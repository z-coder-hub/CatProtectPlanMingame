import { _decorator, Node, Color } from 'cc';
import { ProjectileSystem } from '../../projectiles/ProjectileSystem';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { HeroType } from '../../types/GameTypes';
import { BaseHero } from './BaseHero';

const { ccclass, property } = _decorator;

@ccclass('PersianSniper')
export class PersianSniper extends BaseHero {

    @property({ tooltip: "子弹速度", override: true })
    public bulletSpeed: number = 500;


    @property({ tooltip: "暴击几率" })
    public critChance: number = 0.3;

    @property({ tooltip: "暴击倍率" })
    public critMultiplier: number = 2.5;

    // 私有属性

    // 英雄类型
    public readonly heroType: HeroType = HeroType.PERSIAN_SNIPER;

    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.PERSIAN_SNIPER];

        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 500;
        this.cost = config.cost;
        this.critChance = config.critChance || 0.3;
        this.critMultiplier = config.critMultiplier || 2.5;
    }

    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        this.initializeDefaultAnimation();
    }

    // 使用基类的update方法

    // 目标分配由 BattleManager 统一处理

    protected onAttack(target: Node): void {
        if (!target) return;

        // 使用投射物系统发射带暴击的物理子弹
        ProjectileSystem.CreatePhysicalBullet(this, target.position, this.critChance, this.critMultiplier);
    }

    // ProjectileSystem已包含动态边界计算、碰撞检测、暴击处理等完整功能

    // 使用默认的远程攻击动画（无需重写getAttackAnimationType）

    // 重写基类的英雄点击处理方法
    protected onHeroClickHandler(): void {
        console.log(`${this.unitName} 被点击`);
    }

    // 重写标签配置，使用完整英雄名称
    protected getHeroLabelConfig() {
        return {
            text: this.unitName || "波斯狙击手",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 120, height: 24 }  // 增加宽度以容纳完整名称
        };
    }

    // 实现BaseHero的抽象方法 - 获取placed图片路径
    protected getPlacedImagePath(): string | null {
        return "images/placed/PersianSniper_placed";
    }

    protected onDestroy(): void {
        // 清理由基类处理
    }
}
