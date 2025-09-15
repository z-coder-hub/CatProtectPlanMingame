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
        this.initializeVisuals();
    }
    
    // 继承父类start()方法，无需重写
    
    
    private initializeVisuals(): void {
        // 使用基类BaseHero的_graphics属性
        // this._graphics由BaseHero管理
        
        this.drawRussianBlueAppearance();
    }
    
    private drawRussianBlueAppearance(): void {
        const graphics = this.getGraphics();
        if (!graphics) return;
        
        graphics.clear();
        
        // 绘制俄罗斯蓝猫刺客身体（深蓝色星形）
        graphics.fillColor = new Color(25, 25, 112); // 午夜蓝色
        // 八角星形，更锋利的造型
        const points = 8;
        const outerRadius = 18;
        const innerRadius = 8;
        
        graphics.moveTo(outerRadius, 0);
        for (let i = 0; i < points; i++) {
            const outerAngle = (i * 2 * Math.PI) / points;
            const innerAngle = ((i + 0.5) * 2 * Math.PI) / points;
            
            const outerX = outerRadius * Math.cos(outerAngle);
            const outerY = outerRadius * Math.sin(outerAngle);
            const innerX = innerRadius * Math.cos(innerAngle);
            const innerY = innerRadius * Math.sin(innerAngle);
            
            graphics.lineTo(outerX, outerY);
            graphics.lineTo(innerX, innerY);
        }
        graphics.close();
        graphics.fill();
        
        // 刺客面具（黑色）
        graphics.fillColor = new Color(0, 0, 0);
        graphics.rect(-8, -12, 16, 6);
        graphics.fill();
        
        // 暗影刃（紫色双刃）
        graphics.strokeColor = new Color(75, 0, 130);
        graphics.lineWidth = 3;
        // 左刃
        graphics.moveTo(-20, -3);
        graphics.lineTo(-12, 0);
        graphics.lineTo(-20, 3);
        // 右刃
        graphics.moveTo(20, -3);
        graphics.lineTo(12, 0);
        graphics.lineTo(20, 3);
        graphics.stroke();
        
        // 暗影气场（半透明紫色）
        graphics.strokeColor = new Color(75, 0, 130, 100);
        graphics.lineWidth = 1;
        graphics.circle(0, 0, 30);
        graphics.stroke();
    }
    
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
            text: this.unitName || "俄罗斯蓝猫刺客",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 140, height: 24 }  // 增加宽度以容纳完整名称
        };
    }
}