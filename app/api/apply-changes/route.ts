import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Octokit } from '@octokit/rest';
import Anthropic from '@anthropic-ai/sdk';
import { authOptions } from '@/lib/auth';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { owner, repo, prompt } = await req.json();

    if (!owner || !repo || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

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

    // Get file contents for context (limit to first 10 files)
    const fileContents = await Promise.all(
      tree.tree
        .filter((item) => item.type === 'blob' && item.path)
        .slice(0, 10)
        .map(async (file) => {
          try {
            const { data } = await octokit.repos.getContent({
              owner,
              repo,
              path: file.path!,
              ref: defaultBranch,
            });

            if ('content' in data) {
              return {
                path: file.path!,
                content: Buffer.from(data.content, 'base64').toString('utf-8'),
              };
            }
          } catch (error) {
            return null;
          }
        })
    );

    const validFiles = fileContents.filter(Boolean);
    const repoContext = validFiles
      .map((f) => `File: ${f?.path}\n\`\`\`\n${f?.content}\n\`\`\``)
      .join('\n\n');

    // Step 5: Ask Claude to generate changes
    const aiPrompt = `You are an AI assistant helping to make changes to a GitHub repository.

Repository: ${owner}/${repo}
Current files:
${repoContext}

User request: ${prompt}

Please analyze the request and provide the changes needed. For each file that needs to be created or modified, respond in this exact JSON format:
{
  "files": [
    {
      "path": "path/to/file",
      "content": "complete file content here",
      "action": "create or update"
    }
  ],
  "commitMessage": "Brief commit message",
  "prTitle": "PR title",
  "prDescription": "PR description"
}

Only return valid JSON, no other text.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: aiPrompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const changes = JSON.parse(jsonMatch[0]);

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
      body: changes.prDescription || `Changes requested: ${prompt}\n\nGenerated by AI Agent`,
    });

    return NextResponse.json({
      success: true,
      prUrl: pr.html_url,
      prNumber: pr.number,
    });
  } catch (error: any) {
    console.error('Error applying changes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to apply changes' },
      { status: 500 }
    );
  }
}
