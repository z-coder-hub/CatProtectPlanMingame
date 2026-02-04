import { _decorator, Node } from 'cc';
import { BaseHero } from './BaseHero';
import { HeroType } from '../../types/GameTypes';
import { ProjectileSystem } from '../../projectiles/ProjectileSystem';

const { ccclass, property } = _decorator;

@ccclass('SiameseMage')
export class SiameseMage extends BaseHero {
    
    
    @property({ tooltip: "AOE伤害倍率" })
    public aoeDamage: number = 1.5;
    
    @property({ tooltip: "AOE攻击范围" })
    public aoeRange: number = 80;
    
    // 私有属性
    
    // 英雄类型
    public readonly heroType: HeroType = HeroType.SIAMESE_MAGE;

    // 实现BaseHero的抽象方法：初始化英雄属性
    protected initializeHeroStats(): void {
        this.unitName = "暹罗猫法师";
        this.attackDamage = 20;
        this.attackRange = 300;
        this.attackSpeed = 1.2;
        this.bulletSpeed = 250;
        this.cost = 70;

        // 设置AOE属性
        this.aoeDamage = 1.5;
        this.aoeRange = 80;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        // 外观初始化由基类统一处理，子类可在此添加特殊初始化
    }
    
    // 继承父类start()方法，无需重写
    
    // 目标分配由 BattleManager 统一处理
    
    protected onAttack(target: Node): void {
        if (!target) return;
        
        // 使用投射物系统发射带AOE效果的魔法弹
        ProjectileSystem.CreateMagicMissile(this, target.position, this.aoeDamage, this.aoeRange);
    }

    // 重写攻击动画类型 - 指定为魔法动画
    protected getAttackAnimationType(): 'ranged' | 'magic' | 'melee' {
        return 'magic';
    }

    // 使用BaseHero的通用方法，无需重写

    // 实现抽象方法：提供英雄图片路径
    protected getPlacedImagePath(): string | null {
        return "images/placed/SiameseMage_placed";
    }


}