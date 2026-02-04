import { _decorator, Node } from 'cc';
import { ProjectileSystem } from '../../projectiles/ProjectileSystem';
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

    // 实现BaseHero的抽象方法：初始化英雄属性
    protected initializeHeroStats(): void {
        this.unitName = "英短骑士";
        this.attackDamage = 25;
        this.attackRange = 150;  // 近战范围
        this.attackSpeed = 0.8;
        this.bulletSpeed = 200;  // 剑气速度
        this.cost = 60;
    }

    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        // 外观初始化由基类统一处理，子类可在此添加特殊初始化
    }

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

    // 使用BaseHero的通用方法，无需重写

    // 实现抽象方法：提供英雄图片路径
    protected getPlacedImagePath(): string | null {
        return "images/placed/BritishKnight_placed";
    }


}
