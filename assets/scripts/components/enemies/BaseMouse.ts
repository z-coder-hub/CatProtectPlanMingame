import { _decorator, Component, Node, Vec3, tween, TweenSystem, Label, Color } from 'cc';
import { EnemyType, EnemyState, EnemyUnitStats } from '../../types/GameTypes';
import { GameManager } from '../../managers/GameManager';
import { BattleManager } from '../../managers/BattleManager';
import { DrawingHelper } from '../../utils/DrawingHelper';

const { ccclass, property } = _decorator;


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
    
    
    @property({ tooltip: "移动速度(像素/秒)" })
    public moveSpeed: number = 60;
    
    @property({ tooltip: "金币奖励" })
    public goldReward: number = 3;
    
    // === 状态属性 ===
    public currentHealth: number = 40;
    public enemyState: EnemyState = EnemyState.IDLE;
    public currentTarget: Node | null = null;
    
    // === 受保护属性，子类可以访问 ===
    protected _gameManager: GameManager | null = null;
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
            battleManager.RegisterEnemy(this.node);
        }
    }
    
    protected update(dt: number): void {
        if (!this.isAlive) return;
        
        
        // 根据状态执行对应行为
        switch (this.enemyState) {
            case EnemyState.IDLE:
                this.onIdleState(dt);
                break;
            case EnemyState.MOVING:
                this.onMovingState(dt);
                break;
            case EnemyState.ATTACKING:
                // 老鼠不再攻击，自动转为移动状态
                this.enemyState = EnemyState.MOVING;
                break;
            case EnemyState.DEAD:
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
        return this.currentHealth > 0 && this.enemyState !== EnemyState.DEAD;
    }
    
    
    public get stats(): EnemyUnitStats {
        return {
            name: this.unitName,
            health: this.currentHealth,
            maxHealth: this.maxHealth,
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
        if (this.enemyState === EnemyState.DEAD) return;
        
        this.enemyState = EnemyState.DEAD;
        this.currentTarget = null;
        this.onDie();
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
            this.reachCastle();
            return;
        }
        
        // 简单的向下移动
        const moveDistance = this.moveSpeed * dt;
        const newPos = Vec3.add(new Vec3(), currentPos, new Vec3(0, -moveDistance, 0));
        this.node.setPosition(newPos);
    }
    
    /**
     * 通用的到达城堡方法
     */
    protected reachCastle(): void {
        if (!this._gameManager) return;
        
        const castleDamage = Math.floor(this.maxHealth / 10);
        this._gameManager.CastleTakeDamage(castleDamage);
        
        this.createCastleReachEffect();
        this._gameManager.RemoveActiveEnemy(this.node);
        this.die();
        
        console.log(`${this.unitName}到达城堡，造成 ${castleDamage} 点伤害`);
    }
    
    protected createCastleReachEffect(): void {
    }
    
    /**
     * 重写死亡方法，添加通用的金币奖励逻辑
     */
    protected onDie(): void {
        console.log(`${this.unitName}死亡，奖励 ${this.goldReward} 金币`);
        
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.UnregisterEnemy(this.node);
        }
        
        if (this._gameManager) {
            this._gameManager.AddGold(this.goldReward);
            this._gameManager.RemoveActiveEnemy(this.node);
        }
        
        this.createDeathEffect();
        this.node.destroy();
    }
    
    protected createDeathEffect(): void {
    }
    
    // === 状态处理方法 (子类可重写) ===
    
    protected onIdleState(dt: number): void {
        this.moveTowardsCastle(dt);
    }
    
    /**
     * 移动状态处理
     */
    protected onMovingState(dt: number): void {
        this.moveTowardsCastle(dt);
    }
    
    protected onAttackState(dt: number): void {
        this.currentTarget = null;
        this.enemyState = EnemyState.IDLE;
        this.moveTowardsCastle(dt);
    }
    
    protected onDeadState(_dt: number): void {
    }
    
    // === 动作辅助方法 ===
    
    
    protected onTakeDamage(damage: number): void {
        console.log(`${this.unitName}受到 ${damage} 点伤害，剩余血量: ${this.currentHealth}`);
    }
    
    // === 抽象方法，子类必须实现 ===
    
    
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
    
    protected createMouseNameLabel(): void {
        const labelConfig = this.getMouseLabelConfig();
        
        this._nameLabel = DrawingHelper.createLabel(this.node, {
            text: labelConfig.text,
            fontSize: labelConfig.fontSize,
            color: labelConfig.color,
            position: { x: 0, y: labelConfig.yOffset, z: 0 },
            size: labelConfig.size
        });
    }
    
    protected getMouseLabelConfig(): {
        text: string;
        fontSize: number;
        color: Color;
        yOffset: number;
        size: { width: number; height: number };
    } {
        return {
            text: "老鼠",
            fontSize: 22,
            color: new Color(255, 255, 255),
            yOffset: 35,
            size: { width: 60, height: 28 }
        };
    }
    
}