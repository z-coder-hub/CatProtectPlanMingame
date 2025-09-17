import { _decorator, Color, Vec3, Node, Graphics, tween } from 'cc';
import { BaseProjectile } from '../BaseProjectile';
import { BaseMouse } from '../../components/enemies/BaseMouse';
import { BattleManager } from '../../managers/BattleManager';

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
     * 多层火焰设计，魔法符文环绕，能量脉动核心
     */
    protected initializeVisuals(): void {
        if (!this.graphics) return;

        this.graphics.clear();

        // === 绘制五层火焰效果 === - 放大1.6倍

        // 第1层：外层深红火焰（范围最大）
        this.graphics.fillColor = new Color(139, 0, 0, 120); // 深红色，半透明
        this.graphics.circle(0, 0, 10.4);
        this.graphics.fill();

        // 第2层：橙红色火焰
        this.graphics.fillColor = new Color(255, 69, 0, 180); // 橙红色
        this.graphics.circle(0, 0, 8.32);
        this.graphics.fill();

        // 第3层：亮橙色火焰
        this.graphics.fillColor = new Color(255, 140, 0, 200); // 亮橙色
        this.graphics.circle(0, 0, 6.08);
        this.graphics.fill();

        // 第4层：金黄色火焰
        this.graphics.fillColor = new Color(255, 215, 0, 230); // 金黄色
        this.graphics.circle(0, 0, 4);
        this.graphics.fill();

        // 第5层：白色能量核心
        this.graphics.fillColor = new Color(255, 255, 255, 255); // 纯白色核心
        this.graphics.circle(0, 0, 1.92);
        this.graphics.fill();

        // === 魔法符文环绕效果 ===

        // 外层符文环（深红色）- 放大1.6倍
        this.graphics.strokeColor = new Color(200, 50, 50, 200);
        this.graphics.lineWidth = 2.4;
        for (let i = 0; i < 6; i++) {
            const angle = (i * 60) * Math.PI / 180;
            const radius = 11.2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            // 绘制小型符文标记
            this.graphics.circle(x, y, 1.28);
            this.graphics.stroke();

            // 符文连接线
            const nextAngle = ((i + 1) * 60) * Math.PI / 180;
            const nextX = Math.cos(nextAngle) * radius;
            const nextY = Math.sin(nextAngle) * radius;
            this.graphics.moveTo(x, y);
            this.graphics.lineTo(nextX, nextY);
        }
        this.graphics.stroke();

        // 内层能量符文（金色）- 放大1.6倍
        this.graphics.strokeColor = new Color(255, 215, 0, 255);
        this.graphics.lineWidth = 1.6;
        for (let i = 0; i < 4; i++) {
            const angle = (i * 90 + 45) * Math.PI / 180; // 偏移45度
            const radius = 7.2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            // 绘制能量符文
            this.graphics.moveTo(x - 0.8, y - 0.8);
            this.graphics.lineTo(x + 0.8, y + 0.8);
            this.graphics.moveTo(x + 0.8, y - 0.8);
            this.graphics.lineTo(x - 0.8, y + 0.8);
        }
        this.graphics.stroke();

        // === 火焰细节和轮廓 ===

        // 火焰跳动效果（不规则边缘）- 放大1.6倍
        this.graphics.strokeColor = new Color(255, 100, 0, 180);
        this.graphics.lineWidth = 1.28;
        for (let i = 0; i < 8; i++) {
            const angle = (i * 45) * Math.PI / 180;
            const innerRadius = 5.6;
            const outerRadius = 8.8 + Math.random() * 1.28; // 随机火焰长度

            const innerX = Math.cos(angle) * innerRadius;
            const innerY = Math.sin(angle) * innerRadius;
            const outerX = Math.cos(angle) * outerRadius;
            const outerY = Math.sin(angle) * outerRadius;

            this.graphics.moveTo(innerX, innerY);
            this.graphics.lineTo(outerX, outerY);
        }
        this.graphics.stroke();

        // 主体火球轮廓 - 放大1.6倍
        this.graphics.strokeColor = new Color(255, 0, 0, 200); // 深红色主轮廓
        this.graphics.lineWidth = 1.92;
        this.graphics.circle(0, 0, 8.32);
        this.graphics.stroke();

        // 能量核心轮廓 - 放大1.6倍
        this.graphics.strokeColor = new Color(255, 255, 0, 255); // 黄色核心轮廓
        this.graphics.lineWidth = 1.28;
        this.graphics.circle(0, 0, 1.92);
        this.graphics.stroke();

        // === 魔法能量脉动线 === - 放大1.6倍
        this.graphics.strokeColor = new Color(255, 255, 200, 150);
        this.graphics.lineWidth = 0.8;

        // 从核心向外的能量线
        for (let i = 0; i < 12; i++) {
            const angle = (i * 30) * Math.PI / 180;
            const startRadius = 2.4;
            const endRadius = 5.12;

            const startX = Math.cos(angle) * startRadius;
            const startY = Math.sin(angle) * startRadius;
            const endX = Math.cos(angle) * endRadius;
            const endY = Math.sin(angle) * endRadius;

            this.graphics.moveTo(startX, startY);
            this.graphics.lineTo(endX, endY);
        }
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
        const battleManager = BattleManager.instance;
        if (!battleManager) return;

        const aoeDamage = this.damage * this.aoeDamageMultiplier;
        let hitCount = 0;

        const enemies = battleManager.getAllActiveEnemies();
        for (const enemy of enemies) {
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
        
        // 创建大型火焰爆炸效果 - 放大1.6倍
        // 外层爆炸（显示AOE范围）
        effectGraphics.fillColor = new Color(255, 69, 0, 100); // 半透明橙红色
        effectGraphics.circle(0, 0, this.aoeRange);
        effectGraphics.fill();

        // 中层爆炸
        effectGraphics.fillColor = new Color(255, 140, 0, 150); // 橙色
        effectGraphics.circle(0, 0, 64);
        effectGraphics.fill();

        // 内层爆炸
        effectGraphics.fillColor = new Color(255, 255, 0, 200); // 亮黄色
        effectGraphics.circle(0, 0, 32);
        effectGraphics.fill();

        // 中心白色闪光
        effectGraphics.fillColor = new Color(255, 255, 255, 255);
        effectGraphics.circle(0, 0, 16);
        effectGraphics.fill();

        // AOE范围边框
        effectGraphics.strokeColor = new Color(255, 0, 0, 200);
        effectGraphics.lineWidth = 3.2;
        effectGraphics.circle(0, 0, this.aoeRange);
        effectGraphics.stroke();
        
        // 火焰特效持续0.4秒
        tween(effectNode)
            .delay(0.4)
            .call(() => {
                if (effectNode && effectNode.isValid) {
                    effectNode.destroy();
                }
            })
            .start();
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
        
        // 小型火焰效果 - 放大1.6倍
        aoeGraphics.fillColor = new Color(255, 140, 0, 180);
        aoeGraphics.circle(0, 0, 19.2);
        aoeGraphics.fill();

        aoeGraphics.fillColor = new Color(255, 255, 0, 220);
        aoeGraphics.circle(0, 0, 12.8);
        aoeGraphics.fill();
        
        // AOE特效持续0.2秒
        tween(aoeEffectNode)
            .delay(0.2)
            .call(() => {
                if (aoeEffectNode && aoeEffectNode.isValid) {
                    aoeEffectNode.destroy();
                }
            })
            .start();
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