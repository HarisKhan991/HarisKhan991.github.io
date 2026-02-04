#!/bin/bash
# Quick Push Script for studyHi Repository
# This script helps you push changes to KakashiUchiha12/studyHi

set -e  # Exit on any error

echo "================================================"
echo "Push to studyHi Repository Helper Script"
echo "================================================"
echo ""

# Navigate to the correct directory
cd /home/runner/work/HarisKhan991.github.io/HarisKhan991.github.io

# Check if studyhi remote exists
if git remote | grep -q "^studyhi$"; then
    echo "✓ Remote 'studyhi' already configured"
else
    echo "→ Adding 'studyhi' remote..."
    git remote add studyhi https://github.com/KakashiUchiha12/studyHi.git
    echo "✓ Remote 'studyhi' added"
fi

echo ""
echo "Current remotes:"
git remote -v
echo ""

# Show current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "→ Current branch: $CURRENT_BRANCH"
echo ""

# Show what will be pushed
echo "Recent commits to push:"
git log --oneline -5
echo ""

# Ask user which method they prefer
echo "Choose push method:"
echo "  1) Push to new branch 'improvements' (recommended - create PR later)"
echo "  2) Push directly to 'main' branch (requires force if conflicts)"
echo "  3) Cancel"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "→ Pushing to 'improvements' branch..."
        echo ""
        echo "Command: git push studyhi $CURRENT_BRANCH:improvements"
        echo ""
        echo "You will be prompted for authentication:"
        echo "  Username: KakashiUchiha12"
        echo "  Password: <Your Personal Access Token>"
        echo ""
        echo "Get token from: https://github.com/settings/tokens"
        echo ""
        read -p "Press Enter to continue or Ctrl+C to cancel..."
        
        if git push studyhi $CURRENT_BRANCH:improvements; then
            echo ""
            echo "================================================"
            echo "✓ SUCCESS! Changes pushed to 'improvements' branch"
            echo "================================================"
            echo ""
            echo "Next steps:"
            echo "1. Visit: https://github.com/KakashiUchiha12/studyHi"
            echo "2. Click 'Compare & pull request' button"
            echo "3. Review changes and create PR"
            echo "4. Merge PR to main branch"
            echo ""
        else
            echo ""
            echo "❌ Push failed. Check authentication and try again."
            echo ""
        fi
        ;;
    
    2)
        echo ""
        echo "⚠️  WARNING: This will push directly to main branch!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            echo ""
            echo "→ Pushing to 'main' branch..."
            echo ""
            echo "Command: git push studyhi $CURRENT_BRANCH:main"
            echo ""
            echo "You will be prompted for authentication:"
            echo "  Username: KakashiUchiha12"
            echo "  Password: <Your Personal Access Token>"
            echo ""
            read -p "Press Enter to continue or Ctrl+C to cancel..."
            
            if git push studyhi $CURRENT_BRANCH:main; then
                echo ""
                echo "================================================"
                echo "✓ SUCCESS! Changes pushed to 'main' branch"
                echo "================================================"
                echo ""
                echo "Next steps:"
                echo "1. Visit: https://github.com/KakashiUchiha12/studyHi"
                echo "2. Verify changes are there"
                echo "3. Set up database: npm run db:init"
                echo "4. Deploy application"
                echo ""
            else
                echo ""
                echo "❌ Push failed."
                echo ""
                echo "If there are conflicts, you can force push:"
                echo "git push studyhi $CURRENT_BRANCH:main --force"
                echo ""
                echo "⚠️  Use force push with caution!"
                echo ""
            fi
        else
            echo "Cancelled."
        fi
        ;;
    
    3)
        echo "Cancelled."
        exit 0
        ;;
    
    *)
        echo "Invalid choice. Cancelled."
        exit 1
        ;;
esac

echo ""
echo "================================================"
echo "Push script completed"
echo "================================================"
