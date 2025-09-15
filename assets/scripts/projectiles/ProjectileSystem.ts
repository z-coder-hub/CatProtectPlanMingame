import { _decorator, Vec3 } from 'cc';
import { BaseHero } from '../components/heroes/BaseHero';
import { PhysicalBullet } from './types/PhysicalBullet';
import { MagicMissile } from './types/MagicMissile';
import { SwordWave } from './types/SwordWave';
import { LightningBolt } from './types/LightningBolt';
import { IceShard } from './types/IceShard';
import { ExplosionWave } from './types/ExplosionWave';
import { ProjectilePool } from './ProjectilePool';

const { ccclass } = _decorator;

/**
 * 投射物系统管理器
 * 统一创建和管理所有投射物，消除英雄攻击逻辑中的重复代码
 * 提供工厂方法创建不同类型的投射物
 */
@ccclass('ProjectileSystem')
export class ProjectileSystem {

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
        
        const bulletNode = ProjectilePool.GetPooledProjectile("PhysicalBullet") || ProjectilePool.CreatePhysicalBulletNode();
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
        ProjectilePool.TrackActiveProjectile(bulletNode);
        
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
        
        const missileNode = ProjectilePool.GetPooledProjectile("MagicMissile") || ProjectilePool.CreateMagicMissileNode();
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
        ProjectilePool.TrackActiveProjectile(missileNode);
        
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
        
        const waveNode = ProjectilePool.GetPooledProjectile("SwordWave") || ProjectilePool.CreateSwordWaveNode();
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
        ProjectilePool.TrackActiveProjectile(waveNode);
        
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
        
        const boltNode = ProjectilePool.GetPooledProjectile("LightningBolt") || ProjectilePool.CreateLightningBoltNode();
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
        ProjectilePool.TrackActiveProjectile(boltNode);
        
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
        
        const shardNode = ProjectilePool.GetPooledProjectile("IceShard") || ProjectilePool.CreateIceShardNode();
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
        ProjectilePool.TrackActiveProjectile(shardNode);
        
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
        
        const waveNode = ProjectilePool.GetPooledProjectile("ExplosionWave") || ProjectilePool.CreateExplosionWaveNode();
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
        ProjectilePool.TrackActiveProjectile(waveNode);
        
        console.log(`[ProjectileSystem] 创建爆炸冲击波: 伤害${owner.attackDamage}, 爆炸半径${explosionRadius}`);
        return wave;
    }

}

// 投射物系统已在类定义中导出