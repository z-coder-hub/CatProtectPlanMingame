import { _decorator, Component, Node, Vec3, Graphics, Color } from 'cc';
import { BaseHero } from './BaseHero';
import { BaseMouse } from '../enemies/BaseMouse';
import { HeroType } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { BattleManager } from '../../managers/BattleManager';

const { ccclass } = _decorator;

@ccclass('MaineThunder')
export class MaineThunder extends BaseHero {
    
    // 英雄类型
    public readonly heroType: HeroType = HeroType.MAINE_THUNDER;
    
    protected onLoad(): void {
        super.onLoad();
    }
    
    protected start(): void {
        super.start();
        
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.registerHero(this.node);
        }
    }
    
    // 实现BaseHero的拽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.MAINE_THUNDER];
        
        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 400;
        this.skillCooldown = config.skillCooldown || 10;
        this.cost = config.cost;
    }
    
    // 实现BaseHero的拽象方法
    protected initializeHeroVisuals(): void {
        this.initializeVisuals();
    }
    
    // 初始化外观
    private initializeVisuals(): void {
        let graphics = this.node.addComponent(Graphics);
        
        this.drawMaineThunderAppearance(graphics);
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
    
    protected onIdleState(dt: number): void {
        if (!this.isAlive) return;
        
        const battleManager = BattleManager.instance;
        if (battleManager) {
            const nearestEnemy = battleManager.findNearestEnemy(this.node.position, this.attackRange);
            if (nearestEnemy) {
                this.currentTarget = nearestEnemy;
                this.unitState = 2;
            }
        }
    }
    
    protected onAttack(target: Node): void {
        if (!target || !this.isAlive) return;
        
        // 雷电链式攻击 - 能够弹射到多个敌人
        const targetUnit = target.getComponent(BaseMouse);
        if (targetUnit && targetUnit.isAlive) {
            targetUnit.takeDamage(this.attackDamage);
        }
        
        // 创建闪电特效
        this.createLightningEffect();
        
        // 链式伤害 - 对附近的敌人造成额外伤害
        this.chainLightningAttack(target);
    }
    
    private chainLightningAttack(primaryTarget: Node): void {
        const battleManager = BattleManager.instance;
        if (!battleManager) return;
        
        const nearbyEnemies = battleManager.getEnemiesInRange(primaryTarget.position, 100);
        const chainDamage = this.attackDamage * 0.6; // 60%的链式伤害
        
        for (const enemy of nearbyEnemies) {
            if (enemy !== primaryTarget) {
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
        
        setTimeout(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 400);
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
        
        setTimeout(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 200);
    }
    
    // 实现BaseHero的拽象方法
    protected performAttack(target: Node): void {
        this.onAttack(target);
    }
}