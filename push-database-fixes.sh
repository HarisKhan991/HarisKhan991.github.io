#!/bin/bash

echo "========================================="
echo "Push Database Fixes Only (No Dashboard)"
echo "========================================="
echo ""
echo "This will push ONLY database-related fixes to studyHi repository."
echo "Dashboard redesign will NOT be included."
echo ""
echo "What will be pushed:"
echo "  ✅ Database initialization scripts"
echo "  ✅ Health check endpoint"
echo "  ✅ Database documentation"
echo "  ✅ Auth fixes (conditional OAuth)"
echo "  ✅ Environment templates"
echo ""
echo "What will NOT be pushed:"
echo "  ❌ Dashboard redesign"
echo "  ❌ Dashboard documentation"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "Switching to database-fixes-only branch..."
git checkout database-fixes-only

echo ""
echo "Pushing to studyHi repository..."
echo "Branch: database-fixes-only → database-improvements"
echo ""

git push studyhi database-fixes-only:database-improvements

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed database fixes!"
    echo ""
    echo "Next steps:"
    echo "1. Go to https://github.com/KakashiUchiha12/studyHi"
    echo "2. Click 'Compare & pull request' for 'database-improvements' branch"
    echo "3. Review changes (should only see database-related files)"
    echo "4. Merge the PR"
    echo ""
    
    # Switch back
    git checkout copilot/fix-login-authentication-issues
else
    echo ""
    echo "❌ Push failed. You may need to authenticate."
    echo ""
    echo "Try:"
    echo "  gh auth login"
    echo ""
    echo "Or use Personal Access Token from:"
    echo "  https://github.com/settings/tokens"
    echo ""
    
    # Switch back
    git checkout copilot/fix-login-authentication-issues
fi
