import { _decorator, Node } from 'cc';
import { ProjectileSystem } from '../../projectiles/ProjectileSystem';
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

    // 实现BaseHero的抽象方法：初始化英雄属性
    protected initializeHeroStats(): void {
        this.unitName = "波斯猫狙击手";
        this.attackDamage = 30;
        this.attackRange = 600;  // 超大攻击范围
        this.attackSpeed = 0.7;  // 较慢但高伤害
        this.bulletSpeed = 500;
        this.cost = 80;

        // 设置暴击属性
        this.critChance = 0.3;
        this.critMultiplier = 2.5;
    }

    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        // 外观初始化由基类统一处理，子类可在此添加特殊初始化
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

    // 使用BaseHero的通用方法，无需重写

    // 实现抽象方法：提供英雄图片路径
    protected getPlacedImagePath(): string | null {
        return "images/placed/PersianSniper_placed";
    }


    protected onDestroy(): void {
        // 清理由基类处理
    }
}
