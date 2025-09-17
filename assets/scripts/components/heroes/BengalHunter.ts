import { _decorator, Color, Graphics, Node, tween } from 'cc';
import { BaseHero } from './BaseHero';
import { BaseMouse } from '../enemies/BaseMouse';
import { HeroType } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { ProjectileSystem } from '../../projectiles/ProjectileSystem';

const { ccclass } = _decorator;

@ccclass('BengalHunter')
export class BengalHunter extends BaseHero {
    
    public readonly heroType: HeroType = HeroType.BENGAL_HUNTER;
    
    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.BENGAL_HUNTER];
        
        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 350;
        this.cost = config.cost;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        // 现在使用placed图片显示，无需自定义绘制
        // 孟加拉猎手使用placed图片：BengalHunter_placed.png
    }
    
    // 目标分配由 BattleManager 统一处理
    
    protected onAttack(target: Node): void {
        if (!target || !this.isAlive || !target.isValid) return;
        
        // 使用投射物系统发射快速物理子弹（模拟连发效果）
        ProjectileSystem.CreatePhysicalBullet(this, target.position);
        
        // 短延迟后发射第二发和第三发子弹
        tween(this.node)
            .delay(0.1)
            .call(() => {
                if (target && target.isValid) {
                    ProjectileSystem.CreatePhysicalBullet(this, target.position);
                }
            })
            .delay(0.1)
            .call(() => {
                if (target && target.isValid) {
                    ProjectileSystem.CreatePhysicalBullet(this, target.position);
                }
            })
            .start();
        
        this.createAttackEffect();
    }
    
    private createAttackEffect(): void {
        const effectNode = new Node("AttackEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.strokeColor = new Color(255, 215, 0, 200);
        effectGraphics.lineWidth = 3;
        effectGraphics.circle(0, 0, 25);
        effectGraphics.stroke();
        
        tween(effectNode)
            .delay(0.3)
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
            text: this.unitName || "孟加拉猫猎手",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 120, height: 24 }  // 增加宽度以容纳完整名称
        };
    }

    // 实现BaseHero的抽象方法 - 获取placed图片路径
    protected getPlacedImagePath(): string | null {
        return "images/placed/BengalHunter_placed";
    }

}