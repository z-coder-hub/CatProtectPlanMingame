import { _decorator, Node, Graphics, Color, tween } from 'cc';
import { BaseHero } from './BaseHero';
import { HeroType } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { ProjectileSystem } from '../../projectiles/ProjectileSystem';

const { ccclass } = _decorator;

@ccclass('MaineThunder')
export class MaineThunder extends BaseHero {
    
    // 英雄类型
    public readonly heroType: HeroType = HeroType.MAINE_THUNDER;
    
    // 继承父类的onLoad和start方法，无需重写
    // 基类已经处理了所有必要的初始化工作
    
    // 实现BaseHero的拽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.MAINE_THUNDER];
        
        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 400;
        this.cost = config.cost;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        // 现在使用placed图片显示，无需自定义绘制
        // 缅因雷法师使用placed图片：MaineThunder_placed.png
    }
    
    // 绘制方法已移除 - 现在使用placed图片显示
    
    // 目标分配由 BattleManager 统一处理
    
    protected onAttack(target: Node): void {
        if (!target || !this.isAlive || !target.isValid) return;
        
        // 使用投射物系统发射链式雷电弹
        ProjectileSystem.CreateLightningBolt(this, target.position, 3, 100);
        
        // 创建攻击动画特效
        this.createLightningEffect();
    }
    
    private createLightningEffect(): void {
        const effectNode = new Node("LightningEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.strokeColor = new Color(255, 255, 0, 200);
        effectGraphics.lineWidth = 4;
        effectGraphics.circle(0, 0, 35);
        effectGraphics.stroke();
        
        tween(effectNode)
            .delay(0.4)
            .call(() => {
                if (effectNode && effectNode.isValid) {
                    effectNode.destroy();
                }
            })
            .start();
    }
    
    
    // 重写标签配置，使用完整英雄名称
    protected getHeroLabelConfig() {
        return {
            text: this.unitName || "缅因猫雷法",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 110, height: 24 }  // 增加宽度以容纳完整名称
        };
    }

    // 实现BaseHero的抽象方法 - 获取placed图片路径
    protected getPlacedImagePath(): string | null {
        return "images/placed/MaineThunder_placed";
    }

}