import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Octokit } from '@octokit/rest';
import Anthropic from '@anthropic-ai/sdk';
import { authOptions } from '@/lib/auth';
import {
  buildPrompt,
  getModel,
  getFallbackModel,
  getActiveVariant,
  type PromptContext,
  type PromptVariantId,
} from '@/config/prompts';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const ROUTE_FILE_PATTERNS = [
  /^(?:src\/)?app(?:\/.+)?\/page\.(tsx?|jsx?)$/i,
  /^(?:src\/)?pages\/.+\.(tsx?|jsx?)$/i,
];
const INTEGRATION_ENTRY_PATTERNS = [
  /^(?:src\/)?app\/layout\.(tsx?|jsx?)$/i,
  /^(?:src\/)?app\/page\.(tsx?|jsx?)$/i,
  /^(?:src\/)?pages\/_app\.(tsx?|jsx?)$/i,
  /^(?:src\/)?pages\/index\.(tsx?|jsx?)$/i,
  /^(?:src\/)?middleware\.(ts|js)$/i,
  /^(?:src\/)?components\/.*(nav|navbar|menu|sidebar|header).*\.(tsx?|jsx?)$/i,
  /^(?:src\/)?app\/.*\/layout\.(tsx?|jsx?)$/i,
];

const AB_HINT_PATTERN =
  /\b(a\/b|ab test|abtest|split test|experiment|variant|variants)\b/i;

const DEFAULT_CONTEXT_TREE_LIMIT = 1500;
const DEFAULT_CONTEXT_MAX_CHARS = 300000;
const DEFAULT_TOOL_READ_MAX_CHARS = 24000;
const DEFAULT_TOOL_SEARCH_DEFAULT_LIMIT = 60;
const DEFAULT_SEED_FILE_CHARS = 5000;
const TOOL_LOOP_MAX_STEPS = 10;
const MODEL_MAX_OUTPUT_TOKENS = 16384;
const PLANNING_MAX_OUTPUT_TOKENS = 4096;
const ANTHROPIC_RATE_LIMIT_RETRIES = 5;
const RATE_LIMIT_BASE_DELAY_MS = 2000;
const APPLY_CHANGES_DEBUG = process.env.APPLY_CHANGES_DEBUG === '1';

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const debugLog = (...args: any[]): void => {
  if (APPLY_CHANGES_DEBUG) {
    console.log('[apply-changes]', ...args);
  }
};

const isAnthropicRateLimitError = (error: any): boolean =>
  error?.status === 429 ||
  error?.error?.type === 'rate_limit_error' ||
  (typeof error?.message === 'string' && error.message.toLowerCase().includes('rate_limit_error'));

const getRetryDelayMs = (error: any, attempt: number): number => {
  const headers = error?.headers;
  if (headers) {
    const retryAfter = typeof headers.get === 'function' ? headers.get('retry-after') : headers['retry-after'];
    const retryAfterMs = typeof headers.get === 'function' ? headers.get('retry-after-ms') : headers['retry-after-ms'];
    if (retryAfterMs != null) {
      const ms = typeof retryAfterMs === 'string' ? parseInt(retryAfterMs, 10) : Number(retryAfterMs);
      if (!isNaN(ms) && ms > 0) return Math.min(ms, 60000);
    }
    if (retryAfter != null) {
      const seconds = typeof retryAfter === 'string' ? parseInt(retryAfter, 10) : Number(retryAfter);
      if (!isNaN(seconds) && seconds > 0) return Math.min(seconds * 1000, 60000);
    }
  }
  return RATE_LIMIT_BASE_DELAY_MS * 2 ** attempt;
};

const callAnthropicWithRetry = async (payload: any): Promise<any> => {
  let attempt = 0;
  for (;;) {
    try {
      return await anthropic.messages.create(payload);
    } catch (error: any) {
      if (!isAnthropicRateLimitError(error) || attempt >= ANTHROPIC_RATE_LIMIT_RETRIES) {
        throw error;
      }
      const delayMs = getRetryDelayMs(error, attempt);
      await sleep(delayMs);
      attempt += 1;
    }
  }
};

const isRouteFilePath = (path: string): boolean =>
  ROUTE_FILE_PATTERNS.some((rx) => rx.test(path));
const hasNextStyleRouting = (paths: Set<string>): boolean => {
  for (const path of paths) {
    if (/^(?:src\/)?app\//i.test(path) || /^(?:src\/)?pages\//i.test(path)) return true;
  }
  return false;
};

const isLikelyAbRequest = (userPrompt: string): boolean => AB_HINT_PATTERN.test(userPrompt);

const normalizePromptForAb = (userPrompt: string): string => {
  if (!isLikelyAbRequest(userPrompt)) return userPrompt;

  const trimmed = userPrompt.trim();
  const alreadySpecific =
    /((src\/)?app\/ab-test\/a\/page\.tsx|(src\/)?pages\/ab-test\/a\.tsx|reachable|navigation|entry point)/i.test(
      trimmed
    );
  const tokenCount = trimmed.split(/\s+/).filter(Boolean).length;

  if (alreadySpecific || tokenCount > 32) return trimmed;

  return `${trimmed}

Integration defaults for this A/B request:
- Create two user-facing routes for variants in the repository's existing routing layout:
  - App Router style: app/ab-test/a/page.tsx + app/ab-test/b/page.tsx (or src/app/... if repo uses src/)
  - Pages Router style: pages/ab-test/a.tsx + pages/ab-test/b.tsx (or src/pages/... if repo uses src/)
- Update at least one existing entry/navigation surface so both routes are reachable from app UI.
- Reuse existing layout/providers/components patterns; avoid standalone demo pages.
- Return all required files in one response.`;
};

interface AbIntentSpec {
  featureName: string;
  userIntent: string;
  goal: string;
  hypothesis: string;
  targetSurface: string;
  variantA: string;
  variantB: string;
  primaryMetric: string;
  integrationRequirements: string[];
  assumptions: string[];
}

const AB_INTENT_SYSTEM_PROMPT = `You are an A/B test intent planner.

You convert vague user requests into implementation-ready A/B intent specs.

Return STRICT JSON only (no markdown, no prose outside JSON):
{
  "featureName": "string",
  "userIntent": "string",
  "goal": "string",
  "hypothesis": "string",
  "targetSurface": "string",
  "variantA": "string",
  "variantB": "string",
  "primaryMetric": "string",
  "integrationRequirements": ["string"],
  "assumptions": ["string"]
}

Rules:
- Be broad but practical. Infer missing details safely.
- If request is vague, default to route-level A/B with navigation integration.
- Keep outputs concise and directly usable by a coding model.
- Do not output code.`;

const extractFirstJsonObject = (text: string): string | null => {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
};

const formatAbIntentSpecBlock = (spec: AbIntentSpec): string => {
  const reqs = (spec.integrationRequirements ?? []).map((x) => `- ${x}`).join('\n');
  const assumptions = (spec.assumptions ?? []).map((x) => `- ${x}`).join('\n');
  return `INFERRED A/B INTENT SPEC:
- Feature: ${spec.featureName}
- User intent: ${spec.userIntent}
- Goal: ${spec.goal}
- Hypothesis: ${spec.hypothesis}
- Target surface: ${spec.targetSurface}
- Variant A (control): ${spec.variantA}
- Variant B (treatment): ${spec.variantB}
- Primary metric: ${spec.primaryMetric}
- Integration requirements:
${reqs || '- Ensure variants are integrated into existing app navigation/entry points.'}
- Assumptions:
${assumptions || '- Use repository conventions and minimal safe changes.'}`;
};

interface GeneratedFileChange {
  path: string;
  content: string;
  action: 'create' | 'update';
}

interface GeneratedChangesPayload {
  files: GeneratedFileChange[];
  commitMessage?: string;
  prTitle?: string;
  prDescription?: string;
}

interface ChangePlan {
  appType: 'app-router' | 'pages-router' | 'hybrid' | 'unknown';
  targetFiles: string[];
  integrationFiles: string[];
  newRoutes: string[];
  acceptanceChecks: string[];
}

const CODE_FILE_PATTERN = /\.(tsx?|jsx?|mjs|cjs)$/i;

const isCodeFile = (path: string): boolean => CODE_FILE_PATTERN.test(path);

const getDir = (path: string): string => {
  const idx = path.lastIndexOf('/');
  return idx === -1 ? '' : path.slice(0, idx);
};

const joinPath = (dir: string, rel: string): string => {
  const stack = (dir ? dir.split('/') : []).filter(Boolean);
  for (const part of rel.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return stack.join('/');
};

const buildImportCandidates = (base: string): string[] => [
  base,
  `${base}.ts`,
  `${base}.tsx`,
  `${base}.js`,
  `${base}.jsx`,
  `${base}.mjs`,
  `${base}.cjs`,
  `${base}.json`,
  `${base}/index.ts`,
  `${base}/index.tsx`,
  `${base}/index.js`,
  `${base}/index.jsx`,
  `${base}/index.mjs`,
  `${base}/index.cjs`,
];

const resolveRelativeImportCandidates = (fromPath: string, spec: string): string[] => {
  const base = joinPath(getDir(fromPath), spec);
  return buildImportCandidates(base);
};

const extractImportSpecifiers = (content: string): string[] => {
  const importRegexes = [
    /import\s+[^'"]*from\s+['"]([^'"]+)['"]/g,
    /import\s+['"]([^'"]+)['"]/g,
    /export\s+[^'"]*from\s+['"]([^'"]+)['"]/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  const specs = new Set<string>();
  for (const rx of importRegexes) {
    let m: RegExpExecArray | null;
    while ((m = rx.exec(content)) !== null) {
      const spec = m[1]?.trim();
      if (spec) specs.add(spec);
    }
  }
  return Array.from(specs);
};

const validateImportResolutions = (
  changes: GeneratedChangesPayload,
  allBlobPathSet: Set<string>
): string[] => {
  const errors: string[] = [];
  const reachablePaths = new Set(allBlobPathSet);
  for (const f of changes.files) {
    if (f?.path) reachablePaths.add(f.path);
  }

  const lowerPathMap = new Map<string, string>();
  for (const path of reachablePaths) {
    if (!lowerPathMap.has(path.toLowerCase())) {
      lowerPathMap.set(path.toLowerCase(), path);
    }
  }

  for (const file of changes.files) {
    if (!file?.path || !isCodeFile(file.path) || typeof file.content !== 'string') continue;

    const specs = extractImportSpecifiers(file.content);
    for (const spec of specs) {
      if (spec.startsWith('.')) {
        const candidates = resolveRelativeImportCandidates(file.path, spec);
        const resolved = candidates.find((c) => reachablePaths.has(c));
        if (!resolved) {
          const caseMatch = candidates.find((c) => lowerPathMap.has(c.toLowerCase()));
          if (caseMatch) {
            errors.push(
              `Unresolved import likely due to path casing in ${file.path}: "${spec}" (did you mean "${lowerPathMap.get(
                caseMatch.toLowerCase()
              )}"?)`
            );
          } else {
            errors.push(`Unresolved relative import in ${file.path}: "${spec}"`);
          }
        }
        continue;
      }

      if (spec.startsWith('@/') || spec.startsWith('~/')) {
        const rel = spec.slice(2);
        const aliasCandidates = [...buildImportCandidates(rel), ...buildImportCandidates(`src/${rel}`)];
        const resolved = aliasCandidates.find((c) => reachablePaths.has(c));
        if (!resolved) {
          errors.push(`Unresolved aliased import in ${file.path}: "${spec}"`);
        }
      }
    }
  }

  return errors.slice(0, 25);
};

const parseChangesPayload = (responseText: string): GeneratedChangesPayload => {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response');
  }

  return JSON.parse(jsonMatch[0]) as GeneratedChangesPayload;
};

const PLANNING_SYSTEM_PROMPT = `You are a repository-aware planning assistant.

Produce an implementation plan JSON for a code-editing model.

Return STRICT JSON only:
{
  "appType": "app-router|pages-router|hybrid|unknown",
  "targetFiles": ["string"],
  "integrationFiles": ["string"],
  "newRoutes": ["string"],
  "acceptanceChecks": ["string"]
}

Rules:
- Infer repository framework and route style from context.
- Prefer existing entry points/navigation/layout files for integration.
- For A/B requests include two user-facing routes and integration checks.
- Keep plan practical and concise.`;

const parsePlanPayload = (responseText: string): ChangePlan | null => {
  try {
    const json = extractFirstJsonObject(responseText);
    if (!json) return null;
    const parsed = JSON.parse(json) as Partial<ChangePlan>;
    if (!parsed || typeof parsed !== 'object') return null;
    const appType = parsed.appType ?? 'unknown';
    const normalized: ChangePlan = {
      appType:
        appType === 'app-router' ||
        appType === 'pages-router' ||
        appType === 'hybrid' ||
        appType === 'unknown'
          ? appType
          : 'unknown',
      targetFiles: Array.isArray(parsed.targetFiles)
        ? parsed.targetFiles.filter((x): x is string => typeof x === 'string' && x.length > 0)
        : [],
      integrationFiles: Array.isArray(parsed.integrationFiles)
        ? parsed.integrationFiles.filter((x): x is string => typeof x === 'string' && x.length > 0)
        : [],
      newRoutes: Array.isArray(parsed.newRoutes)
        ? parsed.newRoutes.filter((x): x is string => typeof x === 'string' && x.length > 0)
        : [],
      acceptanceChecks: Array.isArray(parsed.acceptanceChecks)
        ? parsed.acceptanceChecks.filter((x): x is string => typeof x === 'string' && x.length > 0)
        : [],
    };
    return normalized;
  } catch {
    return null;
  }
};

const formatPlanBlock = (plan: ChangePlan): string => {
  const targetFiles = plan.targetFiles.map((x) => `- ${x}`).join('\n');
  const integrationFiles = plan.integrationFiles.map((x) => `- ${x}`).join('\n');
  const newRoutes = plan.newRoutes.map((x) => `- ${x}`).join('\n');
  const acceptanceChecks = plan.acceptanceChecks.map((x) => `- ${x}`).join('\n');
  return `PLANNING ARTIFACT (authoritative):
- App type: ${plan.appType}
- Target files:
${targetFiles || '- (none)'}
- Integration files:
${integrationFiles || '- (none)'}
- New routes:
${newRoutes || '- (none)'}
- Acceptance checks:
${acceptanceChecks || '- Integrate variants into existing navigation or entry points.'}

Follow this plan while adapting minimally to repository constraints.`;
};

const routePathFromFilePath = (filePath: string): string | null => {
  const appMatch = filePath.match(/^(?:src\/)?app(?:\/(.+))?\/page\.(tsx?|jsx?)$/i);
  if (appMatch) {
    const cleaned = (appMatch[1] ?? '')
      .split('/')
      .filter((segment) => segment && !segment.startsWith('(') && !segment.startsWith('@'))
      .join('/');
    return cleaned ? `/${cleaned}` : '/';
  }

  const pagesMatch = filePath.match(/^(?:src\/)?pages\/(.+)\.(tsx?|jsx?)$/i);
  if (pagesMatch) {
    const rel = pagesMatch[1];
    if (rel.startsWith('api/')) return null;
    if (rel === 'index') return '/';
    if (rel.endsWith('/index')) return `/${rel.slice(0, -('/index'.length))}`;
    return `/${rel}`;
  }
  return null;
};

const validateRouteReachability = (changes: GeneratedChangesPayload): string[] => {
  const errors: string[] = [];
  const createdRouteUrls = changes.files
    .filter((f) => f.action === 'create' && isRouteFilePath(f.path))
    .map((f) => routePathFromFilePath(f.path))
    .filter((x): x is string => Boolean(x));

  if (createdRouteUrls.length === 0) return errors;

  const uniqueRoutes = Array.from(new Set(createdRouteUrls));
  const updatedIntegrationFiles = changes.files.filter(
    (f) =>
      f.action === 'update' &&
      INTEGRATION_ENTRY_PATTERNS.some((rx) => rx.test(f.path)) &&
      typeof f.content === 'string'
  );

  if (updatedIntegrationFiles.length === 0) {
    errors.push(
      `Generated routes must be referenced from updated integration files: ${uniqueRoutes.join(', ')}`
    );
    return errors;
  }

  for (const route of uniqueRoutes) {
    const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const refRegexes = [
      new RegExp(`href\\s*=\\s*["'\`]${escapedRoute}["'\`]`, 'i'),
      new RegExp(`to\\s*=\\s*["'\`]${escapedRoute}["'\`]`, 'i'),
      new RegExp(`["'\`]${escapedRoute}["'\`]`, 'i'),
      new RegExp(`router\\.(push|replace)\\(\\s*["'\`]${escapedRoute}["'\`]`, 'i'),
      new RegExp(`redirect\\(\\s*["'\`]${escapedRoute}["'\`]`, 'i'),
    ];

    const hasReference = updatedIntegrationFiles.some((file) =>
      refRegexes.some((rx) => rx.test(file.content))
    );

    if (!hasReference) {
      errors.push(
        `Route "${route}" is created but not referenced from any updated integration file. Add a user-reachable link/navigation path.`
      );
    }
  }

  return errors;
};

const validateChangesPayload = (
  changes: GeneratedChangesPayload,
  allBlobPathSet: Set<string>,
  requestPrompt: string
): string[] => {
  const errors: string[] = [];

  if (!Array.isArray(changes.files)) {
    return ['Invalid AI response: files must be an array'];
  }

  for (const file of changes.files) {
    if (!file || typeof file.path !== 'string' || file.path.length === 0) {
      errors.push('Each file must include a non-empty path');
      continue;
    }
    if (file.action !== 'create' && file.action !== 'update') {
      errors.push(`Invalid action for ${file.path}: must be "create" or "update"`);
    }
    if (typeof file.content !== 'string' || file.content.length === 0) {
      errors.push(`Missing full file content for ${file.path}`);
    }
    if (file.action === 'update' && !allBlobPathSet.has(file.path)) {
      errors.push(`Update references non-existent path: ${file.path}`);
    }
  }

  errors.push(...validateImportResolutions(changes, allBlobPathSet));
  errors.push(...validateRouteReachability(changes));

  if (isLikelyAbRequest(requestPrompt)) {
    const createdRouteFiles = changes.files.filter(
      (f) => f.action === 'create' && isRouteFilePath(f.path)
    );
    const updatedIntegrationFile = changes.files.some(
      (f) => f.action === 'update' && INTEGRATION_ENTRY_PATTERNS.some((rx) => rx.test(f.path))
    );
    const nextStyleRepo =
      hasNextStyleRouting(allBlobPathSet) ||
      changes.files.some((f) => /^(?:src\/)?(app|pages)\//i.test(f.path));

    if (nextStyleRepo && createdRouteFiles.length < 2) {
      errors.push(
        'A/B request in Next-style repos requires two variant routes under app/pages (including src/app or src/pages).'
      );
    }
    if (!updatedIntegrationFile) {
      errors.push(
        'A/B request requires updating at least one existing entry/navigation file so variants are user-reachable.'
      );
    }
  }

  return errors;
};

const buildRepairUserMessage = (baseUserMessage: string, errors: string[]): string => {
  const feedback = errors.map((e) => `- ${e}`).join('\n');
  return `${baseUserMessage}

---
SYSTEM VALIDATION FEEDBACK:
Your previous JSON did not satisfy required integration constraints.
${feedback}

Return corrected JSON only.`;
};

const extractTextFromContentBlocks = (content: any[]): string =>
  content
    .filter((block) => block?.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('\n');

const maybeBuildAbIntentPrompt = async (
  userPrompt: string,
  normalizedPrompt: string
): Promise<string> => {
  if (!isLikelyAbRequest(userPrompt)) {
    return normalizedPrompt;
  }

  try {
    const intentMessage = await callAnthropicWithRetry({
      model: getModel(),
      max_tokens: 4096,
      system: AB_INTENT_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `User request:
${userPrompt}

Normalized request:
${normalizedPrompt}

Produce the A/B intent spec JSON now.`,
        },
      ],
    });

    const intentText = extractTextFromContentBlocks(intentMessage.content as any[]);
    const json = extractFirstJsonObject(intentText);
    if (!json) return normalizedPrompt;
    const parsed = JSON.parse(json) as Partial<AbIntentSpec>;
    if (!parsed.goal || !parsed.variantA || !parsed.variantB) return normalizedPrompt;

    const spec: AbIntentSpec = {
      featureName: parsed.featureName ?? 'ab-test',
      userIntent: parsed.userIntent ?? userPrompt,
      goal: parsed.goal,
      hypothesis: parsed.hypothesis ?? 'Variant B may improve user outcomes versus control.',
      targetSurface: parsed.targetSurface ?? 'Primary user route',
      variantA: parsed.variantA,
      variantB: parsed.variantB,
      primaryMetric: parsed.primaryMetric ?? 'Primary conversion rate',
      integrationRequirements: parsed.integrationRequirements ?? [],
      assumptions: parsed.assumptions ?? [],
    };

    return `${normalizedPrompt}

${formatAbIntentSpecBlock(spec)}

Treat this intent spec as authoritative unless repository constraints require minimal adaptation.`;
  } catch {
    return normalizedPrompt;
  }
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { owner, repo, prompt: rawPrompt, promptVariant } = await req.json();

    if (!owner || !repo || !rawPrompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const normalizedPrompt = normalizePromptForAb(rawPrompt);
    const prompt = await maybeBuildAbIntentPrompt(rawPrompt, normalizedPrompt);

    const octokit = new Octokit({
      auth: session.accessToken,
    });

    // Step 1: Get the default branch
    const { data: repoData } = await octokit.repos.get({
      owner,
      repo,
    });
    const defaultBranch = repoData.default_branch;

    // Step 2: Get the latest commit SHA from the default branch
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`,
    });
    const latestCommitSha = refData.object.sha;

    // Step 3: Create a new branch
    const branchName = `ai-changes-${Date.now()}`;
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: latestCommitSha,
    });

    // Step 4: Get current repository structure
    const { data: tree } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: latestCommitSha,
      recursive: 'true',
    });

    // Build smarter context: prioritize files relevant to the user request
    // instead of taking an arbitrary first-N slice of the tree.
    const allBlobPaths = tree.tree
      .filter((item) => item.type === 'blob' && item.path)
      .map((item) => item.path as string);
    const allBlobPathSet = new Set(allBlobPaths);

    const treePreviewLimit = DEFAULT_CONTEXT_TREE_LIMIT;
    const contextMaxChars = DEFAULT_CONTEXT_MAX_CHARS;
    const toolReadMaxChars = DEFAULT_TOOL_READ_MAX_CHARS;
    const toolSearchDefaultLimit = DEFAULT_TOOL_SEARCH_DEFAULT_LIMIT;

    const fetchFile = async (path: string, maxChars: number) => {
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path,
          ref: defaultBranch,
        });

        if ('content' in data) {
          const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
          return {
            path,
            content: decoded.slice(0, maxChars),
            truncated: decoded.length > maxChars,
          };
        }
      } catch {
        return null;
      }
      return null;
    };

    const seedPaths = [
      'package.json',
      'tsconfig.json',
      'app/layout.tsx',
      'app/page.tsx',
      'pages/_app.tsx',
      'pages/index.tsx',
      'README.md',
    ].filter((p) => allBlobPathSet.has(p));
    const seedFiles = (
      await Promise.all(seedPaths.map((path) => fetchFile(path, DEFAULT_SEED_FILE_CHARS)))
    ).filter(Boolean) as Array<{ path: string; content: string; truncated: boolean }>;

    const packageJsonSeed = seedFiles.find((f) => f.path === 'package.json');
    let depsSummary = '';
    if (packageJsonSeed) {
      try {
        const parsed = JSON.parse(packageJsonSeed.content);
        const deps = Object.entries(parsed.dependencies ?? {})
          .slice(0, 30)
          .map(([k, v]) => `${k}@${v}`);
        const devDeps = Object.entries(parsed.devDependencies ?? {})
          .slice(0, 30)
          .map(([k, v]) => `${k}@${v}`);
        depsSummary = [
          'Dependency versions:',
          `dependencies: ${deps.join(', ') || '(none)'}`,
          `devDependencies: ${devDeps.join(', ') || '(none)'}`,
        ].join('\n');
      } catch {
        depsSummary = '';
      }
    }

    const rawTreePreview = allBlobPaths.slice(0, treePreviewLimit).join('\n');
    const treeCharBudget = clamp(Math.floor(contextMaxChars * 0.2), 6000, 35000);
    const repoTreePreview = rawTreePreview.slice(0, treeCharBudget);

    let conventionsSummary = '';
    if (packageJsonSeed) {
      try {
        const pkg = JSON.parse(packageJsonSeed.content);
        const parts: string[] = [];
        if (pkg.name) parts.push(`Project: ${pkg.name}`);
        if (pkg.type) parts.push(`Module type: ${pkg.type}`);
        if (pkg.scripts && Object.keys(pkg.scripts).length)
          parts.push(`Scripts: ${Object.keys(pkg.scripts).join(', ')}`);
        const deps = pkg.dependencies ?? {};
        if (deps.next) parts.push(`Next.js: ${deps.next}`);
        if (deps.react) parts.push(`React: ${deps.react}`);
        if (deps.typescript || (pkg.devDependencies && pkg.devDependencies.typescript))
          parts.push('TypeScript: yes');
        if (parts.length) conventionsSummary = parts.join('. ');
      } catch {
        conventionsSummary = '';
      }
    }
    if (conventionsSummary) conventionsSummary = `Conventions: ${conventionsSummary}`;

    const seedDocXml = seedFiles
      .map(
        (f, i) =>
          `<document index="${i + 1}">\n<source>${f.path}</source>\n<content>\n${f.content}\n</content>\n</document>`
      )
      .join('\n');

    const repoContext = [
      '<repository_context>',
      '<file_tree>',
      repoTreePreview,
      '</file_tree>',
      depsSummary ? `<dependencies>\n${depsSummary}\n</dependencies>` : '',
      '<documents>',
      seedDocXml,
      '</documents>',
      '</repository_context>',
      '',
      'IMPORTANT: Use tools to inspect additional files as needed.',
    ]
      .filter(Boolean)
      .join('\n');

    const planningUserPrompt = `Repository: ${owner}/${repo}

${repoContext}

User request:
${prompt}

Build the planning artifact JSON now.`;

    let plan: ChangePlan | null = null;
    try {
      const planningMessage = await callAnthropicWithRetry({
        model: getModel(),
        max_tokens: PLANNING_MAX_OUTPUT_TOKENS,
        system: PLANNING_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: planningUserPrompt }],
      });
      const planningText = extractTextFromContentBlocks(planningMessage.content as any[]);
      plan = parsePlanPayload(planningText);
    } catch {
      plan = null;
    }

    const finalizedPrompt = plan ? `${prompt}\n\n${formatPlanBlock(plan)}` : prompt;

    const listDirectory = (dirPathInput: string, limitInput: number) => {
      const normalized = (dirPathInput || '')
        .replace(/^\/+|\/+$/g, '')
        .replace(/\/{2,}/g, '/');
      const childDirs = new Set<string>();
      const childFiles: string[] = [];

      for (const path of allBlobPaths) {
        if (normalized) {
          if (!path.startsWith(`${normalized}/`)) continue;
          const rest = path.slice(normalized.length + 1);
          if (!rest) continue;
          const slashIdx = rest.indexOf('/');
          if (slashIdx === -1) {
            childFiles.push(path);
          } else {
            childDirs.add(`${normalized}/${rest.slice(0, slashIdx)}`);
          }
        } else {
          const slashIdx = path.indexOf('/');
          if (slashIdx === -1) {
            childFiles.push(path);
          } else {
            childDirs.add(path.slice(0, slashIdx));
          }
        }
      }

      const limit = clamp(limitInput || 100, 1, 200);
      return {
        dirPath: normalized || '.',
        directories: Array.from(childDirs).sort().slice(0, limit),
        files: childFiles.sort().slice(0, limit),
      };
    };

    const searchPaths = (query: string, limitInput: number) => {
      const lowerQuery = (query || '').toLowerCase().trim();
      const tokens = lowerQuery.split(/[^a-z0-9]+/).filter((t) => t.length >= 2);
      const limit = clamp(limitInput || toolSearchDefaultLimit, 1, 120);
      if (!lowerQuery || tokens.length === 0) {
        return { query, matches: allBlobPaths.slice(0, limit), totalMatches: allBlobPaths.length };
      }

      const scored = allBlobPaths
        .map((path) => {
          const lower = path.toLowerCase();
          let score = 0;
          for (const token of tokens) {
            if (lower === token) score += 10;
            else if (lower.endsWith(`/${token}`)) score += 8;
            else if (lower.includes(token)) score += 4;
          }
          return { path, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));

      return {
        query,
        matches: scored.slice(0, limit).map((x) => x.path),
        totalMatches: scored.length,
      };
    };

    const toolDefinitions: any[] = [
      {
        name: 'repo_search_paths',
        description:
          'Search repository file paths by keywords. Use this first to locate candidate files before reading.',
        input_schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Keywords to match in file paths' },
            limit: { type: 'number', description: 'Max paths to return (1-120)' },
          },
          required: ['query'],
        },
      },
      {
        name: 'repo_list_dir',
        description:
          'List immediate child directories and files in a directory path. Use for navigation and structure discovery.',
        input_schema: {
          type: 'object',
          properties: {
            dirPath: { type: 'string', description: 'Directory path relative to repository root' },
            limit: { type: 'number', description: 'Max entries per list (1-200)' },
          },
          required: ['dirPath'],
        },
      },
      {
        name: 'repo_read_file',
        description:
          'Read a repository file by exact path. Returns UTF-8 text content (possibly truncated) for implementation decisions.',
        input_schema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Exact file path relative to repository root' },
            maxChars: { type: 'number', description: `Max characters to return (1-${toolReadMaxChars})` },
          },
          required: ['path'],
        },
      },
    ];

    // Step 5: Build prompt from config and ask Claude to generate changes
    const context: PromptContext = {
      owner,
      repo,
      repoContext,
      conventionsSummary: conventionsSummary || undefined,
      userRequest: finalizedPrompt,
    };

    const variant: PromptVariantId =
      promptVariant === 'a' || promptVariant === 'b' || promptVariant === 'default'
        ? promptVariant
        : getActiveVariant();
    const { systemPrompt, userMessage } = buildPrompt(context, variant);

    const modelCandidates = [getModel(), getFallbackModel()]
      .filter((value, idx, arr): value is string => Boolean(value) && arr.indexOf(value) === idx);

    const runToolLoop = async (model: string, userText: string): Promise<string> => {
      const messages: any[] = [{ role: 'user', content: userText }];
      const systemWithToolGuidance = `${systemPrompt}

TOOL USAGE REQUIREMENTS:
- Do NOT assume file contents not read.
- Use repo_search_paths and repo_list_dir first, then repo_read_file for likely targets.
- Read relevant entry points (layout/page/navigation/API) before proposing edits.
- Keep tool calls focused; prefer multiple targeted reads over guessing.
- Generated changes must satisfy the planning artifact and acceptance checks.
- Every created user-facing route must be reachable via updated integration files.`;

      for (let step = 0; step < TOOL_LOOP_MAX_STEPS; step++) {
        debugLog('tool-loop-step:start', { model, step, totalMessages: messages.length });
        const message = await callAnthropicWithRetry({
          model,
          max_tokens: MODEL_MAX_OUTPUT_TOKENS,
          system: systemWithToolGuidance,
          messages,
          tools: toolDefinitions,
        });

        const toolUses = message.content.filter((block: any) => block.type === 'tool_use');
        debugLog('tool-loop-step:response', { model, step, toolUseCount: toolUses.length });
        if (toolUses.length === 0) {
          return extractTextFromContentBlocks(message.content as any[]);
        }

        messages.push({
          role: 'assistant',
          content: message.content as any,
        });

        const toolResults = await Promise.all(
          toolUses.map(async (toolUse: any) => {
            const input = toolUse.input ?? {};
            try {
              if (toolUse.name === 'repo_search_paths') {
                const out = searchPaths(String(input.query ?? ''), Number(input.limit ?? 0));
                return {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify(out),
                };
              }

              if (toolUse.name === 'repo_list_dir') {
                const out = listDirectory(String(input.dirPath ?? ''), Number(input.limit ?? 100));
                return {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify(out),
                };
              }

              if (toolUse.name === 'repo_read_file') {
                const path = String(input.path ?? '');
                if (!allBlobPathSet.has(path)) {
                  return {
                    type: 'tool_result',
                    tool_use_id: toolUse.id,
                    is_error: true,
                    content: JSON.stringify({ error: `File not found in repository tree: ${path}` }),
                  };
                }
                const maxChars = clamp(Number(input.maxChars ?? toolReadMaxChars), 1, toolReadMaxChars);
                const file = await fetchFile(path, maxChars);
                if (!file) {
                  return {
                    type: 'tool_result',
                    tool_use_id: toolUse.id,
                    is_error: true,
                    content: JSON.stringify({ error: `Unable to read file: ${path}` }),
                  };
                }
                return {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify(file),
                };
              }

              return {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                is_error: true,
                content: JSON.stringify({ error: `Unknown tool: ${toolUse.name}` }),
              };
            } catch (error: any) {
              return {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                is_error: true,
                content: JSON.stringify({ error: error?.message || 'Tool execution failed' }),
              };
            }
          })
        );

        messages.push({
          role: 'user',
          content: toolResults as any,
        });
        debugLog('tool-loop-step:tool-results', {
          model,
          step,
          toolResultCount: toolResults.length,
          totalMessages: messages.length,
        });
      }

      throw new Error('Tool loop exceeded maximum steps');
    };

    let changes: GeneratedChangesPayload | null = null;
    let workingUserMessage = userMessage;
    let lastValidationErrors: string[] = [];

    for (let attempt = 0; attempt < 3; attempt++) {
      const model = modelCandidates[Math.min(attempt, modelCandidates.length - 1)];
      debugLog('generation-attempt:start', { attempt, model, variant });
      const responseText = await runToolLoop(model, workingUserMessage);

      try {
        const parsed = parseChangesPayload(responseText);
        const validationErrors = validateChangesPayload(parsed, allBlobPathSet, prompt);

        if (validationErrors.length === 0) {
          changes = parsed;
          debugLog('generation-attempt:validated', {
            attempt,
            model,
            fileCount: parsed.files.length,
          });
          break;
        }

        lastValidationErrors = validationErrors;
        debugLog('generation-attempt:validation-failed', {
          attempt,
          model,
          errors: validationErrors,
        });
        if (attempt < 2) {
          workingUserMessage = buildRepairUserMessage(userMessage, validationErrors);
        }
      } catch (error: any) {
        lastValidationErrors = [error?.message || 'Invalid AI response payload'];
        debugLog('generation-attempt:parse-failed', {
          attempt,
          model,
          error: error?.message || 'Invalid AI response payload',
        });
        if (attempt < 2) {
          workingUserMessage = buildRepairUserMessage(userMessage, lastValidationErrors);
        }
      }
    }

    if (!changes) {
      const reason =
        lastValidationErrors.length > 0
          ? lastValidationErrors.join(' | ')
          : 'Unknown validation failure';
      throw new Error(`AI response failed validation after retries: ${reason}`);
    }

    // Step 6: Apply changes to the repository
    for (const file of changes.files) {
      const content = Buffer.from(file.content).toString('base64');

      try {
        // Try to get the file first to see if it exists
        const { data: existingFile } = await octokit.repos.getContent({
          owner,
          repo,
          path: file.path,
          ref: branchName,
        });

        // Update existing file
        if ('sha' in existingFile) {
          await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: file.path,
            message: changes.commitMessage || 'Update file',
            content,
            branch: branchName,
            sha: existingFile.sha,
          });
        }
      } catch (error: any) {
        // File doesn't exist, create it
        if (error.status === 404) {
          await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: file.path,
            message: changes.commitMessage || 'Create file',
            content,
            branch: branchName,
          });
        } else {
          throw error;
        }
      }
    }

    // Step 7: Create pull request
    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      title: changes.prTitle || 'AI-generated changes',
      head: branchName,
      base: defaultBranch,
      body: changes.prDescription || `Changes requested: ${rawPrompt}\n\nGenerated by AI Agent`,
    });

    return NextResponse.json({
      success: true,
      prUrl: pr.html_url,
      prNumber: pr.number,
    });
  } catch (error: any) {
    console.error('Error applying changes:', error);
    if (isAnthropicRateLimitError(error)) {
      return NextResponse.json(
        {
          error:
            'AI rate limit exceeded. Your organization has hit the token limit. Please wait a minute and try again, or shorten your prompt.',
        },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to apply changes' },
      { status: 500 }
    );
  }
}
