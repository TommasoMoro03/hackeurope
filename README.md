# GitHub AI Agent

An AI-powered tool that connects to GitHub repositories and uses Claude (Anthropic) to automatically generate code changes, create branches, and open pull requests based on natural language prompts.

## Features

- **GitHub OAuth Integration**: Securely connect your GitHub account
- **Repository Linking**: Connect to any GitHub repository you have write access to
- **AI-Powered Changes**: Use natural language to describe changes you want
- **Automated Workflow**:
  - Creates a new branch
  - Applies AI-generated changes
  - Opens a pull request automatically
- **PR Tracking**: Mark PRs as merged when you're done reviewing

## Prerequisites

- Node.js 18+ installed
- A GitHub account
- A GitHub OAuth App
- An Anthropic API key

## Setup Instructions

### 1. Create a GitHub OAuth App

1. Go to GitHub Settings > Developer settings > OAuth Apps > New OAuth App
2. Fill in the details:
   - **Application name**: GitHub AI Agent (or your preferred name)
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:3001/auth/github/callback`
3. Click "Register application"
4. Copy the **Client ID**
5. Generate a new **Client Secret** and copy it

### 2. Get Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Navigate to API Keys
4. Create a new API key and copy it

### 3. Configure Environment Variables

1. Open the `.env.local` file in the project root
2. Replace the placeholder values with your actual credentials:

```env
# GitHub OAuth App credentials
GITHUB_CLIENT_ID=your_actual_github_client_id
GITHUB_CLIENT_SECRET=your_actual_github_client_secret

# Anthropic API key
ANTHROPIC_API_KEY=your_actual_anthropic_api_key

# NextAuth secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your_generated_secret
NEXTAUTH_URL=http://localhost:3001
```

To generate a secure `NEXTAUTH_SECRET`, run:
```bash
openssl rand -base64 32
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3001](http://localhost:3001)

## How to Use

1. **Sign In**: Click "Sign in with GitHub" to authenticate
2. **Connect Repository**:
   - Enter a GitHub repository URL (e.g., `https://github.com/username/repo`)
   - Click "Connect"
3. **Make Changes**:
   - Type your request in natural language (e.g., "Add a README explaining the project setup")
   - Click "Submit & Create PR"
   - Wait for the AI to analyze the repo and create changes
4. **Review PR**:
   - Click the PR link to review changes on GitHub
   - Merge the PR on GitHub when satisfied
   - Click "Mark as Merged" in the app to reset

## Example Prompts

- "Add a README file explaining the project setup"
- "Create a .gitignore file for Node.js projects"
- "Add TypeScript configuration with strict mode"
- "Create a GitHub Actions workflow for CI/CD"
- "Add error handling to the API endpoints"
- "Refactor the authentication code to use middleware"

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, TailwindCSS
- **Authentication**: NextAuth.js with GitHub OAuth
- **AI**: Anthropic Claude API
- **GitHub Integration**: Octokit REST API

## Project Structure

```
hackeurope/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts          # NextAuth configuration
│   │   └── apply-changes/
│   │       └── route.ts              # Main API endpoint for AI changes
│   ├── auth/
│   │   └── github/
│   │       └── callback/
│   │           └── route.ts          # Custom OAuth callback redirect
│   ├── globals.css                   # Global styles
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Main page with UI
├── types/
│   └── next-auth.d.ts                # NextAuth TypeScript definitions
├── .env.local                        # Environment variables (git-ignored)
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

## How It Works

1. **Authentication**: Uses NextAuth.js to authenticate with GitHub OAuth, requesting `repo` and `user` scopes
2. **Repository Connection**: Parses the GitHub URL to extract owner and repo name
3. **AI Processing**:
   - Fetches current repository structure and file contents
   - Sends context and user prompt to Claude API
   - Receives structured changes (files to create/modify, commit message, PR details)
4. **Git Operations**:
   - Creates a new branch from the default branch
   - Applies file changes using GitHub API
   - Creates a pull request with AI-generated title and description

## Troubleshooting

### "Unauthorized" Error
- Ensure your GitHub OAuth credentials are correct in `.env.local`
- Check that the callback URL in your GitHub OAuth App matches `http://localhost:3001/auth/github/callback`

### "Failed to apply changes" Error
- Verify your Anthropic API key is valid and has credits
- Check that you have write access to the target repository
- Ensure the repository exists and is accessible

### Session Issues
- Make sure `NEXTAUTH_SECRET` is set in `.env.local`
- Try signing out and signing back in

## Security Notes

- Never commit `.env.local` to version control (it's in `.gitignore`)
- The GitHub token is stored in the session and used server-side only
- All API requests are authenticated through NextAuth

## License

ISC

## Contributing

Feel free to open issues or submit pull requests!
