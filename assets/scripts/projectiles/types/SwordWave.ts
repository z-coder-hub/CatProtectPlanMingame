import { _decorator, Color, Vec3, Node, Graphics, Component } from 'cc';
import { BaseProjectile } from '../BaseProjectile';
import { BaseMouse } from '../../components/enemies/BaseMouse';
import { GameManager } from '../../managers/GameManager';

const { ccclass, property } = _decorator;

/**
 * 剑气投射物
 * 用于：英国短毛猫骑士、布偶猫守护者
 * 特性：近程投射物，扇形攻击范围，银白色剑光效果
 */
@ccclass('SwordWave')
export class SwordWave extends BaseProjectile {
    
    @property({ tooltip: "冲锋伤害倍率" })
    public chargeMultiplier: number = 1.5;
    
    @property({ tooltip: "前方扇形攻击角度" })
    public attackAngle: number = 60; // 度数
    
    @property({ tooltip: "前方攻击范围" })
    public frontRange: number = 120;
    
    private isChargedAttack: boolean = false;
    
    protected onLoad(): void {
        super.onLoad();
        // 剑气的飞行距离较短
        this.maxRange = 150;
        this.hitRadius = 35; // 更大的碰撞检测范围
    }
    
    /**
     * 初始化剑气的视觉外观
     * 银白色剑形光波，带有锋利感
     */
    protected initializeVisuals(): void {
        if (!this.graphics) return;
        
        this.graphics.clear();
        
        // 剑气主体（银白色）
        this.graphics.fillColor = new Color(220, 220, 255, 200); // 银白色
        // 绘制剑形
        this.graphics.moveTo(0, -8);
        this.graphics.lineTo(12, 0);
        this.graphics.lineTo(0, 8);
        this.graphics.lineTo(-8, 0);
        this.graphics.close();
        this.graphics.fill();
        
        // 剑锋（亮白色）
        this.graphics.fillColor = new Color(255, 255, 255, 255);
        this.graphics.moveTo(0, -4);
        this.graphics.lineTo(8, 0);
        this.graphics.lineTo(0, 4);
        this.graphics.lineTo(-4, 0);
        this.graphics.close();
        this.graphics.fill();
        
        // 剑气边框（蓝白色）
        this.graphics.strokeColor = new Color(200, 200, 255, 255);
        this.graphics.lineWidth = 2;
        this.graphics.moveTo(0, -8);
        this.graphics.lineTo(12, 0);
        this.graphics.lineTo(0, 8);
        this.graphics.lineTo(-8, 0);
        this.graphics.close();
        this.graphics.stroke();
    }
    
    /**
     * 处理击中目标的逻辑
     * 剑气可以攻击前方扇形范围内的多个敌人
     */
    protected onHitTarget(target: BaseMouse): void {
        if (!target || !target.isAlive) return;
        
        // 计算伤害（考虑冲锋状态）
        let finalDamage = this.damage;
        if (this.isChargedAttack) {
            finalDamage *= this.chargeMultiplier;
            console.log(`[SwordWave] 冲锋剑气攻击！伤害: ${finalDamage}`);
        }
        
        // 对主目标造成伤害
        target.takeDamage(finalDamage);
        console.log(`[SwordWave] 击中目标 ${target.unitName}，造成 ${finalDamage} 伤害`);
        
        // 前方扇形范围攻击
        this.performFrontalAttack(this.node.position, finalDamage * 0.7); // 范围伤害70%
    }
    
    /**
     * 执行前方扇形攻击
     * 攻击剑气前方扇形范围内的所有敌人
     */
    private performFrontalAttack(centerPosition: Vec3, damage: number): void {
        const gameManager = GameManager.instance;
        if (!gameManager || !gameManager.activeEnemies) return;
        
        let hitCount = 0;
        
        for (const enemy of gameManager.activeEnemies) {
            if (!enemy || !enemy.isValid) continue;
            
            const enemyComponent = enemy.getComponent(BaseMouse);
            if (!enemyComponent || !enemyComponent.isAlive) continue;
            
            // 计算距离和角度
            const distance = Vec3.distance(centerPosition, enemy.position);
            if (distance > this.frontRange) continue;
            
            // 计算角度是否在扇形范围内
            const directionToEnemy = Vec3.subtract(new Vec3(), enemy.position, centerPosition);
            const angle = Math.atan2(directionToEnemy.y, directionToEnemy.x) * 180 / Math.PI;
            const frontDirection = Math.atan2(this.direction.y, this.direction.x) * 180 / Math.PI;
            
            let angleDiff = Math.abs(angle - frontDirection);
            if (angleDiff > 180) angleDiff = 360 - angleDiff;
            
            if (angleDiff <= this.attackAngle / 2) {
                // 在扇形范围内，造成伤害
                enemyComponent.takeDamage(damage);
                hitCount++;
                
                // 为每个被范围攻击的敌人创建特效
                this.createFrontalHitEffect(enemy.position);
            }
        }
        
        if (hitCount > 0) {
            console.log(`[SwordWave] 前方扇形攻击击中 ${hitCount} 个目标，每个造成 ${damage} 伤害`);
        }
    }
    
    /**
     * 创建击中特效
     * 剑气的银白色光芒爆炸效果
     */
    protected createHitEffect(position: Vec3): void {
        if (!this.node.parent) return;
        
        const effectNode = new Node("SwordWaveHitEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        
        // 主要爆炸效果（银白色十字光）
        effectGraphics.strokeColor = new Color(255, 255, 255, 255);
        effectGraphics.lineWidth = 4;
        // 十字剑光
        effectGraphics.moveTo(-25, 0);
        effectGraphics.lineTo(25, 0);
        effectGraphics.moveTo(0, -25);
        effectGraphics.lineTo(0, 25);
        effectGraphics.stroke();
        
        // 外层光晕
        effectGraphics.fillColor = new Color(220, 220, 255, 150);
        effectGraphics.circle(0, 0, 20);
        effectGraphics.fill();
        
        // 内层亮光
        effectGraphics.fillColor = new Color(255, 255, 255, 200);
        effectGraphics.circle(0, 0, 12);
        effectGraphics.fill();
        
        // 剑气特效持续0.3秒
        const tempComponent = effectNode.addComponent(Component);
        tempComponent.scheduleOnce(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 0.3);
    }
    
    /**
     * 创建前方范围攻击的小型特效
     */
    private createFrontalHitEffect(position: Vec3): void {
        if (!this.node.parent) return;
        
        const frontalEffectNode = new Node("FrontalHitEffect");
        frontalEffectNode.parent = this.node.parent;
        frontalEffectNode.setPosition(position);
        
        const frontalGraphics = frontalEffectNode.addComponent(Graphics);
        
        // 小型剑光特效
        frontalGraphics.strokeColor = new Color(255, 255, 255, 200);
        frontalGraphics.lineWidth = 2;
        frontalGraphics.moveTo(-10, 0);
        frontalGraphics.lineTo(10, 0);
        frontalGraphics.stroke();
        
        frontalGraphics.fillColor = new Color(220, 220, 255, 150);
        frontalGraphics.circle(0, 0, 8);
        frontalGraphics.fill();
        
        // 前方特效持续0.15秒
        const tempComponent2 = frontalEffectNode.addComponent(Component);
        tempComponent2.scheduleOnce(() => {
            if (frontalEffectNode && frontalEffectNode.isValid) {
                frontalEffectNode.destroy();
            }
        }, 0.15);
    }
    
    /**
     * 检查是否可以击中指定目标
     * 剑气可以击中所有敌人
     */
    protected canHitTarget(target: BaseMouse): boolean {
        return target && target.isAlive;
    }
    
    /**
     * 设置冲锋状态
     * 骑士类英雄在冲锋状态下发射剑气会有额外伤害
     */
    public setChargedAttack(isCharged: boolean, multiplier: number = 1.5): void {
        this.isChargedAttack = isCharged;
        this.chargeMultiplier = Math.max(1, multiplier);
    }
    
    /**
     * 设置前方攻击属性
     */
    public setFrontalProperties(angle: number, range: number): void {
        this.attackAngle = Math.max(30, Math.min(120, angle)); // 限制在30-120度之间
        this.frontRange = Math.max(50, range);
    }
    
    /**
     * 获取预期范围伤害
     */
    public get expectedFrontalDamage(): number {
        const baseDamage = this.damage * (this.isChargedAttack ? this.chargeMultiplier : 1);
        return baseDamage * 0.7; // 范围伤害是70%
    }
}