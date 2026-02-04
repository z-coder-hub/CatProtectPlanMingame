import { _decorator, Node } from 'cc';
import { BaseHero } from './BaseHero';
import { HeroType } from '../../types/GameTypes';
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
    
    
    
    // 使用BaseHero的通用初始化方法，无需重写
    
    // 实现BaseHero的抽象方法：初始化英雄属性
    protected initializeHeroStats(): void {
        this.unitName = "橘猫射手";
        this.attackDamage = 15;
        this.attackRange = 500;  // 超大攻击范围
        this.attackSpeed = 1.0;
        this.bulletSpeed = 300;
        this.cost = 50;
    }

    // 实现BaseHero的抽象方法：初始化英雄外观
    protected initializeHeroVisuals(): void {
        // 外观初始化由基类统一处理，子类可在此添加特殊初始化
    }

    // 实现抽象方法：提供英雄图片路径
    protected getPlacedImagePath(): string | null {
        return "images/placed/OrangeCat_placed";
    }

    
}