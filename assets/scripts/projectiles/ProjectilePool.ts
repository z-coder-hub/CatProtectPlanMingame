import { _decorator, Node } from 'cc';
import { BaseProjectile } from './BaseProjectile';
import { PhysicalBullet } from './types/PhysicalBullet';
import { MagicMissile } from './types/MagicMissile';
import { SwordWave } from './types/SwordWave';
import { LightningBolt } from './types/LightningBolt';
import { IceShard } from './types/IceShard';
import { ExplosionWave } from './types/ExplosionWave';

const { ccclass } = _decorator;

/**
 * 投射物对象池管理器
 * 负责管理所有投射物的创建、回收和重用
 * 提高性能并减少内存分配
 */
@ccclass('ProjectilePool')
export class ProjectilePool {

    // === 对象池状态管理 ===
    private static _projectilePools: Map<string, Node[]> = new Map();
    private static _maxPoolSize: number = 30; // 每种投射物的最大池大小
    private static _activeProjectiles: Set<Node> = new Set(); // 跟踪活跃的投射物

    // === 对象池核心方法 ===

    /**
     * 从对象池获取投射物节点
     * @param projectileType 投射物类型名称
     * @returns 从池中获取的节点，如果池为空则返回null
     */
    static GetPooledProjectile(projectileType: string): Node | null {
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
            console.warn("[ProjectilePool] 尝试回收无效的投射物节点");
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
            console.log(`[ProjectilePool] ${projectileType}回收到池，当前池大小: ${pool.length}`);
        } else {
            // 池已满，直接销毁
            console.log(`[ProjectilePool] ${projectileType}池已满，销毁节点`);
            projectile.destroy();
        }
    }

    /**
     * 将投射物添加到活跃列表追踪
     * @param projectile 要追踪的投射物节点
     */
    static TrackActiveProjectile(projectile: Node): void {
        if (projectile && projectile.isValid) {
            this._activeProjectiles.add(projectile);
        }
    }

    // === 投射物节点创建工厂方法 ===

    /**
     * 创建新的物理子弹节点
     */
    static CreatePhysicalBulletNode(): Node {
        const bulletNode = new Node("PhysicalBullet");
        const bulletComponent = bulletNode.addComponent(PhysicalBullet);

        console.log("[ProjectilePool] 创建新的物理子弹节点");
        return bulletNode;
    }

    /**
     * 创建新的魔法弹节点
     */
    static CreateMagicMissileNode(): Node {
        const missileNode = new Node("MagicMissile");
        const missileComponent = missileNode.addComponent(MagicMissile);

        console.log("[ProjectilePool] 创建新的魔法弹节点");
        return missileNode;
    }

    /**
     * 创建新的剑气节点
     */
    static CreateSwordWaveNode(): Node {
        const waveNode = new Node("SwordWave");
        const waveComponent = waveNode.addComponent(SwordWave);

        console.log("[ProjectilePool] 创建新的剑气节点");
        return waveNode;
    }

    /**
     * 创建新的雷电弹节点
     */
    static CreateLightningBoltNode(): Node {
        const boltNode = new Node("LightningBolt");
        const boltComponent = boltNode.addComponent(LightningBolt);

        console.log("[ProjectilePool] 创建新的雷电弹节点");
        return boltNode;
    }

    /**
     * 创建新的冰弹节点
     */
    static CreateIceShardNode(): Node {
        const shardNode = new Node("IceShard");
        const shardComponent = shardNode.addComponent(IceShard);

        console.log("[ProjectilePool] 创建新的冰弹节点");
        return shardNode;
    }

    /**
     * 创建新的爆炸冲击波节点
     */
    static CreateExplosionWaveNode(): Node {
        const waveNode = new Node("ExplosionWave");
        const waveComponent = waveNode.addComponent(ExplosionWave);

        console.log("[ProjectilePool] 创建新的爆炸冲击波节点");
        return waveNode;
    }

    // === 对象池维护和信息方法 ===

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
            console.log(`[ProjectilePool] 清理了 ${invalidProjectiles.length} 个无效投射物`);
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
        console.log("[ProjectilePool] 所有投射物对象池已清空");
    }

    /**
     * 设置对象池最大大小
     * @param maxSize 最大池大小
     */
    static SetMaxPoolSize(maxSize: number): void {
        if (maxSize > 0) {
            this._maxPoolSize = maxSize;
            console.log(`[ProjectilePool] 对象池最大大小设置为: ${maxSize}`);
        }
    }

    /**
     * 获取对象池最大大小
     */
    static GetMaxPoolSize(): number {
        return this._maxPoolSize;
    }
}