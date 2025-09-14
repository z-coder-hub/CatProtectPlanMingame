import { _decorator, Component, Node, Vec3, tween, TweenSystem, Label, Color, Graphics } from 'cc';
import { EnemyType, EnemyState, EnemyUnitStats, EnemyConfig } from '../../types/GameTypes';
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
    
    // === 统一Tween移动系统属性 ===
    protected _movementTween: any = null;
    protected _isMoving: boolean = false;
    protected _movementStarted: boolean = false;

    // 移动行为相关属性（从BasicMouse提取的完整系统）
    protected _zigzagAmplitude: number = 0;                 // 蜿蜒幅度
    protected _movementPattern: 'zigzag' | 'curves' | 'spiral' | 'dash' | 'straight' | 'stealth_sway' = 'zigzag'; // 移动模式
    protected _segmentCount: number = 6;                    // 移动分段数量
    
    // 抽象属性，子类必须实现
    public abstract readonly enemyType: EnemyType;

    // 抽象方法，子类必须实现各自的配置
    protected abstract GetConfig(): EnemyConfig;
    
    protected onLoad(): void {
        this.initializeMouseStats();
        this.initializeMouseVisuals();
        this.createMouseNameLabel();
        this.createMouseHealthBar();
    }

    /**
     * 初始化老鼠属性 - 使用子类配置
     */
    private initializeMouseStats(): void {
        const config = this.GetConfig();

        this.unitName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.moveSpeed = config.moveSpeed;
        this.goldReward = config.goldReward;
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
     * 启动基于Tween的统一移动系统（从BasicMouse提取的完整系统）
     * 使用蜿蜒移动路径，支持多种移动模式
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

        // 初始化移动行为（子类可重写以定制参数）
        this.initializeMovementBehavior();

        // 根据移动模式创建不同的移动路径
        this.createWeavingMovementPath(currentPos, castlePos);
    }

    /**
     * 初始化移动行为参数
     * 子类可重写此方法来定制移动参数
     */
    protected initializeMovementBehavior(): void {
        // 默认移动参数配置（基础老鼠的参数）
        const patterns: ('zigzag' | 'curves' | 'spiral')[] = ['zigzag', 'curves', 'spiral'];
        this._movementPattern = patterns[Math.floor(Math.random() * patterns.length)];

        // 设置蜿蜒参数
        this._zigzagAmplitude = 20 + Math.random() * 30; // 20-50像素的摆动幅度
        this._segmentCount = 4 + Math.floor(Math.random() * 4); // 4-7段移动

        console.log(`${this.unitName}移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }

    /**
     * 创建蜿蜒移动路径（从BasicMouse提取的完整算法）
     */
    protected createWeavingMovementPath(startPos: Vec3, castlePos: Vec3): void {
        this._isMoving = true;
        this.enemyState = EnemyState.MOVING;

        // 停止之前的移动
        this.stopMovement();

        // 计算总距离和每段距离
        const totalDistance = Math.abs(startPos.y - castlePos.y - 50);
        const segmentDistance = totalDistance / this._segmentCount;
        const totalDuration = totalDistance / this.moveSpeed;
        const segmentDuration = totalDuration / this._segmentCount;

        // 根据移动模式生成路径点
        const pathPoints = this.generatePathPoints(startPos, castlePos, totalDistance);

        // 创建链式缓动动画
        this.createChainedTweenMovement(pathPoints, segmentDuration);
    }

    /**
     * 根据移动模式生成路径点（从BasicMouse提取）
     */
    protected generatePathPoints(startPos: Vec3, castlePos: Vec3, totalDistance: number): Vec3[] {
        const points: Vec3[] = [startPos];
        const segmentDistance = totalDistance / this._segmentCount;

        for (let i = 1; i <= this._segmentCount; i++) {
            const progress = i / this._segmentCount;
            const yPos = startPos.y - (segmentDistance * i);
            let xOffset = 0;

            switch (this._movementPattern) {
                case 'zigzag':
                    // Z字形移动：每段改变方向
                    xOffset = Math.sin(i * Math.PI * 0.6) * this._zigzagAmplitude;
                    break;
                case 'curves':
                    // S形曲线移动：平滑曲线
                    xOffset = Math.sin(progress * Math.PI * 2) * this._zigzagAmplitude;
                    break;
                case 'spiral':
                    // 螺旋移动：螺旋下降
                    xOffset = Math.cos(progress * Math.PI * 4) * this._zigzagAmplitude * (1 - progress * 0.5);
                    break;
                case 'dash':
                    // 快速冲刺：主要直线，偶尔调整
                    const dashCycle = progress * 4; // 增加频率
                    if (dashCycle % 2 < 1.8) {
                        xOffset = 0; // 直线冲刺
                    } else {
                        xOffset = (Math.random() - 0.5) * this._zigzagAmplitude * 0.6;
                    }
                    break;
                case 'straight':
                    // 直线移动：几乎无偏移
                    xOffset = (Math.random() - 0.5) * this._zigzagAmplitude * 0.1;
                    break;
                case 'stealth_sway':
                    // 潜行摇摆：不规律的摇摆效果
                    xOffset = Math.sin(progress * Math.PI * 3 + i * 0.8) * this._zigzagAmplitude;
                    break;
            }

            // 限制X坐标不要移动到屏幕外
            const maxX = 300;
            xOffset = Math.max(-maxX, Math.min(maxX, startPos.x + xOffset)) - startPos.x;

            points.push(new Vec3(startPos.x + xOffset, yPos, 0));
        }

        // 最后一个点是城堡位置
        points[points.length - 1] = new Vec3(points[points.length - 1].x, castlePos.y + 50, 0);

        return points;
    }

    /**
     * 创建链式缓动移动（从BasicMouse提取）
     */
    protected createChainedTweenMovement(pathPoints: Vec3[], segmentDuration: number): void {
        let currentTween = tween(this.node);

        // 为每个路径点创建缓动
        for (let i = 1; i < pathPoints.length; i++) {
            const targetPos = pathPoints[i];
            const isLastSegment = i === pathPoints.length - 1;

            // 根据移动模式选择缓动效果 - 使用简化的缓动类型
            currentTween = currentTween.to(segmentDuration, { position: targetPos });

            // 如果是最后一段，添加到达城堡的回调
            if (isLastSegment) {
                currentTween = currentTween.call(() => {
                    this._isMoving = false;
                    this.reachCastle();
                });
            }
        }

        // 启动缓动链
        this._movementTween = currentTween.start();

        console.log(`开始${this._movementPattern}移动，路径点数量: ${pathPoints.length}, 总时长: ${(segmentDuration * (pathPoints.length - 1)).toFixed(2)}秒`);
    }
    
    /**
     * 创建简单移动缓动动画
     * 保留此方法用于特殊情况下的直线移动
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