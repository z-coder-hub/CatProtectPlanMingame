# Contributing to CatProtectPlanMingame 🤝

[English](#english) | [中文](#中文)

---

## English

Thank you for your interest in contributing to CatProtectPlanMingame! This document provides guidelines for contributing to the project.

### 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

### 🤝 Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to:
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members

### 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
   ```bash
   git clone https://github.com/YOUR_USERNAME/CatProtectPlanMingame.git
   cd CatProtectPlanMingame
   ```
3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/CatProtectPlanMingame.git
   ```

### 🛠️ Development Setup

#### Prerequisites
- Cocos Creator 3.8.6
- Node.js v16+
- Git

#### Setup Steps
1. Open the project in Cocos Creator 3.8.6
2. Wait for the engine to compile TypeScript files
3. Click Preview to test the game

#### Running TypeScript Type Check
```bash
# If you have TypeScript installed globally
npx tsc --noEmit --skipLibCheck
```

### 💡 How to Contribute

#### Reporting Bugs
Before creating a bug report, please check existing issues. When creating a bug report, include:
- **Clear title** describing the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Environment details** (OS, Cocos Creator version, browser)

#### Suggesting Features
Feature suggestions are welcome! Please provide:
- **Clear description** of the feature
- **Use cases** and examples
- **Mockups or diagrams** if applicable
- How it aligns with project goals

#### Contributing Code
1. **Check existing issues** or create a new one
2. **Comment on the issue** to let others know you're working on it
3. **Create a feature branch** from `main`
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Make your changes** following coding standards
5. **Test your changes** thoroughly
6. **Commit your changes** following commit guidelines
7. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
8. **Open a Pull Request**

### 📝 Coding Standards

This project follows strict TypeScript coding standards. Please refer to [CLAUDE.md](./CLAUDE.md) for detailed guidelines.

#### Key Principles

1. **TypeScript Type Safety**
   - Enable strict mode
   - Avoid using `any` type
   - Use interfaces and enums

2. **Naming Conventions**
   - PascalCase for classes: `GameManager`, `BaseUnit`
   - camelCase for methods: `takeDamage()`, `findNearestEnemy()`
   - Public methods: Capital first letter `CreateButton()`
   - Private methods: Lowercase first letter `createButton()`
   - Constants: UPPER_SNAKE_CASE `GAME_CONFIG`
   - Private properties: underscore prefix `_gameManager`

3. **DRY Principle (Don't Repeat Yourself)**
   - Extract common logic to base classes
   - Use utility functions for shared functionality
   - Avoid code duplication

4. **YAGNI Principle (You Aren't Gonna Need It)**
   - Only implement what's needed now
   - Don't create methods "just in case"
   - Remove unused code immediately

5. **Component-Based Architecture**
   - Single responsibility principle
   - Use dependency injection
   - Communicate via direct references and interfaces

#### Example Code Style

```typescript
// ✅ Good
export class OrangeCat extends BaseHero {
    private _attackTimer: number = 0;

    protected initializeHeroStats(): void {
        this.attackDamage = 15;
        this.attackRange = 200;
        this.attackSpeed = 1.0;
    }

    protected performAttack(target: Node): void {
        // Implementation
    }
}

// ❌ Bad
export class OrangeCat extends BaseHero {
    attackTimer: number = 0; // Should be private with underscore

    // Missing method visibility modifier
    initializeHeroStats() { // Should have : void return type
        // Implementation
    }
}
```

### 📦 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

#### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

#### Examples
```bash
feat(hero): add new Scottish Marksman hero

- Implement multi-lock shooting mechanic
- Add hero configuration and stats
- Create hero sprite and icon

Closes #123
```

```bash
fix(battle): correct projectile targeting logic

Fixed issue where projectiles would lose target after enemy death

Fixes #456
```

### 🔍 Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Add tests** if applicable
3. **Update CHANGELOG.md** if it's a significant change
4. **Ensure TypeScript compilation** passes without errors
5. **Request review** from maintainers

#### PR Title Format
Follow the same format as commit messages:
```
feat(scope): add amazing feature
```

#### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Screenshots (if applicable)
Add screenshots to help explain your changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] TypeScript compilation passes
```

### 🎯 Priority Areas for Contribution

We especially welcome contributions in these areas:

1. **New Heroes** - Design and implement new cat heroes
2. **New Enemies** - Create new enemy types with unique abilities
3. **Level Design** - Design new challenging levels
4. **Performance Optimization** - Improve game performance
5. **Documentation** - Improve or translate documentation
6. **Bug Fixes** - Fix reported issues

### 📚 Additional Resources

- [Development Guide](./CLAUDE.md) - Comprehensive development documentation
- [Component Architecture](./COMPONENT_ARCHITECTURE.md) - System architecture
- [Game Design](./docs/GameMechanicsDesign.md) - Game mechanics and design

### ❓ Questions?

If you have questions, feel free to:
- Open an issue with the `question` label
- Start a discussion in [GitHub Discussions](https://github.com/ORIGINAL_OWNER/CatProtectPlanMingame/discussions)

---

## 中文

感谢您对 CatProtectPlanMingame 项目的贡献兴趣！本文档提供了贡献指南。

### 📋 目录

- [行为准则](#行为准则)
- [开始贡献](#开始贡献)
- [开发环境设置](#开发环境设置)
- [如何贡献](#如何贡献)
- [编码规范](#编码规范)
- [提交指南](#提交指南)
- [Pull Request流程](#pull-request流程)

### 🤝 行为准则

本项目遵循行为准则。参与时，您应该：
- 尊重和包容他人
- 欢迎新手并帮助他们学习
- 关注对社区最有利的事情
- 对其他社区成员表现出同理心

### 🚀 开始贡献

1. **Fork 仓库** 在 GitHub 上
2. **克隆您的 fork** 到本地
   ```bash
   git clone https://github.com/YOUR_USERNAME/CatProtectPlanMingame.git
   cd CatProtectPlanMingame
   ```
3. **添加上游远程仓库**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/CatProtectPlanMingame.git
   ```

### 🛠️ 开发环境设置

#### 前置要求
- Cocos Creator 3.8.6
- Node.js v16+
- Git

#### 设置步骤
1. 在 Cocos Creator 3.8.6 中打开项目
2. 等待引擎编译 TypeScript 文件
3. 点击预览按钮测试游戏

#### 运行 TypeScript 类型检查
```bash
# 如果全局安装了 TypeScript
npx tsc --noEmit --skipLibCheck
```

### 💡 如何贡献

#### 报告 Bug
创建 bug 报告前，请检查现有 issues。创建时，请包含：
- **清晰的标题** 描述问题
- **重现步骤**
- **期望行为** vs 实际行为
- **截图**（如适用）
- **环境详情**（操作系统、Cocos Creator版本、浏览器）

#### 建议功能
欢迎功能建议！请提供：
- **清晰的功能描述**
- **用例** 和示例
- **原型图或示意图**（如适用）
- 如何与项目目标对齐

#### 贡献代码
1. **检查现有 issues** 或创建新 issue
2. **在 issue 中评论** 让其他人知道您正在处理它
3. **从 `main` 创建功能分支**
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **按照编码规范进行更改**
5. **彻底测试您的更改**
6. **按照提交指南提交更改**
7. **推送到您的 fork**
   ```bash
   git push origin feature/amazing-feature
   ```
8. **打开 Pull Request**

### 📝 编码规范

本项目遵循严格的 TypeScript 编码规范。详细指南请参考 [CLAUDE.md](./CLAUDE.md)。

#### 核心原则

1. **TypeScript 类型安全**
   - 启用严格模式
   - 避免使用 `any` 类型
   - 使用接口和枚举

2. **命名约定**
   - 类名使用 PascalCase: `GameManager`, `BaseUnit`
   - 方法使用 camelCase: `takeDamage()`, `findNearestEnemy()`
   - 公共方法：首字母大写 `CreateButton()`
   - 私有方法：首字母小写 `createButton()`
   - 常量：UPPER_SNAKE_CASE `GAME_CONFIG`
   - 私有属性：下划线前缀 `_gameManager`

3. **DRY 原则（不要重复自己）**
   - 将通用逻辑提取到基类
   - 使用工具函数处理共享功能
   - 避免代码重复

4. **YAGNI 原则（你不会需要它）**
   - 只实现当前需要的功能
   - 不要"以防万一"创建方法
   - 立即删除未使用的代码

5. **组件化架构**
   - 单一职责原则
   - 使用依赖注入
   - 通过直接引用和接口通信

#### 代码示例

```typescript
// ✅ 正确
export class OrangeCat extends BaseHero {
    private _attackTimer: number = 0;

    protected initializeHeroStats(): void {
        this.attackDamage = 15;
        this.attackRange = 200;
        this.attackSpeed = 1.0;
    }

    protected performAttack(target: Node): void {
        // 实现
    }
}

// ❌ 错误
export class OrangeCat extends BaseHero {
    attackTimer: number = 0; // 应该是私有的，带下划线前缀

    // 缺少方法可见性修饰符
    initializeHeroStats() { // 应该有 : void 返回类型
        // 实现
    }
}
```

### 📦 提交指南

我们遵循 [约定式提交](https://www.conventionalcommits.org/zh-hans/) 规范。

#### 提交消息格式
```
<类型>(<范围>): <主题>

<正文>

<页脚>
```

#### 类型
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更改
- `style`: 代码样式更改（格式化，无逻辑更改）
- `refactor`: 代码重构
- `perf`: 性能改进
- `test`: 添加或更新测试
- `chore`: 维护任务

#### 示例
```bash
feat(hero): 添加新的苏格兰折耳猫射手

- 实现多重锁定射击机制
- 添加英雄配置和属性
- 创建英雄精灵图和图标

Closes #123
```

```bash
fix(battle): 修正投射物目标锁定逻辑

修复了敌人死亡后投射物失去目标的问题

Fixes #456
```

### 🔍 Pull Request 流程

1. **更新文档** 如果您更改了功能
2. **添加测试** 如果适用
3. **更新 CHANGELOG.md** 如果是重大更改
4. **确保 TypeScript 编译** 无错误通过
5. **请求审查** 来自维护者

#### PR 标题格式
遵循与提交消息相同的格式：
```
feat(scope): 添加精彩功能
```

#### PR 描述模板
```markdown
## 描述
更改的简要描述

## 更改类型
- [ ] Bug修复
- [ ] 新功能
- [ ] 破坏性更改
- [ ] 文档更新

## 测试
如何测试此更改？

## 截图（如适用）
添加截图帮助解释您的更改

## 检查清单
- [ ] 代码遵循样式指南
- [ ] 完成自我审查
- [ ] 为复杂代码添加注释
- [ ] 更新文档
- [ ] 没有生成新的警告
- [ ] TypeScript编译通过
```

### 🎯 优先贡献领域

我们特别欢迎在这些领域的贡献：

1. **新英雄** - 设计和实现新的猫咪英雄
2. **新敌人** - 创建具有独特能力的新敌人类型
3. **关卡设计** - 设计新的挑战性关卡
4. **性能优化** - 改进游戏性能
5. **文档** - 改进或翻译文档
6. **Bug修复** - 修复报告的问题

### 📚 额外资源

- [开发指南](./CLAUDE.md) - 完整的开发文档
- [组件架构](./COMPONENT_ARCHITECTURE.md) - 系统架构
- [游戏设计](./docs/GameMechanicsDesign.md) - 游戏机制和设计

### ❓ 有问题？

如果您有问题，欢迎：
- 打开带有 `question` 标签的 issue
- 在 [GitHub Discussions](https://github.com/ORIGINAL_OWNER/CatProtectPlanMingame/discussions) 中开始讨论

---

**感谢您的贡献！💖**
