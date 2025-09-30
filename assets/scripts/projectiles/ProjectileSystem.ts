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
 * 投射物创建参数接口
 * 统一各种投射物的创建参数，遵循开闭原则
 */
export interface ProjectileParams {
    /** 发射者英雄 */
    owner: BaseHero;
    /** 目标位置 */
    targetPos: Vec3;

    // 通用属性
    /** 伤害倍率（可选，默认1.0） */
    damageMultiplier?: number;
    /** 速度倍率（可选，默认1.0） */
    speedMultiplier?: number;

    // 物理投射物属性
    /** 暴击几率（0-1，可选） */
    critChance?: number;
    /** 暴击倍率（可选，默认1.5） */
    critMultiplier?: number;

    // AOE投射物属性
    /** AOE伤害倍率（可选） */
    aoeDamageMultiplier?: number;
    /** AOE范围（可选） */
    aoeRange?: number;

    // 特殊状态属性
    /** 是否为冲锋状态（剑气用） */
    isCharged?: boolean;
    /** 冲锋倍率（可选） */
    chargeMultiplier?: number;

    // 连锁属性
    /** 连锁目标数量（雷电用） */
    chainTargets?: number;
    /** 连锁伤害衰减（可选） */
    chainDamageReduction?: number;

    // 状态效果属性
    /** 减速持续时间（冰系用） */
    slowDuration?: number;
    /** 减速百分比（冰系用） */
    slowPercent?: number;
}

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
        // 监听投射物回收事件
        director.on('projectile-recycle', this.recycleProjectile, this);

        // 验证组件类映射
        const types = Array.from(this._componentClasses.keys());

        // 投射物系统初始化完成
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
        return componentClass;
    }

    /**
     * 获取指定类型的对象池
     * 如果对象池不存在则创建新的
     * @param type 投射物类型
     * @returns 对应的对象池
     */
    private static getPool(type: ProjectileType): NodePool {
        let pool = this._pools.get(type);
        if (!pool) {
            // 创建新的对象池，传入对应的组件类作为池处理器
            const componentClass = this.getComponentClass(type);
            if (!componentClass) {
                console.error(`[ProjectileSystem] 无法创建对象池，组件类为空: ${type}`);
                return new NodePool(); // 返回空的对象池作为降级处理
            }

            try {
                pool = new NodePool(componentClass);
                this._pools.set(type, pool);
                // 简化日志：创建对象池
            } catch (error) {
                console.error(`[ProjectileSystem] 创建对象池失败: ${type}`, error);
                pool = new NodePool(); // 降级为空对象池
                this._pools.set(type, pool);
            }
        }
        return pool;
    }

    /**
     * 从对象池获取投射物节点
     * @param type 投射物类型
     * @returns 从池中获取的节点，如果池为空则创建新节点
     */
    private static getProjectile(type: ProjectileType): Node {
        const pool = this.getPool(type);

        // NodePool.get() 会自动调用组件的 reuse() 方法
        let node = pool.get();

        if (!node) {
            // 对象池为空，创建新节点
            node = this.createProjectileNode(type);
        }

        if (!node) {
            console.error(`[ProjectileSystem] 节点获取失败: ${type}`);
        }

        return node;
    }

    /**
     * 回收投射物到对象池
     * @param node 要回收的投射物节点
     * @param type 投射物类型
     */
    static recycleProjectile(node: Node, type: ProjectileType): void {
        if (!node || !node.isValid) {
            console.warn(`[ProjectileSystem] 尝试回收无效的 ${type} 节点`);
            return;
        }

        const pool = this.getPool(type);

        if (pool.size() < this._maxPoolSize) {
            try {
                // NodePool.put() 会自动调用组件的 unuse() 方法
                pool.put(node);
            } catch (error) {
                console.error(`[ProjectileSystem] 回收到池失败: ${type}`, error);
                node.destroy();
            }
        } else {
            // 池已满，直接销毁
            node.destroy();
        }
    }

    /**
     * 创建投射物节点
     * @param type 投射物类型
     * @returns 新创建的节点
     */
    private static createProjectileNode(type: ProjectileType): Node {
        const componentClass = this.getComponentClass(type);
        if (!componentClass) {
            console.error(`[ProjectileSystem] 组件类不存在: ${type}`);
            return new Node(`Unknown_${type}`);
        }

        const node = new Node(type);

        try {
            const component = node.addComponent(componentClass) as BaseProjectile;
            component.setPoolType(type);
            return node;
        } catch (error) {
            console.error(`[ProjectileSystem] 创建节点失败: ${type}`, error);
            node.destroy();
            return new Node(`Error_${type}`);
        }
    }

    // === 统一投射物创建方法 ===

    /**
     * 统一投射物创建接口
     * 遵循开闭原则：新增投射物类型时只需扩展参数接口，无需修改此方法
     * @param type 投射物类型
     * @param params 创建参数
     * @returns 创建的投射物组件，失败返回null
     */
    static CreateProjectile(type: ProjectileType, params: ProjectileParams): BaseProjectile | null {
        if (!params.owner || !params.targetPos) {
            console.error(`[ProjectileSystem] CreateProjectile参数无效: ${type}`);
            return null;
        }

        const projectileNode = this.getProjectile(type);
        if (!projectileNode) {
            console.error(`[ProjectileSystem] 无法创建投射物节点: ${type}`);
            return null;
        }

        const projectile = projectileNode.getComponent(BaseProjectile);
        if (!projectile) {
            console.error(`[ProjectileSystem] 投射物组件缺失: ${type}`);
            return null;
        }

        // 设置对象池类型
        projectile.setPoolType(type);

        // 设置父节点
        projectileNode.parent = params.owner.node.parent;

        // 应用通用参数
        const damage = params.owner.attackDamage * (params.damageMultiplier || 1.0);
        const speed = params.owner.bulletSpeed * (params.speedMultiplier || 1.0);

        // 根据投射物类型设置特殊属性
        this.applySpecialProperties(projectile, type, params);

        // 发射投射物
        projectile.Launch(params.owner, params.targetPos, damage, speed);

        // 简化日志：创建投射物
        return projectile;
    }

    /**
     * 应用投射物类型特殊属性
     * @param projectile 投射物组件
     * @param type 投射物类型
     * @param params 参数
     */
    private static applySpecialProperties(projectile: BaseProjectile, type: ProjectileType, params: ProjectileParams): void {
        switch (type) {
            case ProjectileType.PHYSICAL_BULLET:
                const bullet = projectile as PhysicalBullet;
                bullet.setCriticalProperties(
                    params.critChance || 0,
                    params.critMultiplier || 1.5
                );
                break;

            case ProjectileType.MAGIC_MISSILE:
                const missile = projectile as MagicMissile;
                missile.setAOEProperties(
                    params.aoeDamageMultiplier || 1.5,
                    params.aoeRange || 80
                );
                break;

            case ProjectileType.SWORD_WAVE:
                const wave = projectile as SwordWave;
                wave.setChargedAttack(
                    params.isCharged || false,
                    params.chargeMultiplier || 1.5
                );
                break;

            case ProjectileType.LIGHTNING_BOLT:
                const lightning = projectile as LightningBolt;
                lightning.setChainProperties(
                    params.chainTargets || 3,
                    100, // chainRange
                    params.chainDamageReduction || 0.2
                );
                break;

            case ProjectileType.ICE_SHARD:
                const ice = projectile as IceShard;
                ice.setFrostProperties(
                    80, // freezeRange
                    params.slowPercent || 0.5,
                    params.slowDuration || 3.0
                );
                break;

            case ProjectileType.EXPLOSION_WAVE:
                const explosion = projectile as ExplosionWave;
                explosion.setExplosionProperties(
                    params.aoeRange || 120,
                    params.aoeDamageMultiplier || 2.0,
                    0.5, // edgeMultiplier
                    50   // knockbackForce
                );
                break;
        }
    }

    // === 工厂方法 - 创建具体投射物类型（向后兼容） ===

    /**
     * 创建物理子弹（向后兼容接口）
     * 用于：橘猫射手、波斯狙击手、孟加拉猎手、折耳射手
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
        return this.CreateProjectile(ProjectileType.PHYSICAL_BULLET, {
            owner,
            targetPos,
            critChance,
            critMultiplier
        }) as PhysicalBullet;
    }

    /**
     * 创建魔法弹（向后兼容接口）
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
        return this.CreateProjectile(ProjectileType.MAGIC_MISSILE, {
            owner,
            targetPos,
            aoeDamageMultiplier,
            aoeRange
        }) as MagicMissile;
    }

    /**
     * 创建剑气
     * 用于：短毛骑士、布偶猫守护者
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

        // 简化日志：创建剑气冲击波
        return wave;
    }

    /**
     * 创建雷电弹
     * 用于：缅因雷法师
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

        // 设置父节点并发射
        boltNode.parent = owner.node.parent;
        bolt.Launch(owner, targetPos, owner.attackDamage, owner.bulletSpeed);

        // 简化日志：创建雷电弹
        return bolt;
    }

    /**
     * 创建冰弹
     * 用于：冰霜法师
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

        // 简化日志：创建冰弹
        return shard;
    }

    /**
     * 创建爆炸冲击波
     * 用于：爆破专家、蓝猫刺客
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

        // 简化日志：创建爆炸冲击波
        return wave;
    }

}
