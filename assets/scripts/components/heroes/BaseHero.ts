import { _decorator, Color, Component, EventTouch, Graphics, Label, Node, Sprite, SpriteFrame, UITransform, Vec3, tween, resources } from 'cc';
import { BattleManager } from '../../managers/BattleManager';
import { GameManager } from '../../managers/GameManager';
import { HeroState, HeroType, UnitStats } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';

const { ccclass, property } = _decorator;


/**
 * 英雄基类
 * 融合了BaseUnit的功能，提供所有英雄共同的属性和行为
 */
@ccclass('BaseHero')
export abstract class BaseHero extends Component {

    // === 基础单位属性 (来自BaseUnit) ===
    @property({ tooltip: "单位名称" })
    public unitName: string = "英雄单位";

    // 英雄不再有生命值概念

    @property({ tooltip: "攻击力" })
    public attackDamage: number = 20;

    @property({ tooltip: "攻击范围" })
    public attackRange: number = 150;

    @property({ tooltip: "攻击速度(次/秒)" })
    public attackSpeed: number = 1.0;


    // === 英雄特有属性 ===
    @property({ tooltip: "子弹速度" })
    public bulletSpeed: number = 300;


    @property({ tooltip: "英雄成本" })
    public cost: number = 50;

    // === 状态属性 ===
    public heroState: HeroState = HeroState.IDLE;
    public currentTarget: Node | null = null;

    // === 受保护属性，子类可访问 ===
    protected _gameManager: GameManager | null = null;
    protected _battleManager: BattleManager | null = null;
    protected _attackTimer: number = 0;
    protected _targetSearchTimer: number = 0;
    protected _targetSearchInterval: number = 0.1; // 目标搜索间隔，0.1秒搜索一次
    // 移除生命条相关属性

    // === 统一外观系统属性 ===
    protected _sprite: Sprite | null = null;
    protected _fallbackGraphics: Graphics | null = null;
    protected _nameLabel: Label | null = null;

    // === 统一攻击动画系统属性 ===
    protected _isPlayingAttackAnimation: boolean = false;

    // === 抽象属性，子类必须实现 ===
    public abstract readonly heroType: HeroType;

    // === 生命周期方法 ===
    protected onLoad(): void {
        this.initializeHeroStats();
        this.initializeBaseVisuals();
        this.initializeHeroVisuals();
    }

    protected start(): void {
        // 获取GameManager引用
        this._gameManager = GameManager.instance;

        // 获取BattleManager引用
        this._battleManager = BattleManager.instance;

        // 注册到BattleManager
        if (this._battleManager) {
            this._battleManager.RegisterHero(this.node);
        }
    }

    protected update(dt: number): void {
        // 更新攻击计时器
        if (this._attackTimer > 0) {
            this._attackTimer -= dt;
        }

        // 更新目标搜索计时器
        this._targetSearchTimer += dt;

        // 定时触发攻击逻辑（不是每帧都执行）
        if (this._targetSearchTimer >= this._targetSearchInterval) {
            this.updateHeroAttack();
            this._targetSearchTimer = 0;
        }
    }

    // === 英雄攻击系统 - 通过BattleManager交互 ===

    /**
     * 更新英雄攻击逻辑 - 通过BattleManager获取目标并发起攻击
     * 此方法定时调用，而非每帧调用，提高性能
     */
    protected updateHeroAttack(): void {
        if (!this._battleManager) return;

        // 验证当前目标是否仍然有效
        if (this.currentTarget) {
            const targetValid = this._battleManager.isValidTarget(
                this.currentTarget,
                this.node.position,
                this.attackRange
            );

            if (targetValid) {
                // 目标有效，尝试攻击
                if (this.canAttack) {
                    this.performAttackOnTarget(this.currentTarget);
                }
                return;
            } else {
                // 目标无效，清除并寻找新目标
                this.currentTarget = null;
                this.heroState = HeroState.IDLE;
            }
        }

        // 通过BattleManager获取新的攻击目标
        const newTarget = this.requestTargetFromBattleManager();
        if (newTarget) {
            this.currentTarget = newTarget;
            this.heroState = HeroState.ATTACKING;

            if (this.canAttack) {
                this.performAttackOnTarget(newTarget);
            }
        } else {
            this.heroState = HeroState.IDLE;
        }
    }

    /**
     * 抽象方法：从BattleManager请求攻击目标
     * 英雄通过BattleManager获取目标，而不是自己查找
     */
    protected requestTargetFromBattleManager(): Node | null {
        if (!this._battleManager) return null;

        return this._battleManager.assignTargetForHero(this.node, this.attackRange);
    }

    /**
     * 抽象方法：对目标执行攻击
     * 统一的攻击执行方法，负责攻击计时、目标朝向和具体攻击实现
     */
    protected performAttackOnTarget(target: Node): void {
        if (!this.canAttack || !target || !target.isValid) return;

        // 重置攻击计时器
        this._attackTimer = 1.0 / this.attackSpeed;

        // 播放攻击动画
        this.playAttackAnimation();

        // 调用子类的攻击实现
        this.onAttack(target);
    }


    // === 抽象方法，子类必须实现具体行为 ===

    /**
     * 执行攻击 - 子类必须实现具体的攻击逻辑
     */
    protected abstract onAttack(target: Node): void;


    // === 抽象方法，子类必须实现 ===
    protected abstract initializeHeroVisuals(): void;

    // === 通用方法，可被子类重写 ===

    /**
     * 初始化英雄属性 - 抽象方法，子类必须实现自己的属性设置
     * 符合开闭原则：新增英雄时只需实现此方法，无需修改基类
     */
    protected abstract initializeHeroStats(): void;

    /**
     * 获取英雄标签配置 - 通用实现，符合开闭原则
     * 自动从unitName生成，新增英雄无需修改基类
     */
    protected getHeroLabelConfig(): {
        text: string;
        fontSize: number;
        color: Color;
        yOffset: number;
        size: { width: number; height: number };
    } {
        const heroName = this.unitName || "英雄";
        // 根据名称长度自动调整宽度
        const nameWidth = Math.max(100, heroName.length * 12);

        return {
            text: heroName,
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: nameWidth, height: 24 }
        };
    }

    // === 统一外观系统方法 ===

    /**
     * 初始化基础外观组件 - 所有英雄共同的外观元素
     */
    protected initializeBaseVisuals(): void {
        // 尝试加载placed图片，失败则使用白色圆点
        this.loadPlacedSpriteOrFallback();

        // 创建名称标签
        this.createHeroNameLabel();

        // 设置点击事件
        this.setupClickEvents();
    }

    /**
     * 加载placed图片或创建白色圆点回退
     */
    protected loadPlacedSpriteOrFallback(): void {
        const placedPath = this.getPlacedImagePath();
        if (placedPath) {
            this.loadPlacedSprite(placedPath);
        } else {
            this.createWhiteDotFallback();
        }
    }

    /**
     * 获取英雄的placed图片路径 - 抽象方法，子类显式提供图片路径
     * 符合开闭原则：新增英雄时只需实现此方法，无需修改基类
     */
    protected abstract getPlacedImagePath(): string | null;

    /**
     * 加载placed精灵图片
     */
    protected loadPlacedSprite(imagePath: string): void {
        // 添加Sprite组件
        this._sprite = this.node.addComponent(Sprite);

        // 设置Sprite属性
        this._sprite.type = Sprite.Type.SIMPLE;
        this._sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        // 设置Sprite尺寸（保持与原Graphics绘制相同的视觉尺寸）
        const spriteTransform = this._sprite.node.getComponent(UITransform);
        if (spriteTransform) {
            // 使用1.5倍缩放保持与原系统一致
            const spriteSize = 60; // 30 * 2 = 60，匹配原来的Graphics绘制尺寸
            spriteTransform.setContentSize(spriteSize, spriteSize);
        }

        // 加载SpriteFrame资源
        resources.load(imagePath + "/spriteFrame", SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.error(`加载英雄placed图片失败: ${imagePath}`, err);
                // 加载失败时回退到白色圆点
                if (this._sprite && this._sprite.isValid) {
                    this._sprite.destroy();
                    this._sprite = null;
                }
                this.createWhiteDotFallback();
                return;
            }

            if (!this._sprite || !this._sprite.isValid) {
                return;
            }

            // 设置SpriteFrame
            this._sprite.spriteFrame = spriteFrame;
            console.log(`成功加载英雄placed图片: ${imagePath}`);
        });
    }

    /**
     * 创建白色圆点回退显示
     */
    protected createWhiteDotFallback(): void {
        // 添加Graphics组件用于绘制白色圆点
        this._fallbackGraphics = this.node.addComponent(Graphics);

        // 绘制纯白色圆点
        this._fallbackGraphics.fillColor = new Color(255, 255, 255);
        this._fallbackGraphics.circle(0, 0, 30); // 固定30像素半径
        this._fallbackGraphics.fill();

        // 添加简单的边框以提高可见性
        this._fallbackGraphics.strokeColor = new Color(200, 200, 200);
        this._fallbackGraphics.lineWidth = 2;
        this._fallbackGraphics.circle(0, 0, 30);
        this._fallbackGraphics.stroke();

        console.log(`英雄 ${this.heroType} 使用白色圆点回退显示`);
    }

    /**
     * 创建英雄名称标签 - 统一的标签创建方法
     */
    protected createHeroNameLabel(): void {
        const labelConfig = this.getHeroLabelConfig();

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
     * 设置点击事件
     */
    protected setupClickEvents(): void {
        this.node.on(Node.EventType.TOUCH_END, this.onHeroClick, this);
    }

    /**
     * 英雄点击事件处理
     */
    protected onHeroClick(event: EventTouch): void {
        // 阻止事件传播，避免触发网格点击
        event.propagationStopped = true;

        // 调用子类的点击处理
        this.onHeroClickHandler();
    }

    /**
     * 英雄点击处理方法 - 通用实现，子类可以重写
     */
    protected onHeroClickHandler(): void {
        // 通用点击处理逻辑
        console.log(`${this.unitName} 被点击`);
        // 子类可重写此方法来实现特殊的点击行为
    }

    // === 通用属性访问器 ===
    // 英雄始终存活，不会死亡
    public get isAlive(): boolean {
        return true;
    }

    public get canAttack(): boolean {
        return this._attackTimer <= 0;
    }


    public get stats(): UnitStats {
        return {
            name: this.unitName,
            attackDamage: this.attackDamage,
            attackRange: this.attackRange,
            attackSpeed: this.attackSpeed
        };
    }

    // === 工具方法 ===

    /**
     * 检查目标是否在攻击范围内
     */
    public IsTargetInRange(target: Node): boolean {
        if (!target || !target.isValid) return false;

        const distance = target.position.subtract(this.node.position).length();
        return distance <= this.attackRange;
    }

    /**
     * 获取到目标的距离
     */
    public GetDistanceToTarget(target: Node): number {
        if (!target || !target.isValid) return Infinity;

        return target.position.subtract(this.node.position).length();
    }

    // === 统一攻击动画系统 ===

    /**
     * 播放攻击动画 - 统一的英雄攻击动画效果
     * 根据英雄类型自动选择合适的动画样式
     */
    protected playAttackAnimation(): void {
        if (this._isPlayingAttackAnimation || !this.node) {
            return;
        }

        this._isPlayingAttackAnimation = true;
        const originalScale = Vec3.clone(this.node.scale);
        const originalPosition = Vec3.clone(this.node.position);

        // 根据英雄类型选择不同的动画效果
        const animationType = this.getAttackAnimationType();

        switch (animationType) {
            case 'melee':
                // 近战攻击动画 - 前冲攻击
                tween(this.node)
                    .to(0.1, {
                        scale: new Vec3(originalScale.x * 1.2, originalScale.y * 1.2, originalScale.z),
                        position: Vec3.add(new Vec3(), originalPosition, new Vec3(10, 0, 0))
                    })
                    .to(0.1, {
                        scale: originalScale,
                        position: originalPosition
                    })
                    .call(() => {
                        this._isPlayingAttackAnimation = false;
                    })
                    .start();
                break;

            case 'magic':
                // 魔法施放动画 - 旋转效果
                tween(this.node)
                    .to(0.1, {
                        scale: new Vec3(originalScale.x * 1.1, originalScale.y * 1.1, originalScale.z),
                        eulerAngles: new Vec3(0, 0, 15)
                    })
                    .to(0.1, {
                        scale: originalScale,
                        eulerAngles: new Vec3(0, 0, 0)
                    })
                    .call(() => {
                        this._isPlayingAttackAnimation = false;
                    })
                    .start();
                break;

            case 'ranged':
            default:
                // 远程攻击动画 - 缩放效果
                tween(this.node)
                    .to(0.05, { scale: new Vec3(originalScale.x * 1.15, originalScale.y * 1.15, originalScale.z) })
                    .to(0.05, { scale: originalScale })
                    .call(() => {
                        this._isPlayingAttackAnimation = false;
                    })
                    .start();
                break;
        }
    }

    /**
     * 获取攻击动画类型 - 子类可以重写自定义动画类型
     */
    protected getAttackAnimationType(): 'ranged' | 'magic' | 'melee' {
        // 默认为远程攻击动画，子类可以重写
        return 'ranged';
    }



}
