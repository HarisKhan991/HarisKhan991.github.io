# Quick Push Commands - studyHi Repository

## TL;DR - Copy & Paste

```bash
# Navigate to repo
cd /home/runner/work/HarisKhan991.github.io/HarisKhan991.github.io

# Add remote (one time only)
git remote add studyhi https://github.com/KakashiUchiha12/studyHi.git

# Push to new branch (recommended)
git push studyhi copilot/fix-login-authentication-issues:improvements

# Or push to main (direct)
git push studyhi copilot/fix-login-authentication-issues:main
```

## Interactive Script

```bash
./PUSH-COMMANDS.sh
```

Follow the prompts.

## Authentication

**Username:** `KakashiUchiha12`  
**Password:** Your Personal Access Token from https://github.com/settings/tokens

## After Push

**If pushed to 'improvements' branch:**
1. Go to https://github.com/KakashiUchiha12/studyHi
2. Click "Compare & pull request"
3. Create and merge PR

**If pushed to 'main' branch:**
- Changes are live!
- Set up database: `npm run db:init`

## Full Documentation

See `PUSH-TO-STUDYHI.md` for complete guide.
