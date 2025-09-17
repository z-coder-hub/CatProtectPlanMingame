import { _decorator, Node, Vec3, Color } from 'cc';
import { BaseHero } from './BaseHero';
import { HeroType } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { ProjectileSystem } from '../../projectiles/ProjectileSystem';

const { ccclass, property } = _decorator;

/**
 * 橘猫射手 - 重构后使用统一投射物系统
 * 特性：基础物理子弹，单体伤害，超大攻击范围
 */
@ccclass('OrangeCat')
export class OrangeCat extends BaseHero {
    
    @property({ tooltip: "子弹速度", override: true })
    public bulletSpeed: number = 300;
    
    
    // 私有属性 - 大幅简化
    
    // 英雄类型
    public readonly heroType: HeroType = HeroType.ORANGE_CAT;
    
    // 继承父类的onLoad和start方法
    
    
    
    // 重写攻击方法 - 使用统一投射物系统（从120+行简化为3行！）
    protected onAttack(target: Node): void {
        if (!target) return;
        
        // 使用统一的投射物系统发射物理子弹
        ProjectileSystem.CreatePhysicalBullet(this, target.position);
    }
    
    
    
    
    // 重写基类的英雄点击处理
    protected onHeroClickHandler(): void {
        console.log(`${this.unitName} 被点击`);
    }
    
    
    
    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.ORANGE_CAT];
        
        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 300;
        this.cost = config.cost;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        // 使用基类的统一动画初始化
        this.initializeDefaultAnimation();
    }
    
    // 实现BaseHero的抽象方法 - 英雄标签配置
    protected getHeroLabelConfig() {
        return {
            text: this.unitName || "橘猫射手",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 100, height: 24 }
        };
    }

    // 实现BaseHero的抽象方法 - 获取placed图片路径
    protected getPlacedImagePath(): string | null {
        return "images/placed/OrangeCat_placed";
    }
    
    // 组件销毁时清理资源 - 大幅简化，不再需要管理子弹
    protected onDestroy(): void {
        // 攻击动画由BaseHero统一管理，无需额外清理
    }
}