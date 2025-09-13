import { _decorator, Component, Node, Vec3, tween, TweenSystem, Label, Color, Graphics } from 'cc';
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
    protected _healthBarContainer: Node | null = null;
    protected _healthBarForeground: Graphics | null = null;
    protected _nameLabel: Label | null = null;
    protected _graphics: Graphics | null = null;
    
    // === Tween移动系统属性 ===
    protected _movementTween: any = null;
    protected _isMoving: boolean = false;
    protected _movementStarted: boolean = false;
    
    // 抽象属性，子类必须实现
    public abstract readonly enemyType: EnemyType;
    
    protected onLoad(): void {
        this.initializeMouseStats();
        this.initializeMouseVisuals();
        this.createMouseNameLabel();
        this.createMouseHealthBar();
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
    
    protected update(_dt: number): void {
        if (!this.isAlive) return;
        
        // 启动移动（只执行一次）
        if (!this._movementStarted) {
            this.startMovementTowardsCastle();
            this._movementStarted = true;
        }
    }
    
    // 抽象方法，子类必须实现具体的老鼠属性初始化
    protected abstract initializeMouseStats(): void;
    
    // 抽象方法，子类必须实现具体的老鼠外观
    protected abstract initializeMouseVisuals(): void;
    
    // 抽象方法，子类必须实现老鼠标签配置
    protected abstract getMouseLabelConfig(): {
        text: string;
        fontSize: number;
        color: Color;
        yOffset: number;
        size: { width: number; height: number };
    };

    // 抽象方法，子类必须实现血条配置
    protected abstract getHealthBarConfig(): {
        width: number;
        height: number;
        yOffset: number;
        backgroundColor?: Color;
        foregroundColor?: Color;
        borderColor?: Color;
        borderWidth?: number;
    };
    
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

        // 统一更新血条显示
        this.updateMouseHealthBarDisplay();

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
     * 启动基于Tween的移动系统
     * 子类可以重写此方法实现特定的移动路径
     */
    protected startMovementTowardsCastle(): void {
        if (!this._gameManager || !this._gameManager.castleNode || this._isMoving) return;
        
        const currentPos = this.node.position;
        const castlePos = this._gameManager.castleNode.position;
        
        // 检查是否已经在城堡位置
        if (this.isReachedCastle(currentPos)) {
            this.reachCastle();
            return;
        }
        
        // 计算移动时间
        const distance = Math.abs(currentPos.y - castlePos.y - 50); // 50是城堡缓冲区
        const moveDuration = distance / this.moveSpeed;
        
        // 创建基础直线移动
        this.createMovementTween(currentPos, new Vec3(currentPos.x, castlePos.y + 50, 0), moveDuration);
    }
    
    /**
     * 创建移动缓动动画
     * 子类可以重写此方法实现复杂的移动路径
     */
    protected createMovementTween(startPos: Vec3, endPos: Vec3, duration: number): void {
        this._isMoving = true;
        this.enemyState = EnemyState.MOVING;
        
        // 停止之前的移动
        this.stopMovement();
        
        // 创建新的移动缓动
        this._movementTween = tween(this.node)
            .to(duration, { position: endPos }, { easing: 'linear' })
            .call(() => {
                this._isMoving = false;
                this.reachCastle();
            })
            .start();
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

        // 隐藏血条
        if (this._healthBarContainer) {
            this._healthBarContainer.active = false;
        }

        // 停止移动
        this.stopMovement();

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
    
    // === Tween移动控制方法 ===
    
    /**
     * 停止当前移动
     */
    public stopMovement(): void {
        if (this._movementTween) {
            this._movementTween.stop();
            this._movementTween = null;
        }
        this._isMoving = false;
    }
    
    /**
     * 暂停移动
     */
    public pauseMovement(): void {
        if (this._movementTween) {
            // Cocos Creator 3.8的tween系统可能不直接支持暂停，使用停止代替
            this.stopMovement();
        }
    }
    
    /**
     * 恢复移动（重新开始移动到城堡）
     */
    public resumeMovement(): void {
        if (!this._isMoving && this.isAlive) {
            this._movementStarted = false; // 重置标志以允许重新开始
        }
    }
    
    // === 事件回调方法 (子类可重写) ===
    
    protected onTakeDamage(damage: number): void {
        console.log(`${this.unitName}受到 ${damage} 点伤害，剩余血量: ${this.currentHealth}`);
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
     * 创建带标签的缓动动画（用于批量管理）
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
    
    /**
     * 获取移动状态
     */
    public get isMoving(): boolean {
        return this._isMoving;
    }
    
    /**
     * 获取移动是否已开始
     */
    public get movementStarted(): boolean {
        return this._movementStarted;
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

    /**
     * 创建老鼠血条 - 统一的血条管理系统
     */
    protected createMouseHealthBar(): void {
        const healthBarConfig = this.getHealthBarConfig();

        const healthBarData = DrawingHelper.createHealthBar(this.node, {
            width: healthBarConfig.width,
            height: healthBarConfig.height,
            position: { x: 0, y: healthBarConfig.yOffset, z: 0 },
            backgroundColor: healthBarConfig.backgroundColor || new Color(60, 60, 60),
            foregroundColor: healthBarConfig.foregroundColor || new Color(0, 255, 0),
            borderColor: healthBarConfig.borderColor || new Color(255, 255, 255),
            borderWidth: healthBarConfig.borderWidth || 1
        });

        this._healthBarContainer = healthBarData.container;
        this._healthBarForeground = healthBarData.foreground;

        // 血条始终显示
        this._healthBarContainer.active = true;

        // 初始化血条显示
        this.updateMouseHealthBarDisplay();
    }

    /**
     * 更新老鼠血条显示 - 统一的血条更新系统
     */
    protected updateMouseHealthBarDisplay(): void {
        if (this._healthBarForeground && this._healthBarContainer) {
            const healthPercent = this.currentHealth / this.maxHealth;
            const config = this.getHealthBarConfig();

            DrawingHelper.updateHealthBar(
                this._healthBarForeground,
                healthPercent,
                config.width,
                config.height
            );

            // 血条始终显示，只有死亡时才隐藏
            this._healthBarContainer.active = healthPercent > 0;
        }
    }
    
    /**
     * 获取Graphics组件，直接添加模式
     * 遵循CLAUDE.md禁止条件性组件添加的原则
     */
    protected getGraphicsComponent(): Graphics {
        if (!this._graphics) {
            // 直接添加Graphics组件，让Cocos Creator处理重复检查
            this._graphics = this.node.addComponent(Graphics);
            if (!this._graphics) {
                // 如果添加失败，尝试获取现有组件
                this._graphics = this.node.getComponent(Graphics);
                if (!this._graphics) {
                    console.error("无法获取Graphics组件:", this.node.name);
                }
            }
        }
        return this._graphics;
    }
}