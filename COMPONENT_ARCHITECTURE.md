# 猫咪城堡防御游戏 - 组件架构与依赖关系文档

## 项目概述

这是一个基于 Cocos Creator 3.8.6 和 TypeScript 构建的塔防类游戏，采用组件化架构设计，通过严格的类型安全和单一职责原则实现高度模块化的代码结构。

## 核心架构层次

```
游戏架构层次:
├── 启动层 (Bootstrap Layer)
│   └── GameBootstrap - 游戏启动器和系统初始化
├── 管理层 (Manager Layer)
│   ├── GameManager - 游戏总控制和事件中心
│   ├── BattleManager - 战斗数据中心和目标分配
│   ├── WaveManager - 波次管理和敌人生成
│   └── LevelManager - 关卡系统和英雄解锁
├── 系统层 (System Layer)
│   ├── GridDeploymentSystem - 网格部署系统
│   ├── HeroFactory - 英雄工厂
│   └── EnemyFactory - 敌人工厂
├── 组件层 (Component Layer)
│   ├── UI组件 (GameHUD, HeroSelectionPanel)
│   ├── 英雄组件 (BaseHero + 12种子类)
│   └── 敌人组件 (BaseMouse + 16种子类)
├── 类型层 (Type Layer)
│   ├── GameTypes.ts - 核心类型定义
│   ├── GameConstants.ts - 游戏配置常量
│   └── LevelConfigs.ts - 关卡配置系统
└── 工具层 (Utility Layer)
    ├── UIHelper - UI辅助工具
    ├── DrawingHelper - 绘图辅助工具
    └── EffectHelper - 特效辅助工具
```

## 核心组件详细分析

### 1. 管理器层 (Manager Layer)

#### GameManager - 游戏总控制器和事件中心 ⭐
**职责**: 游戏状态管理、金币系统、关卡控制、事件分发中心
**关键特性**:
- **单例模式**: 全局唯一实例访问
- **事件中心**: 统一处理所有系统间的事件通信
- **状态机**: 管理游戏状态转换 (MENU → DEPLOYMENT → BATTLE → RESTING → VICTORY/GAME_OVER)
- **关卡系统**: 线性10关渐进解锁机制

**主要依赖**:
```typescript
// 依赖的管理器
├── BattleManager - 战斗数据中心
├── WaveManager - 波次管理
├── LevelManager - 关卡和英雄解锁
// 依赖的类型系统
├── GameTypes (GameState, HeroType, LevelConfig)
├── GameConstants (GAME_CONFIG)
└── LevelConfigs (LEVEL_CONFIGS)
```

**事件监听与分发**:
```typescript
// 监听其他管理器的事件
BattleManager → 'enemy-killed' → GameManager.onEnemyKilled()
WaveManager → 'wave-started' → GameManager.onWaveStarted()
WaveManager → 'wave-enemies-cleared' → GameManager.onWaveEnemiesCleared()
LevelManager → 'hero-unlocked' → GameManager.onHeroUnlocked()

// 向外分发的事件
GameManager → 'game-state-changed' → UI组件
GameManager → 'hero-unlocked' → UI组件
```

#### BattleManager - 战斗数据中心 ⭐
**职责**: 统一数据管理、目标分配、战斗逻辑处理
**关键特性**:
- **单一数据源**: 所有英雄和敌人的注册数据统一管理
- **目标分配系统**: 为英雄提供智能目标搜索和分配
- **击杀奖励处理**: 处理敌人死亡和奖励计算
- **数据查询服务**: 为投射物、技能系统提供数据接口

**主要依赖**:
```typescript
// 组件引用
├── BaseHero - 英雄基类
├── BaseMouse - 敌人基类
├── GridDeploymentSystem - 网格系统
// 类型系统
└── GameTypes (GridPosition)
```

**数据管理架构**:
```typescript
// 注册系统
RegisterHero(heroNode: Node) → _registeredHeroes[]
RegisterEnemy(enemyNode: Node) → _registeredEnemies[]

// 数据查询接口
assignTargetForHero() → 智能目标分配
findNearestEnemy() → 最近敌人搜索
getAllActiveEnemies() → 活跃敌人列表
getAllDeployedHeroes() → 部署英雄列表
```

#### WaveManager - 波次管理器
**职责**: 敌人波次生成、定时控制、胜利条件判定
**主要依赖**:
```typescript
├── EnemyFactory - 敌人创建
├── GameTypes (LevelConfig, WaveConfig)
└── GameConstants - 波次配置
```

#### LevelManager - 关卡系统管理器
**职责**: 关卡进度、英雄解锁（成就系统已移除，简化为v1.6）
**主要依赖**:
```typescript
├── GameTypes (HeroType, LevelConfig)
└── LevelConfigs - 关卡数据
```

### 2. 系统层 (System Layer)

#### GridDeploymentSystem - 网格部署系统 ⭐
**职责**: 11x6网格管理、英雄部署、拖拽预览
**关键特性**:
- **动态网格计算**: 基于屏幕尺寸自适应计算格子大小
- **拖拽预览系统**: 实时视觉反馈和冲突检测
- **坐标转换**: 网格坐标↔世界坐标的双向转换
- **Widget自适应布局**: 支持多分辨率屏幕适配

**主要依赖**:
```typescript
// Cocos Creator组件
├── Graphics - 网格渲染和预览效果
├── Widget - 自适应布局
├── UITransform - 坐标转换
// 类型系统
└── GameTypes (GridPosition)
```

**核心接口**:
```typescript
// 坐标转换
GridToWorldPosition(gridPos) → Vec3
WorldToGridPosition(worldPos) → GridPosition | null

// 部署管理
CanDeployAt(gridPos) → boolean
DeployHero(heroNode, gridPos) → boolean
RemoveHero(gridPos) → Node | null

// 拖拽预览
StartDragMode() / EndDragMode()
UpdateHoverPosition(worldPosition)
```

#### HeroFactory & EnemyFactory - 工厂系统
**职责**: 英雄和敌人的动态创建和配置
**主要依赖**:
```typescript
├── GameConstants - 单位配置数据
├── BaseHero/BaseMouse - 基类引用
└── 具体子类 - 12种英雄 / 16种敌人
```

### 3. 组件层 (Component Layer)

#### UI组件子系统

##### GameHUD - 主游戏界面 ⭐
**职责**: 游戏状态显示、控制按钮、游戏失败对话框
**关键特性**:
- **实时数据更新**: 金币、波次、血量、关卡信息的实时显示
- **自适应布局**: 使用Widget组件实现多分辨率适配
- **状态驱动UI**: 根据游戏状态动态更新按钮和显示内容
- **模态对话框**: 游戏失败时的全局覆盖对话框

**主要依赖**:
```typescript
// 管理器引用
├── GameManager - 游戏状态和统计数据
├── WaveManager - 波次信息
├── GameBootstrap - Canvas节点引用
// 工具类
├── UIHelper - UI组件创建和布局
// 类型系统
└── GameTypes (GameState)
```

##### HeroSelectionPanel - 英雄选择面板
**职责**: 英雄选择、拖拽部署、技能显示
**主要依赖**:
```typescript
├── HeroFactory - 英雄创建
├── GridDeploymentSystem - 部署交互
├── LevelManager - 英雄解锁状态
└── UIHelper - 面板布局
```

#### 游戏单位组件子系统

##### BaseHero - 英雄抽象基类 ⭐
**职责**: 统一英雄行为、外观渲染、攻击系统
**关键特性**:
- **统一投射物攻击**: 所有英雄都基于投射物攻击机制
- **统一外观系统**: Graphics组件管理和标签创建
- **目标搜索**: 通过BattleManager进行智能目标分配
- **技能系统**: 支持主动技能和点击事件处理

**主要依赖**:
```typescript
// 管理器交互
├── BattleManager - 注册和目标分配
├── GameManager - 游戏状态引用
// 工具类
├── DrawingHelper - 外观绘制
// 类型系统
├── GameTypes (HeroType, HeroState, UnitStats)
└── Cocos Creator (Graphics, Label, Animation)
```

**抽象方法设计**:
```typescript
// 强制实现的核心方法
abstract readonly heroType: HeroType;
abstract initializeHeroStats(): void;
abstract initializeHeroVisuals(): void;
abstract performAttack(target: Node): void;

// 可选重写的方法
getHeroLabelConfig(): LabelConfig { /* 默认实现 */ }
onHeroClickHandler(): void { /* 默认实现 */ }
activateSpecialSkill(): void { /* 空实现 */ }
```

##### BaseMouse - 敌人抽象基类 ⭐
**职责**: 统一敌人行为、移动系统、血量管理
**关键特性**:
- **纯突破机制**: 专注于到达城堡，不攻击英雄
- **统一移动系统**: Tween-based移动，支持多种移动模式
- **统一血量系统**: 血条显示和伤害处理
- **统一标签系统**: 22px大字体名称显示

**主要依赖**:
```typescript
// 管理器交互
├── BattleManager - 注册和死亡处理
├── GameManager - 游戏状态引用
// 工具类
├── DrawingHelper - 外观绘制
// 类型系统
├── GameTypes (EnemyType, EnemyState, EnemyUnitStats)
└── Cocos Creator (Graphics, Label, Tween)
```

### 4. 类型系统层 (Type Layer)

#### GameTypes.ts - 核心类型定义
**内容**: 枚举、接口、事件类型
```typescript
// 核心枚举
enum GameState { MENU, DEPLOYMENT, BATTLE, RESTING, VICTORY, GAME_OVER }
enum HeroType { ORANGE_CAT, PERSIAN_SNIPER, ... } // 12种英雄
enum EnemyType { BASIC_MOUSE, GIANT_MOUSE, ... } // 16种敌人

// 核心接口
interface UnitStats { name, attackDamage, attackRange, attackSpeed }
interface EnemyUnitStats { name, health, maxHealth, moveSpeed }
interface GridPosition { row: number; col: number }
```

#### GameConstants.ts - 游戏配置常量
**内容**: 所有游戏数值配置
```typescript
HERO_CONFIGS: Record<HeroType, HeroConfig> // 12种英雄完整属性
ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> // 16种敌人完整属性
GAME_CONFIG: { gridConfig, castleHealth, restDuration, ... }
```

#### LevelConfigs.ts - 关卡配置系统
**内容**: 10关渐进解锁配置
```typescript
LEVEL_CONFIGS: {
  前3关: 英雄解锁关卡
  后7关: BOSS挑战关卡
  奖励系统: 金币、英雄解锁、成就
}
```

### 5. 工具层 (Utility Layer)

#### UIHelper - UI辅助工具
**职责**: 统一UI组件创建、Widget布局、按钮事件处理
**核心功能**:
```typescript
// Widget布局辅助
SetupFullWidthTopWidget() - 全屏顶部对齐
SetupLeftAlignWidget() - 左对齐布局
SetupRightAlignWidget() - 右对齐布局
SetupCenterWidget() - 居中布局

// 组件创建辅助
CreatePanelWithBackground() - 带背景的面板
CreateEqualWidthButtons() - 等宽按钮组
CreateCircleIcon() - 圆形图标
```

## 数据流和交互模式

### 1. 事件驱动架构

游戏采用事件驱动的松耦合架构，主要事件流如下：

```
事件流向图:
敌人被击杀 → BattleManager.HandleEnemyKilled()
           ↓ emit('enemy-killed')
           → GameManager.onEnemyKilled()
           → GameManager.AddGold()

波次开始 → WaveManager.StartWave()
        ↓ emit('wave-started')
        → GameManager.onWaveStarted()
        → GameManager.currentWave更新

波次完成 → WaveManager波次检测
        ↓ emit('wave-enemies-cleared')
        → GameManager.onWaveEnemiesCleared()
        → GameManager.NextWave() 或 CompleteLevel()

英雄解锁 → LevelManager.UnlockHero()
        ↓ emit('hero-unlocked')
        → GameManager.onHeroUnlocked()
        → UI更新通知
```

### 2. 数据委托模式

为避免数据重复存储，项目采用数据委托模式：

```
数据流架构:
BattleManager (数据中心)
├── _registeredHeroes: Node[] - 唯一英雄数据源
├── _registeredEnemies: Node[] - 唯一敌人数据源
│
GameManager (数据委托)
├── 通过 BattleManager.instance.getAllDeployedHeroes()
├── 通过 BattleManager.instance.getAllActiveEnemies()
│
投射物系统 (数据查询)
├── 通过 BattleManager.instance.findNearestEnemy()
├── 通过 BattleManager.instance.GetEnemiesInRange()
```

### 3. 单例模式集群

所有管理器类都采用单例模式，确保全局唯一性：

```typescript
// 单例访问模式
GameManager.instance      - 游戏总控制
BattleManager.instance    - 战斗数据中心
WaveManager.instance      - 波次管理
LevelManager.instance     - 关卡系统
GridDeploymentSystem.instance - 网格系统
```

### 4. 组件注册机制

游戏单位通过注册机制与管理器交互：

```typescript
// 英雄注册流程
BaseHero.start() → BattleManager.RegisterHero(this.node)
                → 添加到 _registeredHeroes[]
                → 设置网格坐标信息

// 敌人注册流程
BaseMouse.start() → BattleManager.RegisterEnemy(this.node)
                 → 添加到 _registeredEnemies[]
                 → 开始移动向城堡

// 注销机制
单位死亡/清理 → BattleManager.UnregisterHero/Enemy()
             → 从注册列表移除
             → 自动清理引用
```

### 5. UI数据绑定

UI组件通过轮询机制获取最新数据：

```typescript
// GameHUD数据更新循环
GameHUD.update() → GameManager.GetGameStats()
                → WaveManager.GetWaveStats()
                → 更新金币、波次、血量显示
                → 根据游戏状态更新按钮
```

## 架构优势与特点

### 1. 高度模块化
- **单一职责**: 每个组件职责明确，边界清晰
- **松耦合**: 组件间通过接口和事件通信，减少直接依赖
- **易扩展**: 新增英雄/敌人只需继承基类并实现差异化方法

### 2. 类型安全
- **严格模式**: TypeScript strict mode确保类型安全
- **强类型接口**: 所有组件间交互都有明确的类型定义
- **编译时检查**: 在开发阶段就能发现类型错误

### 3. DRY原则实现
- **统一基类**: BaseHero和BaseMouse消除重复代码
- **抽象与具体分离**: 强制抽象的核心功能与可选的特殊功能
- **配置驱动**: 通过配置而非硬编码区分不同实例

### 4. 性能优化
- **对象池**: SimpleObjectPool管理短生命周期对象
- **定时更新**: 战斗系统使用定时器而非每帧更新
- **智能缓存**: 组件引用缓存减少重复查找

### 5. 多分辨率适配
- **Widget组件**: 优先使用Widget实现自适应布局
- **动态计算**: 网格系统基于屏幕尺寸动态计算
- **UIHelper工具**: 统一的UI创建和布局工具

## 扩展指南

### 添加新英雄
1. 在`HeroType`枚举中添加新类型
2. 在`HERO_CONFIGS`中添加配置
3. 创建继承`BaseHero`的新类
4. 实现必需的抽象方法
5. 可选重写特殊行为方法

### 添加新敌人
1. 在`EnemyType`枚举中添加新类型
2. 在`ENEMY_CONFIGS`中添加配置
3. 创建继承`BaseMouse`的新类
4. 实现`getConfig()`方法
5. 可选重写移动和特殊能力

### 添加新UI组件
1. 继承`Component`创建新UI类
2. 使用`UIHelper`进行布局和组件创建
3. 通过事件系统与管理器通信
4. 确保使用Widget组件进行自适应

这个架构设计确保了代码的可维护性、可扩展性和类型安全性，同时提供了良好的性能和用户体验。每个组件都有明确的职责和边界，通过事件系统和数据委托实现了高度的解耦。