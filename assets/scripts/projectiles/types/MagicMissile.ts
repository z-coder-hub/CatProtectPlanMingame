import { _decorator, Color, Vec3, Node, Graphics } from 'cc';
import { BaseProjectile } from '../BaseProjectile';
import { BaseMouse } from '../../components/enemies/BaseMouse';
import { GameManager } from '../../managers/GameManager';

const { ccclass, property } = _decorator;

/**
 * 魔法弹投射物
 * 用于：暹罗猫法师
 * 特性：火球外观，击中后AOE范围伤害，橙红色特效
 */
@ccclass('MagicMissile')
export class MagicMissile extends BaseProjectile {
    
    @property({ tooltip: "AOE伤害倍率" })
    public aoeDamageMultiplier: number = 1.5;
    
    @property({ tooltip: "AOE攻击范围" })
    public aoeRange: number = 80;
    
    protected onLoad(): void {
        super.onLoad();
    }
    
    /**
     * 初始化魔法弹的视觉外观
     * 橙红色火球，带有火焰效果
     */
    protected initializeVisuals(): void {
        if (!this.graphics) return;
        
        this.graphics.clear();
        
        // 外层火焰（橙红色）
        this.graphics.fillColor = new Color(255, 69, 0, 200); // 橙红色
        this.graphics.circle(0, 0, 5);
        this.graphics.fill();
        
        // 中层火焰（橙色）
        this.graphics.fillColor = new Color(255, 140, 0, 220); // 橙色
        this.graphics.circle(0, 0, 3.5);
        this.graphics.fill();
        
        // 内层火焰（黄色核心）
        this.graphics.fillColor = new Color(255, 255, 0, 255); // 亮黄色
        this.graphics.circle(0, 0, 2);
        this.graphics.fill();
        
        // 添加火焰边框效果
        this.graphics.strokeColor = new Color(255, 0, 0, 150); // 红色边框
        this.graphics.lineWidth = 1;
        this.graphics.circle(0, 0, 5);
        this.graphics.stroke();
    }
    
    /**
     * 处理击中目标的逻辑
     * 魔法弹首先对主目标造成伤害，然后进行AOE伤害
     */
    protected onHitTarget(target: BaseMouse): void {
        if (!target || !target.isAlive) return;
        
        // 对主目标造成全额伤害
        target.takeDamage(this.damage);
        console.log(`[MagicMissile] 击中主目标 ${target.unitName}，造成 ${this.damage} 伤害`);
        
        // 进行AOE伤害
        this.performAOEDamage(this.node.position);
    }
    
    /**
     * 执行AOE范围伤害
     * 对范围内的其他敌人造成AOE伤害
     */
    private performAOEDamage(centerPosition: Vec3): void {
        const gameManager = GameManager.instance;
        if (!gameManager || !gameManager.activeEnemies) return;
        
        const aoeDamage = this.damage * this.aoeDamageMultiplier;
        let hitCount = 0;
        
        for (const enemy of gameManager.activeEnemies) {
            if (!enemy || !enemy.isValid) continue;
            
            const enemyComponent = enemy.getComponent(BaseMouse);
            if (!enemyComponent || !enemyComponent.isAlive) continue;
            
            // 计算距离
            const distance = Vec3.distance(centerPosition, enemy.position);
            
            if (distance <= this.aoeRange) {
                // 在AOE范围内，造成伤害
                enemyComponent.takeDamage(aoeDamage);
                hitCount++;
                
                // 为每个被AOE伤害的敌人创建小型特效
                this.createAOEHitEffect(enemy.position);
            }
        }
        
        if (hitCount > 0) {
            console.log(`[MagicMissile] AOE攻击击中 ${hitCount} 个目标，每个造成 ${aoeDamage} 伤害`);
        }
    }
    
    /**
     * 创建击中特效
     * 魔法弹的火焰爆炸特效，包含AOE范围指示
     */
    protected createHitEffect(position: Vec3): void {
        if (!this.node.parent) return;
        
        const effectNode = new Node("MagicMissileHitEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        
        // 创建大型火焰爆炸效果
        // 外层爆炸（显示AOE范围）
        effectGraphics.fillColor = new Color(255, 69, 0, 100); // 半透明橙红色
        effectGraphics.circle(0, 0, this.aoeRange);
        effectGraphics.fill();
        
        // 中层爆炸
        effectGraphics.fillColor = new Color(255, 140, 0, 150); // 橙色
        effectGraphics.circle(0, 0, 40);
        effectGraphics.fill();
        
        // 内层爆炸
        effectGraphics.fillColor = new Color(255, 255, 0, 200); // 亮黄色
        effectGraphics.circle(0, 0, 20);
        effectGraphics.fill();
        
        // 中心白色闪光
        effectGraphics.fillColor = new Color(255, 255, 255, 255);
        effectGraphics.circle(0, 0, 10);
        effectGraphics.fill();
        
        // AOE范围边框
        effectGraphics.strokeColor = new Color(255, 0, 0, 200);
        effectGraphics.lineWidth = 2;
        effectGraphics.circle(0, 0, this.aoeRange);
        effectGraphics.stroke();
        
        // 火焰特效持续0.4秒
        effectNode.getComponent(MagicMissile)?.scheduleOnce(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 0.4);
    }
    
    /**
     * 创建AOE伤害的小型特效
     * 在被AOE伤害的敌人位置创建小型火焰效果
     */
    private createAOEHitEffect(position: Vec3): void {
        if (!this.node.parent) return;
        
        const aoeEffectNode = new Node("AOEHitEffect");
        aoeEffectNode.parent = this.node.parent;
        aoeEffectNode.setPosition(position);
        
        const aoeGraphics = aoeEffectNode.addComponent(Graphics);
        
        // 小型火焰效果
        aoeGraphics.fillColor = new Color(255, 140, 0, 180);
        aoeGraphics.circle(0, 0, 12);
        aoeGraphics.fill();
        
        aoeGraphics.fillColor = new Color(255, 255, 0, 220);
        aoeGraphics.circle(0, 0, 8);
        aoeGraphics.fill();
        
        // AOE特效持续0.2秒
        aoeEffectNode.getComponent(MagicMissile)?.scheduleOnce(() => {
            if (aoeEffectNode && aoeEffectNode.isValid) {
                aoeEffectNode.destroy();
            }
        }, 0.2);
    }
    
    /**
     * 检查是否可以击中指定目标
     * 魔法弹可以击中所有敌人
     */
    protected canHitTarget(target: BaseMouse): boolean {
        return target && target.isAlive;
    }
    
    /**
     * 设置AOE属性
     * 法师英雄可以配置AOE伤害和范围
     */
    public setAOEProperties(damageMultiplier: number, range: number): void {
        this.aoeDamageMultiplier = Math.max(1, damageMultiplier);
        this.aoeRange = Math.max(30, range);
    }
    
    /**
     * 获取预期AOE伤害
     */
    public get expectedAOEDamage(): number {
        return this.damage * this.aoeDamageMultiplier;
    }
}