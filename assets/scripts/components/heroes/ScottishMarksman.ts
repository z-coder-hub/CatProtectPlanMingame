import { _decorator, Color, Graphics, Node, tween, Vec3 } from 'cc';
import { BaseHero } from './BaseHero';
import { BaseMouse } from '../enemies/BaseMouse';
import { HeroType, HeroState } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { BattleManager } from '../../managers/BattleManager';

const { ccclass } = _decorator;

@ccclass('ScottishMarksman')
export class ScottishMarksman extends BaseHero {
    
    public readonly heroType: HeroType = HeroType.SCOTTISH_MARKSMAN;
    private _multiTargets: Node[] = [];
    
    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.SCOTTISH_MARKSMAN];
        
        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 400;
        this.skillCooldown = config.skillCooldown || 10;
        this.cost = config.cost;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        this.drawScottishMarksmanAppearance();
    }
    
    protected update(dt: number): void {
        super.update(dt);
        
        // 多重锁定逻辑会在攻击时处理
    }
    
    private drawScottishMarksmanAppearance(): void {
        const graphics = this.getGraphics();
        if (!graphics) return;
        
        graphics.clear();
        
        // 绘制苏格兰折耳猫身体（深橙色圆形）
        graphics.fillColor = new Color(255, 165, 0); // 深橙色
        graphics.circle(0, 0, 16);
        graphics.fill();
        
        // 射手帽子（绿色）
        graphics.fillColor = new Color(34, 139, 34);
        graphics.rect(-12, -20, 24, 8);
        graphics.fill();
        
        // 弓箭标识（棕色弓）
        graphics.strokeColor = new Color(139, 69, 19);
        graphics.lineWidth = 3;
        graphics.moveTo(-18, -5);
        graphics.quadraticCurveTo(-22, -10, -18, -15);
        graphics.stroke();
        
        // 多重锁定准星
        graphics.strokeColor = new Color(255, 0, 0, 100);
        graphics.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const angle = (i * 120) * Math.PI / 180;
            const x = Math.cos(angle) * 40;
            const y = Math.sin(angle) * 40;
            graphics.circle(x, y, 8);
        }
        graphics.stroke();
    }
    
    protected onAttack(target: Node): void {
        if (!target || !this.isAlive) return;
        
        // 获取多个目标进行精确制导攻击
        this.performMultiTargetAttack();
    }
    
    private performMultiTargetAttack(): void {
        const battleManager = BattleManager.instance;
        if (!battleManager) return;
        
        // 获取范围内的多个目标
        const enemies = battleManager.GetEnemiesInRange(this.node.position, this.attackRange);
        const config = HERO_CONFIGS[HeroType.SCOTTISH_MARKSMAN];
        const maxTargets = config.multiTargets || 3;
        
        // 选择最多3个目标
        const selectedTargets = enemies.slice(0, maxTargets);
        
        // 对每个目标发射制导弹
        selectedTargets.forEach((target, index) => {
            this.scheduleOnce(() => {
                this.fireGuidedProjectile(target);
            }, index * 0.1); // 间隔0.1秒发射
        });
        
        this.createAttackEffect();
    }
    
    private fireGuidedProjectile(target: Node): void {
        if (!target || !target.isValid) return;
        
        const projectile = new Node("GuidedBullet");
        projectile.parent = this.node.parent;
        projectile.setPosition(this.node.position);
        
        const graphics = projectile.addComponent(Graphics);
        graphics.fillColor = new Color(255, 215, 0); // 金色制导弹
        graphics.circle(0, 0, 3);
        graphics.fill();
        
        // 制导弹轨迹动画
        const startPos = this.node.position.clone();
        const targetPos = target.position.clone();
        const distance = Vec3.distance(startPos, targetPos);
        const duration = distance / this.bulletSpeed;
        
        tween(projectile)
            .to(duration, { position: targetPos })
            .call(() => {
                // 命中目标 - 先检查target是否仍然有效
                if (target && target.isValid) {
                    const targetUnit = target.getComponent(BaseMouse);
                    if (targetUnit && targetUnit.isAlive) {
                        targetUnit.takeDamage(this.attackDamage);
                        this.createHitEffect(target.position);
                    }
                }
                
                if (projectile && projectile.isValid) {
                    projectile.destroy();
                }
            })
            .start();
    }
    
    private createAttackEffect(): void {
        const effectNode = new Node("AttackEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.strokeColor = new Color(255, 215, 0, 200);
        effectGraphics.lineWidth = 2;
        
        // 绘制多重锁定效果
        for (let i = 0; i < 3; i++) {
            const angle = (i * 120) * Math.PI / 180;
            const x = Math.cos(angle) * 30;
            const y = Math.sin(angle) * 30;
            effectGraphics.circle(x, y, 10);
        }
        effectGraphics.stroke();
        
        this.scheduleOnce(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 0.3);
    }
    
    private createHitEffect(position: Vec3): void {
        const hitNode = new Node("HitEffect");
        hitNode.parent = this.node.parent;
        hitNode.setPosition(position);
        
        const hitGraphics = hitNode.addComponent(Graphics);
        hitGraphics.strokeColor = new Color(255, 215, 0, 255);
        hitGraphics.lineWidth = 3;
        hitGraphics.moveTo(-8, -8);
        hitGraphics.lineTo(8, 8);
        hitGraphics.moveTo(8, -8);
        hitGraphics.lineTo(-8, 8);
        hitGraphics.stroke();
        
        // 命中闪烁效果
        tween({ opacity: 255 })
            .to(0.2, { opacity: 0 }, {
                onUpdate: (target: any, ratio: number) => {
                    if (!hitGraphics || !hitNode.isValid) return;
                    const currentOpacity = 255 - (255 * ratio);
                    hitGraphics.strokeColor = new Color(255, 215, 0, currentOpacity);
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
            text: this.unitName || "苏格兰折耳猫射手",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 160, height: 24 }
        };
    }
}