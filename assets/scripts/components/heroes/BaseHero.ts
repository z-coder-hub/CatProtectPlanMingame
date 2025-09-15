import { _decorator, Animation, Color, Component, EventTouch, Graphics, Label, Node, Vec3, tween } from 'cc';
import { BattleManager } from '../../managers/BattleManager';
import { GameManager } from '../../managers/GameManager';
import { HeroState, HeroType, UnitStats } from '../../types/GameTypes';
import { DrawingHelper } from '../../utils/DrawingHelper';

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
    protected _graphics: Graphics | null = null;
    protected _nameLabel: Label | null = null;
    protected _animation: Animation | null = null;

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
    protected abstract initializeHeroStats(): void;
    protected abstract initializeHeroVisuals(): void;
    protected abstract getHeroLabelConfig(): {
        text: string;
        fontSize: number;
        color: Color;
        yOffset: number;
        size: { width: number; height: number };
    };

    // === 统一外观系统方法 ===

    /**
     * 初始化基础外观组件 - 所有英雄共同的外观元素
     */
    protected initializeBaseVisuals(): void {
        // 创建Graphics组件用于绘制英雄外观
        this._graphics = this.node.addComponent(Graphics);

        // 绘制英雄外观
        this.drawHeroAppearance();

        // 创建名称标签
        this.createHeroNameLabel();

        // 设置点击事件
        this.setupClickEvents();
    }

    /**
     * 获取Graphics组件的安全访问方法
     * 子类应使用此方法而不是直接访问_graphics
     */
    protected getGraphics(): Graphics | null {
        return this._graphics;
    }

    /**
     * 统一的Graphics清理和重绘方法
     * 子类可以使用此方法进行安全的重绘操作
     */
    protected redrawHeroAppearance(): void {
        if (this._graphics) {
            this._graphics.clear();
            this.drawHeroAppearance();
        }
    }

    /**
     * 绘制英雄外观 - 基于英雄类型自动选择绘制方式
     */
    protected drawHeroAppearance(): void {
        if (!this._graphics) return;

        const heroTypeMap: Record<HeroType, string> = {
            [HeroType.ORANGE_CAT]: 'orange',
            [HeroType.SIAMESE_MAGE]: 'siamese',
            [HeroType.MAINE_THUNDER]: 'maine',
            [HeroType.PERSIAN_SNIPER]: 'persian',
            [HeroType.BRITISH_KNIGHT]: 'british',
            [HeroType.BENGAL_HUNTER]: 'bengal',
            [HeroType.NORWEGIAN_ICE]: 'norwegian',
            [HeroType.SCOTTISH_MARKSMAN]: 'scottish',
            [HeroType.ABYSSINIAN_ARCHER]: 'abyssinian',
            [HeroType.RUSSIAN_BLUE]: 'russian',
            [HeroType.AMERICAN_BOMBER]: 'american'
        };

        const drawType = heroTypeMap[this.heroType];
        if (drawType) {
            DrawingHelper.drawHeroAppearance(this._graphics, drawType as any);
        }
    }

    /**
     * 创建英雄名称标签 - 统一的标签创建方法
     */
    protected createHeroNameLabel(): void {
        const labelConfig = this.getHeroLabelConfig();

        this._nameLabel = DrawingHelper.createLabel(this.node, {
            text: labelConfig.text,
            fontSize: labelConfig.fontSize,
            color: labelConfig.color,
            position: { x: 0, y: labelConfig.yOffset, z: 0 },
            size: labelConfig.size
        });
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
     * 英雄点击处理方法 - 子类可以重写
     */
    protected onHeroClickHandler(): void {
        // 点击处理逻辑，子类可重写
        console.log(`${this.unitName} 被点击`);
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
