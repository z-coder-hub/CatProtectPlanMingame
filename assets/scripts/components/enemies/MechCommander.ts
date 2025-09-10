import { _decorator, Component, Color, Graphics } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyCategory } from '../../types/GameTypes';
import { ENEMY_CONFIGS } from '../../types/GameConstants';
import { GameManager } from '../../managers/GameManager';

const { ccclass, property } = _decorator;

/**
 * 机械军团长 - 召唤机械兵BOSS
 * 特点：召唤机械老鼠，自我修复能力，机械科技风格
 */
@ccclass('MechCommander')
export class MechCommander extends BaseMouse {

    /** 召唤数量限制 */
    private summonCount: number = 6;
    
    /** 召唤类型 */
    private summonType: EnemyType = EnemyType.MECH_MOUSE;
    
    /** 自我修复速度 */
    private healRate: number = 20;
    
    /** 召唤冷却时间 */
    private summonCooldown: number = 0;
    
    /** 修复冷却时间 */
    private healCooldown: number = 0;
    
    /** 已召唤的机械兵数量 */
    private spawnedCount: number = 0;
    
    /** 机械特效计时器 */
    private mechEffectTimer: number = 0;
    
    /**
     * 初始化机械军团长属性
     */
    protected initializeMouseStats(): void {
        const config = ENEMY_CONFIGS[EnemyType.MECH_COMMANDER];
        this.mouseType = EnemyType.MECH_COMMANDER;
        this.mouseCategory = EnemyCategory.BOSS;
        this.mouseName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.moveSpeed = config.moveSpeed;
        this.goldReward = config.goldReward;
        this.summonCount = (config as any).summonCount || 6;
        this.summonType = (config as any).summonType || EnemyType.MECH_MOUSE;
        this.healRate = (config as any).healRate || 20;
    }
    
    /**
     * 初始化机械军团长外观
     */
    protected initializeMouseVisuals(): void {
        const graphics = this.node.addComponent(Graphics);
        
        // 机械色彩 - 银灰色机械风
        graphics.fillColor = new Color(140, 140, 140, 255);   // 银灰色主体
        graphics.strokeColor = new Color(100, 100, 100, 255); // 深灰色边框
        graphics.lineWidth = 3;
        
        // 机械身体 - 六角形指挥官形状
        graphics.moveTo(0, -20);
        graphics.lineTo(15, -10);
        graphics.lineTo(15, 10);
        graphics.lineTo(0, 20);
        graphics.lineTo(-15, 10);
        graphics.lineTo(-15, -10);
        graphics.close();
        graphics.fill();
        graphics.stroke();
        
        // 指挥头盔
        graphics.fillColor = new Color(120, 120, 150, 255);   // 蓝灰色头盔
        graphics.rect(-12, -25, 24, 15);
        graphics.fill();
        graphics.stroke();
        
        // 机械眼睛 - 红色扫描器
        graphics.fillColor = new Color(255, 50, 50, 255);
        graphics.rect(-8, -22, 6, 3);
        graphics.fill();
        graphics.rect(2, -22, 6, 3);
        graphics.fill();
        
        // 天线/通讯设备
        graphics.strokeColor = new Color(200, 200, 200, 255);
        graphics.lineWidth = 2;
        graphics.moveTo(-5, -25);
        graphics.lineTo(-5, -35);
        graphics.stroke();
        graphics.moveTo(5, -25);
        graphics.lineTo(5, -35);
        graphics.stroke();
        
        // 天线顶部
        graphics.fillColor = new Color(255, 100, 100, 255);
        graphics.circle(-5, -35, 2);
        graphics.fill();
        graphics.circle(5, -35, 2);
        graphics.fill();
        
        // 机械臂/武器系统
        graphics.fillColor = new Color(110, 110, 110, 255);
        graphics.rect(-25, -8, 12, 6);
        graphics.fill();
        graphics.stroke();
        graphics.rect(13, -8, 12, 6);
        graphics.fill();
        graphics.stroke();
        
        // 履带/移动系统
        graphics.fillColor = new Color(80, 80, 80, 255);
        graphics.rect(-18, 15, 36, 10);
        graphics.fill();
        graphics.stroke();
        
        // 履带齿轮
        for (let i = 0; i < 6; i++) {
            const x = -15 + (i * 6);
            graphics.fillColor = new Color(60, 60, 60, 255);
            graphics.circle(x, 20, 2);
            graphics.fill();
        }
        
        // 机械装饰线条
        this.drawMechanicalDetails(graphics);
    }
    
    /**
     * 绘制机械细节
     */
    private drawMechanicalDetails(graphics: Graphics): void {
        graphics.strokeColor = new Color(180, 180, 180, 255);
        graphics.lineWidth = 1;
        
        // 机械纹路
        graphics.moveTo(-12, -5);
        graphics.lineTo(12, -5);
        graphics.stroke();
        graphics.moveTo(-12, 0);
        graphics.lineTo(12, 0);
        graphics.stroke();
        graphics.moveTo(-12, 5);
        graphics.lineTo(12, 5);
        graphics.stroke();
        
        // 机械接缝
        graphics.moveTo(-15, -10);
        graphics.lineTo(-15, 10);
        graphics.stroke();
        graphics.moveTo(15, -10);
        graphics.lineTo(15, 10);
        graphics.stroke();
    }
    
    /**
     * 更新机械特效和逻辑
     */
    protected update(dt: number): void {
        super.update(dt);
        
        // 机械特效更新
        this.mechEffectTimer += dt;
        if (this.mechEffectTimer >= 0.8) {
            this.mechEffectTimer = 0;
            this.updateMechanicalEffect();
        }
        
        // 召唤冷却
        this.summonCooldown -= dt;
        if (this.summonCooldown <= 0 && this.spawnedCount < this.summonCount) {
            this.summonMechUnits();
            this.summonCooldown = 3.0; // 3秒召唤一次
        }
        
        // 自我修复冷却
        this.healCooldown -= dt;
        if (this.healCooldown <= 0) {
            this.performSelfRepair();
            this.healCooldown = 2.0; // 2秒修复一次
        }
    }
    
    /**
     * 更新机械特效
     */
    private updateMechanicalEffect(): void {
        const graphics = this.node.getComponent(Graphics);
        if (!graphics) return;
        
        // 重绘基础外观
        graphics.clear();
        this.initializeMouseVisuals();
        
        // 添加扫描线特效
        const time = Date.now() / 1000;
        graphics.strokeColor = new Color(100, 255, 100, 150);
        graphics.lineWidth = 2;
        
        const scanY = -15 + (Math.sin(time * 4) + 1) * 15;
        graphics.moveTo(-15, scanY);
        graphics.lineTo(15, scanY);
        graphics.stroke();
        
        // 数据传输特效
        graphics.fillColor = new Color(100, 200, 255, 100);
        for (let i = 0; i < 3; i++) {
            const y = -8 + (i * 8) + Math.sin(time * 2 + i) * 2;
            graphics.rect(-2, y, 4, 2);
            graphics.fill();
        }
    }
    
    /**
     * 召唤机械单位
     */
    private summonMechUnits(): void {
        if (this.spawnedCount >= this.summonCount) return;
        
        const gameManager = GameManager.instance;
        if (!gameManager) {
            console.error("GameManager不存在，无法召唤");
            return;
        }
        
        console.log(`机械军团长召唤机械老鼠！已召唤数量：${this.spawnedCount}/${this.summonCount}`);
        
        // 在周围位置召唤机械老鼠
        const angle = Math.random() * 2 * Math.PI;
        const distance = 80;
        const offsetX = Math.cos(angle) * distance;
        const offsetY = Math.sin(angle) * distance;
        
        // 通过GameManager创建新机械敌人
        gameManager.spawnEnemyAtPosition(this.summonType,
            this.node.position.x + offsetX,
            this.node.position.y + offsetY);
        
        this.spawnedCount++;
        
        // 召唤特效
        this.showSummonEffect();
    }
    
    /**
     * 显示召唤特效
     */
    private showSummonEffect(): void {
        const graphics = this.node.getComponent(Graphics);
        if (!graphics) return;
        
        // 机械召唤光环
        graphics.strokeColor = new Color(100, 200, 255, 200);
        graphics.lineWidth = 3;
        graphics.circle(0, 0, 40);
        graphics.stroke();
        
        // 数据流特效
        graphics.fillColor = new Color(150, 200, 255, 150);
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const x = Math.cos(angle) * 30;
            const y = Math.sin(angle) * 30;
            graphics.rect(x - 1, y - 1, 2, 2);
            graphics.fill();
        }
        
        // 1.5秒后恢复正常外观
        this.scheduleOnce(() => {
            graphics.clear();
            this.initializeMouseVisuals();
        }, 1.5);
    }
    
    /**
     * 执行自我修复
     */
    private performSelfRepair(): void {
        if (this.currentHealth >= this.maxHealth) return;
        
        const healAmount = Math.min(this.healRate, this.maxHealth - this.currentHealth);
        this.currentHealth += healAmount;
        
        console.log(`机械军团长自我修复：回复${healAmount}点生命值，当前：${this.currentHealth}/${this.maxHealth}`);
        
        // 修复特效
        this.showRepairEffect();
    }
    
    /**
     * 显示修复特效
     */
    private showRepairEffect(): void {
        const graphics = this.node.getComponent(Graphics);
        if (!graphics) return;
        
        // 修复光芒
        graphics.strokeColor = new Color(100, 255, 100, 200);
        graphics.lineWidth = 2;
        graphics.circle(0, 0, 25);
        graphics.stroke();
        
        // 修复粒子
        graphics.fillColor = new Color(150, 255, 150, 150);
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = Math.cos(angle) * 15;
            const y = Math.sin(angle) * 15;
            graphics.circle(x, y, 2);
            graphics.fill();
        }
    }
    
    /**
     * 机械军团长受伤效果
     */
    protected onTakeDamage(damage: number): void {
        console.log("机械军团长装甲受损，启动应急修复程序！");
        
        // 应急修复特效
        const graphics = this.node.getComponent(Graphics);
        if (graphics) {
            // 添加警告特效
            graphics.strokeColor = new Color(255, 200, 0, 255);
            graphics.lineWidth = 3;
            graphics.circle(0, 0, 35);
            graphics.stroke();
            
            // 火花特效
            graphics.fillColor = new Color(255, 150, 50, 200);
            for (let i = 0; i < 8; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 20 + 15;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                graphics.circle(x, y, 1);
                graphics.fill();
            }
        }
    }
    
    /**
     * 机械军团长特殊死亡效果
     */
    protected onDie(): void {
        console.log("机械军团长系统失控，发生爆炸！");
        
        // 机械爆炸特效
        const graphics = this.node.getComponent(Graphics);
        if (graphics) {
            graphics.clear();
            
            // 爆炸中心
            graphics.fillColor = new Color(255, 100, 50, 255);
            graphics.circle(0, 0, 20);
            graphics.fill();
            
            // 爆炸碎片
            graphics.fillColor = new Color(140, 140, 140, 200);
            for (let i = 0; i < 15; i++) {
                const angle = (i * Math.PI * 2) / 15;
                const distance = 25 + (i * 3);
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                graphics.rect(x - 2, y - 2, 4, 4);
                graphics.fill();
            }
            
            // 电弧残留
            graphics.strokeColor = new Color(100, 150, 255, 150);
            graphics.lineWidth = 2;
            for (let i = 0; i < 6; i++) {
                const angle = Math.random() * Math.PI * 2;
                const startX = Math.cos(angle) * 15;
                const startY = Math.sin(angle) * 15;
                const endX = Math.cos(angle) * 35;
                const endY = Math.sin(angle) * 35;
                graphics.moveTo(startX, startY);
                graphics.lineTo(endX, endY);
                graphics.stroke();
            }
        }
        
        // 延迟销毁，展示爆炸效果
        this.scheduleOnce(() => {
            this.node.destroy();
        }, 1.8);
    }
}