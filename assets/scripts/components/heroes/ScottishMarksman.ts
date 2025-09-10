import { _decorator, Color, Graphics, Node } from 'cc';
import { BaseHero } from './BaseHero';
import { HeroType } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { BattleManager } from '../../managers/BattleManager';
import { ProjectileSystem } from '../../projectiles/ProjectileSystem';

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
        
        // 使用投射物系统进行多重锁定攻击
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
        
        // 使用投射物系统对每个目标发射精确物理子弹
        selectedTargets.forEach((target, index) => {
            this.scheduleOnce(() => {
                if (target && target.isValid) {
                    ProjectileSystem.CreatePhysicalBullet(this, target.position);
                }
            }, index * 0.1); // 间隔0.1秒发射
        });
        
        this.createAttackEffect();
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