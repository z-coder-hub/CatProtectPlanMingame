import { _decorator, Component, Node, Vec3, tween, TweenSystem, Label, Color } from 'cc';
import { EnemyType, UnitStats } from '../../types/GameTypes';
import { GameManager } from '../../managers/GameManager';
import { BattleManager } from '../../managers/BattleManager';
import { DrawingHelper } from '../../utils/DrawingHelper';

const { ccclass, property } = _decorator;

// 单位状态枚举
export enum UnitState {
    IDLE = 0,      // 待机
    MOVING = 1,    // 移动中
    ATTACKING = 2, // 攻击中
    DEAD = 3       // 死亡
}

/**
 * 老鼠敌人基类
 * 融合了BaseUnit的功能，包含所有老鼠共同的属性和行为
 */
@ccclass('BaseMouse')
export abstract class BaseMouse extends Component {
    
    // === 基础单位属性 (来自BaseUnit) ===
    @property({ tooltip: "单位名称" })
    public unitName: string = "老鼠单位";
    
    @property({ tooltip: "最大生命值" })
    public maxHealth: number = 40;
    
    @property({ tooltip: "攻击力" })
    public attackDamage: number = 8;
    
    @property({ tooltip: "攻击范围" })
    public attackRange: number = 50;
    
    @property({ tooltip: "攻击速度(次/秒)" })
    public attackSpeed: number = 1.0;
    
    @property({ tooltip: "移动速度(像素/秒)" })
    public moveSpeed: number = 60;
    
    @property({ tooltip: "金币奖励" })
    public goldReward: number = 3;
    
    // === 状态属性 ===
    public currentHealth: number = 40;
    public unitState: UnitState = UnitState.IDLE;
    public currentTarget: Node | null = null;
    
    // === 受保护属性，子类可以访问 ===
    protected _gameManager: GameManager | null = null;
    protected _attackTimer: number = 0;
    protected _healthBarNode: Node | null = null;
    protected _nameLabel: Label | null = null;
    
    // 抽象属性，子类必须实现
    public abstract readonly enemyType: EnemyType;
    
    protected onLoad(): void {
        this.initializeMouseStats();
        this.initializeMouseVisuals();
        this.createMouseNameLabel();
    }
    
    protected start(): void {
        // 获取GameManager引用
        this._gameManager = GameManager.instance;
        
        // 注册到BattleManager
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.registerEnemy(this.node);
        }
    }
    
    protected update(dt: number): void {
        if (!this.isAlive) return;
        
        // 更新攻击计时器
        if (this._attackTimer > 0) {
            this._attackTimer -= dt;
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
    
    // 抽象方法，子类必须实现具体的老鼠属性初始化
    protected abstract initializeMouseStats(): void;
    
    // 抽象方法，子类必须实现具体的老鼠外观
    protected abstract initializeMouseVisuals(): void;
    
    // === 通用属性访问器 ===
    public get isAlive(): boolean {
        return this.currentHealth > 0 && this.unitState !== UnitState.DEAD;
    }
    
    public get canAttack(): boolean {
        return this._attackTimer <= 0 && this.isAlive;
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
     * 寻找最近的英雄目标
     */
    protected findNearestHero(): Node | null {
        const battleManager = BattleManager.instance;
        if (!battleManager) return null;
        
        const heroes = battleManager.registeredHeroes;
        if (heroes.length === 0) return null;
        
        let nearestHero: Node | null = null;
        let nearestDistance = Infinity;
        
        const mousePos = this.node.position;
        
        for (const hero of heroes) {
            const distance = Vec3.distance(mousePos, hero.position);
            if (distance < nearestDistance && distance <= this.attackRange) {
                nearestDistance = distance;
                nearestHero = hero;
            }
        }
        
        return nearestHero;
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
     * 攻击目标
     */
    protected attackTarget(target: Node): void {
        if (!this.canAttack || !target || !target.isValid) return;
        
        // 重置攻击计时器
        this._attackTimer = 1.0 / this.attackSpeed;
        
        // 调用子类的攻击实现
        this.performAttack(target);
    }
    
    /**
     * 通用的城堡位置获取方法
     * @returns 城堡位置，如果城堡不存在则返回null
     */
    protected getCastlePosition(): Vec3 | null {
        if (!this._gameManager || !this._gameManager.castleNode) {
            return null;
        }
        return this._gameManager.castleNode.position;
    }
    
    /**
     * 检查是否到达城堡
     * @param currentPos 当前位置
     * @param threshold 阈值，默认50
     * @returns 是否到达城堡
     */
    protected isReachedCastle(currentPos: Vec3, threshold: number = 50): boolean {
        const castlePos = this.getCastlePosition();
        if (!castlePos) return false;
        
        return currentPos.y <= castlePos.y + threshold;
    }
    
    /**
     * 通用的朝城堡移动方法
     * 子类可以重写此方法实现特定的移动行为
     * @param dt 时间增量
     */
    protected moveTowardsCastle(dt: number): void {
        if (!this._gameManager || !this._gameManager.castleNode) return;
        
        const currentPos = this.node.position;
        
        // 检查是否到达城堡
        if (this.isReachedCastle(currentPos)) {
            this.attackCastle();
            return;
        }
        
        // 简单的向下移动
        const moveDistance = this.moveSpeed * dt;
        const newPos = Vec3.add(new Vec3(), currentPos, new Vec3(0, -moveDistance, 0));
        this.node.setPosition(newPos);
    }
    
    /**
     * 通用的攻击城堡方法
     */
    protected attackCastle(): void {
        if (!this._gameManager) return;
        
        // 对城堡造成伤害
        this._gameManager.castleTakeDamage(this.attackDamage);
        
        // 创建攻击特效
        this.createCastleAttackEffect();
        
        // 移除自己
        this._gameManager.removeActiveEnemy(this.node);
        this.die();
        
        console.log(`${this.unitName}攻击城堡，造成 ${this.attackDamage} 点伤害`);
    }
    
    /**
     * 创建城堡攻击特效的通用方法
     * 子类可以重写实现不同的特效
     */
    protected createCastleAttackEffect(): void {
        // 基础攻击特效实现
        // 子类可以重写此方法实现特定的特效
    }
    
    /**
     * 重写死亡方法，添加通用的金币奖励逻辑
     */
    protected onDie(): void {
        console.log(`${this.unitName}死亡，奖励 ${this.goldReward} 金币`);
        
        // 从BattleManager注销
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.unregisterEnemy(this.node);
        }
        
        // 给予金币奖励
        if (this._gameManager) {
            this._gameManager.addGold(this.goldReward);
            this._gameManager.removeActiveEnemy(this.node);
        }
        
        // 创建死亡特效
        this.createDeathEffect();
        
        // 销毁节点，清理尸体
        this.node.destroy();
    }
    
    /**
     * 创建死亡特效的通用方法
     * 子类可以重写实现不同的特效
     */
    protected createDeathEffect(): void {
        // 基础死亡特效实现
        // 子类可以重写此方法实现特定的特效
    }
    
    // === 状态处理方法 (子类可重写) ===
    
    /**
     * 待机状态处理 - 老鼠默认朝城堡移动
     */
    protected onIdleState(dt: number): void {
        // 在塔防游戏中，敌人不攻击英雄，只移动向城堡
        this.moveTowardsCastle(dt);
    }
    
    /**
     * 移动状态处理
     */
    protected onMovingState(dt: number): void {
        this.moveTowardsCastle(dt);
    }
    
    /**
     * 攻击状态处理
     */
    protected onAttackState(dt: number): void {
        // 在塔防游戏中，敌人不攻击英雄，立即回到移动状态
        this.currentTarget = null;
        this.unitState = UnitState.IDLE;
        this.moveTowardsCastle(dt);
    }
    
    /**
     * 死亡状态处理
     */
    protected onDeadState(_dt: number): void {
        // 死亡状态，不执行任何操作
    }
    
    // === 动作辅助方法 ===
    
    
    /**
     * 受伤回调
     */
    protected onTakeDamage(damage: number): void {
        console.log(`${this.unitName}受到 ${damage} 点伤害，剩余血量: ${this.currentHealth}`);
        // 子类可重写实现特定的受伤反馈
    }
    
    // === 抽象方法，子类必须实现 ===
    
    /**
     * 执行攻击 - 子类必须实现
     */
    protected abstract performAttack(target: Node): void;
    
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
    protected createTween(_duration: number): any {
        return tween(this.node).tag(1001);
    }
    
    /**
     * 停止所有缓动
     */
    protected stopAllTweens(): void {
        TweenSystem.instance.ActionManager.removeAllActionsFromTarget(this.node);
    }
    
    /**
     * 创建老鼠名称标签 - 统一的标签创建方法
     * 标签位置在老鼠上方，根据老鼠类型显示不同的名称和颜色
     */
    protected createMouseNameLabel(): void {
        // 根据敌人类型获取标签配置
        const labelConfig = this.getMouseLabelConfig();
        
        this._nameLabel = DrawingHelper.createLabel(this.node, {
            text: labelConfig.text,
            fontSize: labelConfig.fontSize,
            color: labelConfig.color,
            position: { x: 0, y: labelConfig.yOffset, z: 0 }, // 统一在上方
            size: labelConfig.size
        });
    }
    
    /**
     * 获取老鼠标签配置 - 子类可以重写以自定义标签
     * 统一使用大字体，提供基础配置
     */
    protected getMouseLabelConfig(): {
        text: string;
        fontSize: number;
        color: Color;
        yOffset: number;
        size: { width: number; height: number };
    } {
        // 统一的大字体配置，子类可以重写
        return {
            text: "老鼠",
            fontSize: 22,           // 统一大字体
            color: new Color(255, 255, 255),
            yOffset: 35,            // 统一上方位置
            size: { width: 60, height: 28 }  // 统一大尺寸
        };
    }
}