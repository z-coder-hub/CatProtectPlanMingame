#!/bin/bash

# CatProtectPlanMingame - Open Source Preparation Script
# 开源准备脚本

echo "🐱 CatProtectPlanMingame - Open Source Preparation"
echo "================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in the project root
if [ ! -f "CLAUDE.md" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

echo "Step 1: Checking current git status..."
echo ""
git status --short

echo ""
read -p "Do you want to continue with the cleanup? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Cleanup cancelled"
    exit 0
fi

echo ""
echo "Step 2: Cleaning up personal and unnecessary files..."
echo ""

# Remove personal files
if [ -d "备案资料" ]; then
    rm -rf "备案资料"
    print_status "Removed: 备案资料/"
fi

if [ -d "Claude-Code-Development-Kit" ]; then
    rm -rf "Claude-Code-Development-Kit"
    print_status "Removed: Claude-Code-Development-Kit/"
fi

# Remove article files
for file in article*.md; do
    if [ -f "$file" ]; then
        rm "$file"
        print_status "Removed: $file"
    fi
done

# Remove system files
find . -name ".DS_Store" -type f -delete
print_status "Removed: All .DS_Store files"

# Remove IDE folders
if [ -d ".idea" ]; then
    rm -rf ".idea"
    print_status "Removed: .idea/"
fi

if [ -d ".vscode" ]; then
    rm -rf ".vscode"
    print_status "Removed: .vscode/"
fi

echo ""
echo "Step 3: Checking for sensitive information..."
echo ""

# Check for potential sensitive information
sensitive_patterns=("API_KEY" "SECRET" "PASSWORD" "TOKEN" "api_key" "secret" "password" "token")
found_sensitive=false

for pattern in "${sensitive_patterns[@]}"; do
    results=$(grep -r --include="*.ts" --include="*.js" "$pattern" assets/ 2>/dev/null)
    if [ ! -z "$results" ]; then
        print_warning "Found potential sensitive information: $pattern"
        echo "$results"
        found_sensitive=true
    fi
done

if [ "$found_sensitive" = false ]; then
    print_status "No sensitive information patterns found"
fi

echo ""
echo "Step 4: Verifying required files..."
echo ""

required_files=("README.md" "LICENSE" "CONTRIBUTING.md" "CHANGELOG.md" ".gitignore")
all_present=true

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "Found: $file"
    else
        print_error "Missing: $file"
        all_present=false
    fi
done

if [ -d ".github/ISSUE_TEMPLATE" ]; then
    print_status "Found: .github/ISSUE_TEMPLATE/"
else
    print_warning "Missing: .github/ISSUE_TEMPLATE/"
fi

if [ -f ".github/pull_request_template.md" ]; then
    print_status "Found: .github/pull_request_template.md"
else
    print_warning "Missing: .github/pull_request_template.md"
fi

echo ""
echo "Step 5: Creating screenshots directory..."
echo ""

if [ ! -d "docs/screenshots" ]; then
    mkdir -p docs/screenshots
    print_status "Created: docs/screenshots/"
    print_warning "Remember to add game screenshots to docs/screenshots/"
else
    print_status "Directory exists: docs/screenshots/"
fi

echo ""
echo "Step 6: Final checklist..."
echo ""

echo "Before publishing to GitHub, please ensure:"
echo ""
echo "  ☐ Update README.md with your GitHub username"
echo "  ☐ Update LICENSE with your name/organization"
echo "  ☐ Update package.json repository URL"
echo "  ☐ Add game screenshots to docs/screenshots/"
echo "  ☐ Update CHANGELOG.md with release date"
echo "  ☐ Review all documentation for personal information"
echo "  ☐ Run TypeScript type check: npx tsc --noEmit --skipLibCheck"
echo "  ☐ Test the game in Cocos Creator 3.8.6"
echo "  ☐ Verify all game assets have proper licensing"
echo ""

echo ""
echo "Step 7: Git status after cleanup..."
echo ""
git status --short

echo ""
echo "================================================="
print_status "Open source preparation complete!"
echo ""
echo "Next steps:"
echo "1. Review the changes: git diff"
echo "2. Stage the changes: git add ."
echo "3. Commit: git commit -m 'chore: prepare for open source release'"
echo "4. Create GitHub repository"
echo "5. Push: git remote add origin <your-repo-url>"
echo "6. Push: git push -u origin main"
echo ""
echo "Good luck with your open source project! 🚀"
echo ""
