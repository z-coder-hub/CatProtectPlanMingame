import { _decorator, Color, Graphics, Node, Vec3 } from 'cc';
import { BaseHero } from './BaseHero';
import { HeroType } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { BattleManager } from '../../managers/BattleManager';
import { ProjectileSystem } from '../../projectiles/ProjectileSystem';

const { ccclass } = _decorator;

@ccclass('AbyssinianArcher')
export class AbyssinianArcher extends BaseHero {
    
    public readonly heroType: HeroType = HeroType.ABYSSINIAN_ARCHER;
    
    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.ABYSSINIAN_ARCHER];
        
        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 300;
        this.cost = config.cost;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        this.drawAbyssinianArcherAppearance();
    }
    
    private drawAbyssinianArcherAppearance(): void {
        const graphics = this.getGraphics();
        if (!graphics) return;
        
        graphics.clear();
        
        // 绘制阿比西尼亚猫身体（深棕色六边形）
        graphics.fillColor = new Color(139, 69, 19); // 深棕色
        const sides = 6;
        const radius = 16;
        graphics.moveTo(radius, 0);
        for (let i = 1; i <= sides; i++) {
            const angle = (i * 2 * Math.PI) / sides;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            graphics.lineTo(x, y);
        }
        graphics.fill();
        
        // 弓箭手头盔（深绿色）
        graphics.fillColor = new Color(0, 100, 0);
        graphics.rect(-14, -22, 28, 10);
        graphics.fill();
        
        // 羽毛装饰（红色）
        graphics.fillColor = new Color(220, 20, 60);
        graphics.circle(-12, -18, 3);
        graphics.circle(-8, -20, 2);
        graphics.fill();
        
        // 魔法弓（紫色，带魔法光效）
        graphics.strokeColor = new Color(138, 43, 226);
        graphics.lineWidth = 3;
        graphics.moveTo(-20, -5);
        graphics.quadraticCurveTo(-25, -10, -20, -15);
        graphics.stroke();
        
        // 扇形攻击范围指示
        graphics.strokeColor = new Color(138, 43, 226, 80);
        graphics.lineWidth = 1;
        const fanAngle = Math.PI / 3; // 60度扇形
        const fanRadius = this.attackRange * 0.3; // 显示范围的30%
        for (let i = -2; i <= 2; i++) {
            const angle = (i * fanAngle) / 4;
            const x = fanRadius * Math.cos(angle);
            const y = fanRadius * Math.sin(angle);
            graphics.moveTo(0, 0);
            graphics.lineTo(x, y);
        }
        graphics.stroke();
    }
    
    protected onAttack(target: Node): void {
        if (!target || !this.isAlive) return;
        
        // 执行扇形箭雨攻击
        this.performArrowRainAttack();
    }
    
    private performArrowRainAttack(): void {
        const battleManager = BattleManager.instance;
        if (!battleManager) return;
        
        const enemies = battleManager.GetEnemiesInRange(this.node.position, this.attackRange);
        const config = HERO_CONFIGS[HeroType.ABYSSINIAN_ARCHER];
        const arrowCount = config.multiShot || 5;
        
        // 计算扇形范围内的敌人
        const fanAngle = Math.PI / 3; // 60度扇形
        const validTargets = enemies.filter(enemy => {
            const direction = Vec3.subtract(new Vec3(), enemy.position, this.node.position);
            const angle = Math.atan2(direction.y, direction.x);
            return Math.abs(angle) <= fanAngle / 2;
        });
        
        // 使用投射物系统发射多发物理子弹模拟箭雨
        for (let i = 0; i < arrowCount; i++) {
            this.scheduleOnce(() => {
                if (validTargets.length > 0) {
                    const targetIndex = i % validTargets.length;
                    const target = validTargets[targetIndex];
                    if (target && target.isValid) {
                        ProjectileSystem.CreatePhysicalBullet(this, target.position);
                    }
                }
            }, i * 0.05); // 间隔0.05秒发射
        }
        
        this.createAttackEffect();
    }
    
    
    private createAttackEffect(): void {
        const effectNode = new Node("AttackEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.strokeColor = new Color(138, 43, 226, 200);
        effectGraphics.lineWidth = 2;
        
        // 绘制扇形攻击效果
        const fanAngle = Math.PI / 3;
        const radius = 50;
        effectGraphics.moveTo(0, 0);
        for (let i = 0; i <= 10; i++) {
            const angle = -fanAngle / 2 + (i * fanAngle) / 10;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            effectGraphics.lineTo(x, y);
        }
        effectGraphics.lineTo(0, 0);
        effectGraphics.stroke();
        
        this.scheduleOnce(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 0.4);
    }
    
    
    // 重写标签配置
    protected getHeroLabelConfig() {
        return {
            text: this.unitName || "阿比西尼亚猫弓箭手",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 160, height: 24 }
        };
    }
}