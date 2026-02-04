# 开源发布指南 / Open Source Release Guide

[English](#english) | [中文](#中文)

---

## English

### 🎯 Quick Checklist

Use this checklist to prepare your project for open source release:

#### ✅ Pre-Release Checklist

**Documentation**
- [ ] README.md created and reviewed
- [ ] LICENSE file added
- [ ] CONTRIBUTING.md created
- [ ] CHANGELOG.md updated with release date
- [ ] All documentation reviewed for personal information

**Code Cleanup**
- [ ] Personal files removed (备案资料/, Claude-Code-Development-Kit/)
- [ ] Article files removed (article*.md)
- [ ] System files removed (.DS_Store, .idea/, .vscode/)
- [ ] .gitignore updated
- [ ] TypeScript compilation passes: `npx tsc --noEmit --skipLibCheck`
- [ ] No sensitive information in code (API keys, passwords, etc.)

**Assets & Resources**
- [ ] Game screenshots added to docs/screenshots/
- [ ] All game assets have proper licensing
- [ ] Resource attribution documented (if using third-party assets)

**GitHub Setup**
- [ ] Update README.md with your GitHub username
- [ ] Update LICENSE with your name/organization
- [ ] Update package.json repository URL
- [ ] GitHub templates created (.github/ISSUE_TEMPLATE/, pull_request_template.md)

**Testing**
- [ ] Game tested in Cocos Creator 3.8.6
- [ ] Web build tested
- [ ] Mobile build tested (if applicable)

### 🚀 Step-by-Step Release Process

#### Step 1: Run Cleanup Script

```bash
# Make the script executable (if not already)
chmod +x prepare-opensource.sh

# Run the cleanup script
./prepare-opensource.sh
```

This script will:
- Remove personal files and directories
- Clean up system files
- Check for sensitive information
- Verify required files exist
- Create necessary directories

#### Step 2: Manual Review

1. **Review README.md**
   - Replace `yourusername` with your actual GitHub username
   - Add game screenshots
   - Verify all links work

2. **Review LICENSE**
   - Update copyright year
   - Add your name or organization

3. **Review CONTRIBUTING.md**
   - Update repository URLs
   - Add any project-specific contribution guidelines

4. **Review package.json**
   ```json
   {
     "repository": {
       "type": "git",
       "url": "https://github.com/YOUR_USERNAME/CatProtectPlanMingame"
     }
   }
   ```

5. **Update CHANGELOG.md**
   - Set release date
   - Update version links

#### Step 3: Add Screenshots

```bash
# Add game screenshots to the screenshots directory
cp /path/to/screenshot1.png docs/screenshots/
cp /path/to/screenshot2.png docs/screenshots/

# Update README.md with screenshot paths
```

Recommended screenshots:
- Main menu
- Hero selection
- Gameplay with deployed heroes
- Battle scene with effects
- Victory/defeat screen

#### Step 4: Final Testing

```bash
# Run TypeScript type check
npx tsc --noEmit --skipLibCheck

# Open in Cocos Creator 3.8.6 and test
# - Test hero deployment
# - Test all 10 levels
# - Test all heroes and enemies
# - Verify UI functionality
```

#### Step 5: Create Git Commit

```bash
# Check what will be committed
git status

# Review changes
git diff

# Stage all changes
git add .

# Create commit
git commit -m "chore: prepare for open source release

- Add README, LICENSE, CONTRIBUTING, CHANGELOG
- Add GitHub issue and PR templates
- Remove personal files and sensitive information
- Update .gitignore
- Add game screenshots and documentation"
```

#### Step 6: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `CatProtectPlanMingame`
3. Description: "A tower defense game built with Cocos Creator 3.8.6 and TypeScript"
4. Public repository
5. **Don't** initialize with README, .gitignore, or license (you already have these)

#### Step 7: Push to GitHub

```bash
# Add remote
git remote add origin https://github.com/YOUR_USERNAME/CatProtectPlanMingame.git

# Verify branch name (should be main or master)
git branch

# Push to GitHub
git push -u origin main
```

#### Step 8: Configure GitHub Repository

1. **About Section**
   - Add description
   - Add website (if you have a demo)
   - Add topics: `cocos-creator`, `typescript`, `tower-defense`, `game`, `gamedev`

2. **Enable Features**
   - Issues: ✓ Enable
   - Discussions: ✓ Enable (for community Q&A)
   - Wiki: Optional

3. **Create First Release**
   - Go to Releases → Create a new release
   - Tag: `v1.6.0`
   - Title: `v1.6.0 - Initial Open Source Release`
   - Description: Copy from CHANGELOG.md

### 📸 Adding Screenshots to README

Edit README.md and add screenshots:

```markdown
## 📸 Screenshots

### Main Menu
![Main Menu](docs/screenshots/main-menu.png)

### Gameplay
![Gameplay](docs/screenshots/gameplay.png)

### Hero Selection
![Hero Selection](docs/screenshots/hero-selection.png)
```

### 🌐 Optional: Deploy Online Demo

Consider deploying a playable version:

**Option 1: GitHub Pages**
```bash
# Build for web in Cocos Creator
# Then push build/web-mobile to gh-pages branch
```

**Option 2: Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Option 3: Netlify**
- Drag and drop the build folder to netlify.com

### 📣 Promote Your Project

After publishing:

1. **Add to awesome lists**
   - awesome-cocos-creator
   - awesome-typescript-games

2. **Share on social media**
   - Twitter/X with #cocoscreator #gamedev
   - Reddit r/gamedev, r/IndieDev
   - Discord communities

3. **Write a blog post**
   - Development journey
   - Technical challenges
   - Lessons learned

### 🐛 Post-Release Checklist

- [ ] Monitor GitHub Issues
- [ ] Respond to Pull Requests
- [ ] Update documentation based on feedback
- [ ] Add CI/CD for automated testing
- [ ] Create release schedule

---

## 中文

### 🎯 快速检查清单

使用此检查清单准备项目开源发布：

#### ✅ 发布前检查清单

**文档**
- [ ] README.md 已创建并审查
- [ ] LICENSE 文件已添加
- [ ] CONTRIBUTING.md 已创建
- [ ] CHANGELOG.md 已更新发布日期
- [ ] 所有文档已审查，无个人信息

**代码清理**
- [ ] 个人文件已移除（备案资料/、Claude-Code-Development-Kit/）
- [ ] 文章文件已移除（article*.md）
- [ ] 系统文件已移除（.DS_Store、.idea/、.vscode/）
- [ ] .gitignore 已更新
- [ ] TypeScript 编译通过：`npx tsc --noEmit --skipLibCheck`
- [ ] 代码中无敏感信息（API密钥、密码等）

**资源和素材**
- [ ] 游戏截图已添加到 docs/screenshots/
- [ ] 所有游戏素材都有适当的许可证
- [ ] 资源归属已记录（如使用第三方素材）

**GitHub 设置**
- [ ] 在 README.md 中更新您的 GitHub 用户名
- [ ] 在 LICENSE 中更新您的姓名/组织
- [ ] 更新 package.json 中的仓库 URL
- [ ] GitHub 模板已创建（.github/ISSUE_TEMPLATE/、pull_request_template.md）

**测试**
- [ ] 在 Cocos Creator 3.8.6 中测试游戏
- [ ] Web 构建已测试
- [ ] 移动端构建已测试（如适用）

### 🚀 逐步发布流程

#### 步骤 1：运行清理脚本

```bash
# 使脚本可执行（如果尚未执行）
chmod +x prepare-opensource.sh

# 运行清理脚本
./prepare-opensource.sh
```

此脚本将：
- 删除个人文件和目录
- 清理系统文件
- 检查敏感信息
- 验证所需文件是否存在
- 创建必要的目录

#### 步骤 2：手动审查

1. **审查 README.md**
   - 将 `yourusername` 替换为您的实际 GitHub 用户名
   - 添加游戏截图
   - 验证所有链接有效

2. **审查 LICENSE**
   - 更新版权年份
   - 添加您的姓名或组织

3. **审查 CONTRIBUTING.md**
   - 更新仓库 URL
   - 添加任何项目特定的贡献指南

4. **审查 package.json**
   ```json
   {
     "repository": {
       "type": "git",
       "url": "https://github.com/YOUR_USERNAME/CatProtectPlanMingame"
     }
   }
   ```

5. **更新 CHANGELOG.md**
   - 设置发布日期
   - 更新版本链接

#### 步骤 3：添加截图

```bash
# 将游戏截图添加到 screenshots 目录
cp /path/to/screenshot1.png docs/screenshots/
cp /path/to/screenshot2.png docs/screenshots/

# 在 README.md 中更新截图路径
```

推荐截图：
- 主菜单
- 英雄选择
- 部署英雄的游戏玩法
- 带特效的战斗场景
- 胜利/失败界面

#### 步骤 4：最终测试

```bash
# 运行 TypeScript 类型检查
npx tsc --noEmit --skipLibCheck

# 在 Cocos Creator 3.8.6 中打开并测试
# - 测试英雄部署
# - 测试所有 10 关
# - 测试所有英雄和敌人
# - 验证 UI 功能
```

#### 步骤 5：创建 Git 提交

```bash
# 检查将要提交的内容
git status

# 审查更改
git diff

# 暂存所有更改
git add .

# 创建提交
git commit -m "chore: prepare for open source release

- Add README, LICENSE, CONTRIBUTING, CHANGELOG
- Add GitHub issue and PR templates
- Remove personal files and sensitive information
- Update .gitignore
- Add game screenshots and documentation"
```

#### 步骤 6：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名称：`CatProtectPlanMingame`
3. 描述："使用 Cocos Creator 3.8.6 和 TypeScript 构建的塔防游戏"
4. 公开仓库
5. **不要**使用 README、.gitignore 或许可证初始化（您已经有这些了）

#### 步骤 7：推送到 GitHub

```bash
# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/CatProtectPlanMingame.git

# 验证分支名称（应该是 main 或 master）
git branch

# 推送到 GitHub
git push -u origin main
```

#### 步骤 8：配置 GitHub 仓库

1. **关于部分**
   - 添加描述
   - 添加网站（如果有演示）
   - 添加主题：`cocos-creator`、`typescript`、`tower-defense`、`game`、`gamedev`

2. **启用功能**
   - Issues：✓ 启用
   - Discussions：✓ 启用（用于社区问答）
   - Wiki：可选

3. **创建首个发布**
   - 转到 Releases → Create a new release
   - 标签：`v1.6.0`
   - 标题：`v1.6.0 - Initial Open Source Release`
   - 描述：从 CHANGELOG.md 复制

### 📸 在 README 中添加截图

编辑 README.md 并添加截图：

```markdown
## 📸 截图

### 主菜单
![主菜单](docs/screenshots/main-menu.png)

### 游戏玩法
![游戏玩法](docs/screenshots/gameplay.png)

### 英雄选择
![英雄选择](docs/screenshots/hero-selection.png)
```

### 🌐 可选：部署在线演示

考虑部署一个可玩的版本：

**选项 1：GitHub Pages**
```bash
# 在 Cocos Creator 中为 web 构建
# 然后将 build/web-mobile 推送到 gh-pages 分支
```

**选项 2：Vercel**
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

**选项 3：Netlify**
- 将构建文件夹拖放到 netlify.com

### 📣 推广您的项目

发布后：

1. **添加到精选列表**
   - awesome-cocos-creator
   - awesome-typescript-games

2. **在社交媒体上分享**
   - Twitter/X 使用 #cocoscreator #gamedev
   - Reddit r/gamedev、r/IndieDev
   - Discord 社区

3. **写博客文章**
   - 开发历程
   - 技术挑战
   - 经验教训

### 🐛 发布后检查清单

- [ ] 监控 GitHub Issues
- [ ] 响应 Pull Requests
- [ ] 根据反馈更新文档
- [ ] 添加 CI/CD 进行自动化测试
- [ ] 创建发布时间表

---

## 🎉 祝贺！

您现在已经准备好发布您的开源项目了！

**记住**：开源不仅仅是发布代码，还包括建立社区、回应反馈和持续改进。

祝您的项目取得成功！🚀
