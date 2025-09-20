import { _decorator, Color, Graphics, Node, tween } from 'cc';
import { ProjectileSystem } from '../../projectiles/ProjectileSystem';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { HeroType } from '../../types/GameTypes';
import { BaseHero } from './BaseHero';

const { ccclass } = _decorator;

@ccclass('AmericanBomber')
export class AmericanBomber extends BaseHero {

    public readonly heroType: HeroType = HeroType.AMERICAN_BOMBER;

    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.AMERICAN_BOMBER];

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
        // 爆破专家使用placed图片：AmericanBomber_placed.png
    }

    // 目标分配由 BattleManager 统一处理

    protected onAttack(target: Node): void {
        if (!target || !this.isAlive) return;

        // 使用投射物系统发射爆炸冲击波
        const config = HERO_CONFIGS[HeroType.AMERICAN_BOMBER];
        const explosionRadius = config.aoeRange || 120;
        const knockbackForce = 50;

        ProjectileSystem.CreateExplosionWave(this, target.position, explosionRadius, knockbackForce);
        this.createAttackEffect();
    }

    private createAttackEffect(): void {
        const effectNode = new Node("AttackEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);

        const effectGraphics = effectNode.addComponent(Graphics);

        // 近战爆破手的发射效果 - 火花四溅
        const sparkColors = [
            new Color(255, 69, 0, 255),   // 橙红色
            new Color(255, 140, 0, 200),  // 橙色
            new Color(255, 215, 0, 150)   // 金色
        ];

        // 绘制火花效果
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const length = 15 + Math.random() * 10;
            const x = length * Math.cos(angle);
            const y = length * Math.sin(angle);

            effectGraphics.strokeColor = sparkColors[i % 3];
            effectGraphics.lineWidth = 2;
            effectGraphics.moveTo(0, 0);
            effectGraphics.lineTo(x, y);
            effectGraphics.stroke();
        }

        // 中心发光效果
        effectGraphics.fillColor = new Color(255, 255, 255, 200);
        effectGraphics.circle(0, 0, 8);
        effectGraphics.fill();

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
            text: this.unitName || "爆破专家",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 160, height: 24 }  // 增加宽度以容纳完整名称
        };
    }

    // 实现BaseHero的抽象方法 - 获取placed图片路径
    protected getPlacedImagePath(): string | null {
        return "images/placed/AmericanBomber_placed";
    }
}