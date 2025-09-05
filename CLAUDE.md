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
│   │   ├── heroes/            # 英雄组件 (12种英雄类型)
│   │   │   ├── BaseHero.ts    # 英雄抽象基类
│   │   │   ├── OrangeCat.ts   # 橘猫射手
│   │   │   ├── PersianSniper.ts # 波斯猫狙击手
│   │   │   ├── SiameseMage.ts # 暹罗猫法师
│   │   │   └── ... (其他9种英雄)
│   │   ├── enemies/           # 敌人组件 (9种老鼠类型)
│   │   │   ├── BaseMouse.ts   # 老鼠抽象基类
│   │   │   ├── BasicMouse.ts  # 基础老鼠
│   │   │   ├── GiantMouse.ts  # 巨型老鼠
│   │   │   ├── FastMouse.ts   # 快速老鼠
│   │   │   └── ... (其他6种老鼠)
│   │   ├── game/              # 游戏对象
│   │   │   └── Castle.ts      # 城堡
│   │   └── ui/                # UI组件
│   │       ├── GameHUD.ts     # 主游戏界面
│   │       └── HeroSelectionPanel.ts # 英雄选择面板
│   ├── managers/              # 管理器类
│   │   ├── GameManager.ts     # 游戏总控制
│   │   ├── BattleManager.ts   # 战斗管理
│   │   └── WaveManager.ts     # 波次管理
│   ├── systems/               # 系统类
│   │   ├── GameBootstrap.ts   # 游戏启动器
│   │   ├── GridDeploymentSystem.ts # 网格部署系统
│   │   ├── HeroFactory.ts     # 英雄工厂系统
│   │   ├── EnemyFactory.ts    # 敌人工厂系统
│   │   └── SkillSystem.ts     # 技能系统
│   ├── types/                 # 类型定义
│   │   ├── GameTypes.ts       # 游戏类型定义
│   │   └── GameConstants.ts   # 游戏常量配置
│   └── utils/                 # 工具类
│       ├── DrawingHelper.ts   # 绘图辅助工具
│       ├── EffectHelper.ts    # 特效辅助工具
│       ├── UIHelper.ts        # UI辅助工具
│       └── SimpleObjectPool.ts # 简单对象池
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
- 通过直接引用和接口进行组件间通信

### 4. DRY 原则 (Don't Repeat Yourself)
- **抽象共同逻辑**: 将重复的代码提取到基类或工具函数中
- **统一接口设计**: 相同功能的组件应使用统一的接口和方法签名
- **避免代码重复**: 通过继承、组合、工具类等方式消除重复实现
- **配置集中管理**: 相同的配置项应统一管理，避免分散在各个文件中

#### DRY 实践示例：
```typescript
// ✅ 推荐：基类统一实现
export abstract class BaseHero extends Component {
    protected _graphics: Graphics | null = null;
    protected _nameLabel: Label | null = null;

    protected initializeBaseVisuals(): void {
        this._graphics = this.node.addComponent(Graphics);
        this.drawHeroAppearance();
        this.createHeroNameLabel();
    }

    protected abstract getHeroLabelConfig(): LabelConfig;
}

// ✅ 推荐：子类只实现差异化部分
export class OrangeCat extends BaseHero {
    protected getHeroLabelConfig() {
        return { text: "橘猫", fontSize: 18, /* ... */ };
    }
}

// ❌ 避免：每个子类重复相同代码
export class OrangeCat extends Component {
    private _graphics: Graphics | null = null;
    private _nameLabel: Label | null = null;

    private initializeVisuals(): void {
        this._graphics = this.node.addComponent(Graphics);
        // 重复的初始化代码...
    }
}
```

### 5. 代码库清洁
- 及时删除废弃的代码和文件
- 避免注释掉的代码长期保留
- 定期清理未使用的import和方法
- 保持项目结构简洁明了

### 6. 事件和通信设计
- **优先使用 Cocos Creator 官方事件系统**: Cocos Creator 提供了成熟优化的事件框架，应作为首选通信方式
- **充分利用节点事件**: 使用 `node.emit()` 和 `node.on()` 进行组件间通信，这是官方推荐的标准做法
- **合理使用触摸事件**: 利用 `Node.EventType.TOUCH_*` 系列事件处理用户交互
- **避免自定义事件总线**: 不要创建额外的事件总线系统，Cocos Creator的事件机制已足够强大
- **结合直接引用**: 在合适场景下结合直接方法调用，与事件系统形成互补
- **接口定义规范**: 使用接口 (如 `IHeroDeploymentHandler`) 定义组件间的通信契约

#### 推荐的通信模式：
```typescript
// ✅ 推荐：使用Cocos Creator官方事件系统
this.node.emit('hero-deployed', { heroType: type, position: pos });
this.node.on('wave-completed', this.onWaveCompleted, this);

// ✅ 推荐：触摸事件处理（实际代码示例）
this.node.on(Node.EventType.TOUCH_END, this.onHeroClick, this);
this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);

// ✅ 推荐：按钮事件处理
button.node.on(Button.EventType.CLICK, this.onButtonClick, this);

// ✅ 推荐：GameManager事件回调系统
private _eventCallbacks = new Map<keyof GameEvents, Function[]>();

// ✅ 推荐：结合直接引用（性能关键场景）
this._heroSelectionPanel.setDeploymentHandler(this._gameHUD);

// ❌ 避免：自定义事件总线
this.customEventBus.emit('hero-deployed', { type, position });
```

#### 项目中的实际事件使用案例：
```typescript
// BaseHero.ts - 英雄点击事件
protected setupClickEvents(): void {
    this.node.on(Node.EventType.TOUCH_END, this.onHeroClick, this);
}

// HeroSelectionPanel.ts - 拖拽部署事件链
buttonNode.on(Node.EventType.TOUCH_START, (event: EventTouch) => { /* 开始拖拽 */ });
buttonNode.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => { /* 拖拽移动 */ });
buttonNode.on(Node.EventType.TOUCH_END, (event: EventTouch) => { /* 完成部署 */ });

// UIHelper.ts - 通用按钮事件
button.node.on(Button.EventType.CLICK, callback, target);
```

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
- 11x6网格管理
- 英雄部署和移动
- 网格状态追踪

## 游戏角色

### 英雄类 (DRY原则重构)
基于DRY原则，英雄系统采用了统一的基类架构，包含**12种英雄类型**分为5个分类：

- **BaseHero**: 英雄抽象基类，统一实现外观渲染、标签创建、点击事件等通用功能
  - 统一的Graphics组件管理和外观绘制
  - 统一的名称标签创建和配置（18px大字体）
  - 统一的点击事件处理和技能触发
  - 通过英雄类型枚举自动选择对应的外观绘制方式

#### 远程英雄 (3种)
- **OrangeCat**: 橘猫射手 - 基础射手，高攻速，子弹攻击
- **PersianSniper**: 波斯猫狙击手 - 高伤害狙击手，暴击能力
- **BengalHunter**: 孟加拉猎手 - 快速攻击的机敏射手

#### 法师英雄 (3种)
- **SiameseMage**: 暹罗猫法师 - AOE魔法攻击，群体伤害
- **MaineThunder**: 缅因雷猫 - 链式雷电攻击，连锁伤害
- **NorwegianIce**: 挪威冰猫 - 冰系法术，减速效果

#### 近战英雄 (2种)
- **BritishKnight**: 英短骑士 - 重装骑士，高伤害近战
- **RagdollGuardian**: 布偶守护者 - 防御型近战单位

#### 辅助英雄 (2种)
- **ScottishEngineer**: 苏格兰工程师 - 攻速光环，增益周围英雄
- **AbyssinianScout**: 阿比西尼亚侦察兵 - 射程光环，扩展攻击范围

#### 特殊英雄 (2种)
- **RussianBlue**: 俄罗斯蓝猫精英 - 穿透攻击，高暴击
- **AmericanBomber**: 美国爆破兵 - AOE爆炸伤害，大范围攻击

每个英雄子类只需要：
1. 实现 `initializeHeroStats()` 设置属性
2. 实现 `initializeHeroVisuals()` 做特殊初始化
3. 可选重写 `getHeroLabelConfig()` 自定义标签
4. 可选重写 `onHeroClickHandler()` 自定义点击行为

### 敌人类 (DRY原则重构)
敌人系统同样采用统一的基类架构，包含**9种敌人类型**分为5个分类：

- **BaseMouse**: 老鼠抽象基类，统一实现移动、标签等通用功能
  - 统一的名称标签创建和配置（22px大字体）
  - 统一的城堡移动逻辑
  - 统一的生命值管理和死亡处理
  - 老鼠专注突破防线，**不具备攻击能力**

#### 基础单位 (2种)
- **BasicMouse**: 基础老鼠 - 普通血量，中等速度
- **GiantMouse**: 巨型老鼠 - 高血量，较慢速度

#### 快速单位 (2种)
- **FastMouse**: 快速老鼠 - 低血量，高速移动
- **SpeedMouse**: 疾速老鼠 - 极低血量，极高速度

#### 装甲单位 (2种)
- **ArmoredMouse**: 装甲老鼠 - 中等血量，护甲减伤
- **TankMouse**: 坦克老鼠 - 极高血量，护甲值，缓慢移动

#### 特殊单位 (1种)
- **StealthMouse**: 潜行老鼠 - 潜行躲避攻击能力

#### BOSS单位 (2种)
- **MouseKing**: 老鼠王 - 超高血量，可召唤小兵
- **MechMouse**: 机械老鼠 - 高血量，特殊机械属性

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
  // 远程英雄
  ORANGE_CAT, PERSIAN_SNIPER, BENGAL_HUNTER,
  // 法师英雄
  SIAMESE_MAGE, MAINE_THUNDER, NORWEGIAN_ICE,
  // 近战英雄
  BRITISH_KNIGHT, RAGDOLL_GUARDIAN,
  // 辅助英雄
  SCOTTISH_ENGINEER, ABYSSINIAN_SCOUT,
  // 特殊英雄
  RUSSIAN_BLUE, AMERICAN_BOMBER
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
  // BOSS单位
  MOUSE_KING, MECH_MOUSE
}

// 英雄状态枚举（英雄不会死亡，不会移动）
enum HeroState {
  IDLE,       // 待机
  ATTACKING   // 攻击中
}

// 敌人状态枚举
enum EnemyState {
  IDLE,       // 待机
  MOVING,     // 移动中
  ATTACKING,  // 攻击中（预留状态，当前游戏机制中敌人不攻击）
  DEAD        // 死亡
}
```

### 核心接口 (游戏机制纯化后)
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

所有游戏数值配置集中在 `GameConstants.ts` 中：
- 英雄属性配置
- 敌人属性配置
- 波次配置
- UI常量
- 游戏常量

## 扩展指南

### 添加新英雄
1. 在 `HeroType` 枚举中添加新类型（选择合适的分类：远程/法师/近战/辅助/特殊）
2. 在 `HERO_CONFIGS` 中添加配置（包含完整的英雄属性和技能参数）
3. 创建继承自 `BaseHero` 的新组件类
4. 实现 `initializeHeroStats()` 和 `performAttack()` 抽象方法
5. 可选实现特殊技能和自定义外观

### 添加新敌人
1. 在 `EnemyType` 枚举中添加新类型（选择合适的分类：基础/快速/装甲/特殊/BOSS）
2. 在 `ENEMY_CONFIGS` 中添加配置（包含血量、速度、奖励等属性）
3. 创建继承自 `BaseMouse` 的新组件类
4. 实现 `initializeMouseStats()` 和 `initializeMouseVisuals()` 抽象方法
5. 可选重写移动逻辑和特殊能力（如潜行、召唤等）

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

### 性能考虑
- 避免在update()中频繁创建对象
- 使用对象池管理子弹等短生命周期对象
- 合理使用缓存减少重复计算
- 避免重复添加Graphics组件（使用直接addComponent或ensureRequiredComponents模式）

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

## 当前架构状态

### ✅ 已实现的系统
- **丰富的游戏内容**: 12种英雄类型和9种敌人类型，提供多样化的战术选择
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

---

这是一个现代化的TypeScript游戏项目，具备良好的架构设计和类型安全保障。当前版本已解决重复系统和API兼容性问题，提供了统一且功能完整的用户界面系统。



添加面板边框（不需要重复 rect，只需 fill，stroke）因为填充和画边框是一条路径线
不要使用mask组件
