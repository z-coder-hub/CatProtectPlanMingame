import { _decorator, Color, Vec3, Node, Graphics, Component } from 'cc';
import { BaseProjectile } from '../BaseProjectile';
import { BaseMouse } from '../../components/enemies/BaseMouse';
import { GameManager } from '../../managers/GameManager';

const { ccclass, property } = _decorator;

/**
 * 雷电弹投射物
 * 用于：缅因猫雷法师
 * 特性：链式跳跃攻击，蓝色闪电效果，能弹射到附近敌人
 */
@ccclass('LightningBolt')
export class LightningBolt extends BaseProjectile {
    
    @property({ tooltip: "链式跳跃次数" })
    public chainCount: number = 3;
    
    @property({ tooltip: "链式跳跃范围" })
    public chainRange: number = 100;
    
    @property({ tooltip: "链式伤害衰减率" })
    public chainDamageDecay: number = 0.6; // 每次跳跃伤害60%
    
    private hitTargets: Set<Node> = new Set(); // 记录已击中的目标，避免重复
    
    protected onLoad(): void {
        super.onLoad();
        this.hitRadius = 30; // 雷电的碰撞检测范围稍大
    }
    
    /**
     * 初始化雷电弹的视觉外观
     * 蓝白色闪电球，带有电弧效果
     */
    protected initializeVisuals(): void {
        if (!this.graphics) return;
        
        this.graphics.clear();
        
        // 外层电弧（深蓝色）
        this.graphics.fillColor = new Color(25, 25, 112, 180); // 深蓝色
        this.graphics.circle(0, 0, 6);
        this.graphics.fill();
        
        // 中层闪电（亮蓝色）
        this.graphics.fillColor = new Color(0, 191, 255, 220); // 亮蓝色
        this.graphics.circle(0, 0, 4);
        this.graphics.fill();
        
        // 内核（白色）
        this.graphics.fillColor = new Color(255, 255, 255, 255);
        this.graphics.circle(0, 0, 2);
        this.graphics.fill();
        
        // 闪电边框效果
        this.graphics.strokeColor = new Color(255, 255, 0, 200); // 黄色闪电边框
        this.graphics.lineWidth = 1;
        this.graphics.circle(0, 0, 6);
        this.graphics.stroke();
        
        // 绘制小型闪电形状
        this.graphics.strokeColor = new Color(255, 255, 0, 255);
        this.graphics.lineWidth = 2;
        this.graphics.moveTo(-4, -6);
        this.graphics.lineTo(2, -2);
        this.graphics.lineTo(-2, 0);
        this.graphics.lineTo(4, 4);
        this.graphics.stroke();
    }
    
    /**
     * 处理击中目标的逻辑
     * 雷电弹首先对主目标造成伤害，然后进行链式跳跃攻击
     */
    protected onHitTarget(target: BaseMouse): void {
        if (!target || !target.isAlive) return;
        
        // 对主目标造成全额伤害
        target.takeDamage(this.damage);
        console.log(`[LightningBolt] 击中主目标 ${target.unitName}，造成 ${this.damage} 伤害`);
        
        // 记录已击中的目标
        this.hitTargets.add(target.node);
        
        // 开始链式攻击
        this.performChainLightning(target.node, this.damage * this.chainDamageDecay, this.chainCount - 1);
    }
    
    /**
     * 执行链式闪电攻击
     * 从当前目标跳跃到附近的其他敌人
     * @param currentTarget 当前击中的目标
     * @param chainDamage 链式攻击伤害
     * @param remainingChains 剩余跳跃次数
     */
    private performChainLightning(currentTarget: Node, chainDamage: number, remainingChains: number): void {
        if (remainingChains <= 0 || !currentTarget || !currentTarget.isValid) return;
        
        const gameManager = GameManager.instance;
        if (!gameManager || !gameManager.activeEnemies) return;
        
        // 寻找最近的未击中目标
        let nearestTarget: Node | null = null;
        let nearestDistance = Infinity;
        
        for (const enemy of gameManager.activeEnemies) {
            if (!enemy || !enemy.isValid) continue;
            if (this.hitTargets.has(enemy)) continue; // 跳过已击中的目标
            
            const enemyComponent = enemy.getComponent(BaseMouse);
            if (!enemyComponent || !enemyComponent.isAlive) continue;
            
            const distance = Vec3.distance(currentTarget.position, enemy.position);
            if (distance <= this.chainRange && distance < nearestDistance) {
                nearestTarget = enemy;
                nearestDistance = distance;
            }
        }
        
        if (nearestTarget) {
            const targetComponent = nearestTarget.getComponent(BaseMouse);
            if (targetComponent && targetComponent.isAlive) {
                // 对目标造成伤害
                targetComponent.takeDamage(chainDamage);
                this.hitTargets.add(nearestTarget);
                
                console.log(`[LightningBolt] 链式攻击击中 ${targetComponent.unitName}，造成 ${chainDamage} 伤害，剩余跳跃 ${remainingChains - 1} 次`);
                
                // 创建链式闪电特效
                this.createChainLightningEffect(currentTarget.position, nearestTarget.position);
                
                // 创建目标击中特效
                this.createChainHitEffect(nearestTarget.position);
                
                // 递归继续链式攻击
                const nextChainDamage = chainDamage * this.chainDamageDecay;
                this.scheduleOnce(() => {
                    this.performChainLightning(nearestTarget!, nextChainDamage, remainingChains - 1);
                }, 0.1); // 短暂延迟创造视觉效果
            }
        }
    }
    
    /**
     * 创建击中特效
     * 雷电弹的蓝色电弧爆炸效果
     */
    protected createHitEffect(position: Vec3): void {
        if (!this.node.parent) return;
        
        const effectNode = new Node("LightningBoltHitEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        
        // 主要闪电爆炸效果
        effectGraphics.fillColor = new Color(0, 191, 255, 150); // 半透明亮蓝色
        effectGraphics.circle(0, 0, 30);
        effectGraphics.fill();
        
        // 内层电弧
        effectGraphics.fillColor = new Color(255, 255, 255, 200);
        effectGraphics.circle(0, 0, 18);
        effectGraphics.fill();
        
        // 绘制放射状闪电
        effectGraphics.strokeColor = new Color(255, 255, 0, 255); // 黄色闪电
        effectGraphics.lineWidth = 3;
        
        // 8个方向的闪电
        for (let i = 0; i < 8; i++) {
            const angle = (i * 45) * Math.PI / 180;
            const startX = Math.cos(angle) * 8;
            const startY = Math.sin(angle) * 8;
            const endX = Math.cos(angle) * 25;
            const endY = Math.sin(angle) * 25;
            
            effectGraphics.moveTo(startX, startY);
            effectGraphics.lineTo(endX, endY);
        }
        effectGraphics.stroke();
        
        // 闪电特效持续0.4秒
        const tempComponent = effectNode.addComponent(Component);
        tempComponent.scheduleOnce(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 0.4);
    }
    
    /**
     * 创建链式闪电特效
     * 在两个目标之间绘制闪电弧线
     */
    private createChainLightningEffect(fromPos: Vec3, toPos: Vec3): void {
        if (!this.node.parent) return;
        
        const chainEffectNode = new Node("ChainLightningEffect");
        chainEffectNode.parent = this.node.parent;
        chainEffectNode.setPosition(fromPos);
        
        const chainGraphics = chainEffectNode.addComponent(Graphics);
        
        // 计算目标方向
        const direction = Vec3.subtract(new Vec3(), toPos, fromPos);
        
        // 绘制闪电弧线
        chainGraphics.strokeColor = new Color(255, 255, 0, 255); // 亮黄色
        chainGraphics.lineWidth = 3;
        
        // 绘制锯齿状闪电线
        const segments = 5;
        const segmentLength = direction.length() / segments;
        let currentPos = Vec3.ZERO;
        
        chainGraphics.moveTo(0, 0);
        
        for (let i = 1; i <= segments; i++) {
            const progress = i / segments;
            const baseX = direction.x * progress;
            const baseY = direction.y * progress;
            
            // 添加随机偏移创造闪电效果
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;
            
            chainGraphics.lineTo(baseX + offsetX, baseY + offsetY);
        }
        
        // 最后一段直达目标
        chainGraphics.lineTo(direction.x, direction.y);
        chainGraphics.stroke();
        
        // 链式特效持续0.3秒
        const tempComponent2 = chainEffectNode.addComponent(Component);
        tempComponent2.scheduleOnce(() => {
            if (chainEffectNode && chainEffectNode.isValid) {
                chainEffectNode.destroy();
            }
        }, 0.3);
    }
    
    /**
     * 创建链式攻击的击中特效
     */
    private createChainHitEffect(position: Vec3): void {
        if (!this.node.parent) return;
        
        const chainHitNode = new Node("ChainHitEffect");
        chainHitNode.parent = this.node.parent;
        chainHitNode.setPosition(position);
        
        const chainHitGraphics = chainHitNode.addComponent(Graphics);
        
        // 小型电弧爆炸
        chainHitGraphics.fillColor = new Color(0, 191, 255, 180);
        chainHitGraphics.circle(0, 0, 15);
        chainHitGraphics.fill();
        
        chainHitGraphics.fillColor = new Color(255, 255, 255, 220);
        chainHitGraphics.circle(0, 0, 10);
        chainHitGraphics.fill();
        
        // 小型闪电十字
        chainHitGraphics.strokeColor = new Color(255, 255, 0, 255);
        chainHitGraphics.lineWidth = 2;
        chainHitGraphics.moveTo(-12, 0);
        chainHitGraphics.lineTo(12, 0);
        chainHitGraphics.moveTo(0, -12);
        chainHitGraphics.lineTo(0, 12);
        chainHitGraphics.stroke();
        
        // 链式击中特效持续0.2秒
        const tempComponent3 = chainHitNode.addComponent(Component);
        tempComponent3.scheduleOnce(() => {
            if (chainHitNode && chainHitNode.isValid) {
                chainHitNode.destroy();
            }
        }, 0.2);
    }
    
    /**
     * 检查是否可以击中指定目标
     * 雷电弹可以击中所有敌人
     */
    protected canHitTarget(target: BaseMouse): boolean {
        return target && target.isAlive;
    }
    
    /**
     * 设置链式攻击属性
     */
    public setChainProperties(chainCount: number, chainRange: number, damageDecay: number): void {
        this.chainCount = Math.max(1, chainCount);
        this.chainRange = Math.max(50, chainRange);
        this.chainDamageDecay = Math.max(0.1, Math.min(1.0, damageDecay));
    }
    
    /**
     * 获取预期总伤害（考虑链式攻击）
     */
    public get expectedTotalDamage(): number {
        let totalDamage = this.damage; // 主目标伤害
        let chainDamage = this.damage * this.chainDamageDecay;
        
        // 计算链式攻击的总伤害
        for (let i = 0; i < this.chainCount - 1; i++) {
            totalDamage += chainDamage;
            chainDamage *= this.chainDamageDecay;
        }
        
        return totalDamage;
    }
    
    /**
     * 重置击中目标记录（投射物回收时调用）
     */
    public resetHitTargets(): void {
        this.hitTargets.clear();
    }
    
    protected onDestroy(): void {
        super.onDestroy();
        this.hitTargets.clear();
    }
}