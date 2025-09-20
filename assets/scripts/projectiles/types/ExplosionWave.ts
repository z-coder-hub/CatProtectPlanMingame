import { _decorator, Color, Vec3, Node, Graphics, tween } from 'cc';
import { BaseProjectile } from '../BaseProjectile';
import { BaseMouse } from '../../components/enemies/BaseMouse';
import { BattleManager } from '../../managers/BattleManager';

const { ccclass, property } = _decorator;

/**
 * 爆炸冲击波投射物
 * 用于：美国短毛猫爆破手、俄罗斯蓝猫刺客（近战爆破）
 * 特性：短程投射物，大范围爆炸伤害，橙色冲击波，推拽效果
 */
@ccclass('ExplosionWave')
export class ExplosionWave extends BaseProjectile {
    
    @property({ tooltip: "爆炸半径" })
    public explosionRadius: number = 120;
    
    @property({ tooltip: "核心爆炸伤害倍率" })
    public coreExplosionMultiplier: number = 1.5; // 爆炸中心150%伤害
    
    @property({ tooltip: "边缘爆炸伤害倍率" })
    public edgeExplosionMultiplier: number = 0.7; // 爆炸边缘70%伤害
    
    @property({ tooltip: "推拽效果强度" })
    public knockbackForce: number = 50;
    
    /**
     * 获取爆炸冲击波投射物配置
     */
    protected getProjectileConfig(): {
        maxRange?: number;
        hitRadius?: number;
        [key: string]: any;
    } {
        return {
            maxRange: 200,  // 爆炸冲击波是近程投射物
            hitRadius: 40   // 触发爆炸的碰撞范围 - 放大1.6倍以匹配视觉尺寸
        };
    }
    
    /**
     * 初始化爆炸冲击波的视觉外观
     * 高压能量球，不稳定脉动，危险警告效果，压力波环绕
     */
    protected initializeVisuals(): void {
        if (!this.graphics) return;

        this.graphics.clear();

        // === 绘制危险警告区域 === - 放大1.6倍

        // 外层危险警告（闪烁红色）
        this.graphics.fillColor = new Color(220, 20, 60, 60); // 深红色警告区
        this.graphics.circle(0, 0, 16);
        this.graphics.fill();

        // 中层压力场（橙红色）
        this.graphics.fillColor = new Color(255, 69, 0, 100); // 橙红色压力场
        this.graphics.circle(0, 0, 13.6);
        this.graphics.fill();

        // === 绘制能量压缩层次 === - 放大1.6倍

        // 第1层：外层能量波（暗橙色）
        this.graphics.fillColor = new Color(255, 69, 0, 180); // 橙红色
        this.graphics.circle(0, 0, 11.2);
        this.graphics.fill();

        // 第2层：压缩能量（亮橙色）
        this.graphics.fillColor = new Color(255, 140, 0, 200); // 亮橙色
        this.graphics.circle(0, 0, 8.8);
        this.graphics.fill();

        // 第3层：高压核心（金黄色）
        this.graphics.fillColor = new Color(255, 215, 0, 240); // 金黄色
        this.graphics.circle(0, 0, 6.4);
        this.graphics.fill();

        // 第4层：能量聚集点（白金色）
        this.graphics.fillColor = new Color(255, 255, 200, 255); // 白金色
        this.graphics.circle(0, 0, 4);
        this.graphics.fill();

        // 第5层：不稳定核心（纯白）
        this.graphics.fillColor = new Color(255, 255, 255, 255); // 纯白核心
        this.graphics.circle(0, 0, 2.4);
        this.graphics.fill();

        // === 压力波纹效果 === - 放大1.6倍

        // 多层压力波环
        this.graphics.strokeColor = new Color(255, 0, 0, 150);
        this.graphics.lineWidth = 2.4;
        for (let i = 0; i < 4; i++) {
            const radius = 14.4 + i * 3.2;
            this.graphics.circle(0, 0, radius);
        }
        this.graphics.stroke();

        // 内层冲击波
        this.graphics.strokeColor = new Color(255, 140, 0, 200);
        this.graphics.lineWidth = 1.2;
        this.graphics.circle(0, 0, 6.5);
        this.graphics.circle(0, 0, 8);
        this.graphics.stroke();

        // === 能量不稳定效果 ===

        // 随机能量溢出点
        this.graphics.fillColor = new Color(255, 255, 0, 220);
        for (let i = 0; i < 8; i++) {
            const angle = (i * 45) * Math.PI / 180;
            const distance = 3.5 + Math.random() * 2;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            const size = 0.4 + Math.random() * 0.5;

            this.graphics.circle(x, y, size);
            this.graphics.fill();
        }

        // 能量裂缝（从核心向外的不规则线）
        this.graphics.strokeColor = new Color(255, 255, 255, 180);
        this.graphics.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            const angle = (i * 60 + Math.random() * 20 - 10) * Math.PI / 180;
            const startRadius = 1.8;
            const midRadius = 3.5 + Math.random() * 1;
            const endRadius = 5.5 + Math.random() * 1.5;

            const startX = Math.cos(angle) * startRadius;
            const startY = Math.sin(angle) * startRadius;
            const midX = Math.cos(angle + 0.2) * midRadius; // 轻微弯曲
            const midY = Math.sin(angle + 0.2) * midRadius;
            const endX = Math.cos(angle) * endRadius;
            const endY = Math.sin(angle) * endRadius;

            this.graphics.moveTo(startX, startY);
            this.graphics.lineTo(midX, midY);
            this.graphics.lineTo(endX, endY);
        }
        this.graphics.stroke();

        // === 危险火花放射 ===

        // 主要火花爆射（大型十字）
        this.graphics.strokeColor = new Color(255, 255, 0, 255);
        this.graphics.lineWidth = 2.5;

        // 强力十字火花
        this.graphics.moveTo(-12, 0);
        this.graphics.lineTo(-7, 0);
        this.graphics.moveTo(7, 0);
        this.graphics.lineTo(12, 0);
        this.graphics.moveTo(0, -12);
        this.graphics.lineTo(0, -7);
        this.graphics.moveTo(0, 7);
        this.graphics.lineTo(0, 12);
        this.graphics.stroke();

        // 次要火花（X形和斜向）
        this.graphics.strokeColor = new Color(255, 140, 0, 200);
        this.graphics.lineWidth = 2;

        // X形火花
        this.graphics.moveTo(-9, -9);
        this.graphics.lineTo(-6, -6);
        this.graphics.moveTo(6, 6);
        this.graphics.lineTo(9, 9);
        this.graphics.moveTo(-9, 9);
        this.graphics.lineTo(-6, 6);
        this.graphics.moveTo(6, -6);
        this.graphics.lineTo(9, -9);
        this.graphics.stroke();

        // 额外的短火花
        this.graphics.strokeColor = new Color(255, 215, 0, 180);
        this.graphics.lineWidth = 1.5;
        for (let i = 0; i < 8; i++) {
            const angle = (i * 45 + 22.5) * Math.PI / 180; // 偏移22.5度
            const startRadius = 6;
            const endRadius = 9 + Math.random() * 2;

            const startX = Math.cos(angle) * startRadius;
            const startY = Math.sin(angle) * startRadius;
            const endX = Math.cos(angle) * endRadius;
            const endY = Math.sin(angle) * endRadius;

            this.graphics.moveTo(startX, startY);
            this.graphics.lineTo(endX, endY);
        }
        this.graphics.stroke();

        // === 能量脉动指示 ===

        // 核心脉动环
        this.graphics.strokeColor = new Color(255, 255, 255, 200);
        this.graphics.lineWidth = 1;
        this.graphics.circle(0, 0, 3);
        this.graphics.circle(0, 0, 4.5);
        this.graphics.stroke();

        // === 边框和警告轮廓 ===

        // 主体危险边框（深红色）
        this.graphics.strokeColor = new Color(178, 34, 34, 255);
        this.graphics.lineWidth = 2.5;
        this.graphics.circle(0, 0, 7);
        this.graphics.stroke();

        // 警告区域边框（闪烁效果）
        this.graphics.strokeColor = new Color(255, 0, 0, 200);
        this.graphics.lineWidth = 2;
        this.graphics.circle(0, 0, 10);
        this.graphics.stroke();

        // 内核边框（亮黄色）
        this.graphics.strokeColor = new Color(255, 255, 0, 255);
        this.graphics.lineWidth = 1.5;
        this.graphics.circle(0, 0, 4);
        this.graphics.stroke();

        // === 危险标识 ===

        // 核心危险点
        this.graphics.fillColor = new Color(255, 0, 0, 255);
        this.graphics.circle(0, 0, 0.8);
        this.graphics.fill();

        // 外围警告点
        this.graphics.fillColor = new Color(255, 69, 0, 200);
        for (let i = 0; i < 4; i++) {
            const angle = (i * 90) * Math.PI / 180;
            const x = Math.cos(angle) * 8.5;
            const y = Math.sin(angle) * 8.5;

            this.graphics.circle(x, y, 1);
            this.graphics.fill();
        }
    }
    
    /**
     * 处理击中目标的逻辑
     * 爆炸冲击波击中任何目标都会立即引爆，造成范围爆炸伤害
     */
    protected onHitTarget(target: BaseMouse): void {
        if (!target || !target.isAlive) return;
        
        console.log(`[ExplosionWave] 击中触发点 ${target.unitName}，引爆范围爆炸！`);
        
        // 在击中点引爆，造成范围伤害
        this.performExplosion(this.node.position);
    }
    
    /**
     * 执行爆炸攻击
     * 对爆炸范围内的所有敌人造成距离衰减伤害和推拽效果
     */
    private performExplosion(explosionCenter: Vec3): void {
        const battleManager = BattleManager.instance;
        if (!battleManager) return;
        
        let hitCount = 0;
        
        for (const enemy of battleManager.getAllActiveEnemies()) {
            if (!enemy || !enemy.isValid) continue;
            
            const enemyComponent = enemy.getComponent(BaseMouse);
            if (!enemyComponent || !enemyComponent.isAlive) continue;
            
            // 计算到爆炸中心的距离
            const distance = Vec3.distance(explosionCenter, enemy.position);
            
            if (distance <= this.explosionRadius) {
                // 计算距离衰减伤害
                const damageMultiplier = this.calculateDamageMultiplier(distance);
                const finalDamage = this.damage * damageMultiplier;
                
                // 造成伤害
                enemyComponent.takeDamage(finalDamage);
                hitCount++;
                
                // 应用推拽效果
                this.applyKnockback(enemy, explosionCenter, distance);
                
                // 创建个体爆炸特效
                this.createIndividualExplosionEffect(enemy.position, damageMultiplier);
                
                console.log(`[ExplosionWave] 爆炸击中 ${enemyComponent.unitName}，距离${Math.round(distance)}，伤害${Math.round(finalDamage)}`);
            }
        }
        
        console.log(`[ExplosionWave] 爆炸攻击击中 ${hitCount} 个目标，爆炸半径 ${this.explosionRadius}`);
    }
    
    /**
     * 计算基于距离的伤害倍率
     * 爆炸中心伤害最高，边缘伤害较低
     */
    private calculateDamageMultiplier(distance: number): number {
        const normalizedDistance = distance / this.explosionRadius; // 0-1之间
        
        // 线性插值计算伤害倍率
        return this.coreExplosionMultiplier * (1 - normalizedDistance) + 
               this.edgeExplosionMultiplier * normalizedDistance;
    }
    
    /**
     * 应用推拽效果
     * 将敌人从爆炸中心推开
     */
    private applyKnockback(enemyNode: Node, explosionCenter: Vec3, distance: number): void {
        if (distance <= 0) return;
        
        // 计算推拽方向（从爆炸中心向外）
        const knockbackDirection = Vec3.subtract(new Vec3(), enemyNode.position, explosionCenter);
        knockbackDirection.normalize();
        
        // 计算推拽距离（距离越近推拽越强）
        const normalizedDistance = distance / this.explosionRadius;
        const knockbackDistance = this.knockbackForce * (1 - normalizedDistance);
        
        // 计算新位置
        const knockbackOffset = Vec3.multiplyScalar(new Vec3(), knockbackDirection, knockbackDistance);
        const newPosition = Vec3.add(new Vec3(), enemyNode.position, knockbackOffset);
        
        // 应用推拽（这里可以用Tween制作平滑推拽效果）
        enemyNode.setPosition(newPosition);
        
        console.log(`[ExplosionWave] 推拽 ${enemyNode.name}，距离 ${Math.round(knockbackDistance)}`);
        
        // 创建推拽指示特效
        this.createKnockbackEffect(enemyNode, knockbackDirection);
    }
    
    /**
     * 创建击中特效
     * 大型爆炸特效，显示完整的爆炸范围和威力
     */
    protected createHitEffect(position: Vec3): void {
        if (!this.node.parent) return;
        
        const effectNode = new Node("ExplosionWaveHitEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        
        // 最外层爆炸范围指示
        effectGraphics.fillColor = new Color(255, 69, 0, 60); // 半透明橙红色
        effectGraphics.circle(0, 0, this.explosionRadius);
        effectGraphics.fill();
        
        // 主要爆炸效果（多层同心圆）
        effectGraphics.fillColor = new Color(255, 140, 0, 150);
        effectGraphics.circle(0, 0, 60);
        effectGraphics.fill();
        
        effectGraphics.fillColor = new Color(255, 215, 0, 200);
        effectGraphics.circle(0, 0, 40);
        effectGraphics.fill();
        
        effectGraphics.fillColor = new Color(255, 255, 255, 255);
        effectGraphics.circle(0, 0, 25);
        effectGraphics.fill();
        
        // 爆炸冲击波边框
        effectGraphics.strokeColor = new Color(255, 0, 0, 255);
        effectGraphics.lineWidth = 3;
        effectGraphics.circle(0, 0, this.explosionRadius);
        effectGraphics.stroke();
        
        // 绘制放射状冲击波
        effectGraphics.strokeColor = new Color(255, 140, 0, 255);
        effectGraphics.lineWidth = 4;
        
        // 12个方向的冲击波
        for (let i = 0; i < 12; i++) {
            const angle = (i * 30) * Math.PI / 180;
            const startX = Math.cos(angle) * 15;
            const startY = Math.sin(angle) * 15;
            const endX = Math.cos(angle) * (this.explosionRadius - 10);
            const endY = Math.sin(angle) * (this.explosionRadius - 10);
            
            effectGraphics.moveTo(startX, startY);
            effectGraphics.lineTo(endX, endY);
        }
        effectGraphics.stroke();
        
        // 内层十字爆炸线
        effectGraphics.strokeColor = new Color(255, 255, 255, 255);
        effectGraphics.lineWidth = 6;
        effectGraphics.moveTo(-40, 0);
        effectGraphics.lineTo(40, 0);
        effectGraphics.moveTo(0, -40);
        effectGraphics.lineTo(0, 40);
        effectGraphics.stroke();
        
        // 爆炸特效持续0.6秒
        tween(effectNode)
            .delay(0.6)
            .call(() => {
                if (effectNode && effectNode.isValid) {
                    effectNode.destroy();
                }
            })
            .start();
    }
    
    /**
     * 创建个体爆炸特效
     * 在每个被爆炸影响的敌人位置创建相应强度的特效
     */
    private createIndividualExplosionEffect(position: Vec3, damageMultiplier: number): void {
        if (!this.node.parent) return;
        
        const individualEffect = new Node("IndividualExplosionEffect");
        individualEffect.parent = this.node.parent;
        individualEffect.setPosition(position);
        
        const individualGraphics = individualEffect.addComponent(Graphics);
        
        // 根据伤害倍率调整特效大小
        const effectSize = 10 + (damageMultiplier * 15); // 10-25像素
        
        // 爆炸火球
        individualGraphics.fillColor = new Color(255, 140, 0, 180);
        individualGraphics.circle(0, 0, effectSize);
        individualGraphics.fill();
        
        individualGraphics.fillColor = new Color(255, 255, 255, 200);
        individualGraphics.circle(0, 0, effectSize * 0.6);
        individualGraphics.fill();
        
        // 火花四射
        individualGraphics.strokeColor = new Color(255, 215, 0, 255);
        individualGraphics.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const angle = (i * 60) * Math.PI / 180;
            const startX = Math.cos(angle) * effectSize * 0.3;
            const startY = Math.sin(angle) * effectSize * 0.3;
            const endX = Math.cos(angle) * effectSize * 1.2;
            const endY = Math.sin(angle) * effectSize * 1.2;
            
            individualGraphics.moveTo(startX, startY);
            individualGraphics.lineTo(endX, endY);
        }
        individualGraphics.stroke();
        
        // 个体特效持续0.25秒
        tween(individualEffect)
            .delay(0.25)
            .call(() => {
                if (individualEffect && individualEffect.isValid) {
                    individualEffect.destroy();
                }
            })
            .start();
    }
    
    /**
     * 创建推拽特效
     * 显示敌人被推拽的方向
     */
    private createKnockbackEffect(targetNode: Node, direction: Vec3): void {
        if (!targetNode || !targetNode.parent) return;
        
        const knockbackIndicator = new Node("KnockbackEffect");
        knockbackIndicator.parent = targetNode;
        knockbackIndicator.setPosition(0, 20, 0);
        
        const knockbackGraphics = knockbackIndicator.addComponent(Graphics);
        
        // 绘制推拽方向箭头
        const arrowLength = 15;
        const arrowX = direction.x * arrowLength;
        const arrowY = direction.y * arrowLength;
        
        knockbackGraphics.strokeColor = new Color(255, 255, 0, 255);
        knockbackGraphics.lineWidth = 3;
        knockbackGraphics.moveTo(0, 0);
        knockbackGraphics.lineTo(arrowX, arrowY);
        
        // 箭头头部
        const arrowHeadLength = 4;
        const perpX = -direction.y * arrowHeadLength;
        const perpY = direction.x * arrowHeadLength;
        
        knockbackGraphics.lineTo(arrowX - direction.x * arrowHeadLength + perpX, 
                                arrowY - direction.y * arrowHeadLength + perpY);
        knockbackGraphics.moveTo(arrowX, arrowY);
        knockbackGraphics.lineTo(arrowX - direction.x * arrowHeadLength - perpX, 
                                arrowY - direction.y * arrowHeadLength - perpY);
        knockbackGraphics.stroke();
        
        // 推拽指示器持续0.4秒
        tween(knockbackIndicator)
            .delay(0.4)
            .call(() => {
                if (knockbackIndicator && knockbackIndicator.isValid) {
                    knockbackIndicator.destroy();
                }
            })
            .start();
    }
    
    /**
     * 检查是否可以击中指定目标
     * 爆炸冲击波可以击中所有敌人，击中后立即引爆
     */
    protected canHitTarget(target: BaseMouse): boolean {
        return target && target.isAlive;
    }
    
    /**
     * 设置爆炸属性
     */
    public setExplosionProperties(radius: number, coreMultiplier: number, edgeMultiplier: number, knockbackForce: number): void {
        this.explosionRadius = Math.max(50, radius);
        this.coreExplosionMultiplier = Math.max(1, coreMultiplier);
        this.edgeExplosionMultiplier = Math.max(0.1, Math.min(1, edgeMultiplier));
        this.knockbackForce = Math.max(0, knockbackForce);
    }
    
    /**
     * 获取预期最大伤害（爆炸中心）
     */
    public get maxExplosionDamage(): number {
        return this.damage * this.coreExplosionMultiplier;
    }
    
    /**
     * 获取预期最小伤害（爆炸边缘）
     */
    public get minExplosionDamage(): number {
        return this.damage * this.edgeExplosionMultiplier;
    }
    
    /**
     * 获取爆炸效果描述
     */
    public get explosionDescription(): string {
        const maxDmg = Math.round(this.maxExplosionDamage);
        const minDmg = Math.round(this.minExplosionDamage);
        return `爆炸半径${this.explosionRadius}，伤害${minDmg}-${maxDmg}，推拽${this.knockbackForce}`;
    }
}