# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

这是一个名为 "CatProtectPlanMingame" 的猫咪城堡防御游戏项目 - 使用 **Cocos Creator 3.8.6** 构建的塔防类迷你游戏，采用 **TypeScript** 开发。玩家通过部署不同类型的猫咪英雄来防御老鼠等敌人的攻击，保护城堡。

**游戏模式**: 10关渐进解锁系统，前3关快速解锁全部12种英雄，后7关为独特BOSS挑战。游戏失败后自动重置到第1关重新开始，没有关卡选择界面。

**核心特色**: 统一投射物攻击机制 - 所有英雄都基于发射投射物，包括物理子弹、魔法弹、冲击波等，提供丰富的射击体验。

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
│   │   ├── heroes/            # 英雄组件 (12种英雄类型)
│   │   │   ├── BaseHero.ts    # 英雄抽象基类
│   │   │   ├── OrangeCat.ts   # 橘猫射手
│   │   │   ├── PersianSniper.ts # 波斯猫狙击手
│   │   │   ├── BengalHunter.ts # 孟加拉猎手
│   │   │   ├── SiameseMage.ts # 暹罗猫法师
│   │   │   ├── MaineThunder.ts # 缅因猫雷法师
│   │   │   ├── NorwegianIce.ts # 挪威森林猫冰法师
│   │   │   ├── BritishKnight.ts # 英国短毛猫骑士
│   │   │   ├── RagdollGuardian.ts # 布偶猫守护者
│   │   │   ├── RussianBlue.ts # 俄罗斯蓝猫刺客(调整为近战)
│   │   │   ├── AmericanBomber.ts # 美国短毛猫爆破手(调整为近战)
│   │   │   ├── ScottishEngineer.ts # 苏格兰折耳猫工程师
│   │   │   └── AbyssinianScout.ts # 阿比西尼亚猫侦察兵
│   │   ├── enemies/           # 敌人组件 (16种老鼠类型，含7种新BOSS)
│   │   │   ├── BaseMouse.ts   # 老鼠抽象基类
│   │   │   ├── BasicMouse.ts  # 基础老鼠
│   │   │   ├── GiantMouse.ts  # 巨型老鼠
│   │   │   ├── FastMouse.ts   # 快速老鼠
│   │   │   ├── ENEMIES_DESIGN_PRINCIPLES.md # ⚠️ 敌人设计原则文档
│   │   │   └── ... (其他13种老鼠，含7种新BOSS)
│   │   ├── game/              # 游戏对象
│   │   │   └── Castle.ts      # 城堡
│   │   └── ui/                # UI组件
│   │       ├── GameHUD.ts     # 主游戏界面
│   │       └── HeroSelectionPanel.ts # 英雄选择面板
│   ├── managers/              # 管理器类
│   │   ├── GameManager.ts     # 游戏总控制
│   │   ├── BattleManager.ts   # 战斗管理
│   │   ├── WaveManager.ts     # 波次管理
│   │   └── LevelManager.ts    # 关卡管理
│   ├── systems/               # 系统类
│   │   ├── GameBootstrap.ts   # 游戏启动器
│   │   ├── GridDeploymentSystem.ts # 网格部署系统
│   │   ├── HeroFactory.ts     # 英雄工厂系统
│   │   ├── EnemyFactory.ts    # 敌人工厂系统
│   │   └── SkillSystem.ts     # 技能系统
│   ├── types/                 # 类型定义
│   │   ├── GameTypes.ts       # 游戏类型定义
│   │   ├── GameConstants.ts   # 游戏常量配置
│   │   └── LevelConfigs.ts    # 关卡配置系统
│   └── utils/                 # 工具类
│       ├── DrawingHelper.ts   # 绘图辅助工具
│       ├── EffectHelper.ts    # 特效辅助工具
│       └── UIHelper.ts        # UI辅助工具
├── textures/                  # 图片资源
├── animations/                # 动画资源
└── scenes/                    # 场景文件
```

## 开发原则

### 8. 按需实现原则 (YAGNI - You Aren't Gonna Need It) ⚡
- **严格禁止提前生成**: 如果一个函数方法暂时没有使用的地方，就**绝对不要**提前生成
- **按需开发**: 只在实际需要时才创建新的方法、类或系统
- **延迟决策**: 等到明确需求时再实现具体功能，避免过度设计
- **渐进式开发**: 优先实现核心功能，然后根据实际需要逐步扩展
- **立即删除**: 发现未使用的方法时应立即删除，不要保留"以备后用"

#### YAGNI 实践要点：
- **需求驱动**：所有代码必须有明确的使用场景和需求支撑
- **最小可行产品**：首先实现最小功能集，确保系统可用
- **重构优于预设计**：在真正需要时通过重构扩展功能，而不是提前预设复杂架构
- **删除无用代码**：定期清理没有被调用的方法和类
- **工具方法例外**：状态查询、清理、配置等管理方法即使暂时未使用也可能有价值，但需要明确标记用途

#### YAGNI 违规示例：
```typescript
// ❌ 错误：提前生成可能用不到的方法
class ProjectilePoolManager {
    // 这些方法目前没有任何地方调用，违反YAGNI原则
    static getPoolsInfo(): PoolInfo { ... }      // 状态查询
    static clearAllPools(): void { ... }         // 场景切换清理
    static setMaxPoolSize(size: number): void { ... } // 配置设置
    static preloadPool(type: ProjectileType, count: number): void { ... } // 预热功能
}

// ✅ 正确：只实现当前需要的方法
class ProjectilePoolManager {
    static getProjectile(type: ProjectileType): Node {
        // 实际在ProjectileSystem中被调用的方法
    }

    static recycleProjectile(node: Node, type: ProjectileType): void {
        // 实际在BaseProjectile中被调用的方法
    }

    // 当未来真正需要状态查询或预热功能时再添加相关方法
}
```

#### YAGNI 执行准则：
- **代码审查时严格检查**：任何新增方法必须有明确的调用者
- **定期清理无用方法**：每周检查并删除未被使用的方法
- **抵制"可能有用"的诱惑**：即使逻辑完善，没有使用者就不要实现
- **文档化例外情况**：如果确实需要保留某些"备用"方法，必须在代码中明确注释原因

### ⚠️ 重要：敌人文件修改前必读

**在修改 `assets/scripts/components/enemies/` 目录下的任何文件之前，必须先阅读 `ENEMIES_DESIGN_PRINCIPLES.md` 文档。**

该文档包含：
- 敌人设计的核心原则和约束
- 纯塔防机制的具体要求
- 敌人能力的允许范围和禁止行为
- 代码实现的标准模式和最佳实践

遵循该文档可以确保：
- 保持游戏的塔防机制纯粹性
- 避免违反设计原则的错误修改
- 维护代码架构的一致性和可维护性

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
- 通过直接引用和接口进行组件间通信

### 4. DRY 原则 (Don't Repeat Yourself)
- **抽象共同逻辑**: 将重复的代码提取到基类或工具函数中
- **统一接口设计**: 相同功能的组件应使用统一的接口和方法签名
- **避免代码重复**: 通过继承、组合、工具类等方式消除重复实现
- **配置集中管理**: 相同的配置项应统一管理，避免分散在各个文件中

#### DRY 实践要点：
- **基类统一实现**：将通用的初始化、渲染、事件处理逻辑提取到抽象基类
- **子类专注差异**：子类只需实现自己独有的特性和行为
- **配置驱动设计**：通过配置参数而非硬编码来区分不同实例
- **工具类复用**：将通用功能封装到工具类中供多个组件使用

### 5. 抽象方法设计原则
- **强制抽象与可选重写平衡**: 在抽象基类设计中，区分必须实现的核心功能和可选的特殊行为
- **强制抽象的判断标准**: 当每个子类都必须提供不同实现时，应设为抽象方法
- **可选重写的判断标准**: 当只有部分子类需要特殊化行为时，应提供合理的默认实现
- **避免过度抽象**: 不强制子类实现它们不需要的功能，保持设计的最小化原则
- **类型安全优先**: 利用编译器检查确保关键方法的正确实现

### 6. 代码库清洁
- 及时删除废弃的代码和文件
- 避免注释掉的代码长期保留
- 定期清理未使用的import和方法
- 保持项目结构简洁明了

### 7. 事件和通信设计
- **优先使用 Cocos Creator 官方事件系统**: Cocos Creator 提供了成熟优化的事件框架，应作为首选通信方式
- **充分利用节点事件**: 使用 `node.emit()` 和 `node.on()` 进行组件间通信，这是官方推荐的标准做法
- **合理使用触摸事件**: 利用 `Node.EventType.TOUCH_*` 系列事件处理用户交互
- **避免自定义事件总线**: 不要创建额外的事件总线系统，Cocos Creator的事件机制已足够强大
- **结合直接引用**: 在合适场景下结合直接方法调用，与事件系统形成互补
- **接口定义规范**: 使用接口 (如 `IHeroDeploymentHandler`) 定义组件间的通信契约

#### 通信设计要点：
- **优先官方事件系统**：充分利用Cocos Creator提供的节点事件、触摸事件、按钮事件
- **事件与直接调用结合**：在性能关键场景使用直接方法调用，在松耦合场景使用事件通信
- **接口定义通信契约**：通过接口明确组件间的通信协议和责任边界
- **避免过度设计**：不要创建不必要的自定义事件总线，利用现有机制即可满足需求

## 核心系统

### 游戏管理器 (GameManager)
- 游戏状态管理
- 金币和资源管理
- 关卡系统和波次管理
- 游戏事件分发
- **数据访问委托**: 通过BattleManager获取英雄和敌人数据，避免数据重复存储

### 战斗管理器 (BattleManager) ⭐ **核心战斗数据中心**
- **单一数据源**: 统一托管所有英雄和敌人的注册数据
- **战斗逻辑处理**: 目标分配和攻击计算
- **伤害处理和单位死亡**: 击杀奖励系统和单位清理
- **全局攻击系统**: 智能识别远程射击英雄类型，提供无范围限制的目标搜索
- **数据查询服务**: 为投射物、英雄、敌人提供统一的数据查询接口

### 波次管理器 (WaveManager)
- 敌人波次生成
- 波次进度控制
- 胜利条件判定

### 网格部署系统 (GridDeploymentSystem)
- 11x6网格管理
- 英雄部署和移动
- 网格状态追踪

## 游戏角色

### 英雄类 (统一投射物攻击机制)
基于DRY原则和纯塔防机制，英雄系统采用了简化的分类架构，包含**12种英雄类型**分为2个分类：

- **BaseHero**: 英雄抽象基类，统一实现外观渲染、标签创建、点击事件和投射物攻击等通用功能
  - 统一的Graphics组件管理和外观绘制
  - 统一的名称标签创建和配置（18px大字体）
  - 统一的点击事件处理和技能触发
  - **统一投射物攻击系统**：所有英雄都基于发射投射物，区别在于投射物效果
  - 通过英雄类型枚举自动选择对应的外观绘制和攻击方式

#### 抽象方法设计原则
BaseHero采用**强制抽象**与**可选重写**相结合的设计模式，在强制一致性和灵活性之间达到平衡：

**🔒 强制抽象方法设计理念：**
- **核心身份标识**：每个英雄必须明确自己的类型和特征
- **属性和外观初始化**：每个英雄有不同的数值配置和视觉表现
- **攻击行为实现**：每个英雄有独特的攻击方式和逻辑
- **标签配置**：每个英雄需要提供完整的名称和显示配置

**🔓 可选重写方法设计理念：**
- **特殊技能系统**：只有部分英雄拥有主动技能，其他使用空实现
- **点击行为处理**：多数英雄使用默认行为，少数需要特殊处理
- **状态处理逻辑**：通用的AI状态机适用于大部分英雄

**🎯 设计目标：**
- **强制一致性**：确保所有英雄都有必需的核心功能
- **避免重复实现**：为通用行为提供合理的默认实现
- **保持灵活性**：允许特殊英雄重写默认行为
- **类型安全保障**：编译时检查确保接口完整性

此设计模式确保新增英雄时只需关注差异化特性，而无需重复实现通用功能。

#### 🏹 射击英雄类 (8种，67%) - 投射物攻击专家

**物理射击子类 (4种)**：
- **OrangeCat**: 橘猫射手 - 基础物理子弹，单体伤害，**超大攻击范围**
- **PersianSniper**: 波斯猫狙击手 - 高伤害狙击弹，暴击效果，**超大攻击范围**
- **BengalHunter**: 孟加拉猎手 - 快速连射弹，快速输出，**超大攻击范围**
- **🔄 ScottishMarksman**: 苏格兰折耳猫射手 - 多重锁定射手，精确制导

**魔法射击子类 (4种)**：
- **SiameseMage**: 暹罗猫法师 - 火球弹→爆炸AOE伤害
- **MaineThunder**: 缅因猫雷法师 - 雷电弹→链式跳跃攻击
- **NorwegianIce**: 挪威森林猫冰法师 - 冰弹→减速+AOE冻结
- **🔄 AbyssinianArcher**: 阿比西尼亚猫弓箭手 - 魔法箭雨，扇形齐射

**重要特性**：所有物理射击英雄拥有**超大攻击范围**，攻击范围覆盖整个战场区域，可以攻击地图上任意位置的敌人。

#### ⚔️ 近战英雄类 (4种，33% ✅) - 近距离战斗专家
- **BritishKnight**: 英短骑士 - 剑气冲击波，前排控制
- **RagdollGuardian**: 布偶猫守护者 - 护盾冲击，防御反击
- **🔄 RussianBlue**: 俄罗斯蓝猫刺客 - 调整为近战，暗影刃攻击，高暴击
- **🔄 AmericanBomber**: 美国短毛猫爆破手 - 调整为近战，近程爆炸攻击

每个英雄子类只需要：
1. 实现 `initializeHeroStats()` 设置属性
2. 实现 `initializeHeroVisuals()` 做特殊初始化
3. 可选重写 `getHeroLabelConfig()` 自定义标签
4. 可选重写 `onHeroClickHandler()` 自定义点击行为

### 敌人类 (DRY原则重构)
敌人系统同样采用统一的基类架构，包含**16种敌人类型**分为5个分类（含7种新BOSS）：

- **BaseMouse**: 老鼠抽象基类，统一实现移动、标签等通用功能
  - 统一的名称标签创建和配置（22px大字体）
  - 统一的城堡移动逻辑
  - 统一的生命值管理和死亡处理
  - 老鼠专注突破防线，**不具备攻击能力**

#### 🚫 敌人设计原则 - 纯塔防机制
**核心原则**: 敌人不能攻击或伤害英雄，这是塔防游戏的基本设计理念。

**✅ 允许的敌人行为**：
- **移动到城堡**: 敌人的唯一目标是突破防线到达城堡
- **对城堡造成伤害**: 到达城堡后对城堡造成伤害
- **防御性特殊能力**: 护盾、护甲、减伤、潜行等防御机制
- **控制效果**: 可以通过特殊能力影响英雄，但不直接造成伤害：
  - **视觉干扰**: 创建烟雾、闪光等影响瞄准精度
  - **电磁干扰**: 暂时降低英雄攻击精度或攻击速度
  - **地形阻挡**: 创建临时屏障影响攻击路径
  - **威慑效果**: 展示强大气场但不造成实际伤害

**❌ 严格禁止的敌人行为**：
- **直接攻击英雄**: 敌人不能主动攻击或伤害英雄
- **对英雄造成伤害**: 任何形式的直接伤害都不允许
- **攻击相关属性**: 攻击力、攻击范围、攻击速度等属性

**🎯 设计目标**：
- **角色分工明确**: 英雄负责攻击，敌人负责突破
- **策略深度**: 通过敌人的控制效果增加策略性
- **游戏平衡**: 避免双向攻击导致的复杂平衡问题
- **玩家体验**: 保持塔防游戏的经典玩法和预期

**🔧 实现指南**：
- 敌人的特殊能力应该专注于**生存能力**和**控制效果**
- 所有"攻击"特效应该重新设计为**威慑**或**干扰**效果
- 代码中不应包含敌人对英雄的伤害计算逻辑
- 敌人配置中不应包含攻击相关的数值属性

#### 基础单位 (2种)
- **BasicMouse**: 基础老鼠 - 普通血量，中等速度
  - **特殊能力**: 无特殊能力，标准突破单位
- **GiantMouse**: 巨型老鼠 - 高血量，较慢速度
  - **特殊能力**: 狂暴模式、额外金币掉落

#### 快速单位 (2种)
- **FastMouse**: 快速老鼠 - 低血量，高速移动
  - **特殊能力**: 无特殊能力，标准快速单位
- **SpeedMouse**: 疾速老鼠 - 极低血量，极高速度
  - **特殊能力**: 受伤加速、残影效果

#### 装甲单位 (2种)
- **ArmoredMouse**: 装甲老鼠 - 中等血量，护甲减伤
  - **特殊能力**: 基础护甲减伤
- **TankMouse**: 坦克老鼠 - 极高血量，护甲值，缓慢移动
  - **特殊能力**: 护甲减伤

#### 特殊单位 (1种)
- **StealthMouse**: 潜行老鼠 - 潜行躲避攻击能力
  - **特殊能力**: 闪避攻击

#### BOSS单位 (9种：2种基础BOSS + 7种新BOSS)
**基础BOSS**:
- **MouseKing**: 老鼠王 - 超高血量，可召唤小兵
  - **特殊能力**: 召唤小老鼠
- **MechMouse**: 机械老鼠 - 高血量，特殊机械属性
  - **特殊能力**: 激光威慑、远程威胁显示

**关卡4-10新BOSS** (具备强大防御和控制能力):
- **ArmorOverlord**: 重甲统领 - 超高护甲值，减伤防御
  - **特殊能力**: 超高护甲、伤害减免80%、重装冲锋威慑
- **ShadowAssassin**: 潜影刺客 - 高潜行几率，伤害减免
  - **特殊能力**: 永久潜行、伤害免疫50%、暗影闪烁
- **StormTyrant**: 疾风暴君 - 极速移动，召唤疾速小兵
  - **特殊能力**: 极速移动、召唤疾速小兵、风暴冲击威慑
- **GiantBehemoth**: 巨兽霸主 - 超大血量，威慑践踏特效
  - **特殊能力**: 超大血量、践踏范围威慑、地震冲击特效
- **ThunderMaster**: 雷电大师 - 电磁干扰特效，电流场护盾
  - **特殊能力**: 链式雷电威慑、电流场护盾、雷电风暴特效
- **MechCommander**: 机械军团长 - 限量召唤机械兵，自我修复
  - **特殊能力**: 无限召唤机械兵、自我修复、激光炮台威慑
- **UltimateOverlord**: 终极霸王 - 融合所有BOSS防御能力，最终挑战
  - **特殊能力**: 融合所有能力、多重形态、终极毁灭威慑

### 游戏对象
- **Castle**: 城堡，玩家需要保护的目标

## 类型系统

### 核心枚举
```typescript
enum GameState {
  MENU, DEPLOYMENT, BATTLE, RESTING, PLAYING,
  VICTORY, GAME_OVER
}

enum HeroType {
  // 射击英雄 - 物理射击子类
  ORANGE_CAT, PERSIAN_SNIPER, BENGAL_HUNTER, SCOTTISH_MARKSMAN,
  // 射击英雄 - 魔法射击子类
  SIAMESE_MAGE, MAINE_THUNDER, NORWEGIAN_ICE, ABYSSINIAN_ARCHER,
  // 近战英雄
  BRITISH_KNIGHT, RAGDOLL_GUARDIAN, RUSSIAN_BLUE, AMERICAN_BOMBER
}

enum EnemyType {
  // 基础单位
  BASIC_MOUSE, GIANT_MOUSE,
  // 快速单位
  FAST_MOUSE, SPEED_MOUSE,
  // 装甲单位
  ARMORED_MOUSE, TANK_MOUSE,
  // 特殊单位
  STEALTH_MOUSE,
  // 基础BOSS单位
  MOUSE_KING, MECH_MOUSE,
  // 新BOSS单位（关卡4-10专用）
  ARMOR_OVERLORD, SHADOW_ASSASSIN, STORM_TYRANT,
  GIANT_BEHEMOTH, THUNDER_MASTER, MECH_COMMANDER,
  ULTIMATE_OVERLORD
}

// 英雄状态枚举（英雄不会死亡，不会移动）
enum HeroState {
  IDLE,       // 待机
  ATTACKING   // 攻击中
}

// 敌人状态枚举（敌人专注突破防线，不具备攻击能力）
enum EnemyState {
  IDLE,       // 待机
  MOVING,     // 移动中
  DEAD        // 死亡
}
```

### 核心接口 (游戏机制纯化后 + v1.6简化)
```typescript
// 英雄单位属性（无生命值，无移动速度）
interface UnitStats {
  readonly name: string;
  attackDamage: number;
  attackRange: number;
  attackSpeed: number;
}

// 敌人单位属性（有生命值，无攻击能力）
interface EnemyUnitStats {
  readonly name: string;
  health: number;
  maxHealth: number;
  moveSpeed: number;
}

// 简化的奖励类型（v1.6优化，仅保留实际使用的）
enum RewardType {
  GOLD = "gold",                    // 金币奖励
  HERO_UNLOCK = "heroUnlock"        // 英雄解锁
}

// 简化的关卡配置（v1.6优化，移除未使用字段）
interface LevelConfig {
  id: string;                       // 关卡唯一ID
  name: string;                     // 关卡名称
  description: string;              // 关卡描述
  initialGold: number;              // 初始金币
  waves: WaveConfig[];              // 波次配置
  rewards: RewardConfig[];          // 奖励配置
  learningObjectives: string[];     // 学习目标
}
```

## 开发规范

### 命名约定
- 组件类使用PascalCase: `GameManager`, `BaseUnit`
- 方法使用camelCase: `takeDamage()`, `findNearestEnemy()`
- **公共方法**使用大写开头的camelCase: `CreateButton()`, `SetupLayout()`
- **私有方法**使用小写开头的camelCase: `createButton()`, `setupLayout()`
- **受保护方法**不限制大小写，可根据具体场景选择: `HandleEvent()`, `updateDisplay()`
- **Cocos Creator生命周期方法**遵循Cocos规则: `onLoad()`, `start()`, `update()`, `onDestroy()`
- **工具类静态方法**使用大写开头的camelCase: `UIHelper.CreateButton()`, `UIHelper.SetupWidget()`
- 常量使用UPPER_SNAKE_CASE: `GAME_CONFIG`, `UI_CONSTANTS`
- 私有属性使用下划线前缀: `_gameManager`, `_currentHealth`

#### 方法可见性命名规则说明：
```typescript
// ✅ 正确：公共方法大写开头
class MyComponent {
    public CreateElement(): Node { ... }
    public SetupComponent(): void { ... }
}

// ✅ 正确：Cocos Creator生命周期方法遵循Cocos规则
class MyComponent extends Component {
    protected onLoad(): void { ... }     // 遵循Cocos规则
    protected start(): void { ... }      // 遵循Cocos规则
    protected update(dt: number): void { ... }  // 遵循Cocos规则
    protected onDestroy(): void { ... }  // 遵循Cocos规则
}

// ✅ 正确：自定义受保护方法不限制大小写
class MyComponent {
    protected HandleEvent(): void { ... }   // 可大写开头
    protected updateDisplay(): void { ... } // 可小写开头
}

// ✅ 正确：私有方法小写开头
class MyComponent {
    private createInternalNode(): Node { ... }
    private handlePrivateEvent(): void { ... }
}

// ✅ 正确：工具类静态方法大写开头
export class UIHelper {
    static CreateButton(): Node { ... }
    static SetupWidget(): void { ... }
}
```

### 注释规范
- 所有公共方法必须有TSDoc注释
- 复杂逻辑添加行内注释说明
- 接口和类型定义添加用途说明

### 错误处理
- 使用TypeScript严格空值检查
- 对外部依赖进行空值检查
- 优雅处理组件初始化失败

## 游戏配置

游戏数值配置分布在两个文件中：
**`GameConstants.ts`** - 基础配置：
- 英雄属性配置（12种英雄的完整属性，统一投射物攻击机制）
- 敌人属性配置（16种老鼠的完整属性，含7种新BOSS）
- UI常量
- 游戏常量

**`LevelConfigs.ts`** - 关卡系统：
- 10关渐进解锁配置（前3关解锁，后7关BOSS挑战）
- 波次配置（每关3个波次，共30个波次）
- 奖励配置（金币奖励和英雄解锁）
- 简化的关卡管理接口

## 扩展指南

### 添加新英雄
1. 在 `HeroType` 枚举中添加新类型（选择合适的分类：射击/近战）
2. 在 `HERO_CONFIGS` 中添加配置（包含完整的英雄属性和投射物参数）
3. 创建继承自 `BaseHero` 的新组件类
4. 实现 `initializeHeroStats()` 和 `performAttack()` 抽象方法
5. 配置投射物类型和效果（物理弹、魔法弹、冲击波）
6. 可选实现特殊技能和自定义外观

#### 🏰 英雄工厂系统功能参考
HeroFactory提供完整的英雄创建和管理功能。以下功能已优化移除，但设计理念可供参考：

**英雄部署管理**:
- **批量创建机制**: 支持一次性创建多个英雄单位，适用于预设关卡或测试场景
- **英雄可用性检查**: 验证英雄类型的配置完整性和组件可用性
- **类型枚举管理**: 自动获取所有可用的英雄类型，用于UI显示和选择系统
- **成本验证系统**: 提供英雄部署成本查询，支持资源管理策略

**配置完整性保障**:
- **双重验证机制**: 确保英雄既有配置数据(`HERO_CONFIGS`)又有对应组件类(`HERO_COMPONENTS`)
- **错误容错处理**: 优雅处理配置缺失或组件创建失败的情况
- **调试信息输出**: 详细的创建日志和错误报告，便于开发和调试

### 添加新敌人
1. 在 `EnemyType` 枚举中添加新类型（选择合适的分类：基础/快速/装甲/特殊/BOSS）
2. 在 `ENEMY_CONFIGS` 中添加配置（包含血量、速度、奖励等属性）
3. 创建继承自 `BaseMouse` 的新组件类
4. 实现 `initializeMouseStats()` 和 `initializeMouseVisuals()` 抽象方法
5. 可选重写移动逻辑和特殊能力（如潜行、召唤等）

#### 🎮 敌人工厂系统功能参考
EnemyFactory提供完整的敌人创建和管理功能。以下功能已优化移除，但设计理念可供参考：

**敌人生成管理**:
- **批量创建机制**: 支持一次性创建多个敌人单位
- **难度等级适配**: 根据关卡难度(1-10)智能选择合适的敌人类型：
  - 难度1-2: 仅基础敌人(BasicMouse)
  - 难度3-5: 基础+进阶敌人(BasicMouse, SpeedMouse)
  - 难度6-8: 包含大部分敌人类型
  - 难度9-10: 所有可用敌人包括BOSS
- **随机生成系统**: 在合适的敌人池中随机选择，保证游戏变化性

**敌人验证和AI管理**:
- **节点有效性检查**: 确保敌人节点和组件的完整性
- **类型识别系统**: 通过节点自动识别敌人类型
- **移动AI启动**: 自动激活敌人的移动行为和路径寻找
- **生命周期管理**: 从创建到销毁的完整管理流程

### 添加新UI组件
1. 创建继承自 `Component` 的新UI类
2. 使用 Graphics API 绘制界面
3. 通过接口和直接引用与其他组件通信
4. **禁止使用延迟函数**: 设置UI组件时绝对不允许使用 `setTimeout`、`scheduleOnce` 等延迟方法
   - **错误示例**: `this.scheduleOnce(() => { graphics.rect(...); }, 0);`
   - **正确做法**: 确保组件正确初始化后直接操作，使用 `updateAlignment()` 等API确保Widget更新
5. **优先使用Widget组件进行对齐布局**: 尽量使用Widget组件而不是手动setPosition进行UI布局
   - Widget提供自动屏幕适配功能，支持多种分辨率和设备
   - 减少手动计算屏幕尺寸和位置的复杂代码
   - 提供更稳定和可维护的UI布局方案
6. 确保所有UI节点都有正确的 UITransform 组件

### Widget组件使用指南

**Widget组件是Cocos Creator推荐的UI布局解决方案**，应该优先使用而不是手动setPosition：

#### 常用Widget对齐方式：
```typescript
// ✅ 推荐：顶部对齐（如顶部信息栏）
const topWidget = node.addComponent(Widget);
topWidget.isAlignTop = true;
topWidget.isAlignLeft = true;
topWidget.isAlignRight = true;
topWidget.top = 0;
topWidget.left = 0;
topWidget.right = 0;

// ✅ 推荐：右上角对齐（如控制按钮）
const rightWidget = node.addComponent(Widget);
rightWidget.isAlignTop = true;
rightWidget.isAlignRight = true;
rightWidget.top = 0;
rightWidget.right = 10;

// ✅ 推荐：居中对齐（如游戏结束消息）
const centerWidget = node.addComponent(Widget);
centerWidget.isAlignHorizontalCenter = true;
centerWidget.isAlignVerticalCenter = true;
```

#### Widget使用原则：
- **总是调用updateAlignment()**: 设置Widget属性后必须调用此方法更新布局
- **配合UITransform使用**: 确保节点有UITransform组件并设置正确的contentSize
- **避免混用**: 不要在使用Widget的节点上再手动setPosition
- **优先级**: Widget > 手动计算屏幕尺寸 > setPosition绝对定位

#### 错误的布局方式：
```typescript
// ❌ 避免：手动计算屏幕尺寸
const screenWidth = view.getVisibleSize().width;
node.setPosition(screenWidth - 100, 50);

// ❌ 避免：硬编码位置
node.setPosition(800, 600);
```

## 调试和测试

### ⚠️ 重要：Cocos Creator测试说明
**Cocos Creator项目必须在IDE中运行测试，不能通过命令行启动**
- 项目需要在 **Cocos Creator 3.8.6 编辑器** 中打开
- 使用编辑器的 **预览** 或 **构建** 功能进行测试
- Web预览通常可通过编辑器工具栏的播放按钮启动
- 如果需要验证代码实现，通过 **代码审查** 检查是否有重复和冗余

### 代码质量检查原则
当需要验证系统功能时，应进行代码审查而非运行时测试：

#### 1. 检查重复代码
```typescript
// 检查是否有重复的组件创建逻辑
// 检查是否有重复的UI绘制代码
// 检查是否有重复的事件处理逻辑
```

#### 2. 检查冗余实现
```typescript
// 验证是否存在多个相似的系统（如英雄选择面板）
// 检查是否有未使用的方法和属性
// 验证接口实现是否一致
// 删除废弃的文件和代码，包括对应的.meta文件
```

#### 3. 架构一致性
```typescript
// 确保组件间的依赖关系清晰
// 验证单例模式的正确使用
// 检查事件系统的统一性
```

### 开发工具
- 使用浏览器开发者工具调试（仅在Cocos Creator预览中）
- TypeScript编译器提供类型检查
- console.log输出调试信息（在编辑器控制台查看）
- Cocos Creator内置调试器和性能分析工具

### TypeScript类型检查
**重要**: 定期运行TypeScript类型检查确保代码质量和类型安全

```bash
# 运行TypeScript编译检查（推荐）
# 注意：由于是Cocos Creator项目，需要使用IDE的诊断功能
# 或者通过VS Code等编辑器的TypeScript支持进行检查

# 如果安装了TypeScript，可以尝试：
npx tsc --noEmit --skipLibCheck

# 或者使用VS Code的问题面板查看类型错误
# Ctrl/Cmd + Shift + M 打开问题面板
```

#### 类型检查最佳实践：
- **定期检查**: 每次代码修改后运行类型检查
- **修复所有错误**: 不要忽略类型错误，即使代码"看起来"正常工作
- **处理警告**: 清理未使用的变量和导入，保持代码整洁
- **抽象方法一致性**: 确保子类正确实现抽象方法
- **接口规范**: 验证组件间接口的正确实现

#### 常见类型错误修复：
- **继承问题**: 确保子类方法可见性与基类一致
- **缺少导入**: 添加必要的类型和组件导入
- **未使用变量**: 删除或使用下划线前缀标记未使用的参数
- **属性不存在**: 使用正确的组件属性，如`UIOpacity`替代`Node.opacity`

### 性能考虑
- 避免在update()中频繁创建对象
- 使用对象池管理子弹等短生命周期对象
- 合理使用缓存减少重复计算
- 避免重复添加Graphics组件（使用直接addComponent或ensureRequiredComponents模式）

### Cocos Creator节点生命周期管理

#### 🎯 **节点销毁机制**
**重要**: Cocos Creator的`node.destroy()`具有内置延迟机制，无需手动添加延迟。

```typescript
// ✅ 正确：直接调用destroy()
if (this.node && this.node.isValid) {
    this.node.destroy();
}

// ❌ 错误：不必要的延迟包装
tween(this.node)
    .delay(0.016)
    .call(() => {
        this.node.destroy(); // 多余的延迟
    })
    .start();
```

#### 📋 **节点销毁最佳实践**
1. **立即失效标记**: 使用`isActive = false`立即停止逻辑
2. **清理资源**: 停止动画、调度器、事件监听
3. **直接销毁**: 调用`node.destroy()`，引擎会在帧结束时处理
4. **状态检查**: 使用`node.isValid`判断节点是否已销毁

```typescript
// 推荐的销毁模式
protected destroyProjectile(): void {
    if (!this.isActive) return;

    this.isActive = false;                    // 立即标记为无效
    Tween.stopAllByTarget(this.node);        // 停止动画
    this.unscheduleAllCallbacks();           // 停止调度

    // 直接销毁 - Cocos Creator会在当前帧逻辑结束后统一处理
    if (this.node && this.node.isValid) {
        this.node.destroy();
    }
}
```

#### ⚠️ **常见错误模式**
- **过度延迟**: 使用`setTimeout`、`scheduleOnce`、`tween.delay`包装`destroy()`
- **重复销毁**: 没有检查`isValid`状态就调用`destroy()`
- **资源泄漏**: 销毁前没有清理调度器、事件监听、动画

#### 🔍 **节点状态检查**
```typescript
// 检查节点是否有效
if (node && node.isValid) {
    // 节点存在且未被销毁
    node.destroy();
}

// 在调度回调中安全检查
const scheduleFunction = () => {
    if (!this.node || !this.node.isValid) {
        this.unschedule(scheduleFunction);
        return;
    }
    // 继续执行逻辑
};
```

## 开发原则

### 🚫 禁止使用延迟等待解决UI组件初始化问题
**重要原则**: 在**UI组件创建和初始化阶段**，遇到UITransform缺失、组件依赖、布局更新等问题时，**绝对不要**使用`setTimeout`、`scheduleOnce`等延迟方法来"解决"问题。

**适用范围**:
- ✅ **禁止场景**: UI组件初始化、onLoad、start等生命周期中的组件设置
- ✅ **允许场景**: 游戏逻辑中的定时效果、动画延迟、技能冷却、AI行为等

#### 为什么在UI初始化中禁止延迟等待：
- 延迟等待只是掩盖问题，不能解决根本原因
- 会导致不可预测的时序问题
- 增加代码复杂性和维护难度
- 可能在不同设备或环境下表现不一致

#### 正确的解决方法：
- **检查组件配置**: 确保所有必需的组件都正确添加和配置
- **验证节点结构**: 检查父子节点关系是否正确
- **修复组件状态**: 直接修复组件的状态和属性问题
- **重构代码逻辑**: 改变组件创建和初始化的顺序
- **使用正确的API**: 查阅Cocos Creator文档，使用正确的组件API

```typescript
// ❌ 错误的做法 - 在UI初始化中使用延迟等待
onLoad() {
    setTimeout(() => {
        scrollView.content = contentTransform; // UI初始化问题
    }, 100);
}

// ✅ 正确的做法 - 修复根本问题
onLoad() {
    if (!scrollView.node.getComponent(UITransform)) {
        scrollView.node.addComponent(UITransform);
    }
    scrollView.content = contentTransform;
}

// ✅ 允许的使用场景 - 游戏逻辑中的延迟效果
castSpell() {
    // 技能延迟效果
    setTimeout(() => {
        this.createExplosionEffect();
    }, 500);
}

// ✅ 允许的使用场景 - AI行为延迟
onEnemySpawn() {
    // 敌人AI行为延迟
    this.scheduleOnce(() => {
        this.startMovingTowardsTarget();
    }, 1.0);
}
```

#### Widget组件的正确使用
**重要**: 调用`widget.updateAlignment()`后，Widget的布局会立即更新完成，无需使用任何延迟：

```typescript
// ✅ 正确的做法
const widget = node.addComponent(Widget);
widget.isAlignTop = true;
widget.top = 100;
widget.updateAlignment(); // 布局立即更新完成

// 可以直接使用节点尺寸和位置
const transform = node.getComponent(UITransform);
const width = transform.contentSize.width; // 已经是更新后的值

// ❌ 错误的做法 - 在UI初始化中不需要延迟
widget.updateAlignment();
this.scheduleOnce(() => {
    // UI初始化中这种延迟是多余的，违背设计原则
}, 0);
```

### 🚫 避免过度使用可选链操作符（?.）
**重要原则**: 避免过度使用可选链操作符（`?.`），因为如果预期组件或属性应该存在，使用 `?.` 只是在掩盖设计问题。

#### 为什么要谨慎使用可选链：
- 如果组件在逻辑上应该存在，使用 `?.` 会掩盖初始化问题
- 当预期存在的组件不存在时，静默失败不利于问题排查
- 应该尽早发现问题，而不是通过可选链来"容忍"问题
- 使代码的预期行为不明确

#### 正确的使用原则：
```typescript
// ❌ 避免：如果gridSystem应该总是存在
if (this._gridSystem?.isValidPosition(pos)) {
    // 静默失败，问题被掩盖
}

// ✅ 推荐：明确检查和错误处理
if (!this._gridSystem) {
    console.error("GridSystem未初始化");
    return;
}
if (this._gridSystem.isValidPosition(pos)) {
    // 明确的逻辑流程
}

// ✅ 适合使用可选链：真正可能为空的情况
const parentTransform = this.node.parent?.getComponent(UITransform);
if (!parentTransform) {
    console.error("父节点不存在或缺少UITransform组件");
    return;
}
```

#### 使用指南：
- **必须存在的组件**: 使用明确的空值检查和错误处理
- **可能不存在的组件**: 可以使用可选链，但要有后续的错误处理
- **DOM遍历或链式调用**: 适合使用可选链
- **调试阶段**: 优先使用明确检查，便于发现初始化问题

### 🚫 禁止使用条件性组件添加模式
**重要原则**: 避免使用 `getComponent` + `addComponent` 的条件性添加模式，这种写法存在潜在问题。

#### 为什么禁止这种写法：
- 如果第一次 `addComponent` 失败，重复调用也不会成功
- 可能导致组件重复添加的问题
- 掩盖了组件添加失败的真实原因
- 增加了代码的不确定性

#### 错误的写法：
```typescript
// ❌ 避免这种写法
let graphics = node.getComponent(Graphics);
if (!graphics) {
    graphics = node.addComponent(Graphics);
}
```

#### 正确的写法：
```typescript
// ✅ 方案1: 直接添加，相信组件系统的重复检查机制
const graphics = node.addComponent(Graphics);

// ✅ 方案2: 明确检查和错误处理
let graphics = node.getComponent(Graphics);
if (!graphics) {
    graphics = node.addComponent(Graphics);
    if (!graphics) {
        console.error("无法添加Graphics组件到节点:", node.name);
        return;
    }
}

// ✅ 方案3: 在组件初始化时确保组件存在
protected onLoad(): void {
    // 在生命周期早期确保组件存在
    this.ensureRequiredComponents();
}

private ensureRequiredComponents(): void {
    if (!this.node.getComponent(UITransform)) {
        this.node.addComponent(UITransform);
    }
}
```

### 🧹 未使用变量和导入清理原则
**重要原则**: 定期清理代码中的未使用变量、函数参数和导入，保持代码整洁和性能最优。

#### 为什么要清理未使用的代码：
- **减少编译时间**: 未使用的导入会增加TypeScript编译时间
- **提高代码可读性**: 避免混淆和误导其他开发者
- **降低维护成本**: 减少不必要的代码维护负担
- **优化打包体积**: 避免将未使用的依赖打包到最终产品中
- **类型检查效率**: 帮助TypeScript编译器更快地进行类型检查

#### 未使用变量处理方法：

```typescript
// ❌ 错误：保留未使用的变量
function processData(data: any, unused: string, config: Config) {
    return data.process(config);
    // unused 参数从未使用
}

// ✅ 方案1：删除未使用的参数
function processData(data: any, config: Config) {
    return data.process(config);
}

// ✅ 方案2：使用下划线前缀标记（API兼容性场景）
function processData(data: any, _unused: string, config: Config) {
    return data.process(config);
    // _unused 明确标记为未使用，但保持API兼容性
}

// ✅ 方案3：添加注释说明保留原因
function processData(data: any, reserved: string, config: Config) {
    // reserved 参数为未来功能预留
    return data.process(config);
}
```

#### 导入清理最佳实践：

```typescript
// ❌ 错误：导入未使用的模块
import { Color, Graphics, Vec3, Node, UIOpacity, Label, Sprite } from 'cc';
import { GameManager } from '../managers/GameManager';
import { EnemyType, EnemyState, EnemyConfig, HeroType } from '../types/GameTypes';

// 实际只使用了部分导入

// ✅ 正确：只导入实际使用的模块
import { Color, Vec3, UIOpacity } from 'cc';
import { EnemyType, EnemyConfig } from '../types/GameTypes';
```

#### 清理检查清单：
- **定期运行TypeScript检查**: 使用 `npx tsc --noEmit` 或IDE诊断工具
- **检查未使用导入**: 清理 `import` 语句中未使用的模块
- **检查未使用变量**: 删除或重命名未使用的局部变量
- **检查未使用参数**: 为必须保留的未使用参数添加下划线前缀
- **检查未使用方法**: 删除未被调用的私有方法和函数
- **检查未使用属性**: 清理类中未被访问的私有属性

#### 自动化工具建议：
- **VS Code**: 启用TypeScript的未使用代码检测
- **ESLint**: 配置 `@typescript-eslint/no-unused-vars` 规则
- **编辑器配置**: 开启"显示未使用代码"的灰色高亮

## Cocos Creator生命周期方法分析

### ✅ onLoad和start方法的实际作用

通过代码分析发现，**onLoad和start方法在项目中仍有重要作用**：

#### BaseHero中的生命周期：
- **onLoad()**: 初始化英雄属性、外观组件和事件监听器
- **start()**: 获取GameManager引用，注册到BattleManager

#### BaseMouse中的生命周期：
- **onLoad()**: 初始化敌人属性、外观、标签和血条
- **start()**: 获取GameManager引用，注册到BattleManager

#### 子类中的生命周期使用模式：
```typescript
// ✅ 标准模式：只调用父类方法（推荐）
protected onLoad(): void {
    super.onLoad();
}

protected start(): void {
    super.start();
}

// ❌ 冗余模式：重复获取GameManager（需要清理）
protected onLoad(): void {
    super.onLoad();
    this._gameManager = GameManager.instance; // 冗余，基类已处理
}
```

#### 优化建议：
1. **保留基类中的onLoad和start方法** - 它们有实际作用
2. **清理子类中的冗余代码** - 移除重复的GameManager获取
3. **简化子类实现** - 大多数子类只需调用super方法
4. **统一生命周期模式** - 所有初始化逻辑集中在基类中处理

## 已知问题和解决方案

### 1. 组件初始化顺序
- **问题**: 组件间存在依赖关系，初始化顺序很重要
- **解决方案**: 使用GameBootstrap统一管理初始化顺序
- **检查方式**: 确保GameBootstrap.ts中的创建顺序正确

### 2. Graphics API兼容性
- **问题**: `closePath()`在Cocos Creator 3.8.6中不存在，应使用`close()`
- **解决方案**: 所有路径闭合使用`graphics.close()`而不是`graphics.closePath()`
- **检查命令**: `grep -r "closePath" assets/scripts/` 应返回空结果

### 3. 重复渲染组件警告
- **问题**: 向已有Graphics组件的节点添加新Graphics组件
- **解决方案**: 直接使用`addComponent(Graphics)`，Cocos Creator会自动处理重复添加
- **检查模式**:
```typescript
// 推荐的模式
const graphics = node.addComponent(Graphics);
// 或在必要时使用ensureRequiredComponents模式
```

### 4. 系统重复实现
- **问题**: 避免创建重复的功能系统
- **解决方案**: 统一使用GameHUD作为唯一的UI系统
- **检查要点**:
  - GameBootstrap.ts中只创建必要的系统组件
  - GameHUD.ts包含完整的英雄选择和游戏状态显示功能
  - 避免创建功能重叠的组件

### 5. 类型安全和单例模式
- **问题**: 组件引用可能为null导致运行时错误
- **解决方案**: 所有组件引用都通过单例模式或依赖注入获取，并进行空值检查
- **检查模式**:
```typescript
const manager = ManagerName.instance;
if (!manager) {
    console.error("未找到Manager实例");
    return;
}
```

### 6. 性能优化
- **问题**: 频繁的对象创建和复杂计算影响性能
- **解决方案**: 战斗系统使用定时更新而非每帧更新
- **检查要点**: update()方法中避免频繁的new操作

### 7. 代码库维护
- **问题**: 废弃代码和文件积累导致混淆和维护困难
- **解决方案**: 及时删除不需要的代码、文件和相关引用
- **检查要点**:
  - 删除废弃的组件类文件(.ts)及其元数据文件(.meta)
  - 清理未使用的import语句和方法
  - 移除注释掉的代码块
  - 验证删除操作不会破坏现有功能

## 更新日志

- **v1.0**: 完成从Cocos Creator 2.4.10到3.8.6的TypeScript迁移
- 实现了完整的游戏核心系统
- 建立了类型安全的开发架构
- 保持了原有游戏玩法和设计

- **v1.1**: UI系统重构和错误修复
- 实现统一的GameHUD界面系统，移除重复系统
- 修复Graphics API兼容性问题(closePath → close)
- 解决重复渲染组件警告
- 完善英雄拖拽部署功能
- 清理废弃文件，保持代码库整洁

- **v1.2**: DRY原则重构和外观系统统一
- 重构英雄类架构，实现BaseHero统一外观管理系统
- 消除英雄子类中50-80行的重复代码
- 统一英雄标签系统，实现18px大字体和1.5倍外观缩放
- 重构老鼠类架构，实现BaseMouse统一标签配置（22px大字体）
- 建立抽象基类模式，新增英雄/敌人只需实现差异化部分

- **v1.3**: 游戏机制纯化，移除不必要属性
- **移除英雄生命值系统**: 英雄单位不再有生命值概念，成为永久性防御单位
  - 更新GameTypes.ts，将UnitStats和EnemyUnitStats分离
  - 修改GameConstants.ts，移除所有英雄配置中的health/maxHealth
  - 重构BaseHero.ts，移除takeDamage、die等生命值相关方法
  - 更新所有英雄子类，移除生命值初始化和死亡处理逻辑
- **移除老鼠攻击能力**: 老鼠专注于突破防线，不攻击英雄
  - 更新EnemyUnitStats接口，移除攻击相关属性
  - 修改所有敌人配置，移除attackDamage、attackRange、attackSpeed
  - 重构BaseMouse.ts，移除攻击逻辑和状态处理
  - 更新GameMechanicsDesign.md，明确老鼠只专注突破防线
- **移除英雄移动速度**: 英雄固定部署，不会移动
  - 更新UnitStats接口，移除moveSpeed属性
  - 修改所有英雄配置，移除moveSpeed设置
  - 重构BaseHero.ts，移除移动相关属性和状态处理
  - 更新文档，明确英雄为固定防御单位

- **v1.4**: 文档更新和内容扩展反映实际实现
- **扩展英雄系统**: 完善12种英雄类型的文档描述
  - 更新英雄分类：远程(3种)、法师(3种)、近战(2种)、辅助(2种)、特殊(2种)
  - 详细描述每种英雄的特色和能力（如穿透、AOE、光环、暴击等）
  - 明确英雄工厂系统和创建流程
- **扩展敌人系统**: 完善9种敌人类型的文档描述
  - 更新敌人分类：基础(2种)、快速(2种)、装甲(2种)、特殊(1种)、BOSS(2种)
  - 详细描述每种老鼠的特征（血量、速度、特殊能力等）
  - 强调老鼠无攻击能力，专注突破防线的设计理念
- **完善项目结构**: 更新文档以反映实际的代码结构
  - 移除已不存在的BaseUnit.ts，突出BaseHero和BaseMouse基类
  - 添加工具类目录（utils）和完整的系统组件列表
  - 明确UI系统职责分工（GameHUD主界面 + HeroSelectionPanel英雄面板）
- **更新类型系统**: 同步枚举和接口定义与实际代码
  - 完整的HeroType和EnemyType枚举列表
  - 分离后的UnitStats和EnemyUnitStats接口定义
  - 新增游戏状态（DEPLOYMENT、RESTING等）

- **v1.5**: 架构数据管理优化，统一战斗数据中心
- **BattleManager成为核心数据中心**: 重构数据存储架构，消除数据重复存储问题
  - 移除GameManager中的`_deployedHeroes`和`_activeEnemies`重复存储
  - BattleManager的`_registeredHeroes`和`_registeredEnemies`成为唯一数据源
  - GameManager通过BattleManager获取英雄和敌人数据，实现数据访问委托
  - 更新所有数据访问接口，确保单一数据源原则
- **投射物系统数据来源统一**: 更新所有投射物类的数据获取方式
  - BaseProjectile、LightningBolt、MagicMissile、ExplosionWave、IceShard、SwordWave
  - 从`GameManager.instance.activeEnemies`改为`BattleManager.instance.getAllActiveEnemies()`
  - 统一使用BattleManager提供的数据查询接口
- **敌人组件数据引用更新**: 优化敌人特殊能力的英雄数据获取
  - UltimateOverlord、GiantBehemoth、ThunderMaster等BOSS组件
  - 从`gameManager.deployedHeroes`改为`battleManager.getAllDeployedHeroes()`
  - 确保威慑、干扰等特殊能力正确获取英雄数据
- **WaveManager数据同步优化**: 更新波次管理中的敌人状态检查
  - 波次完成检测改为使用`BattleManager.instance.registeredEnemies`
  - 统一战斗统计数据来源，提高数据一致性

- **v1.6**: 代码清理和类型系统优化，遵循YAGNI原则
- **未使用代码大规模清理**: 系统性清理项目中的冗余代码，提升代码质量
  - **删除未使用枚举**: 移除`UnitType`、`DeploymentMode`等完全未使用的枚举定义
  - **清理未使用导入**: 移除4个英雄组件中多余的`Animation`导入，清理`GameTypes.ts`中的`Component`导入
  - **简化类型系统**: 删除400+行未使用的复杂类型定义（成就系统、挑战模式、玩家进度系统等）
  - **保留核心类型**: 仅保留实际使用的`RewardType`（GOLD、HERO_UNLOCK）和简化的`LevelConfig`接口
- **配置数据优化**: 清理关卡配置中的无效字段和未使用数据
  - 删除`WORLDS`数组和相关世界配置（当前版本未实现）
  - 移除`COMPLETE_10_LEVELS`中的无效字段（`worldId`、`difficulty`、`unlockConditions`等）
  - 简化`LEVEL_CONFIGS`对象，仅保留实际使用的方法
- **类型安全保障**: 修复所有TypeScript编译错误，确保类型系统的一致性和正确性
  - 添加LevelManager本地类型定义，保持功能完整性
  - 统一枚举值使用，避免字符串常量错误
  - 完善接口定义，补充缺失的字段

- **v1.7**: systems目录代码清理和文档信息补充
- **工厂系统代码精简**: 清理systems目录下的未使用方法，遵循YAGNI原则
  - **EnemyFactory.ts优化**: 移除9个未使用方法，保留核心创建功能
    - 删除批量创建、可用性检查、类型枚举、描述获取等辅助方法
    - 删除特殊能力查询、AI启动、节点验证、随机选择等管理方法
    - 保留`createEnemy()`核心方法，确保敌人创建功能完整
  - **HeroFactory.ts优化**: 移除3个未使用方法，精简接口设计
    - 删除批量创建英雄、可用性检查、类型枚举等辅助方法
    - 保留`CreateHero()`、`GetHeroConfig()`、`GetHeroCost()`核心方法
    - 维持英雄创建和配置查询的基本功能
- **文档信息补充**: 将有价值的删除信息补充到设计文档中
  - **敌人特殊能力详细描述**: 补充16种敌人的完整特殊能力说明
    - 基础单位: BasicMouse(无特殊能力)、GiantMouse(狂暴模式、额外金币)
    - 快速单位: FastMouse(无特殊能力)、SpeedMouse(受伤加速、残影效果)
    - 装甲单位: ArmoredMouse/TankMouse(护甲减伤)、StealthMouse(闪避攻击)
    - BOSS单位: 详细的威慑和控制特效描述（从链式雷电到终极毁灭）
  - **工厂系统功能参考**: 记录被优化移除的高级功能设计理念
    - 敌人工厂: 批量创建、难度适配、随机生成、AI管理等功能设计
    - 英雄工厂: 批量部署、可用性验证、配置完整性保障等管理机制
- **代码质量提升**: 通过TypeScript编译检查，确保系统稳定性

## 当前架构状态

### ✅ 已实现的系统
- **优化的游戏内容**: 12种英雄类型和16种敌人类型，完美的战术平衡
- **统一UI系统**: GameHUD主界面 + HeroSelectionPanel英雄面板的协作式UI架构
- **完整的英雄系统**: 包含5个分类的英雄，支持拖拽部署、技能系统、工厂创建
- **多样化的敌人系统**: 从基础老鼠到BOSS单位，包含装甲、潜行、召唤等特殊机制
- **智能网格部署**: 11x6网格的英雄部署和管理，支持实时预览和冲突检测
- **实时游戏状态管理**: 金币、波次、城堡血量、英雄冷却的动态显示
- **高效通信系统**: 优先使用Cocos Creator官方事件框架，结合接口定义和直接引用
- **DRY架构**: BaseHero和BaseMouse统一外观系统，大幅减少重复代码
- **统一标签系统**: 英雄18px大字体，老鼠22px大字体，提供清晰的视觉识别
- **工厂模式**: HeroFactory和EnemyFactory提供统一的单位创建和管理
- **对象池优化**: SimpleObjectPool管理子弹等短生命周期对象，提升性能

### ⚠️ 需要注意的区域
- **Graphics组件**: 所有创建都已加入存在性检查，避免重复添加
- **单例模式**: 所有Manager都通过静态instance访问

### 🔧 开发建议
1. **新功能开发**: 优先扩展现有系统而非创建新系统
2. **UI开发**: 所有UI功能集中在GameHUD中实现
3. **测试验证**: 通过代码审查而非运行时测试验证功能
4. **错误处理**: 始终检查组件和管理器引用的有效性
5. **代码清理**: 及时删除不需要的代码和文件，保持代码库整洁
6. **DRY原则**: 新增英雄/敌人继承BaseHero/BaseMouse，只实现差异化功能
7. **抽象优先**: 发现重复代码时，优先提取到基类或工具类中
8. **YAGNI原则**: 遵循"你不会需要它"原则，避免提前实现未来"可能"需要的功能
9. **类型安全**: 定期运行TypeScript检查，清理未使用的导入、变量和类型定义
10. **简化优先**: 保持类型系统简洁，只定义实际使用的接口和枚举

---

这是一个现代化的TypeScript游戏项目，具备良好的架构设计和类型安全保障。当前版本（v1.6）已完成大规模代码清理，遵循YAGNI原则，删除了450+行未使用代码，简化了类型系统，同时保持了完整的功能性和类型安全。项目现在更加简洁、高效、易于维护。



添加面板边框（不需要重复 rect，只需 fill，stroke）因为填充和画边框是一条路径线
不要使用mask组件
