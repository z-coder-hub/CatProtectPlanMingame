import { _decorator, Color, Graphics, Node, tween } from 'cc';
import { BaseHero } from './BaseHero';
import { HeroType } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { ProjectileSystem } from '../../projectiles/ProjectileSystem';

const { ccclass } = _decorator;

@ccclass('RussianBlue')
export class RussianBlue extends BaseHero {
    
    public readonly heroType: HeroType = HeroType.RUSSIAN_BLUE;
    
    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.RUSSIAN_BLUE];
        
        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 350;
        this.cost = config.cost;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        // 外观初始化由基类统一处理，子类可在此添加特殊初始化
    }
    
    // 继承父类start()方法，无需重写
    
    
    
    // 目标分配由 BattleManager 统一处理
    
    protected onAttack(target: Node): void {
        if (!target || !this.isAlive) return;
        
        // 使用投射物系统发射爆炸冲击波模拟刺客暗影刃爆发攻击
        const explosionRadius = 80; // 中等范围爆炸模拟暗影刃穿透
        const knockbackForce = 30; // 轻微击退效果
        
        ProjectileSystem.CreateExplosionWave(this, target.position, explosionRadius, knockbackForce);
        this.createAttackEffect();
    }
    
    
    private createAttackEffect(): void {
        const effectNode = new Node("AttackEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.strokeColor = new Color(75, 0, 130, 200); // 暗紫色
        effectGraphics.lineWidth = 3;
        
        // 暗影波纹效果
        for (let i = 0; i < 3; i++) {
            const radius = 20 + i * 8;
            effectGraphics.circle(0, 0, radius);
        }
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
            text: this.unitName || "蓝猫刺客",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 140, height: 24 }  // 增加宽度以容纳完整名称
        };
    }

    // 实现BaseHero的抽象方法 - 获取placed图片路径（目前无美术资源）
    protected getPlacedImagePath(): string | null {
        return "images/placed/RussianBlue_placed";
    }

}