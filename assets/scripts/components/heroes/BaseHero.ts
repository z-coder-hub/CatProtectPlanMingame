import { _decorator, Component, Node, Vec3, tween, TweenSystem, Graphics, Label, Color, EventTouch, Animation } from 'cc';
import { HeroType, HeroState, UnitStats } from '../../types/GameTypes';
import { GameManager } from '../../managers/GameManager';
import { BattleManager } from '../../managers/BattleManager';
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
    
    @property({ tooltip: "技能冷却时间" })
    public skillCooldown: number = 5;
    
    @property({ tooltip: "英雄成本" })
    public cost: number = 50;
    
    // === 状态属性 ===
    public heroState: HeroState = HeroState.IDLE;
    public currentTarget: Node | null = null;
    
    // === 受保护属性，子类可访问 ===
    protected _gameManager: GameManager | null = null;
    protected _attackTimer: number = 0;
    protected _skillTimer: number = 0;
    // 移除生命条相关属性
    
    // === 统一外观系统属性 ===
    protected _graphics: Graphics | null = null;
    protected _nameLabel: Label | null = null;
    protected _animation: Animation | null = null;
    
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
        
        // 注册到BattleManager
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.registerHero(this.node);
        }
    }
    
    protected update(dt: number): void {
        // 更新攻击计时器
        if (this._attackTimer > 0) {
            this._attackTimer -= dt;
        }
        
        // 更新技能计时器
        if (this._skillTimer > 0) {
            this._skillTimer -= dt;
        }
        
        // 根据状态执行对应行为
        switch (this.heroState) {
            case HeroState.IDLE:
                this.onIdleState(dt);
                break;
            case HeroState.ATTACKING:
                this.onAttackState(dt);
                break;
        }
    }
    
    // === 抽象方法，子类必须实现 ===
    protected abstract initializeHeroStats(): void;
    protected abstract initializeHeroVisuals(): void;
    
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
            [HeroType.RAGDOLL_GUARDIAN]: 'ragdoll',
            [HeroType.SCOTTISH_ENGINEER]: 'scottish',
            [HeroType.ABYSSINIAN_SCOUT]: 'abyssinian',
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
     * 获取英雄标签配置 - 子类可以重写以自定义标签
     */
    protected getHeroLabelConfig(): {
        text: string;
        fontSize: number;
        color: Color;
        yOffset: number;
        size: { width: number; height: number };
    } {
        // 默认配置，基于英雄名称
        return {
            text: this.unitName,
            fontSize: 18,           // 统一大字体
            color: new Color(255, 255, 255),
            yOffset: 35,            // 统一上方位置
            size: { width: 70, height: 24 }  // 统一大尺寸
        };
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
        // 默认尝试使用技能
        if (this.canUseSkill) {
            this.useSkill();
        }
    }
    
    // === 通用属性访问器 ===
    // 英雄始终存活，不会死亡
    public get isAlive(): boolean {
        return true;
    }
    
    public get canAttack(): boolean {
        return this._attackTimer <= 0;
    }
    
    public get canUseSkill(): boolean {
        return this._skillTimer <= 0;
    }
    
    public get stats(): UnitStats {
        return {
            name: this.unitName,
            attackDamage: this.attackDamage,
            attackRange: this.attackRange,
            attackSpeed: this.attackSpeed
        };
    }
    
    // === 战斗方法 ===
    // 英雄不会受到伤害或死亡，移除相关方法
    
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
            this.heroState = HeroState.ATTACKING;
        }
    }
    
    /**
     * 攻击状态处理
     */
    protected onAttackState(dt: number): void {
        if (!this.currentTarget || !this.currentTarget.isValid) {
            this.heroState = HeroState.IDLE;
            return;
        }
        
        // 检查目标是否仍在范围内
        if (!this.isTargetInRange(this.currentTarget)) {
            this.currentTarget = null;
            this.heroState = HeroState.IDLE;
            return;
        }
        
        // 攻击目标
        this.attackTarget(this.currentTarget);
    }
    
    // === 事件回调方法 (子类可重写) ===
    // 英雄不会受伤或死亡，移除相关回调方法
    
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
    
    // 移除死亡特效方法，英雄不会死亡
    
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