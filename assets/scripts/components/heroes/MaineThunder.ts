import { _decorator, Component, Node, Vec3, Graphics, Color, tween } from 'cc';
import { BaseHero } from './BaseHero';
import { BaseMouse } from '../enemies/BaseMouse';
import { HeroType } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { ProjectileSystem } from '../../projectiles/ProjectileSystem';
import { BattleManager } from '../../managers/BattleManager';

const { ccclass } = _decorator;

@ccclass('MaineThunder')
export class MaineThunder extends BaseHero {
    
    // 英雄类型
    public readonly heroType: HeroType = HeroType.MAINE_THUNDER;
    
    protected onLoad(): void {
        super.onLoad();
    }
    
    // 继承父类start()方法，无需重写
    
    // 实现BaseHero的拽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.MAINE_THUNDER];
        
        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 400;
        this.cost = config.cost;
    }
    
    // 实现BaseHero的拽象方法
    protected initializeHeroVisuals(): void {
        this.initializeVisuals();
    }
    
    // 初始化外观
    private initializeVisuals(): void {
        // 使用基类BaseHero的_graphics属性
        if (!this._graphics) return;
        
        this.drawMaineThunderAppearance(this._graphics);
    }
    
    // 绘制缅因雷猫外观
    private drawMaineThunderAppearance(graphics: Graphics): void {
        graphics.clear();
        
        // 绘制身体和边框（一条路径）
        graphics.rect(-22, -22, 44, 44);
        
        // 填充身体（深蓝色，代表雷电）
        graphics.fillColor = new Color(25, 25, 112); // 深蓝色
        graphics.fill();
        
        // 描边雷电边框（亮蓝色）
        graphics.strokeColor = new Color(0, 191, 255); // 亮蓝色
        graphics.lineWidth = 3;
        graphics.stroke();
        
        // 绘制雷电标识
        graphics.strokeColor = new Color(255, 255, 0); // 黄色闪电
        graphics.lineWidth = 3;
        // 闪电形状
        graphics.moveTo(-10, -15);
        graphics.lineTo(5, -5);
        graphics.lineTo(-5, 0);
        graphics.lineTo(10, 10);
        graphics.stroke();
    }
    
    // 目标分配由 BattleManager 统一处理
    
    protected onAttack(target: Node): void {
        if (!target || !this.isAlive || !target.isValid) return;
        
        // 使用投射物系统发射链式雷电弹
        ProjectileSystem.CreateLightningBolt(this, target.position, 3, 100);
        
        // 创建攻击动画特效
        this.createLightningEffect();
    }
    
    private chainLightningAttack(primaryTarget: Node): void {
        const battleManager = BattleManager.instance;
        if (!battleManager) return;
        
        const nearbyEnemies = battleManager.GetEnemiesInRange(primaryTarget.position, 100);
        const chainDamage = this.attackDamage * 0.6; // 60%的链式伤害
        
        for (const enemy of nearbyEnemies) {
            if (enemy !== primaryTarget && enemy.isValid) {
                const enemyUnit = enemy.getComponent(BaseMouse);
                if (enemyUnit && enemyUnit.isAlive) {
                    enemyUnit.takeDamage(chainDamage);
                    this.createChainLightningEffect(primaryTarget.position, enemy.position);
                }
            }
        }
    }
    
    private createLightningEffect(): void {
        const effectNode = new Node("LightningEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.strokeColor = new Color(255, 255, 0, 200);
        effectGraphics.lineWidth = 4;
        effectGraphics.circle(0, 0, 35);
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
    
    private createChainLightningEffect(from: Vec3, to: Vec3): void {
        const effectNode = new Node("ChainLightningEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(from);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.strokeColor = new Color(0, 191, 255, 150);
        effectGraphics.lineWidth = 3;
        
        const direction = Vec3.subtract(new Vec3(), to, from);
        effectGraphics.moveTo(0, 0);
        effectGraphics.lineTo(direction.x, direction.y);
        effectGraphics.stroke();
        
        tween(effectNode)
            .delay(0.2)
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
            text: this.unitName || "缅因猫雷法",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 110, height: 24 }  // 增加宽度以容纳完整名称
        };
    }
    
    // 已移除多余的performAttack包装方法，直接使用onAttack实现
}