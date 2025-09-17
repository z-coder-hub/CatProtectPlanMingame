import { _decorator, Color, Graphics, Node, tween } from 'cc';
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
        // 使用基类的统一动画初始化
        this.initializeDefaultAnimation();
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
            tween(this.node)
                .delay(index * 0.1) // 间隔0.1秒发射
                .call(() => {
                    if (target && target.isValid && this.node && this.node.isValid) {
                        ProjectileSystem.CreatePhysicalBullet(this, target.position);
                    }
                })
                .start();
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
        
        tween(effectNode)
            .delay(0.3)
            .call(() => {
                if (effectNode && effectNode.isValid) {
                    effectNode.destroy();
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

    // 实现BaseHero的抽象方法 - 获取placed图片路径
    protected getPlacedImagePath(): string | null {
        return null; // 暂时没有placed图片资源
    }
}