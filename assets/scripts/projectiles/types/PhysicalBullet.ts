import { _decorator, Color, Vec3, Node, Graphics, tween } from 'cc';
import { BaseProjectile } from '../BaseProjectile';
import { BaseMouse } from '../../components/enemies/BaseMouse';

const { ccclass, property } = _decorator;

/**
 * 物理子弹投射物
 * 用于：橘猫射手、波斯狙击手、孟加拉猎手、折耳射手
 * 特性：直线飞行，单体伤害，黄色子弹外观
 */
@ccclass('PhysicalBullet')
export class PhysicalBullet extends BaseProjectile {
    
    @property({ tooltip: "暴击几率" })
    public critChance: number = 0;
    
    @property({ tooltip: "暴击倍率" })
    public critMultiplier: number = 1.5;
    
    
    /**
     * 初始化物理子弹的视觉外观
     * 简单的黄色圆点
     */
    protected initializeVisuals(): void {
        if (!this.graphics) return;

        this.graphics.clear();

        // 绘制简单的黄色圆点
        this.graphics.fillColor = new Color(255, 255, 0, 255); // 黄色
        this.graphics.circle(0, 0, 4);
        this.graphics.fill();
    }
    
    /**
     * 处理击中目标的逻辑
     * 物理子弹造成单体物理伤害，可能触发暴击
     */
    protected onHitTarget(target: BaseMouse): void {
        if (!target || !target.isAlive) return;
        
        // 计算最终伤害（考虑暴击）
        let finalDamage = this.damage;
        
        if (this.critChance > 0 && Math.random() < this.critChance) {
            finalDamage *= this.critMultiplier;
            console.log(`[PhysicalBullet] 暴击！伤害: ${finalDamage}`);
            
            // 暴击时创建特殊效果
            this.createCriticalHitEffect(this.node.position);
        }
        
        // 对目标造成伤害
        target.takeDamage(finalDamage);
        
        console.log(`[PhysicalBullet] 击中目标 ${target.unitName}，造成 ${finalDamage} 伤害`);
    }
    
    /**
     * 创建击中特效
     * 物理子弹的黄色爆炸特效
     */
    protected createHitEffect(position: Vec3): void {
        if (!this.node.parent) return;
        
        const effectNode = new Node("PhysicalBulletHitEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        
        // 创建黄色爆炸圆圈 - 放大1.7倍
        effectGraphics.fillColor = new Color(255, 255, 0, 150);
        effectGraphics.circle(0, 0, 25.5);
        effectGraphics.fill();

        // 添加白色中心点 - 放大1.7倍
        effectGraphics.fillColor = new Color(255, 255, 255, 200);
        effectGraphics.circle(0, 0, 13.6);
        effectGraphics.fill();
        
        // 特效持续0.2秒后销毁
        tween(effectNode)
            .delay(0.2)
            .call(() => {
                if (effectNode && effectNode.isValid) {
                    effectNode.destroy();
                }
            })
            .start();
    }
    
    /**
     * 创建暴击特效
     * 更大更亮的黄色爆炸效果
     */
    private createCriticalHitEffect(position: Vec3): void {
        if (!this.node.parent) return;
        
        const critEffectNode = new Node("CriticalHitEffect");
        critEffectNode.parent = this.node.parent;
        critEffectNode.setPosition(position);
        
        const critGraphics = critEffectNode.addComponent(Graphics);
        
        // 创建更大的橙红色爆炸圆圈 - 放大1.7倍
        critGraphics.fillColor = new Color(255, 140, 0, 180);
        critGraphics.circle(0, 0, 42.5);
        critGraphics.fill();

        // 添加亮黄色中心 - 放大1.7倍
        critGraphics.fillColor = new Color(255, 255, 100, 220);
        critGraphics.circle(0, 0, 25.5);
        critGraphics.fill();

        // 添加白色核心 - 放大1.7倍
        critGraphics.fillColor = new Color(255, 255, 255, 255);
        critGraphics.circle(0, 0, 13.6);
        critGraphics.fill();
        
        // 暴击特效持续0.3秒
        tween(critEffectNode)
            .delay(0.3)
            .call(() => {
                if (critEffectNode && critEffectNode.isValid) {
                    critEffectNode.destroy();
                }
            })
            .start();
    }
    
    /**
     * 检查是否可以击中指定目标
     * 物理子弹可以击中所有敌人，无特殊限制
     */
    protected canHitTarget(target: BaseMouse): boolean {
        return target && target.isAlive;
    }
    
    /**
     * 设置暴击属性
     * 波斯狙击手等英雄会设置暴击属性
     */
    public setCriticalProperties(critChance: number, critMultiplier: number): void {
        this.critChance = Math.max(0, Math.min(1, critChance)); // 限制在0-1之间
        this.critMultiplier = Math.max(1, critMultiplier); // 至少1倍伤害
    }
    
    /**
     * 获取实际伤害（考虑暴击期望）
     */
    public get expectedDamage(): number {
        return this.damage * (1 + this.critChance * (this.critMultiplier - 1));
    }

    /**
     * 获取物理子弹投射物配置
     */
    protected getProjectileConfig(): {
        maxRange?: number;
        hitRadius?: number;
        [key: string]: any;
    } {
        return {
            // 使用默认配置，无需特殊设置
        };
    }
}