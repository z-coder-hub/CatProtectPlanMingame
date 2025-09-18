import { _decorator, Color, Component, Graphics, Label, Node, tween, Vec3, director, Sprite, SpriteFrame, UITransform, resources } from 'cc';
import { BattleManager } from '../../managers/BattleManager';
import { GameManager } from '../../managers/GameManager';
import { EnemyConfig, EnemyState, EnemyUnitStats, EnemyCategory } from '../../types/GameTypes';
import { EnemyType } from '../../types/GameConstants';

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
    protected _battleManager: BattleManager | null = null;
    protected _healthBarContainer: Node | null = null;
    protected _healthBarForeground: Graphics | null = null;
    protected _nameLabel: Label | null = null;
    protected _graphics: Graphics | null = null;

    // === 统一外观系统属性（模仿BaseHero） ===
    protected _sprite: Sprite | null = null;
    protected _fallbackGraphics: Graphics | null = null;

    // === 统一Tween移动系统属性 ===
    protected _movementTween: any = null;
    protected _isMoving: boolean = false;
    protected _movementStarted: boolean = false;

    // 移动行为相关属性（从BasicMouse提取的完整系统）
    protected _zigzagAmplitude: number = 0;                 // 蜿蜒幅度

    // === 对象池支持 ===
    protected _movementPattern: 'zigzag' | 'curves' | 'spiral' | 'dash' | 'straight' | 'stealth_sway' = 'zigzag'; // 移动模式
    protected _segmentCount: number = 6;                    // 移动分段数量

    // 抽象属性，子类必须实现
    public abstract readonly enemyType: EnemyType;

    // 抽象方法，子类必须实现各自的配置
    protected abstract getConfig(): EnemyConfig;

    // === 抽象方法：图片资源路径（模仿BaseHero） ===
    /**
     * 获取敌人图片资源路径
     * 子类实现此方法返回对应的图片路径，如果返回null则使用Graphics回退
     */
    protected abstract getEnemyImagePath(): string | null;

    protected onLoad(): void {
        this.initializeMouseStats();
        this.initializeBaseVisuals();
        this.initializeMouseVisuals();
        this.createMouseNameLabel();
        this.createMouseHealthBar();
    }

    /**
     * 初始化老鼠属性 - 使用子类配置
     */
    private initializeMouseStats(): void {
        const config = this.getConfig();

        this.unitName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.moveSpeed = config.moveSpeed;
        this.goldReward = config.goldReward;
    }

    protected start(): void {
        // 获取GameManager引用
        this._gameManager = GameManager.instance;

        // 获取BattleManager引用
        this._battleManager = BattleManager.instance;

        // 注册到BattleManager
        if (this._battleManager) {
            this._battleManager.RegisterEnemy(this.node);
        }
    }

    protected update(_dt: number): void {
        if (!this.isAlive) return;

        // 启动移动（只执行一次）
        if (!this._movementStarted) {
            console.log(`[BaseMouse] 🚀 开始移动: ${this.enemyType}, 位置: ${this.node.position}, 状态: ${this.enemyState}`);
            this.startMovementTowardsCastle();
            this._movementStarted = true;
        }
    }

    // === 统一外观系统方法（模仿BaseHero） ===

    /**
     * 初始化基础外观组件 - 所有敌人共同的外观元素
     */
    protected initializeBaseVisuals(): void {
        // 尝试加载敌人图片，失败则使用Graphics回退
        this.loadEnemySpriteOrFallback();
    }

    /**
     * 加载敌人图片或创建Graphics回退
     */
    protected loadEnemySpriteOrFallback(): void {
        const imagePath = this.getEnemyImagePath();
        if (imagePath) {
            this.loadEnemySprite(imagePath);
        } else {
            this.createEnemyGraphicsFallback();
        }
    }

    /**
     * 加载敌人精灵图片
     */
    protected loadEnemySprite(imagePath: string): void {
        // 添加Sprite组件
        this._sprite = this.node.addComponent(Sprite);

        // 设置Sprite属性
        this._sprite.type = Sprite.Type.SIMPLE;
        this._sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        // 设置Sprite尺寸（根据敌人类型调整）
        const spriteTransform = this._sprite.node.getComponent(UITransform);
        if (spriteTransform) {
            const config = this.getConfig();
            let spriteSize = 40; // 默认尺寸

            // 根据敌人分类调整尺寸
            switch (config.category) {
                case EnemyCategory.BASIC:
                    spriteSize = 35;
                    break;
                case EnemyCategory.FAST:
                    spriteSize = 30;
                    break;
                case EnemyCategory.ARMORED:
                    spriteSize = 45;
                    break;
                case EnemyCategory.SPECIAL:
                    spriteSize = 40;
                    break;
                case EnemyCategory.BOSS:
                    spriteSize = 60; // BOSS更大
                    break;
            }

            spriteTransform.setContentSize(spriteSize, spriteSize);
        }

        // 加载SpriteFrame资源
        resources.load(imagePath + "/spriteFrame", SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.error(`加载敌人图片失败: ${imagePath}`, err);
                // 加载失败时回退到Graphics绘制
                if (this._sprite && this._sprite.isValid) {
                    this._sprite.destroy();
                    this._sprite = null;
                }
                this.createEnemyGraphicsFallback();
                return;
            }

            if (!this._sprite || !this._sprite.isValid) {
                return;
            }

            // 设置SpriteFrame
            this._sprite.spriteFrame = spriteFrame;
            console.log(`成功加载敌人图片: ${imagePath}`);
        });
    }

    /**
     * 创建Graphics回退显示
     */
    protected createEnemyGraphicsFallback(): void {
        // 使用原有的Graphics绘制系统作为回退
        this._fallbackGraphics = this.getGraphicsComponent();

        // 调用子类的绘制方法
        if (this._fallbackGraphics) {
            this.drawEnemyGraphics(this._fallbackGraphics);
            console.log(`敌人 ${this.enemyType} 使用Graphics回退显示`);
        }
    }

    /**
     * 绘制敌人Graphics外观 - 子类必须实现
     * 当图片加载失败或没有图片资源时，会调用此方法绘制外观
     */
    protected abstract drawEnemyGraphics(graphics: Graphics): void;

    // 子类可选重写：初始化敌人特殊外观（如特效、动画等）
    protected initializeMouseVisuals(): void {
        // 默认实现为空，子类可重写添加特殊外观
    }

    // 统一的老鼠标签配置 - 基于敌人分类提供默认配置
    protected getMouseLabelConfig(): {
        text: string;
        fontSize: number;
        color: Color;
        yOffset: number;
        size: { width: number; height: number };
    } {
        const config = this.getConfig();

        // 根据敌人分类提供统一配置
        switch (config.category) {
            case EnemyCategory.BASIC:
                return {
                    text: this.unitName,
                    fontSize: 22,
                    color: new Color(255, 255, 255),
                    yOffset: 35,
                    size: { width: 60, height: 28 }
                };

            case EnemyCategory.FAST:
                return {
                    text: this.unitName,
                    fontSize: 22,
                    color: new Color(255, 255, 100), // 快速单位用亮黄色
                    yOffset: 35,
                    size: { width: 70, height: 28 }
                };

            case EnemyCategory.ARMORED:
                return {
                    text: this.unitName,
                    fontSize: 22,
                    color: new Color(255, 215, 0), // 装甲单位用金色
                    yOffset: 40, // 装甲单位通常更高，需要更大偏移
                    size: { width: 70, height: 28 }
                };

            case EnemyCategory.SPECIAL:
                return {
                    text: this.unitName,
                    fontSize: 22,
                    color: new Color(200, 150, 255), // 特殊单位用紫色
                    yOffset: 35,
                    size: { width: 80, height: 28 }
                };

            case EnemyCategory.BOSS:
                return {
                    text: this.unitName,
                    fontSize: 24, // BOSS用更大字体
                    color: new Color(255, 255, 255),
                    yOffset: 50, // BOSS体型更大，标签位置更高
                    size: { width: 120, height: 32 }
                };

            default:
                return {
                    text: this.unitName,
                    fontSize: 22,
                    color: new Color(255, 255, 255),
                    yOffset: 35,
                    size: { width: 60, height: 28 }
                };
        }
    }

    // 统一的血条配置 - 基于敌人分类提供默认配置
    protected getHealthBarConfig(): {
        width: number;
        height: number;
        yOffset: number;
        backgroundColor?: Color;
        foregroundColor?: Color;
        borderColor?: Color;
        borderWidth?: number;
    } {
        const config = this.getConfig();

        // 根据敌人分类提供统一配置
        switch (config.category) {
            case EnemyCategory.BASIC:
                return {
                    width: 30,
                    height: 4,
                    yOffset: 25,
                    backgroundColor: new Color(60, 60, 60),
                    foregroundColor: new Color(0, 255, 0),
                    borderColor: new Color(255, 255, 255),
                    borderWidth: 1
                };

            case EnemyCategory.FAST:
                return {
                    width: 25,
                    height: 3,
                    yOffset: 20,
                    backgroundColor: new Color(60, 60, 60),
                    foregroundColor: new Color(255, 255, 100), // 快速单位用亮黄色
                    borderColor: new Color(255, 255, 255),
                    borderWidth: 1
                };

            case EnemyCategory.ARMORED:
                return {
                    width: 50,
                    height: 6,
                    yOffset: 30,
                    backgroundColor: new Color(60, 60, 60),
                    foregroundColor: new Color(255, 215, 0), // 装甲单位用金色
                    borderColor: new Color(255, 255, 255),
                    borderWidth: 2
                };

            case EnemyCategory.SPECIAL:
                return {
                    width: 40,
                    height: 5,
                    yOffset: 25,
                    backgroundColor: new Color(60, 60, 60),
                    foregroundColor: new Color(200, 150, 255), // 特殊单位用紫色
                    borderColor: new Color(255, 255, 255),
                    borderWidth: 1
                };

            case EnemyCategory.BOSS:
                return {
                    width: 120,
                    height: 12,
                    yOffset: 55,
                    backgroundColor: new Color(60, 60, 60),
                    foregroundColor: new Color(255, 100, 100), // BOSS用红色前景
                    borderColor: new Color(255, 255, 255),
                    borderWidth: 3
                };

            default:
                return {
                    width: 30,
                    height: 4,
                    yOffset: 25,
                    backgroundColor: new Color(60, 60, 60),
                    foregroundColor: new Color(0, 255, 0),
                    borderColor: new Color(255, 255, 255),
                    borderWidth: 1
                };
        }
    }

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
     * @param damage 伤害值
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

        // 通知BattleManager处理击杀奖励
        if (this._battleManager) {
            this._battleManager.HandleEnemyKilled(this);
        }

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

        // 计算总距离
        const totalDistance = Math.abs(startPos.y - castlePos.y - 50);
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
    protected createMovementTween(_startPos: Vec3, endPos: Vec3, duration: number): void {
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
        // 注意：敌人注销由BattleManager统一处理
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

        // 注意：击杀奖励和注销由BattleManager.HandleEnemyKilled统一处理
        // 这里不再重复调用UnregisterEnemy

        this.createDeathEffect();

        // 回收到对象池而不是直接销毁
        if (this.node && this.node.isValid) {
            // 使用全局事件通知回收，避免循环依赖
            director.emit('enemy-recycle', this.node, this.enemyType);
        }
    }

    protected createDeathEffect(): void {
    }

    // === 对象池接口方法 ===


    /**
     * 对象池重用方法 - 当从对象池中取出时调用
     * 重置敌人状态以供重用
     */
    public reuse(..._args: any[]): void {
        // 重置基础状态
        this.enemyState = EnemyState.IDLE;
        this.currentTarget = null;
        this._isMoving = false;
        this._movementStarted = false;

        // 重置生命值
        this.currentHealth = this.maxHealth;

        // 重置节点状态（位置由EnemyFactory设置）
        this.node.active = true;

        // 停止所有移动
        this.stopMovement();

        // 重新获取管理器引用（如果需要）
        if (!this._battleManager) {
            this._battleManager = BattleManager.instance;
        }
        if (!this._gameManager) {
            this._gameManager = GameManager.instance;
        }

        // 重新注册到BattleManager（关键修复）
        if (this._battleManager) {
            this._battleManager.RegisterEnemy(this.node);
            console.log(`[BaseMouse] 🔄 重用敌人已重新注册到BattleManager: ${this.enemyType}`);
        } else {
            console.error(`[BaseMouse] ❌ 无法重新注册敌人，BattleManager不存在: ${this.enemyType}`);
        }

        // 重置血条
        if (this._healthBarContainer) {
            this._healthBarContainer.active = true;
        }
        this.updateMouseHealthBarDisplay();

        // 调用子类的重置逻辑
        this.onPoolReuse();
    }

    /**
     * 对象池回收方法 - 当放入对象池时调用
     * 清理敌人状态
     */
    public unuse(): void {
        // 停止所有移动和调度
        this.stopMovement();
        this.unscheduleAllCallbacks();

        // 重置状态
        this.enemyState = EnemyState.DEAD;
        this.currentTarget = null;
        this.node.active = false;

        // 隐藏血条
        if (this._healthBarContainer) {
            this._healthBarContainer.active = false;
        }

        // 调用子类的清理逻辑
        this.onPoolUnuse();
    }

    /**
     * 子类可重写：对象池重用时的特殊逻辑
     */
    protected onPoolReuse(): void {
        // 默认实现为空，子类可重写
    }

    /**
     * 子类可重写：对象池回收时的特殊逻辑
     */
    protected onPoolUnuse(): void {
        // 默认实现为空，子类可重写
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



    protected createMouseNameLabel(): void {
        const labelConfig = this.getMouseLabelConfig();

        // 直接创建标签，不依赖DrawingHelper
        const labelNode = new Node(`Label_${labelConfig.text}`);
        labelNode.parent = this.node;
        labelNode.setPosition(0, labelConfig.yOffset, 0);

        // 设置UITransform
        const uiTransform = labelNode.addComponent(UITransform);
        if (labelConfig.size) {
            uiTransform.setContentSize(labelConfig.size.width, labelConfig.size.height);
        } else {
            uiTransform.setContentSize(labelConfig.text.length * labelConfig.fontSize, labelConfig.fontSize);
        }

        // 创建Label组件
        this._nameLabel = labelNode.addComponent(Label);
        this._nameLabel.string = labelConfig.text;
        this._nameLabel.fontSize = labelConfig.fontSize;
        this._nameLabel.color = labelConfig.color;
        this._nameLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        this._nameLabel.verticalAlign = Label.VerticalAlign.CENTER;
    }

    /**
     * 创建老鼠血条 - 统一的血条管理系统
     */
    protected createMouseHealthBar(): void {
        const healthBarConfig = this.getHealthBarConfig();

        // 直接创建血条，不依赖DrawingHelper
        // 创建血条容器
        this._healthBarContainer = new Node(`HealthBar_${this.unitName}`);
        this._healthBarContainer.parent = this.node;
        this._healthBarContainer.setPosition(0, healthBarConfig.yOffset, 0);

        // 设置血条容器UITransform
        const containerTransform = this._healthBarContainer.addComponent(UITransform);
        containerTransform.setContentSize(healthBarConfig.width, healthBarConfig.height);

        // 创建背景
        const backgroundGraphics = this._healthBarContainer.addComponent(Graphics);
        const bgColor = healthBarConfig.backgroundColor || new Color(60, 60, 60);
        backgroundGraphics.fillColor = bgColor;
        backgroundGraphics.rect(-healthBarConfig.width / 2, -healthBarConfig.height / 2, healthBarConfig.width, healthBarConfig.height);
        backgroundGraphics.fill();

        // 创建边框
        const borderColor = healthBarConfig.borderColor || new Color(255, 255, 255);
        const borderWidth = healthBarConfig.borderWidth || 1;
        backgroundGraphics.strokeColor = borderColor;
        backgroundGraphics.lineWidth = borderWidth;
        backgroundGraphics.rect(-healthBarConfig.width / 2, -healthBarConfig.height / 2, healthBarConfig.width, healthBarConfig.height);
        backgroundGraphics.stroke();

        // 创建前景血条
        const foregroundNode = new Node('HealthBarForeground');
        foregroundNode.parent = this._healthBarContainer;
        foregroundNode.setPosition(0, 0, 0);

        const foregroundTransform = foregroundNode.addComponent(UITransform);
        foregroundTransform.setContentSize(healthBarConfig.width, healthBarConfig.height);

        this._healthBarForeground = foregroundNode.addComponent(Graphics);
        const fgColor = healthBarConfig.foregroundColor || new Color(0, 255, 0);
        this._healthBarForeground.fillColor = fgColor;

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

            // 直接更新血条，不依赖DrawingHelper
            this._healthBarForeground.clear();

            if (healthPercent > 0) {
                const currentWidth = config.width * healthPercent;
                this._healthBarForeground.rect(
                    -config.width / 2,
                    -config.height / 2,
                    currentWidth,
                    config.height
                );
                this._healthBarForeground.fill();
            }

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
