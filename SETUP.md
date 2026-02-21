# Quick Setup Guide

## Your Current GitHub OAuth Configuration

Based on your setup:
- **Homepage URL**: `http://localhost:5173`
- **Authorization callback URL**: `http://localhost:3001/auth/github/callback`

## Steps to Get Started

### 1. Add Your API Keys to `.env.local`

Open `.env.local` and replace the placeholders:

```env
GITHUB_CLIENT_ID=your_actual_client_id
GITHUB_CLIENT_SECRET=your_actual_client_secret
ANTHROPIC_API_KEY=your_actual_anthropic_key
NEXTAUTH_SECRET=generate_with_openssl_command_below
NEXTAUTH_URL=http://localhost:3001
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 2. Install Dependencies (if not already done)

```bash
npm install
```

### 3. Start the Server

```bash
npm run dev
```

### 4. Access the App

Open your browser to: **http://localhost:3001**

## How the OAuth Flow Works

1. User clicks "Sign in with GitHub"
2. GitHub redirects to: `http://localhost:3001/auth/github/callback`
3. Our custom route at `app/auth/github/callback/route.ts` intercepts this
4. It redirects to NextAuth's handler at `/api/auth/callback/github`
5. NextAuth processes the callback and creates a session
6. User is authenticated and can use the app

## Testing the Integration

1. Go to http://localhost:3001
2. Click "Sign in with GitHub"
3. Authorize the app
4. You should be redirected back and see the main interface
5. Enter a GitHub repo URL (e.g., `https://github.com/yourusername/test-repo`)
6. Click "Connect"
7. Type a prompt like "Add a README file"
8. Click "Submit & Create PR"
9. Wait for the AI to create a PR
10. Click the PR link to review on GitHub

## Troubleshooting

If you get authorization errors:
- Double-check your GitHub Client ID and Secret in `.env.local`
- Verify the callback URL in GitHub OAuth App settings: `http://localhost:3001/auth/github/callback`
- Make sure `NEXTAUTH_SECRET` is set (not empty)
- Try clearing browser cookies/cache and signing in again
