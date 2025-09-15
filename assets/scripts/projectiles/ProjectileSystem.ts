import { _decorator, Node, Vec3, Component } from 'cc';
import { BaseHero } from '../components/heroes/BaseHero';
import { BaseProjectile } from './BaseProjectile';
import { PhysicalBullet } from './types/PhysicalBullet';
import { MagicMissile } from './types/MagicMissile';
import { SwordWave } from './types/SwordWave';
import { LightningBolt } from './types/LightningBolt';
import { IceShard } from './types/IceShard';
import { ExplosionWave } from './types/ExplosionWave';

const { ccclass, property } = _decorator;

/**
 * 投射物系统管理器
 * 统一创建和管理所有投射物，消除英雄攻击逻辑中的重复代码
 * 提供工厂方法创建不同类型的投射物
 */
@ccclass('ProjectileSystem')
export class ProjectileSystem {
    
    // === 对象池管理 ===
    private static _projectilePools: Map<string, Node[]> = new Map();
    private static _maxPoolSize: number = 30; // 每种投射物的最大池大小
    private static _activeProjectiles: Set<Node> = new Set(); // 跟踪活跃的投射物
    
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
        
        const bulletNode = this.getPooledProjectile("PhysicalBullet") || this.createPhysicalBulletNode();
        if (!bulletNode) {
            console.error("[ProjectileSystem] 无法创建物理子弹节点");
            return null;
        }
        
        const bullet = bulletNode.getComponent(PhysicalBullet);
        if (!bullet) {
            console.error("[ProjectileSystem] 物理子弹组件缺失");
            return null;
        }
        
        // 设置暴击属性
        bullet.setCriticalProperties(critChance, critMultiplier);
        
        // 设置父节点并发射
        bulletNode.parent = owner.node.parent;
        bullet.Launch(owner, targetPos, owner.attackDamage, owner.bulletSpeed);
        
        // 跟踪活跃投射物
        this._activeProjectiles.add(bulletNode);
        
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
        
        const missileNode = this.getPooledProjectile("MagicMissile") || this.createMagicMissileNode();
        if (!missileNode) {
            console.error("[ProjectileSystem] 无法创建魔法弹节点");
            return null;
        }
        
        const missile = missileNode.getComponent(MagicMissile);
        if (!missile) {
            console.error("[ProjectileSystem] 魔法弹组件缺失");
            return null;
        }
        
        // 设置AOE属性
        missile.setAOEProperties(aoeDamageMultiplier, aoeRange);
        
        // 设置父节点并发射
        missileNode.parent = owner.node.parent;
        missile.Launch(owner, targetPos, owner.attackDamage, owner.bulletSpeed);
        
        // 跟踪活跃投射物
        this._activeProjectiles.add(missileNode);
        
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
        
        const waveNode = this.getPooledProjectile("SwordWave") || this.createSwordWaveNode();
        if (!waveNode) {
            console.error("[ProjectileSystem] 无法创建剑气节点");
            return null;
        }
        
        const wave = waveNode.getComponent(SwordWave);
        if (!wave) {
            console.error("[ProjectileSystem] 剑气组件缺失");
            return null;
        }
        
        // 设置冲锋属性
        wave.setChargedAttack(isCharged, chargeMultiplier);
        
        // 设置父节点并发射
        waveNode.parent = owner.node.parent;
        wave.Launch(owner, targetPos, owner.attackDamage, owner.bulletSpeed);
        
        // 跟踪活跃投射物
        this._activeProjectiles.add(waveNode);
        
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
        
        const boltNode = this.getPooledProjectile("LightningBolt") || this.createLightningBoltNode();
        if (!boltNode) {
            console.error("[ProjectileSystem] 无法创建雷电弹节点");
            return null;
        }
        
        const bolt = boltNode.getComponent(LightningBolt);
        if (!bolt) {
            console.error("[ProjectileSystem] 雷电弹组件缺失");
            return null;
        }
        
        // 设置链式攻击属性
        bolt.setChainProperties(chainCount, chainRange, 0.6);
        bolt.resetHitTargets();
        
        // 设置父节点并发射
        boltNode.parent = owner.node.parent;
        bolt.Launch(owner, targetPos, owner.attackDamage, owner.bulletSpeed);
        
        // 跟踪活跃投射物
        this._activeProjectiles.add(boltNode);
        
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
        
        const shardNode = this.getPooledProjectile("IceShard") || this.createIceShardNode();
        if (!shardNode) {
            console.error("[ProjectileSystem] 无法创建冰弹节点");
            return null;
        }
        
        const shard = shardNode.getComponent(IceShard);
        if (!shard) {
            console.error("[ProjectileSystem] 冰弹组件缺失");
            return null;
        }
        
        // 设置冰霜属性
        shard.setFrostProperties(freezeRange, slowAmount, 3.0);
        
        // 设置父节点并发射
        shardNode.parent = owner.node.parent;
        shard.Launch(owner, targetPos, owner.attackDamage, owner.bulletSpeed);
        
        // 跟踪活跃投射物
        this._activeProjectiles.add(shardNode);
        
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
        
        const waveNode = this.getPooledProjectile("ExplosionWave") || this.createExplosionWaveNode();
        if (!waveNode) {
            console.error("[ProjectileSystem] 无法创建爆炸冲击波节点");
            return null;
        }
        
        const wave = waveNode.getComponent(ExplosionWave);
        if (!wave) {
            console.error("[ProjectileSystem] 爆炸冲击波组件缺失");
            return null;
        }
        
        // 设置爆炸属性
        wave.setExplosionProperties(explosionRadius, 1.5, 0.7, knockbackForce);
        
        // 设置父节点并发射
        waveNode.parent = owner.node.parent;
        wave.Launch(owner, targetPos, owner.attackDamage, owner.bulletSpeed);
        
        // 跟踪活跃投射物
        this._activeProjectiles.add(waveNode);
        
        console.log(`[ProjectileSystem] 创建爆炸冲击波: 伤害${owner.attackDamage}, 爆炸半径${explosionRadius}`);
        return wave;
    }
    
    // === 对象池管理方法 ===
    
    /**
     * 从对象池获取投射物节点
     * @param projectileType 投射物类型名称
     * @returns 从池中获取的节点，如果池为空则返回null
     */
    private static getPooledProjectile(projectileType: string): Node | null {
        const pool = this._projectilePools.get(projectileType);
        if (!pool || pool.length === 0) {
            return null;
        }
        
        // 从池中获取有效的节点
        while (pool.length > 0) {
            const node = pool.pop()!;
            if (node && node.isValid) {
                node.active = true;
                return node;
            }
        }
        
        return null;
    }
    
    /**
     * 回收投射物到对象池
     * @param projectile 要回收的投射物节点
     * @param projectileType 投射物类型名称
     */
    static RecycleProjectile(projectile: Node, projectileType: string): void {
        if (!projectile || !projectile.isValid) {
            console.warn("[ProjectileSystem] 尝试回收无效的投射物节点");
            return;
        }
        
        // 从活跃列表中移除
        this._activeProjectiles.delete(projectile);
        
        // 重置节点状态
        projectile.setPosition(0, 0, 0);
        projectile.active = false;
        
        // 清理投射物组件状态
        const projectileComponent = projectile.getComponent(BaseProjectile);
        if (projectileComponent) {
            // 重置投射物状态的方法需要在BaseProjectile中添加
            projectileComponent.unscheduleAllCallbacks();
        }
        
        // 如果池未满，放入池中
        let pool = this._projectilePools.get(projectileType);
        if (!pool) {
            pool = [];
            this._projectilePools.set(projectileType, pool);
        }
        
        if (pool.length < this._maxPoolSize) {
            pool.push(projectile);
            console.log(`[ProjectileSystem] ${projectileType}回收到池，当前池大小: ${pool.length}`);
        } else {
            // 池已满，直接销毁
            console.log(`[ProjectileSystem] ${projectileType}池已满，销毁节点`);
            projectile.destroy();
        }
    }
    
    /**
     * 清理无效的投射物（定期维护）
     * 遍历活跃投射物，移除已销毁的节点
     */
    static CleanupInvalidProjectiles(): void {
        const invalidProjectiles: Node[] = [];
        
        this._activeProjectiles.forEach(projectile => {
            if (!projectile || !projectile.isValid) {
                invalidProjectiles.push(projectile);
            }
        });
        
        invalidProjectiles.forEach(invalid => {
            this._activeProjectiles.delete(invalid);
        });
        
        if (invalidProjectiles.length > 0) {
            console.log(`[ProjectileSystem] 清理了 ${invalidProjectiles.length} 个无效投射物`);
        }
    }
    
    /**
     * 获取当前活跃的投射物数量
     */
    static GetActiveProjectileCount(): number {
        return this._activeProjectiles.size;
    }
    
    /**
     * 获取对象池状态信息
     */
    static GetPoolInfo(): { [key: string]: { poolSize: number; maxSize: number; usage: number } } {
        const info: any = {};
        
        this._projectilePools.forEach((pool, type) => {
            info[type] = {
                poolSize: pool.length,
                maxSize: this._maxPoolSize,
                usage: Math.round((1 - pool.length / this._maxPoolSize) * 100)
            };
        });
        
        return info;
    }
    
    /**
     * 清空所有对象池
     * 通常在场景切换或游戏结束时调用
     */
    static ClearAllPools(): void {
        this._projectilePools.forEach((pool, type) => {
            pool.forEach(node => {
                if (node && node.isValid) {
                    node.destroy();
                }
            });
        });
        
        this._projectilePools.clear();
        this._activeProjectiles.clear();
        console.log("[ProjectileSystem] 所有投射物对象池已清空");
    }
    
    // === 私有方法 - 创建具体投射物节点 ===
    
    /**
     * 创建新的物理子弹节点
     */
    private static createPhysicalBulletNode(): Node {
        const bulletNode = new Node("PhysicalBullet");
        const bulletComponent = bulletNode.addComponent(PhysicalBullet);
        
        console.log("[ProjectileSystem] 创建新的物理子弹节点");
        return bulletNode;
    }
    
    /**
     * 创建新的魔法弹节点
     */
    private static createMagicMissileNode(): Node {
        const missileNode = new Node("MagicMissile");
        const missileComponent = missileNode.addComponent(MagicMissile);
        
        console.log("[ProjectileSystem] 创建新的魔法弹节点");
        return missileNode;
    }
    
    /**
     * 创建新的剑气节点
     */
    private static createSwordWaveNode(): Node {
        const waveNode = new Node("SwordWave");
        const waveComponent = waveNode.addComponent(SwordWave);
        
        console.log("[ProjectileSystem] 创建新的剑气节点");
        return waveNode;
    }
    
    /**
     * 创建新的雷电弹节点
     */
    private static createLightningBoltNode(): Node {
        const boltNode = new Node("LightningBolt");
        const boltComponent = boltNode.addComponent(LightningBolt);
        
        console.log("[ProjectileSystem] 创建新的雷电弹节点");
        return boltNode;
    }
    
    /**
     * 创建新的冰弹节点
     */
    private static createIceShardNode(): Node {
        const shardNode = new Node("IceShard");
        const shardComponent = shardNode.addComponent(IceShard);
        
        console.log("[ProjectileSystem] 创建新的冰弹节点");
        return shardNode;
    }
    
    /**
     * 创建新的爆炸冲击波节点
     */
    private static createExplosionWaveNode(): Node {
        const waveNode = new Node("ExplosionWave");
        const waveComponent = waveNode.addComponent(ExplosionWave);
        
        console.log("[ProjectileSystem] 创建新的爆炸冲击波节点");
        return waveNode;
    }
}

// 投射物系统已在类定义中导出