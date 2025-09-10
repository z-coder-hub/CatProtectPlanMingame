# 投射物系统使用指南

## 快速开始

### 英雄重构示例

#### 重构前 (OrangeCat.ts)
```typescript
// 原来的橘猫攻击代码 - 120+ 行重复逻辑
protected onAttack(target: Node): void {
    this.shootBullet(target);  // 复杂的子弹逻辑
    this.playAttackAnimation();
}

private shootBullet(target: Node): void {
    // 计算方向、创建子弹、设置动画、碰撞检测...
    // 大量重复代码
}
```

#### 重构后 (OrangeCat.ts) 
```typescript
import { ProjectileSystem } from '../../projectiles/ProjectileSystem';

// 新的橘猫攻击代码 - 仅3行核心逻辑！
protected onAttack(target: Node): void {
    // 使用统一的投射物系统发射物理子弹
    ProjectileSystem.CreatePhysicalBullet(this, target.position);
    this.playAttackAnimation();
}
```

#### 重构后的法师 (SiameseMage.ts)
```typescript
import { ProjectileSystem } from '../../projectiles/ProjectileSystem';

protected onAttack(target: Node): void {
    // 发射带AOE效果的魔法弹
    ProjectileSystem.CreateMagicMissile(this, target.position, 1.5, 80);
    this.playAttackAnimation();
}
```

## 优势对比

### 代码量对比
- **重构前**: 每个射击英雄 120+ 行重复的子弹逻辑
- **重构后**: 每个英雄只需 1 行发射代码

### 维护性对比  
- **重构前**: 修改子弹逻辑需要在多个英雄类中重复修改
- **重构后**: 修改投射物行为只需修改对应的投射物类

### 扩展性对比
- **重构前**: 添加新英雄需要重写完整的子弹系统
- **重构后**: 新英雄只需调用对应的工厂方法

## 文件结构
```
assets/scripts/projectiles/
├── README.md                       # 本使用指南
├── ProjectileSystem.md             # 详细系统文档  
├── ProjectileSystem.ts             # 管理器类
├── BaseProjectile.ts              # 抽象基类
└── types/                         # 具体投射物类型
    ├── PhysicalBullet.ts          # ✅ 已实现
    ├── MagicMissile.ts            # ✅ 已实现  
    ├── LightningBolt.ts           # 🚧 待实现
    ├── IceShard.ts                # 🚧 待实现
    ├── SwordWave.ts               # 🚧 待实现
    └── ExplosionWave.ts           # 🚧 待实现
```

## 系统特性

### ✅ 已实现特性
- **统一投射物管理**: 所有英雄使用相同的发射接口
- **对象池优化**: 投射物节点复用，减少GC压力
- **碰撞检测统一**: 高效的50fps碰撞检测系统
- **视觉效果统一**: 每种投射物有独特的外观和击中特效
- **基于继承的设计**: 面向对象的清晰架构

### 🚧 计划特性
- **更多投射物类型**: 雷电弹、冰弹、剑气、爆炸冲击波
- **链式攻击**: 雷电弹的跳跃攻击
- **减速效果**: 冰弹的冻结效果  
- **穿透攻击**: 某些投射物可以穿透多个敌人
- **音效系统**: 每种投射物的发射和击中音效

---

*通过投射物系统，我们成功消除了英雄攻击逻辑中的重复代码，实现了真正的DRY原则。*