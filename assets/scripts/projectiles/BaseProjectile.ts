import { _decorator, Component, Node, Vec3, Graphics, Color, tween, Tween } from 'cc';
import { BaseHero } from '../components/heroes/BaseHero';
import { BaseMouse } from '../components/enemies/BaseMouse';
import { GameManager } from '../managers/GameManager';

const { ccclass, property } = _decorator;

/**
 * 投射物抽象基类
 * 定义所有投射物的通用行为和接口
 * 子类需要实现具体的视觉效果、击中逻辑和伤害处理
 */
@ccclass('BaseProjectile')
export abstract class BaseProjectile extends Component {
    
    // === 通用属性 ===
    @property({ tooltip: "伤害值" })
    protected damage: number = 10;
    
    @property({ tooltip: "移动速度" })
    protected speed: number = 300;
    
    @property({ tooltip: "碰撞检测半径" })
    protected hitRadius: number = 25;
    
    @property({ tooltip: "最大飞行距离" })
    protected maxRange: number = 2000;
    
    // === 运行时属性 ===
    protected owner: BaseHero | null = null;
    protected startPosition: Vec3 = new Vec3();
    protected targetPosition: Vec3 = new Vec3();
    protected direction: Vec3 = new Vec3();
    protected isActive: boolean = false;
    protected traveledDistance: number = 0;
    
    // === 组件引用 ===
    protected graphics: Graphics | null = null;
    
    // === 游戏边界 ===
    protected readonly gameBounds = {
        minX: -600,
        maxX: 600,
        minY: -400,
        maxY: 400
    };
    
    // === 抽象方法，子类必须实现 ===
    
    /**
     * 初始化投射物的视觉外观
     * 每种投射物有不同的颜色、形状和大小
     */
    protected abstract initializeVisuals(): void;
    
    /**
     * 处理击中目标的逻辑
     * 不同投射物有不同的伤害类型和特殊效果
     * @param target 击中的目标敌人
     */
    protected abstract onHitTarget(target: BaseMouse): void;
    
    /**
     * 创建击中特效
     * 每种投射物有不同的击中视觉效果
     * @param position 击中位置
     */
    protected abstract createHitEffect(position: Vec3): void;
    
    /**
     * 检查是否可以击中指定目标
     * 某些投射物可能有特殊的击中条件（如穿透、范围等）
     * @param target 目标敌人
     * @returns 是否可以击中该目标
     */
    protected abstract canHitTarget(target: BaseMouse): boolean;
    
    // === 通用方法，基类实现 ===
    
    protected onLoad(): void {
        // 获取或创建Graphics组件
        this.graphics = this.node.getComponent(Graphics) || this.node.addComponent(Graphics);
        
        // 初始化视觉外观
        this.initializeVisuals();
    }
    
    /**
     * 发射投射物
     * @param owner 发射者英雄
     * @param targetPos 目标位置
     * @param damage 伤害值
     * @param speed 移动速度
     */
    public Launch(owner: BaseHero, targetPos: Vec3, damage: number, speed: number): void {
        if (!owner || !targetPos) {
            console.error("[BaseProjectile] Launch参数无效");
            return;
        }
        
        this.owner = owner;
        this.damage = damage;
        this.speed = speed;
        this.startPosition = Vec3.clone(owner.node.position);
        this.targetPosition = Vec3.clone(targetPos);
        
        // 计算方向向量
        this.direction = Vec3.subtract(new Vec3(), this.targetPosition, this.startPosition);
        this.direction.normalize();
        
        // 设置初始位置
        this.node.setPosition(this.startPosition);
        
        // 开始飞行
        this.isActive = true;
        this.traveledDistance = 0;
        
        this.startFlight();
        this.startCollisionDetection();
    }
    
    /**
     * 开始飞行动画
     */
    protected startFlight(): void {
        // 计算最大飞行距离
        const maxTravelDistance = this.calculateMaxTravelDistance();
        
        // 计算最终位置
        const finalPosition = Vec3.add(
            new Vec3(),
            this.startPosition,
            Vec3.multiplyScalar(new Vec3(), this.direction, maxTravelDistance)
        );
        
        // 计算飞行时间
        const travelTime = maxTravelDistance / this.speed;
        
        // 开始飞行动画
        tween(this.node)
            .to(travelTime, { position: finalPosition })
            .call(() => {
                // 飞出边界或到达最大距离，销毁投射物
                this.destroyProjectile();
            })
            .start();
    }
    
    /**
     * 开始碰撞检测
     */
    protected startCollisionDetection(): void {
        const collisionCheckInterval = 0.02; // 50fps检测频率
        
        const collisionCheckFunction = () => {
            if (!this.node || !this.node.isValid || !this.isActive) {
                this.unschedule(collisionCheckFunction);
                return;
            }
            
            this.checkCollisions();
        };
        
        // 启动碰撞检测调度
        this.schedule(collisionCheckFunction, collisionCheckInterval);
        
        // 将调度函数与投射物关联，便于后续清理
        (this.node as any)._collisionCheckFunction = collisionCheckFunction;
    }
    
    /**
     * 检测碰撞
     */
    protected checkCollisions(): void {
        if (!this.isActive) return;
        
        const gameManager = GameManager.instance;
        if (!gameManager || !gameManager.activeEnemies) return;
        
        for (const enemy of gameManager.activeEnemies) {
            if (!enemy || !enemy.isValid) continue;
            
            const enemyComponent = enemy.getComponent(BaseMouse);
            if (!enemyComponent || !enemyComponent.isAlive) continue;
            
            // 检查是否可以击中该目标
            if (!this.canHitTarget(enemyComponent)) continue;
            
            // 计算距离
            const distance = Vec3.distance(this.node.position, enemy.position);
            
            if (distance <= this.hitRadius) {
                // 击中目标
                this.onProjectileHitTarget(enemy);
                return;
            }
        }
    }
    
    /**
     * 投射物击中目标的统一处理
     * @param targetNode 目标节点
     */
    protected onProjectileHitTarget(targetNode: Node): void {
        if (!targetNode || !this.isActive) return;
        
        const targetUnit = targetNode.getComponent(BaseMouse);
        if (!targetUnit) {
            console.error("[BaseProjectile] 击中目标缺少BaseMouse组件");
            return;
        }
        
        // 停止飞行动画
        Tween.stopAllByTarget(this.node);
        
        // 停止碰撞检测
        const collisionCheckFunction = (this.node as any)._collisionCheckFunction;
        if (collisionCheckFunction) {
            this.unschedule(collisionCheckFunction);
        }
        
        // 创建击中特效
        this.createHitEffect(this.node.position);
        
        // 调用子类的击中逻辑
        this.onHitTarget(targetUnit);
        
        // 销毁投射物
        this.destroyProjectile();
    }
    
    /**
     * 计算最大飞行距离（直到飞出边界）
     */
    protected calculateMaxTravelDistance(): number {
        const startPos = this.startPosition;
        const direction = this.direction;
        const bounds = this.gameBounds;
        
        let maxDistance = this.maxRange;
        
        // 计算与各个边界的交点，取最近的
        if (direction.x > 0) {
            const distToRightBound = (bounds.maxX - startPos.x) / direction.x;
            maxDistance = Math.min(maxDistance, distToRightBound);
        } else if (direction.x < 0) {
            const distToLeftBound = (bounds.minX - startPos.x) / direction.x;
            maxDistance = Math.min(maxDistance, distToLeftBound);
        }
        
        if (direction.y > 0) {
            const distToTopBound = (bounds.maxY - startPos.y) / direction.y;
            maxDistance = Math.min(maxDistance, distToTopBound);
        } else if (direction.y < 0) {
            const distToBottomBound = (bounds.minY - startPos.y) / direction.y;
            maxDistance = Math.min(maxDistance, distToBottomBound);
        }
        
        return Math.max(maxDistance, 100); // 确保至少飞行100像素
    }
    
    /**
     * 销毁投射物
     */
    protected destroyProjectile(): void {
        if (!this.isActive) return;
        
        this.isActive = false;
        
        // 停止所有动画
        Tween.stopAllByTarget(this.node);
        
        // 取消碰撞检测调度
        const collisionCheckFunction = (this.node as any)._collisionCheckFunction;
        if (collisionCheckFunction) {
            this.unschedule(collisionCheckFunction);
            delete (this.node as any)._collisionCheckFunction;
        }
        
        // 通知ProjectileSystem回收或销毁
        this.scheduleOnce(() => {
            if (this.node && this.node.isValid) {
                this.node.destroy();
            }
        }, 0);
    }
    
    /**
     * 获取基础伤害值
     */
    public get baseDamage(): number {
        return this.damage;
    }
    
    /**
     * 检查投射物是否仍然活跃
     */
    public get isAlive(): boolean {
        return this.isActive && this.node && this.node.isValid;
    }
    
    /**
     * 获取投射物所有者
     */
    public get projectileOwner(): BaseHero | null {
        return this.owner;
    }
    
    protected onDestroy(): void {
        this.isActive = false;
        
        // 清理所有调度
        this.unscheduleAllCallbacks();
        
        // 停止所有动画
        if (this.node && this.node.isValid) {
            Tween.stopAllByTarget(this.node);
        }
    }
}