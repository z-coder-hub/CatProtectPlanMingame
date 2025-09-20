import { _decorator, Color, Graphics, Node, Vec3, tween } from 'cc';
import { BaseHero } from './BaseHero';
import { BaseMouse } from '../enemies/BaseMouse';
import { HeroType } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { BattleManager } from '../../managers/BattleManager';

const { ccclass } = _decorator;

@ccclass('NorwegianIce')
export class NorwegianIce extends BaseHero {
    
    public readonly heroType: HeroType = HeroType.NORWEGIAN_ICE;
    
    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.NORWEGIAN_ICE];
        
        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 350;
        this.cost = config.cost;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        // 现在使用白色圆点显示，无需自定义绘制
        // 冰霜法师使用白色圆点（无placed资源）
    }
    
    // 目标分配由 BattleManager 统一处理
    
    protected onAttack(target: Node): void {
        if (!target || !this.isAlive) return;
        
        // 冰霜AOE攻击
        const battleManager = BattleManager.instance;
        if (battleManager) {
            const enemies = battleManager.GetEnemiesInRange(target.position, 80);
            
            for (const enemy of enemies) {
                const enemyUnit = enemy.getComponent(BaseMouse);
                if (enemyUnit && enemyUnit.isAlive) {
                    enemyUnit.takeDamage(this.attackDamage);
                    
                    // 减速效果（降低移动速度）
                    const originalSpeed = enemyUnit.moveSpeed;
                    enemyUnit.moveSpeed *= 0.5;
                    
                    // 3秒后恢复速度
                    this.scheduleOnce(() => {
                        if (enemyUnit && enemyUnit.isAlive) {
                            enemyUnit.moveSpeed = originalSpeed;
                        }
                    }, 3.0);
                }
            }
        }
        
        this.createIceEffect(target.position);
    }
    
    
    private createIceEffect(position: Vec3): void {
        const effectNode = new Node("IceEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.fillColor = new Color(173, 216, 230, 150);
        effectGraphics.circle(0, 0, 80);
        effectGraphics.fill();
        
        // 效果动画 - 使用tween系统
        const initialOpacity = 150;
        const animationDuration = (initialOpacity / 10) * 0.016; // 根据原始逻辑计算时间
        
        // 使用tween创建淡入动画
        tween({ opacity: initialOpacity })
            .to(animationDuration, { opacity: 0 }, {
                onUpdate: (_target: any, ratio: number) => {
                    if (!effectGraphics || !effectNode.isValid) return;
                    
                    const currentOpacity = initialOpacity - (initialOpacity * ratio);
                    
                    if (currentOpacity > 0) {
                        effectGraphics.clear();
                        effectGraphics.fillColor = new Color(173, 216, 230, Math.max(0, currentOpacity));
                        effectGraphics.circle(0, 0, 80);
                        effectGraphics.fill();
                    }
                },
                onComplete: () => {
                    if (effectNode && effectNode.isValid) {
                        effectNode.destroy();
                    }
                }
            })
            .start();
    }
    
    // 重写标签配置，使用完整英雄名称
    protected getHeroLabelConfig() {
        return {
            text: this.unitName || "冰霜法师",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 140, height: 24 }  // 增加宽度以容纳完整名称
        };
    }

    // 实现BaseHero的抽象方法 - 获取placed图片路径
    protected getPlacedImagePath(): string | null {
        return null; // 暂时没有placed图片资源
    }
}