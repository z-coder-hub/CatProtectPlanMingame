import { _decorator, Color, Vec3, Node, Graphics, tween } from 'cc';
import { BaseProjectile } from '../BaseProjectile';
import { BaseMouse } from '../../components/enemies/BaseMouse';
import { BattleManager } from '../../managers/BattleManager';

const { ccclass, property } = _decorator;

/**
 * 冰弹投射物
 * 用于：冰霜法师
 * 特性：冰蓝色外观，减速效果，冻结范围内敌人，AOE冰霜伤害
 */
@ccclass('IceShard')
export class IceShard extends BaseProjectile {
    
    @property({ tooltip: "冰冻范围" })
    public freezeRange: number = 90;
    
    @property({ tooltip: "减速效果强度" })
    public slowAmount: number = 0.5; // 减速50%
    
    @property({ tooltip: "冰冻持续时间" })
    public freezeDuration: number = 3.0;
    
    @property({ tooltip: "冰霜AOE伤害倍率" })
    public frostDamageMultiplier: number = 0.8;
    
    /**
     * 获取冰弹投射物配置
     */
    protected getProjectileConfig(): {
        maxRange?: number;
        hitRadius?: number;
        [key: string]: any;
    } {
        return {
            hitRadius: 42   // 冰弹的碰撞检测范围 - 放大1.5倍以匹配视觉尺寸
        };
    }
    
    /**
     * 初始化冰弹的视觉外观
     * 复杂多面体冰晶，透明折射效果，寒霜微粒环绕
     */
    protected initializeVisuals(): void {
        if (!this.graphics) return;

        this.graphics.clear();

        // === 绘制寒气和霜雾层次 === - 放大1.5倍

        // 外层寒气场（极淡蓝色）
        this.graphics.fillColor = new Color(173, 216, 230, 80); // 极淡蓝色寒气
        this.graphics.circle(0, 0, 12.75);
        this.graphics.fill();

        // 中层霜雾（淡蓝色）
        this.graphics.fillColor = new Color(176, 224, 230, 120); // 淡蓝色霜雾
        this.graphics.circle(0, 0, 10.5);
        this.graphics.fill();

        // 内层冰雾（冰蓝色）
        this.graphics.fillColor = new Color(135, 206, 235, 150); // 冰蓝色
        this.graphics.circle(0, 0, 8.25);
        this.graphics.fill();

        // === 复杂多面体冰晶结构 ===

        // 主体冰晶（不规则八边形）- 放大1.5倍
        this.graphics.fillColor = new Color(135, 206, 235, 180); // 冰蓝色，半透明
        const outerRadius = 7.5;
        this.graphics.moveTo(outerRadius, 0);
        for (let i = 1; i <= 8; i++) {
            const angle = (i * 45) * Math.PI / 180;
            const radiusVariation = outerRadius + (Math.sin(i * 2) * 1.2); // 不规则变化
            const x = Math.cos(angle) * radiusVariation;
            const y = Math.sin(angle) * radiusVariation;
            this.graphics.lineTo(x, y);
        }
        this.graphics.close();
        this.graphics.fill();

        // 内层冰晶（六边形）- 放大1.5倍
        this.graphics.fillColor = new Color(176, 224, 230, 200); // 更透明的冰蓝
        const innerRadius = 5.25;
        this.graphics.moveTo(innerRadius, 0);
        for (let i = 1; i <= 6; i++) {
            const angle = (i * 60) * Math.PI / 180;
            const x = Math.cos(angle) * innerRadius;
            const y = Math.sin(angle) * innerRadius;
            this.graphics.lineTo(x, y);
        }
        this.graphics.close();
        this.graphics.fill();

        // === 冰晶内部结构和气泡 ===

        // 冰晶核心（白色透明）- 放大1.5倍
        this.graphics.fillColor = new Color(255, 255, 255, 150);
        this.graphics.circle(0, 0, 3);
        this.graphics.fill();

        // 内部气泡和裂纹 - 放大1.5倍
        this.graphics.fillColor = new Color(200, 230, 255, 120);
        // 随机分布的小气泡
        for (let i = 0; i < 6; i++) {
            const angle = (i * 60 + 30) * Math.PI / 180;
            const distance = 2.25 + Math.random() * 2.25;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            const size = 0.45 + Math.random() * 0.6;

            this.graphics.circle(x, y, size);
            this.graphics.fill();
        }

        // === 冰晶表面纹理和裂纹 === - 放大1.5倍

        // 主要裂纹纹理
        this.graphics.strokeColor = new Color(200, 230, 255, 180);
        this.graphics.lineWidth = 1.8;

        // 放射状内部纹理
        for (let i = 0; i < 6; i++) {
            const angle = (i * 60) * Math.PI / 180;
            const startX = Math.cos(angle) * 1.5;
            const startY = Math.sin(angle) * 1.5;
            const endX = Math.cos(angle) * 5.25;
            const endY = Math.sin(angle) * 5.25;

            this.graphics.moveTo(startX, startY);
            this.graphics.lineTo(endX, endY);
        }
        this.graphics.stroke();

        // 环形纹理（模拟冰层）
        this.graphics.strokeColor = new Color(176, 224, 230, 140);
        this.graphics.lineWidth = 1.2;
        this.graphics.circle(0, 0, 3.75);
        this.graphics.circle(0, 0, 6);
        this.graphics.stroke();

        // === 冰面高光和反射效果 === - 放大1.5倍

        // 主要高光面
        this.graphics.fillColor = new Color(255, 255, 255, 200);
        // 上方高光区域
        this.graphics.moveTo(-2.25, -3);
        this.graphics.lineTo(2.25, -3.75);
        this.graphics.lineTo(3, -1.5);
        this.graphics.lineTo(-1.5, -0.75);
        this.graphics.close();
        this.graphics.fill();

        // 次要高光点
        this.graphics.fillColor = new Color(255, 255, 255, 150);
        this.graphics.circle(2.25, 2.25, 1.2);
        this.graphics.fill();
        this.graphics.circle(-3, 0.75, 0.9);
        this.graphics.fill();

        // === 寒霜微粒效果 === - 放大1.5倍

        // 环绕的冰霜微粒
        this.graphics.fillColor = new Color(200, 230, 255, 180);
        for (let i = 0; i < 16; i++) {
            const angle = (i * 22.5) * Math.PI / 180;
            const distance = 9 + Math.random() * 3;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            const size = 0.3 + Math.random() * 0.45;

            this.graphics.circle(x, y, size);
            this.graphics.fill();
        }

        // === 冰晶轮廓和边框 === - 放大1.5倍

        // 主体冰晶轮廓（深蓝色）
        this.graphics.strokeColor = new Color(65, 105, 225, 255);
        this.graphics.lineWidth = 2.7;
        this.graphics.moveTo(outerRadius, 0);
        for (let i = 1; i <= 8; i++) {
            const angle = (i * 45) * Math.PI / 180;
            const radiusVariation = outerRadius + (Math.sin(i * 2) * 1.2);
            const x = Math.cos(angle) * radiusVariation;
            const y = Math.sin(angle) * radiusVariation;
            this.graphics.lineTo(x, y);
        }
        this.graphics.close();
        this.graphics.stroke();

        // 内层冰晶轮廓
        this.graphics.strokeColor = new Color(100, 149, 237, 200);
        this.graphics.lineWidth = 1.8;
        this.graphics.moveTo(innerRadius, 0);
        for (let i = 1; i <= 6; i++) {
            const angle = (i * 60) * Math.PI / 180;
            const x = Math.cos(angle) * innerRadius;
            const y = Math.sin(angle) * innerRadius;
            this.graphics.lineTo(x, y);
        }
        this.graphics.close();
        this.graphics.stroke();

        // 寒气边界
        this.graphics.strokeColor = new Color(176, 224, 230, 120);
        this.graphics.lineWidth = 1.5;
        this.graphics.circle(0, 0, 10.5);
        this.graphics.stroke();
    }
    
    /**
     * 处理击中目标的逻辑
     * 冰弹首先对主目标造成伤害和减速，然后进行AOE冰冻攻击
     */
    protected onHitTarget(target: BaseMouse): void {
        if (!target || !target.isAlive) return;
        
        // 对主目标造成伤害并施加减速效果
        target.takeDamage(this.damage);
        this.applySlowEffect(target);
        
        console.log(`[IceShard] 击中主目标 ${target.unitName}，造成 ${this.damage} 伤害并减速`);
        
        // 进行AOE冰霜攻击
        this.performFrostAttack(this.node.position);
    }
    
    /**
     * 施加减速效果
     * 降低目标的移动速度
     */
    private applySlowEffect(target: BaseMouse): void {
        // 这里需要在BaseMouse中添加减速状态管理
        // 暂时通过直接修改移动速度实现
        const originalSpeed = target.moveSpeed;
        const newSpeed = originalSpeed * (1 - this.slowAmount);
        
        // 设置减速状态（需要BaseMouse支持）
        (target as any).currentSpeed = newSpeed;
        (target as any).isSlowed = true;
        
        console.log(`[IceShard] 对 ${target.unitName} 施加减速效果：${originalSpeed} → ${newSpeed}`);
        
        // 创建减速状态指示特效
        this.createSlowEffect(target.node);
        
        // 定时恢复速度
        tween(target.node)
            .delay(this.freezeDuration)
            .call(() => {
                if (target && target.isAlive && target.node && target.node.isValid) {
                    (target as any).currentSpeed = originalSpeed;
                    (target as any).isSlowed = false;
                    console.log(`[IceShard] ${target.unitName} 减速效果结束`);
                }
            })
            .start();
    }
    
    /**
     * 执行冰霜范围攻击
     * 对范围内的其他敌人造成冰霜伤害和减速效果
     */
    private performFrostAttack(centerPosition: Vec3): void {
        const battleManager = BattleManager.instance;
        if (!battleManager) return;
        
        const frostDamage = this.damage * this.frostDamageMultiplier;
        let hitCount = 0;
        
        for (const enemy of battleManager.getAllActiveEnemies()) {
            if (!enemy || !enemy.isValid) continue;
            
            const enemyComponent = enemy.getComponent(BaseMouse);
            if (!enemyComponent || !enemyComponent.isAlive) continue;
            
            // 计算距离
            const distance = Vec3.distance(centerPosition, enemy.position);
            
            if (distance <= this.freezeRange) {
                // 在冰霜范围内，造成伤害和减速
                enemyComponent.takeDamage(frostDamage);
                this.applySlowEffect(enemyComponent);
                hitCount++;
                
                // 为每个被冰霜攻击的敌人创建特效
                this.createFrostHitEffect(enemy.position);
            }
        }
        
        if (hitCount > 0) {
            console.log(`[IceShard] 冰霜攻击击中 ${hitCount} 个目标，每个造成 ${frostDamage} 伤害并减速`);
        }
    }
    
    /**
     * 创建击中特效
     * 冰弹的冰霜爆炸效果，显示冰冻范围
     */
    protected createHitEffect(position: Vec3): void {
        if (!this.node.parent) return;
        
        const effectNode = new Node("IceShardHitEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        
        // 外层冰霜范围指示（显示AOE范围）
        effectGraphics.fillColor = new Color(173, 216, 230, 80); // 半透明淡蓝色
        effectGraphics.circle(0, 0, this.freezeRange);
        effectGraphics.fill();
        
        // 中层冰霜爆炸
        effectGraphics.fillColor = new Color(135, 206, 235, 150); // 冰蓝色
        effectGraphics.circle(0, 0, 35);
        effectGraphics.fill();
        
        // 内层冰晶爆炸
        effectGraphics.fillColor = new Color(255, 255, 255, 200); // 白色
        effectGraphics.circle(0, 0, 20);
        effectGraphics.fill();
        
        // 绘制放射状冰刺
        effectGraphics.strokeColor = new Color(135, 206, 235, 255);
        effectGraphics.lineWidth = 3;
        
        // 8个方向的冰刺
        for (let i = 0; i < 8; i++) {
            const angle = (i * 45) * Math.PI / 180;
            const startX = Math.cos(angle) * 10;
            const startY = Math.sin(angle) * 10;
            const endX = Math.cos(angle) * 30;
            const endY = Math.sin(angle) * 30;
            
            effectGraphics.moveTo(startX, startY);
            effectGraphics.lineTo(endX, endY);
        }
        effectGraphics.stroke();
        
        // 冰霜范围边框
        effectGraphics.strokeColor = new Color(65, 105, 225, 200);
        effectGraphics.lineWidth = 2;
        effectGraphics.circle(0, 0, this.freezeRange);
        effectGraphics.stroke();
        
        // 冰霜特效持续0.5秒
        tween(effectNode)
            .delay(0.5)
            .call(() => {
                if (effectNode && effectNode.isValid) {
                    effectNode.destroy();
                }
            })
            .start();
    }
    
    /**
     * 创建冰霜攻击的击中特效
     */
    private createFrostHitEffect(position: Vec3): void {
        if (!this.node.parent) return;
        
        const frostEffectNode = new Node("FrostHitEffect");
        frostEffectNode.parent = this.node.parent;
        frostEffectNode.setPosition(position);
        
        const frostGraphics = frostEffectNode.addComponent(Graphics);
        
        // 冰霜环状效果
        frostGraphics.fillColor = new Color(173, 216, 230, 150);
        frostGraphics.circle(0, 0, 12);
        frostGraphics.fill();
        
        frostGraphics.fillColor = new Color(255, 255, 255, 200);
        frostGraphics.circle(0, 0, 8);
        frostGraphics.fill();
        
        // 小型冰刺十字
        frostGraphics.strokeColor = new Color(135, 206, 235, 255);
        frostGraphics.lineWidth = 2;
        frostGraphics.moveTo(-8, 0);
        frostGraphics.lineTo(8, 0);
        frostGraphics.moveTo(0, -8);
        frostGraphics.lineTo(0, 8);
        frostGraphics.stroke();
        
        // 冰霜击中特效持续0.3秒
        tween(frostEffectNode)
            .delay(0.3)
            .call(() => {
                if (frostEffectNode && frostEffectNode.isValid) {
                    frostEffectNode.destroy();
                }
            })
            .start();
    }
    
    /**
     * 创建减速状态指示特效
     */
    private createSlowEffect(targetNode: Node): void {
        if (!targetNode || !targetNode.parent) return;
        
        const slowIndicator = new Node("SlowEffect");
        slowIndicator.parent = targetNode;
        slowIndicator.setPosition(0, 30, 0); // 在目标头顶显示
        
        const slowGraphics = slowIndicator.addComponent(Graphics);
        
        // 绘制减速指示（蓝色雪花状）
        slowGraphics.fillColor = new Color(135, 206, 235, 180);
        slowGraphics.circle(0, 0, 8);
        slowGraphics.fill();
        
        slowGraphics.strokeColor = new Color(255, 255, 255, 255);
        slowGraphics.lineWidth = 2;
        // 雪花形状
        slowGraphics.moveTo(-6, 0);
        slowGraphics.lineTo(6, 0);
        slowGraphics.moveTo(0, -6);
        slowGraphics.lineTo(0, 6);
        slowGraphics.moveTo(-4, -4);
        slowGraphics.lineTo(4, 4);
        slowGraphics.moveTo(-4, 4);
        slowGraphics.lineTo(4, -4);
        slowGraphics.stroke();
        
        // 减速指示器持续时间与减速效果相同
        tween(slowIndicator)
            .delay(this.freezeDuration)
            .call(() => {
                if (slowIndicator && slowIndicator.isValid) {
                    slowIndicator.destroy();
                }
            })
            .start();
    }
    
    /**
     * 检查是否可以击中指定目标
     * 冰弹可以击中所有敌人
     */
    protected canHitTarget(target: BaseMouse): boolean {
        return target && target.isAlive;
    }
    
    /**
     * 设置冰霜攻击属性
     */
    public setFrostProperties(freezeRange: number, slowAmount: number, freezeDuration: number): void {
        this.freezeRange = Math.max(50, freezeRange);
        this.slowAmount = Math.max(0.1, Math.min(0.9, slowAmount)); // 限制在10%-90%之间
        this.freezeDuration = Math.max(1, freezeDuration);
    }
    
    /**
     * 获取预期冰霜伤害
     */
    public get expectedFrostDamage(): number {
        return this.damage * this.frostDamageMultiplier;
    }
    
    /**
     * 获取减速效果描述
     */
    public get slowEffectDescription(): string {
        const slowPercent = Math.round(this.slowAmount * 100);
        return `减速${slowPercent}%持续${this.freezeDuration}秒`;
    }
}