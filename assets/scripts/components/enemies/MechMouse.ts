import { _decorator, Color, Graphics, Vec3, tween } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyState } from '../../types/GameTypes';
import { ENEMY_CONFIGS } from '../../types/GameConstants';

const { ccclass, property } = _decorator;

/**
 * 机械老鼠 - 高科技移动单位，专注突破防线
 * 特点：血量250，移速50，科技外观，奖励30金币
 * 设计原则：不具备攻击能力，专注于到达城堡造成威胁
 */
@ccclass('MechMouse')
export class MechMouse extends BaseMouse {
    
    public readonly enemyType: EnemyType = EnemyType.MECH_MOUSE;
    
    // 私有属性
    private _graphics: Graphics | null = null;
    
    // 科技视觉效果属性
    private _engineGlow: number = 0;          // 引擎发光效果
    
    protected initializeMouseStats(): void {
        const config = ENEMY_CONFIGS[this.enemyType];
        
        // 基础属性配置
        this.unitName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.moveSpeed = config.moveSpeed;
        this.goldReward = config.goldReward;
        
        // 设置节点缩放，机械老鼠比普通老鼠大30%
        this.node.setScale(1.3, 1.3, 1.3);
        
        console.log(`初始化${this.unitName}: 血量${this.maxHealth}, 移速${this.moveSpeed}, 奖励${this.goldReward}金币`);
    }
    
    protected initializeMouseVisuals(): void {
        // 创建机械老鼠外观 - 银灰色科技外观
        this._graphics = this.node.addComponent(Graphics);
        
        // 绘制机械老鼠身体
        this.drawMechMouseAppearance();
        
        console.log(`${this.unitName}外观创建完成`);
    }
    
    /**
     * 绘制机械老鼠外观
     */
    private drawMechMouseAppearance(): void {
        if (!this._graphics) return;
        
        this._graphics.clear();
        
        // 机械外观颜色
        const bodyColor = new Color(120, 120, 140, 255);    // 银灰色机械身体
        const glowColor = new Color(100, 150, 255, 255);    // 蓝色科技光
        
        // 绘制机械身体主体（矩形科技造型）
        this._graphics.fillColor = bodyColor;
        this._graphics.strokeColor = new Color(80, 80, 100, 255);
        this._this._graphics.lineWidth = 2;
        
        // 主体 - 科技感矩形身体
        this._graphics.roundRect(-15, -8, 30, 16, 3);
        this._graphics.fill();
        this._graphics.stroke();
        
        // 装甲板细节
        this._graphics.fillColor = new Color(140, 140, 160, 255);
        this._graphics.roundRect(-12, -6, 24, 12, 2);
        this._graphics.fill();
        
        // 科技纹理线条
        this._graphics.strokeColor = new Color(160, 160, 180, 255);
        this._graphics.lineWidth = 1;
        for (let i = -10; i <= 10; i += 5) {
            this._graphics.moveTo(i, -5);
            this._graphics.lineTo(i, 5);
        }
        this._graphics.stroke();
        
        // 头部 - 机械头盔
        this._graphics.fillColor = new Color(100, 100, 120, 255);
        this._graphics.roundRect(-10, 0, 20, 12, 2);
        this._graphics.fill();
        this._graphics.stroke();
        
        // 眼部 - 发光的机械眼
        const eyeColor = new Color(0, 200, 255, 255);    // 蓝色机械眼
        
        this._graphics.fillColor = eyeColor;
        this._graphics.circle(-5, 4, 3);
        this._graphics.fill();
        this._graphics.circle(5, 4, 3);
        this._graphics.fill();
        
        // 机械眼瞳孔
        this._graphics.fillColor = new Color(255, 255, 255, 255);
        this._graphics.circle(-5, 4, 1);
        this._graphics.fill();
        this._graphics.circle(5, 4, 1);
        this._graphics.fill();
        
        // 科技装置口
        this._graphics.fillColor = new Color(100, 100, 120, 255);
        this._graphics.circle(0, -2, 4);
        this._graphics.fill();
        
        // 科技装置内部
        this._graphics.fillColor = new Color(50, 50, 70, 255);
        this._graphics.circle(0, -2, 2);
        this._graphics.fill();
        
        // 机械天线/传感器
        this._graphics.strokeColor = new Color(120, 120, 140, 255);
        this._graphics.lineWidth = 2;
        this._graphics.moveTo(-8, 10);
        this._graphics.lineTo(-8, 16);
        this._graphics.moveTo(8, 10);
        this._graphics.lineTo(8, 16);
        this._graphics.stroke();
        
        // 天线顶端指示灯
        this._graphics.fillColor = new Color(100, 255, 100, 255);
        this._graphics.circle(-8, 16, 2);
        this._graphics.fill();
        this._graphics.circle(8, 16, 2);
        this._graphics.fill();
        
        // 机械履带/脚部
        this._graphics.fillColor = new Color(80, 80, 100, 255);
        this._graphics.roundRect(-12, -16, 8, 6, 1);
        this._graphics.fill();
        this._graphics.roundRect(4, -16, 8, 6, 1);
        this._graphics.fill();
        
        // 履带纹理
        this._graphics.strokeColor = new Color(100, 100, 120, 255);
        this._graphics.lineWidth = 1;
        for (let i = -10; i <= 10; i += 3) {
            this._graphics.moveTo(i, -15);
            this._graphics.lineTo(i, -11);
        }
        this._graphics.stroke();
        
        // 机械尾部 - 推进器
        this._graphics.fillColor = new Color(100, 100, 120, 255);
        this._graphics.circle(14, -4, 4);
        this._graphics.fill();
        
        // 推进器火焰效果（移动时显示）
        const thrusterColor = new Color(255, Math.floor(100 + this._engineGlow * 155), 0, 255);
        this._graphics.fillColor = thrusterColor;
        this._graphics.circle(18, -4, 2);
        this._graphics.fill();
        
    }
    
    /**
     * 重写update方法，添加科技视觉效果
     */
    protected update(dt: number): void {
        super.update(dt);
        
        if (!this.isAlive) return;
        
        // 更新引擎发光效果
        this._engineGlow = 0.5 + 0.5 * Math.sin(Date.now() * 0.01);
        
        // 更新科技外观效果
        this.updateTechAppearance();
    }
    
    /**
     * 更新科技外观效果
     */
    private updateTechAppearance(): void {
        const graphics = this.node.getComponent(Graphics);
        if (graphics) {
            this.drawMechMouseAppearance();
        }
    }
    
    
    /**
     * 获取机械老鼠标签配置
     */
    protected getMouseLabelConfig() {
        return {
            text: "机械老鼠",
            fontSize: 24,                        // BOSS用更大字体
            color: new Color(100, 200, 255),     // 蓝色科技字体
            yOffset: 50,                         // 因为体型更大，标签位置更高
            size: { width: 80, height: 32 }     // 更大的标签尺寸
        };
    }
    
    /**
     * 重写移动方法，机械老鼠移动时有推进器效果
     */
    protected moveTowardsCastle(dt: number): void {
        if (!this._gameManager || !this._gameManager.castleNode) return;
        
        const currentPos = this.node.position;
        
        // 检查是否到达城堡
        if (this.isReachedCastle(currentPos)) {
            this.reachCastle();
            return;
        }
        
        // 机械移动 - 稳定匀速
        const moveDistance = this.moveSpeed * dt;
        const newPos = Vec3.add(new Vec3(), currentPos, new Vec3(0, -moveDistance, 0));
        this.node.setPosition(newPos);
        
        // 更新推进器效果
        this.updateThrusterEffect();
    }
    
    /**
     * 更新推进器效果
     */
    private updateThrusterEffect(): void {
        // 推进器发光效果已在绘制方法中处理
        // 这里可以添加额外的推进器特效
    }
    
    /**
     * 重写城堡到达方法 - 机械老鼠到达城堡造成科技伤害
     */
    protected reachCastle(): void {
        if (!this._gameManager) return;
        
        // 机械老鼠到达城堡造成高科技伤害
        const castleDamage = Math.floor(this.maxHealth / 4); // 基于血量计算的科技伤害 (250/4=62.5≈62点伤害)
        this._gameManager.CastleTakeDamage(castleDamage);
        
        console.log(`${this.unitName}对城堡发动科技攻击！造成 ${castleDamage} 点伤害！`);
        
        // 创建科技到达特效
        this.createTechReachEffect();
        
        // 移除自己
        this._gameManager.RemoveActiveEnemy(this.node);
        this.die();
    }
    
    /**
     * 创建科技到达城堡的特效
     */
    private createTechReachEffect(): void {
        // 科技攻击特效 - 电磁脉冲效果
        const originalScale = this.node.scale.clone();
        
        // 电磁脉冲扩散
        this.node.setScale(originalScale.x * 0.5, originalScale.y * 0.5, originalScale.z);
        
        // 快速扩散然后消失 - 使用tween系统替代scheduleOnce
        tween(this.node)
            .delay(0.1)
            .call(() => {
                if (this.node && this.node.isValid) {
                    this.node.setScale(originalScale.x * 3, originalScale.y * 3, originalScale.z);
                    this.node.opacity = 100;
                }
            })
            .start();
        
        tween(this.node)
            .delay(0.3)
            .call(() => {
                if (this.node && this.node.isValid) {
                    this.node.opacity = 0;
                }
            })
            .start();
    }
    
    /**
     * 创建死亡特效 - 机械单位的特殊爆炸效果
     */
    protected createDeathEffect(): void {
        // 机械爆炸特效 - 多阶段爆炸
        const originalScale = this.node.scale.clone();
        const originalOpacity = this.node.opacity;
        
        // 第一阶段：电路短路闪烁 - 使用tween系统替代scheduleOnce
        for (let i = 1; i <= 8; i++) {
            tween(this.node)
                .delay(i * 0.05)
                .call(() => {
                    if (this.node && this.node.isValid) {
                        this.node.opacity = i % 2 === 0 ? originalOpacity : 50;
                    }
                })
                .start();
        }
        
        // 第二阶段：爆炸扩散 - 使用tween系统替代scheduleOnce
        tween(this.node)
            .delay(0.5)
            .call(() => {
                if (this.node && this.node.isValid) {
                    this.node.setScale(originalScale.x * 2, originalScale.y * 2, originalScale.z);
                    this.node.opacity = 200;
                }
            })
            .start();
        
        // 第三阶段：消失 - 使用tween系统替代scheduleOnce
        tween(this.node)
            .delay(0.7)
            .call(() => {
                if (this.node && this.node.isValid) {
                    this.node.setScale(0, 0, 0);
                    this.node.opacity = 0;
                }
            })
            .start();
        
        console.log(`${this.unitName}机械系统损毁，爆炸解体！`);
    }
}