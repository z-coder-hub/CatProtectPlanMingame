import { _decorator, Animation, Color, Node } from 'cc';
import { ProjectileSystem } from '../../projectiles/ProjectileSystem';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { HeroType } from '../../types/GameTypes';
import { DrawingHelper } from '../../utils/DrawingHelper';
import { BaseHero } from './BaseHero';

const { ccclass } = _decorator;

@ccclass('BritishKnight')
export class BritishKnight extends BaseHero {


    // 私有属性
    // _graphics由BaseHero管理
    // _animation由BaseHero管理
    private _isCharged: boolean = false; // 冲锋状态

    // 英雄类型
    public readonly heroType: HeroType = HeroType.BRITISH_KNIGHT;

    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.BRITISH_KNIGHT];

        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 350;
        this.cost = config.cost;
    }

    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        this.initializeVisuals();
        this.initializeAnimation();
        // 移除setupClickEvents，使用BaseHero的统一系统
    }

    // 继承父类start()方法，无需重写


    private initializeVisuals(): void {
        // 使用基类BaseHero的_graphics属性
        // this._graphics由BaseHero管理

        this.drawBritishKnightAppearance();
        // 移除createNameLabel，使用BaseHero的统一标签系统
    }

    private drawBritishKnightAppearance(): void {
        if (!this._graphics) return;
        DrawingHelper.drawHeroAppearance(this._graphics, 'british');
    }

    // 重写标签配置，使用完整英雄名称
    protected getHeroLabelConfig() {
        return {
            text: this.unitName || "英国短毛猫骑士",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 140, height: 24 }  // 增加宽度以容纳完整名称
        };
    }

    private initializeAnimation(): void {
        this._animation = this.node.getComponent(Animation);
        if (this._animation) {
            if (this._animation.getState('british_knight_idle')) {
                this._animation.play('british_knight_idle');
            }
        }
    }

    // 使用BaseHero的统一update方法

    // 目标分配由 BattleManager 统一处理

    protected onAttack(target: Node): void {
        if (!target || !this.isAlive) return;

        // 使用投射物系统发射剑气（考虑冲锋状态）
        ProjectileSystem.CreateSwordWave(this, target.position, this._isCharged, 1.5);

        // 重置冲锋状态
        if (this._isCharged) {
            this._isCharged = false;
        }
    }

    // 重写攻击动画类型 - 指定为近战动画
    protected getAttackAnimationType(): 'ranged' | 'magic' | 'melee' {
        return 'melee';
    }

    // 重写BaseHero的点击处理方法
    protected onHeroClickHandler(): void {
        console.log(`${this.unitName} 被点击`);
    }

}
