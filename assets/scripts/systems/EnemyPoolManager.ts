import { _decorator, Node, NodePool, director } from 'cc';
import { EnemyType } from '../types/GameTypes';
import { BaseMouse } from '../components/enemies/BaseMouse';
import { BasicMouse } from '../components/enemies/BasicMouse';
import { GiantMouse } from '../components/enemies/GiantMouse';
import { FastMouse } from '../components/enemies/FastMouse';
import { SpeedMouse } from '../components/enemies/SpeedMouse';
import { ArmoredMouse } from '../components/enemies/ArmoredMouse';
import { TankMouse } from '../components/enemies/TankMouse';
import { StealthMouse } from '../components/enemies/StealthMouse';
import { MouseKing } from '../components/enemies/MouseKing';
import { MechMouse } from '../components/enemies/MechMouse';
import { ArmorOverlord } from '../components/enemies/ArmorOverlord';
import { ShadowAssassin } from '../components/enemies/ShadowAssassin';
import { StormTyrant } from '../components/enemies/StormTyrant';
import { GiantBehemoth } from '../components/enemies/GiantBehemoth';
import { ThunderMaster } from '../components/enemies/ThunderMaster';
import { MechCommander } from '../components/enemies/MechCommander';
import { UltimateOverlord } from '../components/enemies/UltimateOverlord';

const { ccclass } = _decorator;

/**
 * 敌人自动注册装饰器
 * 使用方式：@RegisterEnemy(EnemyType.BASIC_MOUSE)
 *
 * 遵循开闭原则：新增敌人时无需修改池管理器，只需使用此装饰器
 *
 * 示例：
 * ```typescript
 * @RegisterEnemy(EnemyType.NEW_ENEMY)
 * export class NewEnemy extends BaseMouse {
 *     // 敌人实现
 * }
 * ```
 */
export function RegisterEnemy(enemyType: EnemyType) {
    return function<T extends new (...args: any[]) => BaseMouse>(constructor: T) {
        // 自动注册到池管理器
        EnemyPoolManager.registerEnemyClass(enemyType, constructor as new () => BaseMouse);
        return constructor;
    };
}

/**
 * 基于官方 NodePool 的敌人对象池管理器
 * 使用 Cocos Creator 官方推荐的对象池实现
 * 提供高效的敌人节点创建、回收和重用机制
 *
 * 功能特性：
 * - 支持所有16种敌人类型的对象池管理
 * - 自动创建和销毁节点，避免频繁的内存分配
 * - 池大小限制防止内存过度使用
 * - 统一的日志格式，便于调试和监控
 * - 事件驱动架构，避免循环依赖
 *
 * 使用方式：
 * ```typescript
 * // 获取敌人节点（从池中获取或新创建）
 * const enemyNode = EnemyPoolManager.getEnemy(EnemyType.BASIC_MOUSE);
 *
 * // 回收敌人节点到池中（通过事件系统自动调用）
 * director.emit('enemy-recycle', enemyNode, EnemyType.BASIC_MOUSE);
 * ```
 *
 * @see EnemyFactory 用于更高级的敌人创建和部署功能
 * @see ProjectileSystem 参考了相似的对象池管理模式
 */
@ccclass('EnemyPoolManager')
export class EnemyPoolManager {

    // === 对象池映射 ===
    private static _pools: Map<EnemyType, NodePool> = new Map();
    private static _maxPoolSize: number = 15; // 每种敌人的最大池大小

    // === 动态注册表 - 支持装饰器自动注册 ===
    /** 敌人组件类动态注册表 */
    private static _enemyRegistry: Map<EnemyType, new () => BaseMouse> = new Map();

    // 静态初始化 - 注册现有敌人（向后兼容）
    private static _initialized = false;

    /**
     * 初始化现有敌人注册（仅执行一次）
     */
    private static initializeRegistry(): void {
        if (this._initialized) return;

        // 注册现有敌人类型（向后兼容）
        this._enemyRegistry.set(EnemyType.BASIC_MOUSE, BasicMouse);
        this._enemyRegistry.set(EnemyType.GIANT_MOUSE, GiantMouse);
        this._enemyRegistry.set(EnemyType.FAST_MOUSE, FastMouse);
        this._enemyRegistry.set(EnemyType.SPEED_MOUSE, SpeedMouse);
        this._enemyRegistry.set(EnemyType.ARMORED_MOUSE, ArmoredMouse);
        this._enemyRegistry.set(EnemyType.TANK_MOUSE, TankMouse);
        this._enemyRegistry.set(EnemyType.STEALTH_MOUSE, StealthMouse);
        this._enemyRegistry.set(EnemyType.MOUSE_KING, MouseKing);
        this._enemyRegistry.set(EnemyType.MECH_MOUSE, MechMouse);
        this._enemyRegistry.set(EnemyType.ARMOR_OVERLORD, ArmorOverlord);
        this._enemyRegistry.set(EnemyType.SHADOW_ASSASSIN, ShadowAssassin);
        this._enemyRegistry.set(EnemyType.STORM_TYRANT, StormTyrant);
        this._enemyRegistry.set(EnemyType.GIANT_BEHEMOTH, GiantBehemoth);
        this._enemyRegistry.set(EnemyType.THUNDER_MASTER, ThunderMaster);
        this._enemyRegistry.set(EnemyType.MECH_COMMANDER, MechCommander);
        this._enemyRegistry.set(EnemyType.ULTIMATE_OVERLORD, UltimateOverlord);

        this._initialized = true;
        console.log(`[EnemyPoolManager] 📝 已注册 ${this._enemyRegistry.size} 种敌人类型`);
    }

    /**
     * 注册敌人类（供装饰器使用）
     * @param enemyType 敌人类型
     * @param enemyClass 敌人类构造函数
     */
    public static registerEnemyClass(enemyType: EnemyType, enemyClass: new () => BaseMouse): void {
        this.initializeRegistry();

        if (this._enemyRegistry.has(enemyType)) {
            console.warn(`[EnemyPoolManager] ⚠️ 敌人类型 ${enemyType} 已存在，将被覆盖`);
        }

        this._enemyRegistry.set(enemyType, enemyClass);
        console.log(`[EnemyPoolManager] ✅ 注册敌人类型: ${enemyType}`);
    }

    /**
     * 通用敌人节点创建方法
     * @param enemyType 敌人类型
     * @returns 创建的敌人节点
     */
    private static createEnemyNode(enemyType: EnemyType): Node {
        this.initializeRegistry();

        const componentClass = this._enemyRegistry.get(enemyType);
        if (!componentClass) {
            console.error(`[EnemyPoolManager] ❌ 未注册的敌人类型: ${enemyType}`);
            return new Node(`Unknown_${enemyType}`);
        }

        try {
            // 创建敌人节点
            const enemyNode = new Node(`Enemy_${enemyType}_${Date.now()}`);

            // 添加敌人组件
            const enemyComponent = enemyNode.addComponent(componentClass as any);

            // 验证组件是否正确创建
            if (!enemyComponent) {
                console.error(`[EnemyPoolManager] ❌ 敌人组件创建失败: ${enemyType}`);
                enemyNode.destroy();
                return new Node(`Failed_${enemyType}`);
            }

            return enemyNode;

        } catch (error) {
            console.error(`[EnemyPoolManager] ❌ 创建敌人节点时发生错误: ${enemyType}`, error);
            return new Node(`Error_${enemyType}`);
        }
    }

    // === 初始化方法 ===

    /**
     * 初始化敌人对象池系统
     * 注册全局事件监听器，避免循环依赖
     */
    static initialize(): void {
        // 监听敌人回收事件
        director.on('enemy-recycle', this.recycleEnemy, this);

        this.initializeRegistry();
        const supportedTypes = Array.from(this._enemyRegistry.keys());
        console.log(`[EnemyPoolManager] 敌人对象池系统初始化完成，支持 ${supportedTypes.length} 种敌人类型`);
    }

    // === 对象池核心方法 ===

    /**
     * 获取指定类型的对象池
     * 如果对象池不存在则创建新的
     * @param type 敌人类型
     * @returns 对应的对象池
     */
    private static getPool(type: EnemyType): NodePool {
        let pool = this._pools.get(type);
        if (!pool) {
            // 获取对应的组件类
            const componentClass = this._enemyRegistry.get(type);
            if (!componentClass) {
                console.error(`[EnemyPoolManager] ❌ 未找到 ${type} 的组件类`);
                // 降级处理：创建空对象池
                pool = new NodePool();
            } else {
                // 创建新的对象池，传入组件类作为池处理器
                // 创建对象池
                try {
                    pool = new NodePool(componentClass);
                    // 对象池创建成功
                } catch (error) {
                    console.error(`[EnemyPoolManager] ❌ 创建对象池失败: ${type}`, error);
                    // 降级处理：创建空对象池
                    pool = new NodePool();
                }
            }
            this._pools.set(type, pool);
        }
        return pool;
    }

    /**
     * 从对象池获取敌人节点
     * 优先从对象池中获取已有节点，如果池为空则创建新节点
     * 这是获取敌人节点的主要入口方法
     *
     * @param type 敌人类型
     * @returns 从池中获取的节点，如果池为空则创建新节点
     * @example
     * ```typescript
     * const basicMouse = EnemyPoolManager.getEnemy(EnemyType.BASIC_MOUSE);
     * const boss = EnemyPoolManager.getEnemy(EnemyType.MOUSE_KING);
     * ```
     */
    static getEnemy(type: EnemyType): Node {
        const pool = this.getPool(type);
        let node = pool.get();

        if (!node) {
            // 对象池为空，创建新节点
            node = this.createEnemyNode(type);
        } else {
            // NodePool.get() 会自动调用组件的 reuse() 方法
            // 从池中获取节点
            // 节点状态已重置
        }

        return node;
    }

    /**
     * 回收敌人到对象池
     * 将不再使用的敌人节点回收到对应的对象池中，以便后续重用
     * 如果池已满则直接销毁节点，防止内存过度使用
     *
     * @param node 要回收的敌人节点
     * @param type 敌人类型，必须与节点实际类型匹配
     * @example
     * ```typescript
     * // 通常在敌人死亡或离开场景时调用
     * EnemyPoolManager.recycleEnemy(enemyNode, EnemyType.BASIC_MOUSE);
     * ```
     */
    static recycleEnemy(node: Node, type: EnemyType): void {
        if (!node || !node.isValid) {
            console.warn(`[EnemyPoolManager] ⚠️ 尝试回收无效的 ${type} 节点`);
            return;
        }

        const pool = this.getPool(type);

        // 检查池的大小限制
        if (pool.size() < this._maxPoolSize) {
            // NodePool.put() 会自动调用组件的 unuse() 方法
            pool.put(node);
            // 节点已回收到对象池
            // 节点状态已清理
        } else {
            // 池已满，直接销毁
            console.log(`[EnemyPoolManager] 🗑️ ${type} 池已满(${pool.size()}/${this._maxPoolSize})，销毁节点`);
            node.destroy();
        }
    }


}