# 敌人系统设计原则与开发指南

## 文档概述

本文档为 CatProtectPlanMingame 敌人系统提供完整的设计原则和开发指导。本系统基于纯塔防机制，敌人老鼠专注于突破防线到达城堡，不具备攻击英雄的能力。

**文档版本**: v1.0
**适用引擎**: Cocos Creator 3.8.6
**开发语言**: TypeScript (严格模式)

---

## 🎯 核心设计哲学

### 纯塔防机制原则

**核心理念**: 敌人不能攻击或伤害英雄，这是塔防游戏的基本设计理念。

#### ✅ 允许的敌人行为
- **移动到城堡**: 敌人的唯一目标是突破防线到达城堡
- **对城堡造成伤害**: 到达城堡后对城堡造成伤害
- **防御性特殊能力**: 护盾、护甲、减伤、潜行等防御机制
- **控制效果**: 可以通过特殊能力影响英雄，但不直接造成伤害：
  - **视觉干扰**: 创建烟雾、闪光等影响瞄准精度
  - **电磁干扰**: 暂时降低英雄攻击精度或攻击速度
  - **地形阻挡**: 创建临时屏障影响攻击路径
  - **威慑效果**: 展示强大气场但不造成实际伤害

#### ❌ 严格禁止的敌人行为
- **直接攻击英雄**: 敌人不能主动攻击或伤害英雄
- **对英雄造成伤害**: 任何形式的直接伤害都不允许
- **攻击相关属性**: 攻击力、攻击范围、攻击速度等属性

#### 🎯 设计目标
- **角色分工明确**: 英雄负责攻击，敌人负责突破
- **策略深度**: 通过敌人的控制效果增加策略性
- **游戏平衡**: 避免双向攻击导致的复杂平衡问题
- **玩家体验**: 保持塔防游戏的经典玩法和预期

---

## 📊 敌人分类体系

### 5大分类，16种敌人类型

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

#### BOSS单位 (9种：2种基础BOSS + 7种新BOSS)

**基础BOSS**:
- **MouseKing**: 老鼠王 - 超高血量，可召唤小兵
- **MechMouse**: 机械老鼠 - 高血量，特殊机械属性

**关卡4-10新BOSS**:
- **ArmorOverlord**: 重甲统领 - 超高护甲值，减伤防御
- **ShadowAssassin**: 潜影刺客 - 高潜行几率，伤害减免
- **StormTyrant**: 疾风暴君 - 极速移动，召唤疾速小兵
- **GiantBehemoth**: 巨兽霸主 - 超大血量，威慑践踏特效
- **ThunderMaster**: 雷电大师 - 电磁干扰特效，电流场护盾
- **MechCommander**: 机械军团长 - 限量召唤机械兵，自我修复
- **UltimateOverlord**: 终极霸王 - 融合所有BOSS防御能力，最终挑战

---

## 🏗️ BaseMouse 架构设计

### DRY 原则重构架构

BaseMouse 作为抽象基类，统一实现所有老鼠共同的功能，遵循 DRY (Don't Repeat Yourself) 原则：

#### 统一管理的功能
1. **外观渲染系统**: 统一的Graphics组件管理和绘制
2. **标签系统**: 统一的名称标签创建和配置（22px大字体）
3. **血条系统**: 统一的血条创建、显示和更新
4. **移动系统**: 完整的Tween移动系统，支持6种移动模式
5. **生命周期管理**: 统一的初始化、受伤、死亡处理流程
6. **状态管理**: 统一的敌人状态（IDLE、MOVING、DEAD）处理

#### 抽象方法设计原则

**强制抽象方法** - 子类必须实现：
```typescript
// 核心身份标识
public abstract readonly enemyType: EnemyType;

// 配置信息提供
protected abstract GetConfig(): EnemyConfig;

// 外观初始化
protected abstract initializeMouseVisuals(): void;
```

**统一配置方法** - 基类提供统一实现，根据敌人分类自动配置：
```typescript
// 统一标签配置 - 基于EnemyCategory自动选择样式
protected getMouseLabelConfig(): {
    text: string;
    fontSize: number;
    color: Color;
    yOffset: number;
    size: { width: number; height: number };
}

// 统一血条配置 - 基于EnemyCategory自动选择样式
protected getHealthBarConfig(): {
    width: number;
    height: number;
    yOffset: number;
    backgroundColor?: Color;
    foregroundColor?: Color;
    borderColor?: Color;
    borderWidth?: number;
}
```

**可选重写方法** - 子类可以重写：
```typescript
// 移动行为定制
protected initializeMovementBehavior(): void

// 受伤回调
protected onTakeDamage(damage: number): void

// 死亡回调
protected onDie(): void

// 特效方法
protected createDeathEffect(): void
protected createCastleReachEffect(): void
```

---

## 🎮 移动系统设计

### 基于Tween的统一移动系统

#### 6种移动模式

1. **zigzag**: Z字形移动 - 每段改变方向，适合基础单位
2. **curves**: S形曲线移动 - 平滑曲线路径
3. **spiral**: 螺旋移动 - 螺旋下降，逐渐收缩
4. **dash**: 快速冲刺 - 主要直线，偶尔调整，适合快速单位
5. **straight**: 直线移动 - 几乎无偏移，适合装甲单位
6. **stealth_sway**: 潜行摇摆 - 不规律摇摆，适合潜行单位

#### 移动参数配置

```typescript
protected initializeMovementBehavior(): void {
    // 根据敌人类型选择移动模式
    this._movementPattern = this.selectMovementPattern();

    // 设置移动参数
    this._zigzagAmplitude = this.calculateAmplitude(); // 摆动幅度
    this._segmentCount = this.calculateSegments();     // 路径分段数
}
```

#### 链式缓动系统

- **分段路径生成**: 根据移动模式生成多个路径点
- **链式缓动动画**: 使用Cocos Creator的tween系统创建平滑移动
- **到达检测**: 统一的城堡到达检测和处理机制

---

## 🎨 视觉设计规范

### 统一标签系统

#### 基于分类的自动配置
BaseMouse 根据敌人分类（EnemyCategory）自动提供统一的标签配置：

- **BASIC**: 白色文字，标准尺寸
- **FAST**: 亮黄色文字，表示速度
- **ARMORED**: 金色文字，表示装甲
- **SPECIAL**: 紫色文字，表示特殊能力
- **BOSS**: 白色文字，更大字体和尺寸

```typescript
// 系统自动根据config.category选择配置
// 子类无需重写，除非有特殊需求
protected getMouseLabelConfig() {
    const config = this.GetConfig();
    switch (config.category) {
        case EnemyCategory.BOSS:
            return {
                text: this.unitName,
                fontSize: 24,  // BOSS用更大字体
                color: new Color(255, 255, 255),
                yOffset: 50,
                size: { width: 120, height: 32 }
            };
        // ... 其他分类的自动配置
    }
}
```

### 血条系统规范

#### 基于分类的自动配置
BaseMouse 根据敌人分类自动提供血条配置，确保视觉一致性：

- **BASIC**: 绿色前景，小尺寸血条
- **FAST**: 亮黄色前景，较小血条
- **ARMORED**: 金色前景，较大血条
- **SPECIAL**: 紫色前景，中等血条
- **BOSS**: 红色前景，大血条，粗边框

```typescript
// 系统自动根据config.category选择配置
protected getHealthBarConfig() {
    const config = this.GetConfig();
    switch (config.category) {
        case EnemyCategory.BOSS:
            return {
                width: 120,
                height: 12,
                yOffset: 55,
                backgroundColor: new Color(60, 60, 60),
                foregroundColor: new Color(255, 100, 100), // BOSS用红色
                borderColor: new Color(255, 255, 255),
                borderWidth: 3
            };
        // ... 其他分类的自动配置
    }
}
```

### Graphics组件管理

#### 组件获取模式
```typescript
protected getGraphicsComponent(): Graphics {
    if (!this._graphics) {
        // 直接添加Graphics组件，让Cocos Creator处理重复检查
        this._graphics = this.node.addComponent(Graphics);
        if (!this._graphics) {
            // 如果添加失败，尝试获取现有组件
            this._graphics = this.node.getComponent(Graphics);
            if (!this._graphics) {
                console.error("无法获取Graphics组件:", this.node.name);
            }
        }
    }
    return this._graphics;
}
```

---

## 🔄 函数合并与代码优化原则

### DRY原则在函数设计中的应用

#### 函数合并指南
遵循DRY原则，避免创建不必要的中间层函数，将相关逻辑合并到单一职责明确的函数中：

```typescript
// ❌ 避免：不必要的中间层函数
private initializeVisuals(): void {
    this._graphics = this.getGraphicsComponent();
    this.drawMouseAppearance();
}

private drawMouseAppearance(): void {
    if (!this._graphics) return;
    // 绘制逻辑...
}

// ✅ 推荐：合并为单一函数
private drawMouseAppearance(): void {
    this._graphics = this.getGraphicsComponent();
    if (!this._graphics) return;
    // 绘制逻辑...
}
```

#### 避免重复调用基类方法
BaseMouse基类已经在适当的时机调用了移动行为初始化，子类不应重复调用：

```typescript
// ❌ 错误：重复调用移动行为初始化
protected initializeMouseVisuals(): void {
    this.drawMouseAppearance();
    this.initializeMovementBehavior(); // 多余，基类已在移动时自动调用
}

// ✅ 正确：只处理视觉相关的初始化
protected initializeMouseVisuals(): void {
    this.drawMouseAppearance();
}
```

#### 理解基类方法调用时机
BaseMouse的方法调用流程：

1. **onLoad阶段**:
   - `initializeMouseStats()` - 初始化属性
   - `initializeMouseVisuals()` - 初始化外观（子类实现）
   - `createMouseNameLabel()` - 创建标签
   - `createMouseHealthBar()` - 创建血条

2. **移动开始时**:
   - `startMovementTowardsCastle()` - 开始移动
   - `initializeMovementBehavior()` - 自动调用移动参数初始化（子类可重写）

```typescript
// BaseMouse中的移动流程
protected startMovementTowardsCastle(): void {
    // ... 前置检查

    // 初始化移动行为（子类可重写以定制参数）
    this.initializeMovementBehavior(); // 在这里自动调用

    // 根据移动模式创建不同的移动路径
    this.createWeavingMovementPath(currentPos, castlePos);
}
```

#### 单一职责原则
每个方法应该有明确的单一职责：

- **initializeMouseVisuals()**: 专注于外观初始化
- **initializeMovementBehavior()**: 专注于移动参数配置
- **drawMouseAppearance()**: 专注于具体的绘制逻辑

### 避免过度抽象
不要为了抽象而创建不必要的中间层：

```typescript
// ❌ 避免：过度抽象的中间层
protected setupComponents(): void {
    this.setupGraphics();
    this.setupVisuals();
}

protected setupGraphics(): void {
    this._graphics = this.getGraphicsComponent();
}

protected setupVisuals(): void {
    this.drawMouseAppearance();
}

// ✅ 推荐：直接在需要的地方处理
protected initializeMouseVisuals(): void {
    this.drawMouseAppearance(); // 函数内部处理Graphics获取
}
```

---

## 📋 开发规范

### 继承实现模式

#### 子类实现模板
```typescript
@ccclass('NewMouse')
export class NewMouse extends BaseMouse {

    // 1. 定义敌人类型（必需）
    public readonly enemyType: EnemyType = EnemyType.NEW_MOUSE;

    // 2. 实现配置方法（必需）
    protected GetConfig(): EnemyConfig {
        return {
            type: EnemyType.NEW_MOUSE,
            name: "新敌人",
            category: EnemyCategory.BASIC,
            health: 50,
            maxHealth: 50,
            moveSpeed: 100,
            goldReward: 5
        };
    }

    // 3. 实现外观初始化（必需）
    protected initializeMouseVisuals(): void {
        this.initializeVisuals();
    }

    // 标签和血条配置：基类已根据敌人分类自动提供
    // 子类通常无需重写，除非有特殊需求

    // 6. 可选：重写移动行为
    protected initializeMovementBehavior(): void {
        // 定制移动参数
        this._movementPattern = 'zigzag';
        this._zigzagAmplitude = 25;
        this._segmentCount = 5;
    }

    // 7. 可选：重写受伤处理
    protected onTakeDamage(damage: number): void {
        super.onTakeDamage(damage);
        // 添加特殊受伤效果
    }

    // 8. 私有方法：外观绘制
    private initializeVisuals(): void {
        const graphics = this.getGraphicsComponent();
        // 绘制敌人外观
        this.drawMouseAppearance(graphics);
    }
}
```

### 抽象方法实现原则

#### 强制实现的方法
1. **enemyType**: 每个敌人必须有唯一的类型标识
2. **GetConfig()**: 提供完整的敌人配置信息（包含敌人分类）
3. **initializeMouseVisuals()**: 初始化敌人的视觉外观

#### 可选重写的方法
1. **initializeMovementBehavior()**: 定制移动行为参数
2. **onTakeDamage()**: 受伤时的特殊处理
3. **onDie()**: 死亡时的特殊处理
4. **createDeathEffect()**: 死亡特效
5. **createCastleReachEffect()**: 到达城堡特效
6. **getMouseLabelConfig()**: 仅在需要特殊标签效果时重写（如动态颜色）
7. **getHealthBarConfig()**: 仅在需要特殊血条样式时重写（如特殊颜色）

---

## ⚡ 性能优化原则

### 组件管理优化

#### Graphics组件复用
- 使用 `getGraphicsComponent()` 统一获取Graphics组件
- 避免重复添加组件，让Cocos Creator处理重复检查
- 缓存Graphics组件引用，避免频繁获取

#### Tween动画优化
```typescript
// 停止之前的移动动画
public stopMovement(): void {
    if (this._movementTween) {
        this._movementTween.stop();
        this._movementTween = null;
    }
    this._isMoving = false;
}

// 避免内存泄漏
protected onDestroy(): void {
    this.stopMovement();
    super.onDestroy && super.onDestroy();
}
```

### 生命周期优化

#### 初始化顺序
```typescript
protected onLoad(): void {
    // 1. 初始化属性（从配置加载）
    this.initializeMouseStats();

    // 2. 初始化外观
    this.initializeMouseVisuals();

    // 3. 创建UI元素
    this.createMouseNameLabel();
    this.createMouseHealthBar();
}

protected start(): void {
    // 1. 获取管理器引用
    this._gameManager = GameManager.instance;

    // 2. 注册到战斗管理器
    const battleManager = BattleManager.instance;
    if (battleManager) {
        battleManager.RegisterEnemy(this.node);
    }
}
```

#### Update循环优化
```typescript
protected update(_dt: number): void {
    // 死亡检查 - 早期退出
    if (!this.isAlive) return;

    // 移动启动 - 只执行一次
    if (!this._movementStarted) {
        this.startMovementTowardsCastle();
        this._movementStarted = true;
    }

    // 避免在update中进行复杂计算
}
```

---

## 🔧 扩展指南

### 添加新敌人类型流程

#### 1. 类型定义
在 `GameTypes.ts` 中添加新的敌人类型：
```typescript
export enum EnemyType {
    // ... 现有类型
    NEW_ENEMY_TYPE = "NewEnemyType"
}
```

#### 2. 配置添加
在 `GameConstants.ts` 中添加敌人配置：
```typescript
export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
    // ... 现有配置
    [EnemyType.NEW_ENEMY_TYPE]: {
        type: EnemyType.NEW_ENEMY_TYPE,
        name: "新敌人",
        category: EnemyCategory.BASIC,
        health: 50,
        maxHealth: 50,
        moveSpeed: 100,
        goldReward: 5
    }
};
```

#### 3. 组件实现
创建继承自 `BaseMouse` 的新组件：
```typescript
@ccclass('NewEnemy')
export class NewEnemy extends BaseMouse {
    // 实现必需的抽象方法
    // 参考上面的子类实现模板
}
```

#### 4. 工厂注册
在 `EnemyFactory.ts` 中注册新敌人：
```typescript
createEnemy(enemyType: EnemyType, position: Vec3): Node | null {
    switch (enemyType) {
        // ... 现有case
        case EnemyType.NEW_ENEMY_TYPE:
            component = enemyNode.addComponent(NewEnemy);
            break;
    }
}
```

### 特殊能力开发指南

#### 护甲系统实现
```typescript
protected onTakeDamage(damage: number): void {
    // 护甲减伤计算
    const reducedDamage = Math.max(1, damage - this.armorValue);
    const actualDamage = damage - reducedDamage;

    if (actualDamage > 0) {
        console.log(`护甲减伤: ${actualDamage}点伤害被护甲吸收`);
    }

    // 显示护甲特效
    this.showArmorEffect();
}
```

#### 潜行系统实现
```typescript
private stealthChance: number = 0.3; // 30%闪避几率

protected onTakeDamage(damage: number): void {
    // 潜行闪避检查
    if (Math.random() < this.stealthChance) {
        console.log("潜行闪避！攻击未命中");
        this.showDodgeEffect();
        return; // 不受伤害
    }

    // 正常受伤处理
    super.onTakeDamage(damage);
}
```

#### 召唤系统实现
```typescript
private summonCount: number = 3;
private hasSummoned: boolean = false;

protected onTakeDamage(damage: number): void {
    super.onTakeDamage(damage);

    // 血量低于50%时召唤小兵
    if (!this.hasSummoned && this.currentHealth < this.maxHealth * 0.5) {
        this.summonMinions();
        this.hasSummoned = true;
    }
}

private summonMinions(): void {
    for (let i = 0; i < this.summonCount; i++) {
        // 创建召唤物逻辑
        this.createSummonedUnit(i);
    }
}
```

---

## 🚫 设计反模式与禁忌

### 严格禁止的设计

#### 1. 敌人攻击英雄
```typescript
// ❌ 禁止：敌人不能有攻击方法
performAttack(target: Node): void {
    // 绝对不允许实现此方法
}

// ❌ 禁止：敌人配置不能包含攻击属性
{
    attackDamage: 10,    // 禁止
    attackRange: 100,    // 禁止
    attackSpeed: 1.0     // 禁止
}
```

#### 2. 破坏DRY原则
```typescript
// ❌ 避免：在子类中重复实现基类已有功能
protected createMouseNameLabel(): void {
    // 不要重复实现，基类已提供
}

// ❌ 避免：重复的外观管理代码
protected getGraphicsComponent(): Graphics {
    // 不要重复实现，使用基类方法
}
```

#### 3. 不当的组件管理
```typescript
// ❌ 避免：条件性组件添加
let graphics = node.getComponent(Graphics);
if (!graphics) {
    graphics = node.addComponent(Graphics);
}

// ✅ 正确：使用基类提供的方法
const graphics = this.getGraphicsComponent();
```

#### 4. 延迟等待解决初始化问题
```typescript
// ❌ 禁止：在初始化中使用延迟等待
onLoad() {
    setTimeout(() => {
        this.initializeVisuals(); // 错误的做法
    }, 100);
}

// ✅ 正确：修复根本的初始化问题
onLoad() {
    this.initializeVisuals(); // 直接处理
}
```

#### 5. 不必要的函数拆分
```typescript
// ❌ 避免：过度拆分导致的复杂调用链
protected initializeMouseVisuals(): void {
    this.initializeVisuals();
}

private initializeVisuals(): void {
    this.setupGraphics();
    this.drawAppearance();
}

private setupGraphics(): void {
    this._graphics = this.getGraphicsComponent();
}

private drawAppearance(): void {
    if (!this._graphics) return;
    // 绘制代码...
}

// ✅ 正确：合理的函数设计
protected initializeMouseVisuals(): void {
    this.drawMouseAppearance();
}

private drawMouseAppearance(): void {
    this._graphics = this.getGraphicsComponent();
    if (!this._graphics) return;
    // 绘制代码...
}
```

#### 6. 重复调用基类已处理的逻辑
```typescript
// ❌ 避免：在视觉初始化中重复调用移动相关逻辑
protected initializeMouseVisuals(): void {
    this.drawMouseAppearance();
    this.initializeMovementBehavior(); // 基类会在移动时自动调用
}

// ❌ 避免：重复获取GameManager引用
protected onLoad(): void {
    super.onLoad();
    this._gameManager = GameManager.instance; // 基类在start中已处理
}

// ✅ 正确：专注于自身职责
protected initializeMouseVisuals(): void {
    this.drawMouseAppearance(); // 只处理外观相关
}

protected onLoad(): void {
    super.onLoad(); // 基类已处理所有必要的初始化
}
```

---

## 📝 架构演进记录

### v1.0 - 基础实现
- 个体敌人类独立实现
- 重复的外观绘制代码
- 分散的移动逻辑

### v1.1 - DRY原则重构
- 引入 BaseMouse 抽象基类
- 统一外观渲染系统
- 统一标签和血条管理
- 抽象移动系统

### v1.2 - 游戏机制纯化
- 移除敌人攻击能力
- 确立纯塔防设计理念
- 优化敌人状态枚举

### v1.3 - 性能和维护性优化
- 统一组件管理模式
- Tween动画优化
- 生命周期管理改进

### v1.4 - 函数合并与代码简化优化
- 添加函数合并原则，消除不必要的中间层函数
- 明确基类方法调用时机，避免重复调用移动行为初始化
- 强化单一职责原则，每个方法职责更加明确
- 增加过度抽象的设计反模式识别
- 完善代码优化指南和最佳实践示例

---

## 🔮 未来扩展方向

### 潜在增强功能

1. **AI行为树系统**: 为复杂BOSS实现更智能的行为模式
2. **环境交互系统**: 敌人与地形环境的交互机制
3. **群体行为系统**: 敌人之间的协作和编队移动
4. **动态难度调整**: 根据玩家表现调整敌人属性
5. **视觉效果增强**: 更丰富的特效和动画系统

### 技术债务清单

1. **移动模式优化**: 当前6种模式可进一步细化和平衡
2. **特效系统统一**: 标准化所有敌人的视觉特效
3. **配置热更新**: 支持不重启游戏调整敌人参数
4. **性能分析工具**: 开发专用的敌人系统性能监控工具

---

## 📚 相关文档

- **主项目文档**: `/CLAUDE.md` - 项目整体架构和开发规范
- **类型定义**: `/assets/scripts/types/GameTypes.ts` - 完整的类型系统
- **游戏配置**: `/assets/scripts/types/GameConstants.ts` - 敌人配置参数
- **基类实现**: `/assets/scripts/components/enemies/BaseMouse.ts` - 基类源代码

---

**文档维护者**: Claude Code Assistant
**最后更新**: 2024年当前日期
**下次审查**: 建议每次架构变更后更新

---

*本文档是活文档，应随着敌人系统的演进持续更新。新的开发者应首先阅读本文档，然后参考具体的代码实现。*