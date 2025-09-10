import { _decorator, Color, Vec3, Node, Graphics } from 'cc';
import { BaseProjectile } from '../BaseProjectile';
import { BaseMouse } from '../../components/enemies/BaseMouse';
import { GameManager } from '../../managers/GameManager';

const { ccclass, property } = _decorator;

/**
 * 冰弹投射物
 * 用于：挪威森林猫冰法师
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
    
    protected onLoad(): void {
        super.onLoad();
        this.hitRadius = 28; // 冰弹的碰撞检测范围
    }
    
    /**
     * 初始化冰弹的视觉外观
     * 冰蓝色水晶形状，带有霜雾效果
     */
    protected initializeVisuals(): void {
        if (!this.graphics) return;
        
        this.graphics.clear();
        
        // 外层霜雾（淡蓝色）
        this.graphics.fillColor = new Color(173, 216, 230, 120); // 淡蓝色雾气
        this.graphics.circle(0, 0, 7);
        this.graphics.fill();
        
        // 主体冰晶（冰蓝色六边形）
        this.graphics.fillColor = new Color(135, 206, 235, 200); // 冰蓝色
        // 绘制六边形冰晶
        const radius = 5;
        this.graphics.moveTo(radius, 0);
        for (let i = 1; i <= 6; i++) {
            const angle = (i * 60) * Math.PI / 180;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            this.graphics.lineTo(x, y);
        }
        this.graphics.close();
        this.graphics.fill();
        
        // 内核（白色）
        this.graphics.fillColor = new Color(255, 255, 255, 180);
        this.graphics.circle(0, 0, 2.5);
        this.graphics.fill();
        
        // 冰晶边框（深蓝色）
        this.graphics.strokeColor = new Color(65, 105, 225, 255); // 深蓝色
        this.graphics.lineWidth = 1.5;
        this.graphics.moveTo(radius, 0);
        for (let i = 1; i <= 6; i++) {
            const angle = (i * 60) * Math.PI / 180;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            this.graphics.lineTo(x, y);
        }
        this.graphics.close();
        this.graphics.stroke();
        
        // 绘制内部冰晶纹理
        this.graphics.strokeColor = new Color(200, 230, 255, 150);
        this.graphics.lineWidth = 1;
        this.graphics.moveTo(0, -3);
        this.graphics.lineTo(0, 3);
        this.graphics.moveTo(-2.5, 0);
        this.graphics.lineTo(2.5, 0);
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
        target.scheduleOnce(() => {
            if (target && target.isAlive) {
                (target as any).currentSpeed = originalSpeed;
                (target as any).isSlowed = false;
                console.log(`[IceShard] ${target.unitName} 减速效果结束`);
            }
        }, this.freezeDuration);
    }
    
    /**
     * 执行冰霜范围攻击
     * 对范围内的其他敌人造成冰霜伤害和减速效果
     */
    private performFrostAttack(centerPosition: Vec3): void {
        const gameManager = GameManager.instance;
        if (!gameManager || !gameManager.activeEnemies) return;
        
        const frostDamage = this.damage * this.frostDamageMultiplier;
        let hitCount = 0;
        
        for (const enemy of gameManager.activeEnemies) {
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
        effectNode.getComponent(IceShard)?.scheduleOnce(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 0.5);
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
        frostEffectNode.getComponent(IceShard)?.scheduleOnce(() => {
            if (frostEffectNode && frostEffectNode.isValid) {
                frostEffectNode.destroy();
            }
        }, 0.3);
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
        slowIndicator.getComponent(IceShard)?.scheduleOnce(() => {
            if (slowIndicator && slowIndicator.isValid) {
                slowIndicator.destroy();
            }
        }, this.freezeDuration);
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