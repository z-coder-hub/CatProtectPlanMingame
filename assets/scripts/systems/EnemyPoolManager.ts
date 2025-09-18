import { _decorator, Node, NodePool, director } from 'cc';
import { EnemyType } from '../types/GameConstants';
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

    // === 敌人组件类映射 ===
    /** 敌人组件类映射表，用于NodePool创建时的池处理器 */
    private static readonly _componentClasses = new Map<EnemyType, any>([
        // 基础单位
        [EnemyType.BASIC_MOUSE, BasicMouse],
        [EnemyType.GIANT_MOUSE, GiantMouse],

        // 快速单位
        [EnemyType.FAST_MOUSE, FastMouse],
        [EnemyType.SPEED_MOUSE, SpeedMouse],

        // 装甲单位
        [EnemyType.ARMORED_MOUSE, ArmoredMouse],
        [EnemyType.TANK_MOUSE, TankMouse],

        // 特殊单位
        [EnemyType.STEALTH_MOUSE, StealthMouse],

        // 基础BOSS单位
        [EnemyType.MOUSE_KING, MouseKing],
        [EnemyType.MECH_MOUSE, MechMouse],

        // 新BOSS单位
        [EnemyType.ARMOR_OVERLORD, ArmorOverlord],
        [EnemyType.SHADOW_ASSASSIN, ShadowAssassin],
        [EnemyType.STORM_TYRANT, StormTyrant],
        [EnemyType.GIANT_BEHEMOTH, GiantBehemoth],
        [EnemyType.THUNDER_MASTER, ThunderMaster],
        [EnemyType.MECH_COMMANDER, MechCommander],
        [EnemyType.ULTIMATE_OVERLORD, UltimateOverlord]
    ]);

    // === 敌人工厂方法映射 ===
    /** 敌人节点创建工厂方法映射表，每种敌人类型对应一个创建函数 */
    private static readonly _factoryMethods: Map<EnemyType, () => Node> = new Map([
        // 基础单位
        [EnemyType.BASIC_MOUSE, () => EnemyPoolManager.createBasicMouseNode()],
        [EnemyType.GIANT_MOUSE, () => EnemyPoolManager.createGiantMouseNode()],

        // 快速单位
        [EnemyType.FAST_MOUSE, () => EnemyPoolManager.createFastMouseNode()],
        [EnemyType.SPEED_MOUSE, () => EnemyPoolManager.createSpeedMouseNode()],

        // 装甲单位
        [EnemyType.ARMORED_MOUSE, () => EnemyPoolManager.createArmoredMouseNode()],
        [EnemyType.TANK_MOUSE, () => EnemyPoolManager.createTankMouseNode()],

        // 特殊单位
        [EnemyType.STEALTH_MOUSE, () => EnemyPoolManager.createStealthMouseNode()],

        // BOSS单位
        [EnemyType.MOUSE_KING, () => EnemyPoolManager.createMouseKingNode()],
        [EnemyType.MECH_MOUSE, () => EnemyPoolManager.createMechMouseNode()],

        // 新BOSS单位
        [EnemyType.ARMOR_OVERLORD, () => EnemyPoolManager.createArmorOverlordNode()],
        [EnemyType.SHADOW_ASSASSIN, () => EnemyPoolManager.createShadowAssassinNode()],
        [EnemyType.STORM_TYRANT, () => EnemyPoolManager.createStormTyrantNode()],
        [EnemyType.GIANT_BEHEMOTH, () => EnemyPoolManager.createGiantBehemothNode()],
        [EnemyType.THUNDER_MASTER, () => EnemyPoolManager.createThunderMasterNode()],
        [EnemyType.MECH_COMMANDER, () => EnemyPoolManager.createMechCommanderNode()],
        [EnemyType.ULTIMATE_OVERLORD, () => EnemyPoolManager.createUltimateOverlordNode()]
    ]);

    // === 初始化方法 ===

    /**
     * 初始化敌人对象池系统
     * 注册全局事件监听器，避免循环依赖
     */
    static initialize(): void {
        console.log("[EnemyPoolManager] 🚀 开始初始化敌人对象池系统...");

        // 监听敌人回收事件
        director.on('enemy-recycle', this.recycleEnemy, this);
        console.log("[EnemyPoolManager] 📡 已注册敌人回收事件监听器");

        console.log(`[EnemyPoolManager] ⚙️ 对象池配置: 最大大小=${this._maxPoolSize}`);
        console.log("[EnemyPoolManager] 🎉 敌人对象池系统初始化完成");
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
            const componentClass = this._componentClasses.get(type);
            if (!componentClass) {
                console.error(`[EnemyPoolManager] ❌ 未找到 ${type} 的组件类`);
                // 降级处理：创建空对象池
                pool = new NodePool();
            } else {
                // 创建新的对象池，传入组件类作为池处理器
                console.log(`[EnemyPoolManager] 🆕 创建 ${type} 对象池，使用组件类: ${componentClass.name}`);
                try {
                    pool = new NodePool(componentClass);
                    console.log(`[EnemyPoolManager] ✅ 成功创建 ${type} 对象池，支持自动调用 reuse/unuse`);
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
            const factory = this._factoryMethods.get(type);
            if (factory) {
                node = factory();
                console.log(`[EnemyPoolManager] 🆕 创建新的 ${type} 节点，池大小: ${pool.size()}`);
            } else {
                console.error(`[EnemyPoolManager] ❌ 未找到 ${type} 的工厂方法`);
                return new Node(`Unknown_${type}`);
            }
        } else {
            // NodePool.get() 会自动调用组件的 reuse() 方法
            console.log(`[EnemyPoolManager] ♻️ 从池中获取 ${type} 节点，剩余: ${pool.size()}`);
            console.log(`[EnemyPoolManager] 🔄 节点已通过reuse()方法重置状态`);
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
            console.log(`[EnemyPoolManager] ♻️ ${type} 回收到池，当前池大小: ${pool.size()}`);
            console.log(`[EnemyPoolManager] 📦 节点已通过unuse()方法清理状态`);
        } else {
            // 池已满，直接销毁
            console.log(`[EnemyPoolManager] 🗑️ ${type} 池已满(${pool.size()}/${this._maxPoolSize})，销毁节点`);
            node.destroy();
        }
    }

    // === 敌人节点创建工厂方法 ===

    // 基础单位
    private static createBasicMouseNode(): Node {
        const node = new Node(EnemyType.BASIC_MOUSE);
        node.addComponent(BasicMouse);
        return node;
    }

    private static createGiantMouseNode(): Node {
        const node = new Node(EnemyType.GIANT_MOUSE);
        node.addComponent(GiantMouse);
        return node;
    }

    // 快速单位
    private static createFastMouseNode(): Node {
        const node = new Node(EnemyType.FAST_MOUSE);
        node.addComponent(FastMouse);
        return node;
    }

    private static createSpeedMouseNode(): Node {
        const node = new Node(EnemyType.SPEED_MOUSE);
        node.addComponent(SpeedMouse);
        return node;
    }

    // 装甲单位
    private static createArmoredMouseNode(): Node {
        const node = new Node(EnemyType.ARMORED_MOUSE);
        node.addComponent(ArmoredMouse);
        return node;
    }

    private static createTankMouseNode(): Node {
        const node = new Node(EnemyType.TANK_MOUSE);
        node.addComponent(TankMouse);
        return node;
    }

    // 特殊单位
    private static createStealthMouseNode(): Node {
        const node = new Node(EnemyType.STEALTH_MOUSE);
        node.addComponent(StealthMouse);
        return node;
    }

    // BOSS单位
    private static createMouseKingNode(): Node {
        const node = new Node(EnemyType.MOUSE_KING);
        node.addComponent(MouseKing);
        return node;
    }

    private static createMechMouseNode(): Node {
        const node = new Node(EnemyType.MECH_MOUSE);
        node.addComponent(MechMouse);
        return node;
    }

    // 新BOSS单位
    private static createArmorOverlordNode(): Node {
        const node = new Node(EnemyType.ARMOR_OVERLORD);
        node.addComponent(ArmorOverlord);
        return node;
    }

    private static createShadowAssassinNode(): Node {
        const node = new Node(EnemyType.SHADOW_ASSASSIN);
        node.addComponent(ShadowAssassin);
        return node;
    }

    private static createStormTyrantNode(): Node {
        const node = new Node(EnemyType.STORM_TYRANT);
        node.addComponent(StormTyrant);
        return node;
    }

    private static createGiantBehemothNode(): Node {
        const node = new Node(EnemyType.GIANT_BEHEMOTH);
        node.addComponent(GiantBehemoth);
        return node;
    }

    private static createThunderMasterNode(): Node {
        const node = new Node(EnemyType.THUNDER_MASTER);
        node.addComponent(ThunderMaster);
        return node;
    }

    private static createMechCommanderNode(): Node {
        const node = new Node(EnemyType.MECH_COMMANDER);
        node.addComponent(MechCommander);
        return node;
    }

    private static createUltimateOverlordNode(): Node {
        const node = new Node(EnemyType.ULTIMATE_OVERLORD);
        node.addComponent(UltimateOverlord);
        return node;
    }

}