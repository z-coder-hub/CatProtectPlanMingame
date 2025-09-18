import { _decorator, director, Node, NodePool, Vec3 } from 'cc';
import { BaseHero } from '../components/heroes/BaseHero';
import { ProjectileType } from '../types/GameConstants';
import { BaseProjectile } from './BaseProjectile';
import { ExplosionWave } from './types/ExplosionWave';
import { IceShard } from './types/IceShard';
import { LightningBolt } from './types/LightningBolt';
import { MagicMissile } from './types/MagicMissile';
import { PhysicalBullet } from './types/PhysicalBullet';
import { SwordWave } from './types/SwordWave';

const { ccclass } = _decorator;

/**
 * 投射物系统管理器
 * 统一创建和管理所有投射物，消除英雄攻击逻辑中的重复代码
 * 内置对象池管理，提高投射物创建和回收的性能
 *
 * 对象池工作原理：
 * 1. 创建 NodePool 时传入组件类作为 poolHandler
 * 2. NodePool 自动管理节点的创建、回收和重用
 * 3. 投射物组件只需专注于游戏逻辑，无需实现特殊接口
 * 4. 统一的系统处理所有类型投射物的生命周期
 */
@ccclass('ProjectileSystem')
export class ProjectileSystem {

    // === 对象池管理 ===
    private static _pools: Map<ProjectileType, NodePool> = new Map();
    private static _maxPoolSize: number = 70; // 每种投射物的最大池大小

    // === 投射物组件类映射 ===
    private static readonly _componentClasses = new Map<ProjectileType, any>([
        [ProjectileType.PHYSICAL_BULLET, PhysicalBullet],
        [ProjectileType.MAGIC_MISSILE, MagicMissile],
        [ProjectileType.SWORD_WAVE, SwordWave],
        [ProjectileType.LIGHTNING_BOLT, LightningBolt],
        [ProjectileType.ICE_SHARD, IceShard],
        [ProjectileType.EXPLOSION_WAVE, ExplosionWave]
    ]);

    // === 初始化方法 ===

    /**
     * 初始化投射物系统
     */
    static initialize(): void {
        console.log("[ProjectileSystem] 🚀 开始初始化投射物系统...");

        // 监听投射物回收事件
        director.on('projectile-recycle', this.recycleProjectile, this);
        console.log("[ProjectileSystem] 📡 已注册投射物回收事件监听器");

        // 验证组件类映射
        const types = Array.from(this._componentClasses.keys());
        console.log(`[ProjectileSystem] 📋 已注册的投射物类型: ${types.join(', ')}`);

        types.forEach(type => {
            const componentClass = this._componentClasses.get(type);
            console.log(`[ProjectileSystem] ✅ ${type}: ${componentClass?.name || 'Unknown'}`);
        });

        console.log(`[ProjectileSystem] ⚙️ 对象池配置: 最大大小=${this._maxPoolSize}`);
        console.log("[ProjectileSystem] 🎉 投射物系统初始化完成，对象池管理已就绪");
    }


    // === 对象池核心方法 ===

    /**
     * 获取指定类型的组件类
     * @param type 投射物类型
     * @returns 对应的组件类
     */
    private static getComponentClass(type: ProjectileType): any {
        const componentClass = this._componentClasses.get(type);
        if (!componentClass) {
            console.error(`[ProjectileSystem] 未找到 ${type} 的组件类`);
            return null;
        }
        console.log(`[ProjectileSystem] 获取组件类: ${type} -> ${componentClass.name}`);
        return componentClass;
    }

    /**
     * 获取指定类型的对象池
     * 如果对象池不存在则创建新的
     * @param type 投射物类型
     * @returns 对应的对象池
     */
    private static getPool(type: ProjectileType): NodePool {
        console.log(`[ProjectileSystem] 请求对象池: ${type}`);
        let pool = this._pools.get(type);
        if (!pool) {
            // 创建新的对象池，传入对应的组件类作为池处理器
            const componentClass = this.getComponentClass(type);
            if (!componentClass) {
                console.error(`[ProjectileSystem] 无法创建对象池，组件类为空: ${type}`);
                return new NodePool(); // 返回空的对象池作为降级处理
            }

            console.log(`[ProjectileSystem] 创建新对象池，使用组件类: ${componentClass.name}`);
            try {
                pool = new NodePool(componentClass);
                this._pools.set(type, pool);
                console.log(`[ProjectileSystem] ✅ 成功创建 ${type} 对象池`);
            } catch (error) {
                console.error(`[ProjectileSystem] ❌ 创建对象池失败: ${type}`, error);
                pool = new NodePool(); // 降级为空对象池
                this._pools.set(type, pool);
            }
        } else {
            console.log(`[ProjectileSystem] 🔄 使用现有对象池: ${type}, 当前大小: ${pool.size()}`);
        }
        return pool;
    }

    /**
     * 从对象池获取投射物节点
     * @param type 投射物类型
     * @returns 从池中获取的节点，如果池为空则创建新节点
     */
    private static getProjectile(type: ProjectileType): Node {
        console.log(`[ProjectileSystem] 🎯 请求投射物节点: ${type}`);
        const pool = this.getPool(type);

        // NodePool.get() 会自动调用组件的 reuse() 方法
        console.log(`[ProjectileSystem] 尝试从对象池获取节点，池当前大小: ${pool.size()}`);
        let node = pool.get();

        if (!node) {
            // 对象池为空，创建新节点
            console.log(`[ProjectileSystem] 🆕 对象池为空，创建新节点: ${type}`);
            node = this.createProjectileNode(type);
            console.log(`[ProjectileSystem] ✅ 新节点创建完成: ${type}, 池大小: ${pool.size()}`);
        } else {
            console.log(`[ProjectileSystem] ♻️ 从池中获取 ${type} 节点，剩余: ${pool.size()}`);
        }

        if (node) {
            console.log(`[ProjectileSystem] 🎉 成功获取节点: ${node.name}, 有效性: ${node.isValid}`);
        } else {
            console.error(`[ProjectileSystem] ❌ 节点获取失败: ${type}`);
        }

        return node;
    }

    /**
     * 回收投射物到对象池
     * @param node 要回收的投射物节点
     * @param type 投射物类型
     */
    static recycleProjectile(node: Node, type: ProjectileType): void {
        console.log(`[ProjectileSystem] 🔄 请求回收投射物: ${type}`);

        if (!node || !node.isValid) {
            console.warn(`[ProjectileSystem] ⚠️ 尝试回收无效的 ${type} 节点: node=${!!node}, valid=${node?.isValid}`);
            return;
        }

        console.log(`[ProjectileSystem] 节点有效，准备回收: ${node.name}`);
        const pool = this.getPool(type);

        // 检查池的大小限制
        console.log(`[ProjectileSystem] 池状态检查: 当前大小=${pool.size()}, 最大大小=${this._maxPoolSize}`);

        if (pool.size() < this._maxPoolSize) {
            try {
                // NodePool.put() 会自动调用组件的 unuse() 方法
                pool.put(node);
                console.log(`[ProjectileSystem] ✅ ${type} 成功回收到池，当前池大小: ${pool.size()}`);
            } catch (error) {
                console.error(`[ProjectileSystem] ❌ 回收到池失败: ${type}`, error);
                node.destroy();
            }
        } else {
            // 池已满，直接销毁
            console.log(`[ProjectileSystem] 🗑️ ${type} 池已满(${pool.size()}/${this._maxPoolSize})，销毁节点`);
            node.destroy();
        }
    }

    /**
     * 创建投射物节点
     * @param type 投射物类型
     * @returns 新创建的节点
     */
    private static createProjectileNode(type: ProjectileType): Node {
        console.log(`[ProjectileSystem] 🛠️ 开始创建投射物节点: ${type}`);

        const componentClass = this.getComponentClass(type);
        if (!componentClass) {
            console.error(`[ProjectileSystem] ❌ 组件类不存在，创建未知节点: ${type}`);
            return new Node(`Unknown_${type}`);
        }

        console.log(`[ProjectileSystem] 创建节点和组件...`);
        const node = new Node(type);

        try {
            const component = node.addComponent(componentClass) as BaseProjectile;
            component.setPoolType(type);
            console.log(`[ProjectileSystem] ✅ 节点创建成功: ${node.name}, 组件: ${component.constructor.name}`);
            return node;
        } catch (error) {
            console.error(`[ProjectileSystem] ❌ 创建节点失败: ${type}`, error);
            node.destroy();
            return new Node(`Error_${type}`);
        }
    }

    // === 工厂方法 - 创建具体投射物类型 ===

    /**
     * 创建物理子弹
     * 用于：橘猫射手、波斯猫狙击手、孟加拉猎手、苏格兰折耳猫射手
     * @param owner 发射者英雄
     * @param targetPos 目标位置
     * @param critChance 暴击几率（可选）
     * @param critMultiplier 暴击倍率（可选）
     * @returns 创建的物理子弹
     */
    static CreatePhysicalBullet(
        owner: BaseHero,
        targetPos: Vec3,
        critChance: number = 0,
        critMultiplier: number = 1.5
    ): PhysicalBullet | null {
        if (!owner || !targetPos) {
            console.error("[ProjectileSystem] CreatePhysicalBullet参数无效");
            return null;
        }

        const bulletNode = this.getProjectile(ProjectileType.PHYSICAL_BULLET);
        if (!bulletNode) {
            console.error("[ProjectileSystem] 无法创建物理子弹节点");
            return null;
        }

        const bullet = bulletNode.getComponent(PhysicalBullet);
        if (!bullet) {
            console.error("[ProjectileSystem] 物理子弹组件缺失");
            return null;
        }

        // 设置对象池类型
        bullet.setPoolType(ProjectileType.PHYSICAL_BULLET);

        // 设置暴击属性
        bullet.setCriticalProperties(critChance, critMultiplier);

        // 设置父节点并发射
        bulletNode.parent = owner.node.parent;
        bullet.Launch(owner, targetPos, owner.attackDamage, owner.bulletSpeed);

        console.log(`[ProjectileSystem] 创建物理子弹: 伤害${owner.attackDamage}, 速度${owner.bulletSpeed}`);
        return bullet;
    }

    /**
     * 创建魔法弹
     * 用于：暹罗猫法师
     * @param owner 发射者英雄
     * @param targetPos 目标位置
     * @param aoeDamageMultiplier AOE伤害倍率（可选）
     * @param aoeRange AOE范围（可选）
     * @returns 创建的魔法弹
     */
    static CreateMagicMissile(
        owner: BaseHero,
        targetPos: Vec3,
        aoeDamageMultiplier: number = 1.5,
        aoeRange: number = 80
    ): MagicMissile | null {
        if (!owner || !targetPos) {
            console.error("[ProjectileSystem] CreateMagicMissile参数无效");
            return null;
        }

        const missileNode = this.getProjectile(ProjectileType.MAGIC_MISSILE);
        if (!missileNode) {
            console.error("[ProjectileSystem] 无法创建魔法弹节点");
            return null;
        }

        const missile = missileNode.getComponent(MagicMissile);
        if (!missile) {
            console.error("[ProjectileSystem] 魔法弹组件缺失");
            return null;
        }

        // 设置对象池类型
        missile.setPoolType(ProjectileType.MAGIC_MISSILE);

        // 设置AOE属性
        missile.setAOEProperties(aoeDamageMultiplier, aoeRange);

        // 设置父节点并发射
        missileNode.parent = owner.node.parent;
        missile.Launch(owner, targetPos, owner.attackDamage, owner.bulletSpeed);

        console.log(`[ProjectileSystem] 创建魔法弹: 伤害${owner.attackDamage}, AOE${aoeRange}`);
        return missile;
    }

    /**
     * 创建剑气
     * 用于：英国短毛猫骑士、布偶猫守护者
     * @param owner 发射者英雄
     * @param targetPos 目标位置
     * @param isCharged 是否为冲锋攻击（可选）
     * @param chargeMultiplier 冲锋伤害倍率（可选）
     * @returns 创建的剑气
     */
    static CreateSwordWave(
        owner: BaseHero,
        targetPos: Vec3,
        isCharged: boolean = false,
        chargeMultiplier: number = 1.5
    ): SwordWave | null {
        if (!owner || !targetPos) {
            console.error("[ProjectileSystem] CreateSwordWave参数无效");
            return null;
        }

        const waveNode = this.getProjectile(ProjectileType.SWORD_WAVE);
        if (!waveNode) {
            console.error("[ProjectileSystem] 无法创建剑气节点");
            return null;
        }

        const wave = waveNode.getComponent(SwordWave);
        if (!wave) {
            console.error("[ProjectileSystem] 剑气组件缺失");
            return null;
        }

        // 设置对象池类型
        wave.setPoolType(ProjectileType.SWORD_WAVE);

        // 设置冲锋属性
        wave.setChargedAttack(isCharged, chargeMultiplier);

        // 设置父节点并发射
        waveNode.parent = owner.node.parent;
        wave.Launch(owner, targetPos, owner.attackDamage, owner.bulletSpeed);

        console.log(`[ProjectileSystem] 创建剑气: 伤害${owner.attackDamage}, 冲锋${isCharged}`);
        return wave;
    }

    /**
     * 创建雷电弹
     * 用于：缅因猫雷法师
     * @param owner 发射者英雄
     * @param targetPos 目标位置
     * @param chainCount 链式跳跃次数（可选）
     * @param chainRange 链式跳跃范围（可选）
     * @returns 创建的雷电弹
     */
    static CreateLightningBolt(
        owner: BaseHero,
        targetPos: Vec3,
        chainCount: number = 3,
        chainRange: number = 100
    ): LightningBolt | null {
        if (!owner || !targetPos) {
            console.error("[ProjectileSystem] CreateLightningBolt参数无效");
            return null;
        }

        const boltNode = this.getProjectile(ProjectileType.LIGHTNING_BOLT);
        if (!boltNode) {
            console.error("[ProjectileSystem] 无法创建雷电弹节点");
            return null;
        }

        const bolt = boltNode.getComponent(LightningBolt);
        if (!bolt) {
            console.error("[ProjectileSystem] 雷电弹组件缺失");
            return null;
        }

        // 设置对象池类型
        bolt.setPoolType(ProjectileType.LIGHTNING_BOLT);

        // 设置链式攻击属性
        bolt.setChainProperties(chainCount, chainRange, 0.6);
        bolt.resetHitTargets();

        // 设置父节点并发射
        boltNode.parent = owner.node.parent;
        bolt.Launch(owner, targetPos, owner.attackDamage, owner.bulletSpeed);

        console.log(`[ProjectileSystem] 创建雷电弹: 伤害${owner.attackDamage}, 链式${chainCount}次`);
        return bolt;
    }

    /**
     * 创建冰弹
     * 用于：挪威森林猫冰法师
     * @param owner 发射者英雄
     * @param targetPos 目标位置
     * @param freezeRange 冰冻范围（可选）
     * @param slowAmount 减速强度（可选）
     * @returns 创建的冰弹
     */
    static CreateIceShard(
        owner: BaseHero,
        targetPos: Vec3,
        freezeRange: number = 90,
        slowAmount: number = 0.5
    ): IceShard | null {
        if (!owner || !targetPos) {
            console.error("[ProjectileSystem] CreateIceShard参数无效");
            return null;
        }

        const shardNode = this.getProjectile(ProjectileType.ICE_SHARD);
        if (!shardNode) {
            console.error("[ProjectileSystem] 无法创建冰弹节点");
            return null;
        }

        const shard = shardNode.getComponent(IceShard);
        if (!shard) {
            console.error("[ProjectileSystem] 冰弹组件缺失");
            return null;
        }

        // 设置对象池类型
        shard.setPoolType(ProjectileType.ICE_SHARD);

        // 设置冰霜属性
        shard.setFrostProperties(freezeRange, slowAmount, 3.0);

        // 设置父节点并发射
        shardNode.parent = owner.node.parent;
        shard.Launch(owner, targetPos, owner.attackDamage, owner.bulletSpeed);

        console.log(`[ProjectileSystem] 创建冰弹: 伤害${owner.attackDamage}, 冰冻范围${freezeRange}`);
        return shard;
    }

    /**
     * 创建爆炸冲击波
     * 用于：美国短毛猫爆破手、俄罗斯蓝猫刺客
     * @param owner 发射者英雄
     * @param targetPos 目标位置
     * @param explosionRadius 爆炸半径（可选）
     * @param knockbackForce 推拽强度（可选）
     * @returns 创建的爆炸冲击波
     */
    static CreateExplosionWave(
        owner: BaseHero,
        targetPos: Vec3,
        explosionRadius: number = 120,
        knockbackForce: number = 50
    ): ExplosionWave | null {
        if (!owner || !targetPos) {
            console.error("[ProjectileSystem] CreateExplosionWave参数无效");
            return null;
        }

        const waveNode = this.getProjectile(ProjectileType.EXPLOSION_WAVE);
        if (!waveNode) {
            console.error("[ProjectileSystem] 无法创建爆炸冲击波节点");
            return null;
        }

        const wave = waveNode.getComponent(ExplosionWave);
        if (!wave) {
            console.error("[ProjectileSystem] 爆炸冲击波组件缺失");
            return null;
        }

        // 设置对象池类型
        wave.setPoolType(ProjectileType.EXPLOSION_WAVE);

        // 设置爆炸属性
        wave.setExplosionProperties(explosionRadius, 1.5, 0.7, knockbackForce);

        // 设置父节点并发射
        waveNode.parent = owner.node.parent;
        wave.Launch(owner, targetPos, owner.attackDamage, owner.bulletSpeed);

        console.log(`[ProjectileSystem] 创建爆炸冲击波: 伤害${owner.attackDamage}, 爆炸半径${explosionRadius}`);
        return wave;
    }

}
