# 投射物系统 (ProjectileSystem)

## 概述

投射物系统是统一管理游戏中所有投射物攻击的核心系统。基于面向对象设计原则，采用继承结构实现不同类型的投射物，消除英雄攻击逻辑中的重复代码。

## 设计理念

### 🎯 核心原则
1. **统一投射物机制**: 所有英雄都基于投射物攻击，区别在于投射物类型
2. **基于继承的设计**: 使用抽象基类和具体子类，而不是配置驱动
3. **职责分离**: 英雄负责发射，投射物负责飞行和伤害判定
4. **DRY原则**: 消除重复的子弹飞行、碰撞检测代码

### 🏗️ 系统架构

```
投射物系统架构
├── BaseProjectile (抽象基类)
│   ├── 通用飞行逻辑
│   ├── 通用碰撞检测
│   └── 抽象方法定义
├── 具体投射物类型
│   ├── PhysicalBullet (物理子弹)
│   ├── MagicMissile (魔法弹)
│   ├── LightningBolt (雷电弹)
│   ├── IceShard (冰弹)
│   ├── SwordWave (剑气)
│   └── ExplosionWave (爆炸冲击波)
└── ProjectileSystem (管理器)
    ├── 投射物工厂方法
    ├── 对象池管理
    └── 全局碰撞检测
```

## 类设计

### BaseProjectile (抽象基类)

**职责**: 定义所有投射物的通用行为和接口

```typescript
abstract class BaseProjectile extends Component {
    // === 通用属性 ===
    protected damage: number;
    protected speed: number;
    protected owner: BaseHero;
    protected startPosition: Vec3;
    protected targetPosition: Vec3;
    protected direction: Vec3;
    
    // === 抽象方法 (子类必须实现) ===
    protected abstract initializeVisuals(): void;
    protected abstract onHitTarget(target: BaseMouse): void;
    protected abstract createHitEffect(position: Vec3): void;
    protected abstract canHitTarget(target: BaseMouse): boolean;
    
    // === 通用方法 (基类实现) ===
    protected launch(): void;
    protected updateMovement(dt: number): void;
    protected checkCollisions(): void;
    protected destroyProjectile(): void;
}
```

### 具体投射物类型

#### PhysicalBullet (物理子弹)
- **使用英雄**: 橘猫射手、波斯猫狙击手、孟加拉猎手
- **特性**: 直线飞行，单体伤害，黄色子弹
- **击中效果**: 黄色爆炸特效

#### MagicMissile (魔法弹)
- **使用英雄**: 暹罗猫法师
- **特性**: 火球外观，击中后AOE伤害
- **击中效果**: 火焰爆炸，范围伤害

#### LightningBolt (雷电弹)
- **使用英雄**: 缅因猫雷法师
- **特性**: 链式跳跃攻击，蓝色闪电效果
- **击中效果**: 电弧特效，跳跃到附近敌人

#### IceShard (冰弹)
- **使用英雄**: 挪威森林猫冰法师
- **特性**: 冰蓝色外观，减速效果
- **击中效果**: 冰霜爆炸，冻结范围内敌人

#### SwordWave (剑气)
- **使用英雄**: 英国短毛猫骑士、布偶猫守护者
- **特性**: 近程投射物，扇形攻击范围
- **击中效果**: 剑光特效，前方范围伤害

#### ExplosionWave (爆炸冲击波)
- **使用英雄**: 美国短毛猫爆破手、俄罗斯蓝猫刺客
- **特性**: 爆炸范围攻击，橙色冲击波
- **击中效果**: 爆炸特效，范围伤害

### ProjectileSystem (管理器)

**职责**: 统一创建和管理所有投射物

```typescript
class ProjectileSystem {
    // === 工厂方法 ===
    static CreatePhysicalBullet(owner: BaseHero, targetPos: Vec3): PhysicalBullet;
    static CreateMagicMissile(owner: BaseHero, targetPos: Vec3): MagicMissile;
    static CreateLightningBolt(owner: BaseHero, targetPos: Vec3): LightningBolt;
    static CreateIceShard(owner: BaseHero, targetPos: Vec3): IceShard;
    static CreateSwordWave(owner: BaseHero, targetPos: Vec3): SwordWave;
    static CreateExplosionWave(owner: BaseHero, targetPos: Vec3): ExplosionWave;
    
    // === 对象池管理 ===
    private static _projectilePools: Map<string, Node[]>;
    static GetPooledProjectile(type: string): Node;
    static RecycleProjectile(projectile: Node): void;
    
    // === 全局管理 ===
    static CleanupInvalidProjectiles(): void;
    static GetActiveProjectiles(): Node[];
}
```

## 使用方式

### 英雄发射投射物

```typescript
// 橘猫射手发射物理子弹
protected onAttack(target: Node): void {
    const bullet = ProjectileSystem.CreatePhysicalBullet(this, target.position);
    // 投射物会自动处理飞行、碰撞和伤害
}

// 暹罗猫法师发射魔法弹
protected onAttack(target: Node): void {
    const missile = ProjectileSystem.CreateMagicMissile(this, target.position);
    // 魔法弹会自动处理AOE伤害
}
```

### 投射物生命周期

1. **创建阶段**: ProjectileSystem创建对应类型的投射物
2. **初始化**: 设置伤害、速度、目标等属性
3. **飞行阶段**: 每帧更新位置，检测碰撞
4. **击中阶段**: 检测到碰撞后调用onHitTarget处理伤害
5. **销毁阶段**: 创建击中特效，回收到对象池

## 优势

### 🚀 性能优化
- **对象池管理**: 投射物复用，减少GC压力
- **统一碰撞检测**: 避免重复的碰撞检测逻辑
- **批量更新**: 统一的投射物更新循环

### 🛠️ 开发效率
- **消除重复代码**: 橘猫和波斯猫不再有120+行重复逻辑
- **易于扩展**: 新增投射物类型只需继承BaseProjectile
- **统一接口**: 所有英雄使用相同的发射接口

### 🎨 设计一致性
- **统一视觉体验**: 所有英雄都有投射物攻击
- **符合设计文档**: 实现了"统一投射物攻击机制"
- **面向对象**: 清晰的职责分离和继承结构

## 文件结构

```
assets/scripts/projectiles/
├── ProjectileSystem.md              # 本文档
├── ProjectileSystem.ts              # 管理器类
├── BaseProjectile.ts               # 抽象基类
└── types/                          # 具体投射物类型
    ├── PhysicalBullet.ts
    ├── MagicMissile.ts
    ├── LightningBolt.ts
    ├── IceShard.ts
    ├── SwordWave.ts
    └── ExplosionWave.ts
```

## 实现计划

1. ✅ **系统设计**: 完成架构设计和文档编写
2. ⏳ **基类实现**: 创建BaseProjectile抽象基类
3. ⏳ **具体类型**: 实现6种投射物子类
4. ⏳ **管理系统**: 创建ProjectileSystem管理器
5. ⏳ **英雄重构**: 重构现有英雄使用新系统
6. ⏳ **测试验证**: 验证系统功能和性能

## 注意事项

### 🔧 技术要点
- 投射物组件必须正确处理节点的生命周期
- 对象池要处理好节点的reset和回收
- 碰撞检测要考虑性能，避免过度检测
- 特效创建要及时清理，避免内存泄漏

### 📋 开发规范
- 所有投射物类名以具体类型命名，如PhysicalBullet
- 抽象方法必须有清晰的注释说明职责
- 每种投射物要有对应的视觉效果和音效
- 要编写单元测试验证碰撞检测的准确性

---

*此文档随系统开发进度更新，最后更新: 2025-01-14*