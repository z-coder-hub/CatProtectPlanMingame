import { _decorator, Color, Graphics, Node, tween, Vec3 } from 'cc';
import { BaseHero } from './BaseHero';
import { BaseMouse } from '../enemies/BaseMouse';
import { HeroType, HeroState } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { BattleManager } from '../../managers/BattleManager';

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
        this.skillCooldown = config.skillCooldown || 8;
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
        
        // 发射5支魔法箭
        for (let i = 0; i < arrowCount; i++) {
            this.scheduleOnce(() => {
                this.fireMagicArrow(i, arrowCount, validTargets);
            }, i * 0.05); // 间隔0.05秒发射
        }
        
        this.createAttackEffect();
    }
    
    private fireMagicArrow(index: number, total: number, targets: Node[]): void {
        const arrow = new Node("MagicArrow");
        arrow.parent = this.node.parent;
        arrow.setPosition(this.node.position);
        
        const graphics = arrow.addComponent(Graphics);
        graphics.fillColor = new Color(138, 43, 226, 255); // 紫色魔法箭
        graphics.strokeColor = new Color(255, 215, 0, 200); // 金色边框
        graphics.lineWidth = 1;
        
        // 绘制箭头形状
        graphics.moveTo(0, 0);
        graphics.lineTo(12, -2);
        graphics.lineTo(8, 0);
        graphics.lineTo(12, 2);
        graphics.closePath();
        graphics.fill();
        graphics.stroke();
        
        // 计算箭的飞行方向（扇形分散）
        const fanAngle = Math.PI / 3; // 60度扇形
        const angleStep = fanAngle / (total - 1);
        const arrowAngle = -fanAngle / 2 + (index * angleStep);
        
        // 目标位置（优先选择范围内的敌人，否则飞向扇形边缘）
        let targetPos: Vec3;
        if (targets.length > 0) {
            const targetIndex = index % targets.length;
            targetPos = targets[targetIndex].position.clone();
        } else {
            const distance = this.attackRange;
            targetPos = new Vec3(
                this.node.position.x + distance * Math.cos(arrowAngle),
                this.node.position.y + distance * Math.sin(arrowAngle),
                0
            );
        }
        
        const distance = Vec3.distance(this.node.position, targetPos);
        const duration = distance / this.bulletSpeed;
        
        // 箭的飞行动画
        tween(arrow)
            .to(duration, { position: targetPos })
            .call(() => {
                // 检查命中的敌人
                if (targets.length > 0) {
                    const hitTarget = targets.find(target => 
                        Vec3.distance(target.position, targetPos) < 30
                    );
                    
                    if (hitTarget) {
                        const targetUnit = hitTarget.getComponent(BaseMouse);
                        if (targetUnit && targetUnit.isAlive) {
                            targetUnit.takeDamage(this.attackDamage);
                            this.createHitEffect(targetPos);
                        }
                    }
                }
                
                if (arrow && arrow.isValid) {
                    arrow.destroy();
                }
            })
            .start();
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
    
    private createHitEffect(position: Vec3): void {
        const hitNode = new Node("HitEffect");
        hitNode.parent = this.node.parent;
        hitNode.setPosition(position);
        
        const hitGraphics = hitNode.addComponent(Graphics);
        hitGraphics.fillColor = new Color(138, 43, 226, 200);
        
        // 魔法爆炸效果
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const x = 8 * Math.cos(angle);
            const y = 8 * Math.sin(angle);
            hitGraphics.circle(x, y, 3);
        }
        hitGraphics.fill();
        
        // 闪烁消失效果
        tween({ scale: 1, opacity: 200 })
            .to(0.3, { scale: 1.5, opacity: 0 }, {
                onUpdate: (target: any, ratio: number) => {
                    if (!hitGraphics || !hitNode.isValid) return;
                    const currentOpacity = 200 - (200 * ratio);
                    const currentScale = 1 + (0.5 * ratio);
                    hitNode.setScale(currentScale, currentScale, 1);
                    hitGraphics.fillColor = new Color(138, 43, 226, currentOpacity);
                },
                onComplete: () => {
                    if (hitNode && hitNode.isValid) {
                        hitNode.destroy();
                    }
                }
            })
            .start();
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