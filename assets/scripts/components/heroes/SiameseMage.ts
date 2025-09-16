import { _decorator, Node, Vec3, Color } from 'cc';
import { BaseHero } from './BaseHero';
import { HeroType } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
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
    
    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.SIAMESE_MAGE];
        
        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 350;
        this.cost = config.cost;
        this.aoeDamage = config.aoeDamage || 1.5;
        this.aoeRange = config.aoeRange || 80;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        this.initializeDefaultAnimation();
    }
    
    // 继承父类start()方法，无需重写
    
    // 重写标签配置，使用完整英雄名称
    protected getHeroLabelConfig() {
        return {
            text: this.unitName || "暹罗猫法师",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 110, height: 24 }  // 增加宽度以容纳完整名称
        };
    }
    
    
    
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

    // 重写基类的点击处理方法
    protected onHeroClickHandler(): void {
        console.log(`${this.unitName} 被点击`);
    }
    
}