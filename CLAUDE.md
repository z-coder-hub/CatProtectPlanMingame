# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

这是一个名为 "CatProtectPlanMingame" 的猫咪城堡防御游戏项目 - 使用 **Cocos Creator 3.8.6** 构建的塔防类迷你游戏，采用 **TypeScript** 开发。玩家通过部署不同类型的猫咪英雄来防御老鼠等敌人的攻击，保护城堡。

## 技术栈

- **引擎**: Cocos Creator 3.8.6
- **语言**: TypeScript (严格模式)
- **架构**: 组件化架构，类型安全
- **目标平台**: Web、移动端

## 项目结构

```
assets/
├── scripts/                    # TypeScript脚本文件
│   ├── components/             # 游戏组件
│   │   ├── base/              # 基础组件
│   │   │   └── BaseUnit.ts    # 所有游戏单位的基类
│   │   ├── heroes/            # 英雄组件
│   │   │   └── OrangeCat.ts   # 橘猫射手
│   │   ├── enemies/           # 敌人组件
│   │   │   └── BasicMouse.ts  # 基础老鼠
│   │   ├── game/              # 游戏对象
│   │   │   └── Castle.ts      # 城堡
│   │   └── ui/                # UI组件
│   │       └── GameHUD.ts     # 游戏界面
│   ├── managers/              # 管理器类
│   │   ├── GameManager.ts     # 游戏总控制
│   │   ├── BattleManager.ts   # 战斗管理
│   │   ├── WaveManager.ts     # 波次管理
│   │   └── ResourceManager.ts # 资源管理
│   ├── systems/               # 系统类
│   │   ├── GameBootstrap.ts   # 游戏启动器
│   │   └── GridDeploymentSystem.ts # 网格部署系统
│   └── types/                 # 类型定义
│       ├── GameTypes.ts       # 游戏类型定义
│       └── GameConstants.ts   # 游戏常量配置
├── textures/                  # 图片资源
├── animations/                # 动画资源
└── scenes/                    # 场景文件
```

## 开发原则

### 1. TypeScript 类型安全
- 启用严格模式，所有代码必须有明确类型
- 使用接口定义数据结构
- 利用枚举提高代码可读性
- 避免使用 `any` 类型

### 2. 代码驱动开发
- 所有组件、UI都通过TypeScript代码动态创建
- 使用Graphics API绘制游戏对象外观
- 避免过度依赖编辑器配置

### 3. 组件化架构
- 单一职责原则，每个组件职责明确
- 使用依赖注入，避免紧耦合
- 通过事件系统进行组件间通信

## 核心系统

### 游戏管理器 (GameManager)
- 游戏状态管理
- 金币和资源管理
- 英雄和敌人列表维护
- 游戏事件分发

### 战斗管理器 (BattleManager)
- 战斗逻辑处理
- 目标分配和攻击计算
- 伤害处理和单位死亡

### 波次管理器 (WaveManager)
- 敌人波次生成
- 波次进度控制
- 胜利条件判定

### 网格部署系统 (GridDeploymentSystem)
- 5x5网格管理
- 英雄部署和移动
- 网格状态追踪

## 游戏角色

### 英雄类
- **BaseUnit**: 所有单位的基类，提供生命值、攻击、移动等基础功能
- **OrangeCat**: 橘猫射手，远程攻击，精准射击技能

### 敌人类
- **BasicMouse**: 基础老鼠，朝城堡移动并攻击

### 游戏对象
- **Castle**: 城堡，玩家需要保护的目标

## 类型系统

### 核心枚举
```typescript
enum GameState { MENU, PLAYING, PAUSED, GAME_OVER, VICTORY }
enum HeroType { ORANGE_CAT, SIAMESE_CAT, MAINE_CAT }
enum EnemyType { BASIC_MOUSE }
enum UnitState { IDLE, MOVING, ATTACKING, DEAD }
```

### 核心接口
```typescript
interface UnitStats {
  name: string;
  health: number;
  maxHealth: number;
  attackDamage: number;
  attackRange: number;
  attackSpeed: number;
  moveSpeed: number;
}

interface GameEvents {
  'hero-deployed': { hero: Component; position: GridPosition };
  'enemy-spawned': { enemy: Component; position: WorldPosition };
  'unit-destroyed': { unit: Component; position: WorldPosition };
  'wave-completed': { wave: number };
  'game-state-changed': { newState: GameState; oldState: GameState };
}
```

## 开发规范

### 命名约定
- 组件类使用PascalCase: `GameManager`, `BaseUnit`
- 方法使用camelCase: `takeDamage()`, `findNearestEnemy()`
- 常量使用UPPER_SNAKE_CASE: `GAME_CONFIG`, `UI_CONSTANTS`
- 私有属性使用下划线前缀: `_gameManager`, `_currentHealth`

### 注释规范
- 所有公共方法必须有TSDoc注释
- 复杂逻辑添加行内注释说明
- 接口和类型定义添加用途说明

### 错误处理
- 使用TypeScript严格空值检查
- 对外部依赖进行空值检查
- 优雅处理组件初始化失败

## 游戏配置

所有游戏数值配置集中在 `GameConstants.ts` 中：
- 英雄属性配置
- 敌人属性配置  
- 波次配置
- UI常量
- 游戏常量

## 扩展指南

### 添加新英雄
1. 在 `HeroType` 枚举中添加新类型
2. 在 `HERO_CONFIGS` 中添加配置
3. 创建继承自 `BaseUnit` 的新组件类
4. 实现特有的攻击逻辑和技能

### 添加新敌人
1. 在 `EnemyType` 枚举中添加新类型
2. 在 `ENEMY_CONFIGS` 中添加配置
3. 创建继承自 `BaseUnit` 的新组件类
4. 实现特有的AI行为

### 添加新UI组件
1. 创建继承自 `Component` 的新UI类
2. 使用 Graphics API 绘制界面
3. 通过 GameManager 的事件系统进行通信

## 调试和测试

### 开发工具
- 使用浏览器开发者工具调试
- TypeScript编译器提供类型检查
- console.log输出调试信息

### 性能考虑
- 避免在update()中频繁创建对象
- 使用对象池管理子弹等短生命周期对象
- 合理使用缓存减少重复计算

## 已知问题和解决方案

1. **组件初始化顺序**: 使用GameBootstrap统一管理初始化顺序
2. **类型安全**: 所有组件引用都通过单例模式或依赖注入获取
3. **性能优化**: 战斗系统使用定时更新而非每帧更新

## 更新日志

- **v1.0**: 完成从Cocos Creator 2.4.10到3.8.6的TypeScript迁移
- 实现了完整的游戏核心系统
- 建立了类型安全的开发架构
- 保持了原有游戏玩法和设计

---

这是一个现代化的TypeScript游戏项目，具备良好的架构设计和类型安全保障。