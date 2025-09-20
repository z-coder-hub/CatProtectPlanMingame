import { _decorator, Color, Node } from 'cc';
import { ProjectileSystem } from '../../projectiles/ProjectileSystem';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { HeroType } from '../../types/GameTypes';
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
        this.initializeDefaultAnimation();
    }

    // 重写标签配置，使用完整英雄名称
    protected getHeroLabelConfig() {
        return {
            text: this.unitName || "短毛骑士",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 140, height: 24 }  // 增加宽度以容纳完整名称
        };
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

    // 实现BaseHero的抽象方法 - 获取placed图片路径
    protected getPlacedImagePath(): string | null {
        return null; // 暂时没有placed图片资源
    }

}
