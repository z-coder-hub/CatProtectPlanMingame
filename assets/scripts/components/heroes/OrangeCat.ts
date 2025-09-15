import { _decorator, Node, Vec3, Color, Animation } from 'cc';
import { BaseHero } from './BaseHero';
import { HeroType } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { ProjectileSystem } from '../../projectiles/ProjectileSystem';
import { EffectHelper } from '../../utils/EffectHelper';

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
    
    // 初始化动画
    private initializeAnimation(): void {
        this._animation = this.node.getComponent(Animation);
        if (this._animation) {
            // 播放idle动画（如果存在）
            if (this._animation.getState('orange_cat_idle')) {
                this._animation.play('orange_cat_idle');
            }
        }
    }
    
    protected update(dt: number): void {
        super.update(dt);
    }
    
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
    
    // 创建点击反馈特效
    private createClickFeedback(): void {
        if (this.node.parent) {
            const feedbackPos = Vec3.add(new Vec3(), this.node.position, new Vec3(0, 40, 0));
            EffectHelper.createClickFeedback(feedbackPos, this.node.parent);
        }
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
        // 初始化动画
        this.initializeAnimation();
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
    
    // 组件销毁时清理资源 - 大幅简化，不再需要管理子弹
    protected onDestroy(): void {
        // 攻击动画由BaseHero统一管理，无需额外清理
    }
}