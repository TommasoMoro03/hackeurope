/**
 * Scalable prompt configuration for the GitHub AI Agent.
 *
 * Model IDs from https://docs.anthropic.com/en/docs/models-overview (Feb 2025+)
 *
 * FLOW (apply-changes → Claude):
 * 1. API fetches repo: default branch, full file tree, then selects scored files + import-following.
 * 2. Builds context: XML repo context (file_tree, dependencies, documents with path+content).
 * 3. User message order: repo name → conventions → full repoContext → USER REQUEST at the end.
 * 4. System prompt tells Claude: use thinking to understand the app, then output JSON.
 * 5. Claude responds with thinking + text; we parse JSON, validate paths, apply changes, open PR.
 *
 * Set MODEL_OVERRIDE in .env to use a different model (e.g. claude-opus-4-6 for max quality).
 */

export const LIGHT_MODELS = {
  /** Fastest; near-frontier intelligence; 200K context */
  haiku: 'claude-haiku-4-5-20251001',
  /** Best speed/intelligence balance; 200K context, 64K max output; default for coding */
  sonnet: 'claude-sonnet-4-6',
  /** Fallback; previous Sonnet generation */
  sonnet45: 'claude-sonnet-4-5-20250929',
  /** Most intelligent; best for complex repos; 200K context, 128K max output */
  opus: 'claude-opus-4-6',
} as const;

export type PromptVariantId = 'default' | 'a' | 'b';

export interface PromptVariant {
  id: PromptVariantId;
  name: string;
  /** System/instruction that defines Claude's role and output format */
  instructions: string;
  /** Template for the user message. Use {{placeholders}} for dynamic values */
  userMessageTemplate: string;
}

/**
 * Prompt variants for A/B testing.
 * Add new variants here; each gets a distinct approach to the same task.
 */
export const PROMPT_VARIANTS: Record<PromptVariantId, PromptVariant> = {
  default: {
    id: 'default',
    name: 'Default (balanced)',
    instructions: `You are an expert repository-integrated coding assistant. Your task is to produce changes that work in one shot and match the codebase.

INTENT-FIRST GENERALIST BEHAVIOR:
- First infer what the user actually wants to test (goal, target surface, control vs treatment), even if the request is vague.
- If the request includes an inferred A/B intent spec, treat it as authoritative unless repository constraints require minimal adaptation.
- Resolve ambiguity with practical defaults that preserve user intent and repository conventions.

BEFORE making any edits, use your thinking to fully understand the app and identify the correct targets:

1) Understand the app: What kind of app is this (Next.js App Router, Pages Router, etc.)? Where are the entry points (app/, pages/), the root layout, and the main pages? Which API routes exist? How do layout and pages compose (sidebar, providers, nested routes)?

2) Identify the correct pages and files: For the user's request, which specific pages, routes, or components must change? Trace from the request to the actual file paths in the provided file tree. Do not guess—use only paths that appear in the file tree or that you are explicitly creating.

3) Map structure and conventions: Naming (files, components, exports), import style (path aliases, extensions), formatting, and patterns (hooks, API handlers, config). Infer from the provided file contents.

4) Plan integration: Where must the change touch (routes, layout, navigation, API, imports, config) so the feature works end-to-end?

Do not invent files, APIs, or architecture not present in the context. If something is missing, choose the minimal change that fits existing patterns. Only after this understanding phase should you produce the JSON with file changes.

STYLE AND CONVENTIONS:
- Match the application style exactly: same naming (e.g. kebab-case files, PascalCase components), same import style, same dependency versions and patterns.
- Preserve existing code and formatting; make the smallest valid change set. When adding code, mirror the style of the files you see (comments, spacing, types).
- Prefer existing project conventions over introducing new patterns or libraries.

Before outputting, verify in your thinking:
- All integration points are wired (routes/pages/layout/API/imports/config).
- Dependency versions and framework usage are consistent with the repo.
- Every file path you return exists in the provided file tree (for updates) or is a new path you are creating (for creates); no hallucinated paths.

OUTPUT FORMAT (strict JSON only, no markdown or text before/after):
{
  "files": [
    {
      "path": "path/to/file",
      "content": "complete file content",
      "action": "create or update"
    }
  ],
  "commitMessage": "Brief commit message",
  "prTitle": "PR title",
  "prDescription": "PR description"
}

Rules:
- Return ONLY the JSON object. No explanation, no code fences.
- For each file: provide complete file content (not patches). action is exactly "create" or "update".
- Use only the provided repository context; do not invent files or APIs.
- If context is insufficient, do the safest minimal implementation using existing patterns.
- Include every file that must change for the feature to work (multi-file edits in one response).
- Commit/PR text should explain why the integration works.`,
    userMessageTemplate: `Repository: {{owner}}/{{repo}}
{{conventionsSummary}}

{{repoContext}}

---
USER REQUEST:
{{userRequest}}

---
Analyze the repository context above thoroughly, then output the JSON with all required changes.`,
  },

  a: {
    id: 'a',
    name: 'Variant A (concise, instruction-first)',
    instructions: `You are a code-editing assistant. Use thinking to understand repo structure and conventions, then output valid JSON only.

JSON shape:
{
  "files": [{"path": "string", "content": "string", "action": "create|update"}],
  "commitMessage": "string",
  "prTitle": "string",
  "prDescription": "string"
}

Output only the JSON. Match application style and use only provided context; no invented files or APIs. Wire integration points (routes/imports/api/config) and keep dependency versions consistent.`,
    userMessageTemplate: `Repo: {{owner}}/{{repo}}
{{conventionsSummary}}

{{repoContext}}

Request: {{userRequest}}

Output the JSON.`,
  },

  b: {
    id: 'b',
    name: 'Variant B (detailed, reasoning-friendly)',
    instructions: `You are an AI assistant that makes fully integrated, style-consistent changes to GitHub repositories.

Use your thinking to: (1) infer user intent for the A/B experiment (goal, control, treatment), even from vague requests; (2) understand the codebase—structure, entry points, conventions; (3) infer style—naming, imports, formatting from provided files; (4) plan integration—routes, layout, API, imports; (5) verify—no invented paths or APIs, versions consistent.

Output format (JSON only, no markdown or preamble):
{
  "files": [
    { "path": "path/to/file", "content": "full file content", "action": "create or update" }
  ],
  "commitMessage": "Brief commit message",
  "prTitle": "PR title",
  "prDescription": "Description"
}

- Return ONLY the JSON. Complete file contents per file. Match existing style and conventions.
- Use only provided context; do not hallucinate files or APIs.
- Wire all relevant entry points; include every file needed for the feature to work in one shot.`,
    userMessageTemplate: `Repository: {{owner}}/{{repo}}
{{conventionsSummary}}

{{repoContext}}

---
User request: {{userRequest}}

---
Analyze the context, then output the JSON with all required changes.`,
  },
};

export interface PromptContext {
  owner: string;
  repo: string;
  /** Structured repo context (XML): file tree, dependencies, then file documents. Built in apply-changes. */
  repoContext: string;
  /** Short summary of stack/conventions (e.g. from package.json + tsconfig). Optional. */
  conventionsSummary?: string;
  userRequest: string;
}

/**
 * Get the active prompt variant (for A/B testing).
 * Set PROMPT_VARIANT=a or PROMPT_VARIANT=b in .env.local to switch.
 */
export function getActiveVariant(): PromptVariantId {
  return 'default';
}

/**
 * Default model for coding tasks. Uses MODEL_OVERRIDE env if set (e.g. claude-opus-4-6).
 */
export function getModel(): string {
  const override = process.env.MODEL_OVERRIDE?.trim();
  const allowedModels = Object.values(LIGHT_MODELS) as string[];
  if (override && allowedModels.includes(override)) return override;
  return LIGHT_MODELS.sonnet;
}

/**
 * Fallback model used for one retry if generation fails validation.
 */
export function getFallbackModel(): string {
  return LIGHT_MODELS.sonnet45;
}

/**
 * Build the full prompt sent to Claude.
 * Ensures the prompt is always correctly structured for the API.
 */
export function buildPrompt(
  context: PromptContext,
  variantId?: PromptVariantId
): { systemPrompt: string; userMessage: string } {
  const variant = PROMPT_VARIANTS[variantId ?? getActiveVariant()];

  const userMessage = variant.userMessageTemplate
    .replace(/\{\{owner\}\}/g, context.owner)
    .replace(/\{\{repo\}\}/g, context.repo)
    .replace(/\{\{repoContext\}\}/g, context.repoContext)
    .replace(/\{\{conventionsSummary\}\}/g, context.conventionsSummary ?? '')
    .replace(/\{\{userRequest\}\}/g, context.userRequest);

  return {
    systemPrompt: variant.instructions,
    userMessage,
  };
}
