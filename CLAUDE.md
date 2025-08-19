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
- 通过直接引用和接口进行组件间通信

### 4. 代码库清洁
- 及时删除废弃的代码和文件
- 避免注释掉的代码长期保留
- 定期清理未使用的import和方法
- 保持项目结构简洁明了

### 5. 事件和通信设计
- **避免过度事件驱动**: Cocos Creator 本身已有完整的事件分发机制，不要重复造轮子
- **优先使用直接引用**: 组件间通信优先使用直接的方法调用和属性访问
- **合理使用 Cocos 事件**: 只在必要时使用 `node.emit()` 和 `node.on()` 等内置事件机制
- **避免自定义事件系统**: 不要创建额外的事件总线或消息系统，利用现有的单例模式和依赖注入
- **接口优于事件**: 使用接口 (如 `IHeroDeploymentHandler`) 定义组件间的通信契约
- **单例模式通信**: 通过 Manager 单例进行跨组件状态共享和方法调用

#### 推荐的通信模式：
```typescript
// ✅ 推荐：直接接口调用
interface IGameHandler {
    deployHero(type: HeroType, pos: GridPosition): boolean;
}

// ✅ 推荐：单例模式访问
const gameManager = GameManager.instance;
gameManager.spendGold(cost);

// ✅ 推荐：父子组件直接引用
this._heroSelectionPanel.setDeploymentHandler(this._gameHUD);

// ❌ 避免：自定义事件系统
this.eventBus.emit('hero-deployed', { type, position });
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

// 组件间通信接口示例
interface IHeroDeploymentHandler {
  deployHeroToGrid(heroType: HeroType, gridRow: number, gridCol: number): boolean;
}

interface IGameStateHandler {
  onGameStateChange(newState: GameState, oldState: GameState): void;
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
3. 通过接口和直接引用与其他组件通信

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

### 🚫 禁止使用延迟等待解决问题
**重要原则**: 遇到组件初始化、UITransform缺失、事件时序等问题时，**绝对不要**使用`setTimeout`、`scheduleOnce`等延迟方法来"解决"问题。

#### 为什么禁止延迟等待：
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
// ❌ 错误的做法 - 使用延迟等待
setTimeout(() => {
    scrollView.content = contentTransform;
}, 100);

// ✅ 正确的做法 - 修复根本问题
if (!scrollView.node.getComponent(UITransform)) {
    scrollView.node.addComponent(UITransform);
}
scrollView.content = contentTransform;
```

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

## 当前架构状态

### ✅ 已实现的系统
- **统一UI系统**: GameHUD.ts作为唯一的用户界面
- **英雄管理**: 完整的英雄选择、拖拽部署、工厂创建系统
- **网格部署**: 5x5网格的英雄部署和管理
- **游戏状态管理**: 金币、波次、城堡血量的实时显示
- **通信系统**: 基于接口和直接引用的组件间通信

### ⚠️ 需要注意的区域
- **Graphics组件**: 所有创建都已加入存在性检查，避免重复添加
- **单例模式**: 所有Manager都通过静态instance访问

### 🔧 开发建议
1. **新功能开发**: 优先扩展现有系统而非创建新系统
2. **UI开发**: 所有UI功能集中在GameHUD中实现
3. **测试验证**: 通过代码审查而非运行时测试验证功能
4. **错误处理**: 始终检查组件和管理器引用的有效性
5. **代码清理**: 及时删除不需要的代码和文件，保持代码库整洁

---

这是一个现代化的TypeScript游戏项目，具备良好的架构设计和类型安全保障。当前版本已解决重复系统和API兼容性问题，提供了统一且功能完整的用户界面系统。



添加面板边框（不需要重复 rect，只需 fill，stroke）因为填充和画边框是一条路径线
不要使用mask组件
