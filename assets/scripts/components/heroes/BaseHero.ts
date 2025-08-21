import { _decorator, Component, Node, Vec3, tween, TweenSystem } from 'cc';
import { HeroType, UnitStats } from '../../types/GameTypes';
import { GameManager } from '../../managers/GameManager';
import { BattleManager } from '../../managers/BattleManager';

const { ccclass, property } = _decorator;

// 单位状态枚举
export enum UnitState {
    IDLE = 0,      // 待机
    MOVING = 1,    // 移动中
    ATTACKING = 2, // 攻击中
    DEAD = 3       // 死亡
}

/**
 * 英雄基类
 * 融合了BaseUnit的功能，提供所有英雄共同的属性和行为
 */
@ccclass('BaseHero')
export abstract class BaseHero extends Component {
    
    // === 基础单位属性 (来自BaseUnit) ===
    @property({ tooltip: "单位名称" })
    public unitName: string = "英雄单位";
    
    @property({ tooltip: "最大生命值" })
    public maxHealth: number = 100;
    
    @property({ tooltip: "攻击力" })
    public attackDamage: number = 20;
    
    @property({ tooltip: "攻击范围" })
    public attackRange: number = 150;
    
    @property({ tooltip: "攻击速度(次/秒)" })
    public attackSpeed: number = 1.0;
    
    @property({ tooltip: "移动速度(像素/秒)" })
    public moveSpeed: number = 100;
    
    // === 英雄特有属性 ===
    @property({ tooltip: "子弹速度" })
    public bulletSpeed: number = 300;
    
    @property({ tooltip: "技能冷却时间" })
    public skillCooldown: number = 5;
    
    @property({ tooltip: "英雄成本" })
    public cost: number = 50;
    
    // === 状态属性 ===
    public currentHealth: number = 100;
    public unitState: UnitState = UnitState.IDLE;
    public currentTarget: Node | null = null;
    
    // === 受保护属性，子类可访问 ===
    protected _gameManager: GameManager | null = null;
    protected _attackTimer: number = 0;
    protected _skillTimer: number = 0;
    protected _healthBarNode: Node | null = null;
    
    // === 抽象属性，子类必须实现 ===
    public abstract readonly heroType: HeroType;
    
    // === 生命周期方法 ===
    protected onLoad(): void {
        this.initializeHeroStats();
        this.initializeHeroVisuals();
    }
    
    protected start(): void {
        // 获取GameManager引用
        this._gameManager = GameManager.instance;
        
        // 注册到BattleManager
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.registerHero(this.node);
        }
    }
    
    protected update(dt: number): void {
        if (!this.isAlive) return;
        
        // 更新攻击计时器
        if (this._attackTimer > 0) {
            this._attackTimer -= dt;
        }
        
        // 更新技能计时器
        if (this._skillTimer > 0) {
            this._skillTimer -= dt;
        }
        
        // 根据状态执行对应行为
        switch (this.unitState) {
            case UnitState.IDLE:
                this.onIdleState(dt);
                break;
            case UnitState.MOVING:
                this.onMovingState(dt);
                break;
            case UnitState.ATTACKING:
                this.onAttackState(dt);
                break;
            case UnitState.DEAD:
                this.onDeadState(dt);
                break;
        }
    }
    
    // === 抽象方法，子类必须实现 ===
    protected abstract initializeHeroStats(): void;
    protected abstract initializeHeroVisuals(): void;
    
    // === 通用属性访问器 ===
    public get isAlive(): boolean {
        return this.currentHealth > 0 && this.unitState !== UnitState.DEAD;
    }
    
    public get canAttack(): boolean {
        return this._attackTimer <= 0 && this.isAlive;
    }
    
    public get canUseSkill(): boolean {
        return this._skillTimer <= 0 && this.isAlive;
    }
    
    public get stats(): UnitStats {
        return {
            name: this.unitName,
            health: this.currentHealth,
            maxHealth: this.maxHealth,
            attackDamage: this.attackDamage,
            attackRange: this.attackRange,
            attackSpeed: this.attackSpeed,
            moveSpeed: this.moveSpeed
        };
    }
    
    // === 战斗方法 ===
    
    /**
     * 受到伤害
     */
    public takeDamage(damage: number): void {
        if (!this.isAlive) return;
        
        this.currentHealth = Math.max(0, this.currentHealth - damage);
        this.onTakeDamage(damage);
        
        if (this.currentHealth <= 0) {
            this.die();
        }
    }
    
    /**
     * 死亡处理
     */
    public die(): void {
        if (this.unitState === UnitState.DEAD) return;
        
        this.unitState = UnitState.DEAD;
        this.currentTarget = null;
        this.onDie();
    }
    
    /**
     * 寻找最近的敌人
     */
    protected findNearestEnemy(): Node | null {
        const battleManager = BattleManager.instance;
        if (!battleManager) return null;
        
        const enemies = battleManager.registeredEnemies;
        if (enemies.length === 0) return null;
        
        let nearestEnemy: Node | null = null;
        let nearestDistance = Infinity;
        
        const heroPos = this.node.position;
        
        for (const enemy of enemies) {
            const distance = Vec3.distance(heroPos, enemy.position);
            if (distance < nearestDistance && distance <= this.attackRange) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        }
        
        return nearestEnemy;
    }
    
    /**
     * 检查目标是否在攻击范围内
     */
    protected isTargetInRange(target: Node): boolean {
        if (!target || !target.isValid) return false;
        
        const distance = Vec3.distance(this.node.position, target.position);
        return distance <= this.attackRange;
    }
    
    /**
     * 获取到目标的距离
     */
    public getDistanceToTarget(target: Node): number {
        if (!target || !target.isValid) return Infinity;
        
        return Vec3.distance(this.node.position, target.position);
    }
    
    /**
     * 攻击目标
     */
    protected attackTarget(target: Node): void {
        if (!this.canAttack || !target || !target.isValid) return;
        
        // 重置攻击计时器
        this._attackTimer = 1.0 / this.attackSpeed;
        
        // 调用子类的攻击实现
        this.performAttack(target);
    }
    
    // === 状态处理方法 (子类可重写) ===
    
    /**
     * 待机状态处理
     */
    protected onIdleState(dt: number): void {
        // 寻找敌人
        const target = this.findNearestEnemy();
        if (target) {
            this.currentTarget = target;
            this.unitState = UnitState.ATTACKING;
        }
    }
    
    /**
     * 移动状态处理
     */
    protected onMovingState(dt: number): void {
        // 英雄一般不主动移动，子类可重写
    }
    
    /**
     * 攻击状态处理
     */
    protected onAttackState(dt: number): void {
        if (!this.currentTarget || !this.currentTarget.isValid) {
            this.unitState = UnitState.IDLE;
            return;
        }
        
        // 检查目标是否仍在范围内
        if (!this.isTargetInRange(this.currentTarget)) {
            this.currentTarget = null;
            this.unitState = UnitState.IDLE;
            return;
        }
        
        // 攻击目标
        this.attackTarget(this.currentTarget);
    }
    
    /**
     * 死亡状态处理
     */
    protected onDeadState(dt: number): void {
        // 死亡状态，不执行任何操作
    }
    
    // === 事件回调方法 (子类可重写) ===
    
    /**
     * 受伤回调
     */
    protected onTakeDamage(damage: number): void {
        // 子类可重写实现特定的受伤反馈
    }
    
    /**
     * 死亡回调
     */
    protected onDie(): void {
        // 从BattleManager注销
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.unregisterHero(this.node);
        }
        
        // 子类可重写实现特定的死亡行为
        this.createDeathEffect();
    }
    
    // === 抽象方法，子类必须实现具体行为 ===
    
    /**
     * 执行攻击 - 子类必须实现
     */
    protected abstract performAttack(target: Node): void;
    
    /**
     * 使用技能 - 子类可选实现
     */
    protected useSkill(): void {
        if (!this.canUseSkill) return;
        
        this._skillTimer = this.skillCooldown;
        this.onUseSkill();
    }
    
    /**
     * 技能使用回调 - 子类可重写
     */
    protected onUseSkill(): void {
        // 子类实现具体技能逻辑
    }
    
    /**
     * 创建死亡特效 - 子类可重写
     */
    protected createDeathEffect(): void {
        // 子类实现具体死亡特效
    }
    
    // === 工具方法 ===
    
    /**
     * 面向目标
     */
    protected faceTarget(target: Node): void {
        if (!target) return;
        
        const direction = Vec3.subtract(new Vec3(), target.position, this.node.position);
        if (direction.x > 0) {
            this.node.setScale(1, 1, 1); // 面向右
        } else {
            this.node.setScale(-1, 1, 1); // 面向左
        }
    }
    
    /**
     * 创建缓动动画
     */
    protected createTween(duration: number): any {
        return tween(this.node).tag(1001);
    }
    
    /**
     * 停止所有缓动
     */
    protected stopAllTweens(): void {
        TweenSystem.instance.ActionManager.removeAllActionsFromTarget(this.node);
    }
}