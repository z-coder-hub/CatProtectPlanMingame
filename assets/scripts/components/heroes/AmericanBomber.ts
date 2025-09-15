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
        this.initializeVisuals();
    }

    // 继承父类start()方法，无需重写
    protected update(dt: number): void {
        super.update(dt);
    }


    private initializeVisuals(): void {
        // 使用基类BaseHero的_graphics属性
        // this._graphics由BaseHero管理
        this.drawAmericanBomberAppearance();
    }

    private drawAmericanBomberAppearance(): void {
        const graphics = this.getGraphics();
        if (!graphics) return;

        graphics.clear();

        // 绘制美国短毛猫爆破手身体（红白蓝三色，更紧凑的近战造型）
        // 红色底部
        graphics.fillColor = new Color(220, 20, 60); // 深红色
        graphics.rect(-16, -16, 32, 11);
        graphics.fill();

        // 白色中部
        graphics.fillColor = new Color(255, 255, 255);
        graphics.rect(-16, -5, 32, 10);
        graphics.fill();

        // 蓝色顶部
        graphics.fillColor = new Color(0, 0, 139); // 深蓝色
        graphics.rect(-16, 5, 32, 11);
        graphics.fill();

        // 边框
        graphics.strokeColor = new Color(0, 0, 0);
        graphics.lineWidth = 2;
        graphics.rect(-16, -16, 32, 32);
        graphics.stroke();

        // 爆破手护目镜（黄色）
        graphics.fillColor = new Color(255, 215, 0);
        graphics.circle(0, -8, 5);
        graphics.fill();

        // 护目镜反光
        graphics.fillColor = new Color(255, 255, 255);
        graphics.circle(-2, -10, 2);
        graphics.fill();

        // 手雷（左右各一个，绿色）
        graphics.fillColor = new Color(34, 139, 34);
        graphics.circle(-12, 8, 4);
        graphics.circle(12, 8, 4);
        graphics.fill();

        // 手雷引线
        graphics.strokeColor = new Color(255, 255, 0);
        graphics.lineWidth = 1;
        graphics.moveTo(-12, 4);
        graphics.lineTo(-12, 0);
        graphics.moveTo(12, 4);
        graphics.lineTo(12, 0);
        graphics.stroke();

        // 爆炸范围指示圆（半透明橙色）
        graphics.strokeColor = new Color(255, 69, 0, 100);
        graphics.lineWidth = 1;
        const range = this.attackRange * 0.4; // 显示攻击范围的40%
        graphics.circle(0, 0, range);
        graphics.stroke();
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
            text: this.unitName || "美国短毛猫爆破手",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 160, height: 24 }  // 增加宽度以容纳完整名称
        };
    }
}
