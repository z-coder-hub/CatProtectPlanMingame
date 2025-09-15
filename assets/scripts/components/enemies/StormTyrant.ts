import { _decorator, Component, Color, Graphics, tween, Vec3 } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyConfig, EnemyCategory } from '../../types/GameTypes';
import { GameManager } from '../../managers/GameManager';

const { ccclass, property } = _decorator;

/**
 * 疾风暴君 - 极速移动召唤BOSS
 * 特点：极高移动速度，可以召唤疾速小兵，风暴特效
 */
@ccclass('StormTyrant')
export class StormTyrant extends BaseMouse {

    /** 敌人类型 */
    public readonly enemyType: EnemyType = EnemyType.STORM_TYRANT;

    /** 召唤数量 */
    private summonCount: number = 3;
    
    /** 召唤类型 */
    private summonType: EnemyType = EnemyType.SPEED_MOUSE;
    
    /** 召唤冷却时间 */
    private summonCooldown: number = 0;
    
    /** 风暴特效计时器 */
    private stormEffectTimer: number = 0;
    
    // 实现BaseMouse的抽象方法 - 疾风暴君配置
    protected getConfig(): EnemyConfig {
        return {
            type: EnemyType.STORM_TYRANT,
            name: "疾风暴君",
            category: EnemyCategory.BOSS,
            health: 250,
            maxHealth: 250,
            moveSpeed: 140,
            goldReward: 90,
            summonCount: 3,
            summonType: EnemyType.SPEED_MOUSE
        };
    }

    protected onLoad(): void {
        super.onLoad();

        // 特殊属性配置
        const config = this.getConfig();
        this.summonCount = (config as any).summonCount || 3;
        this.summonType = (config as any).summonType || EnemyType.SPEED_MOUSE;

        console.log(`初始化${this.unitName}: 血量${this.maxHealth}, 移速${this.moveSpeed}, 奖励${this.goldReward}金币`);
    }

    /**
     * 初始化疾风暴君移动行为 - 大幅旋风式移动
     * 特点：使用spiral和curves模式，大摆动幅度，体现疾风特性
     */
    protected initializeMovementBehavior(): void {
        // 疾风暴君的移动模式 - 螺旋和曲线混合
        const patterns: ('spiral' | 'curves')[] = ['spiral', 'curves'];
        this._movementPattern = patterns[Math.floor(Math.random() * patterns.length)];

        // 大幅度的旋风式摆动 - 体现疾风暴君的狂野移动
        this._zigzagAmplitude = 60 + Math.random() * 40; // 60-100像素的大幅摆动
        this._segmentCount = 8 + Math.floor(Math.random() * 4); // 8-11段移动，增加旋风效果

        console.log(`疾风暴君移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }
    
    /**
     * 初始化疾风暴君外观
     */
    protected initializeMouseVisuals(): void {
        const graphics = this.getGraphicsComponent();
        
        // 风暴色彩 - 青蓝色主体
        graphics.fillColor = new Color(70, 150, 200, 255);    // 青蓝色身体
        graphics.strokeColor = new Color(50, 120, 180, 255);  // 深蓝边框
        graphics.lineWidth = 2;
        
        // 流线型身体 - 体现速度感
        graphics.ellipse(0, 0, 18, 25);
        graphics.fill();
        graphics.stroke();
        
        // 风暴眼 - 中央旋涡
        graphics.fillColor = new Color(100, 180, 220, 255);
        graphics.circle(0, 0, 8);
        graphics.fill();
        
        // 内部旋涡纹理
        graphics.strokeColor = new Color(130, 200, 240, 255);
        graphics.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            const startX = Math.cos(angle) * 3;
            const startY = Math.sin(angle) * 3;
            const endX = Math.cos(angle + Math.PI / 4) * 6;
            const endY = Math.sin(angle + Math.PI / 4) * 6;
            graphics.moveTo(startX, startY);
            graphics.lineTo(endX, endY);
            graphics.stroke();
        }
        
        // 风暴翼 - 体现飞行能力
        graphics.fillColor = new Color(90, 170, 210, 200);    // 半透明风翼
        graphics.ellipse(-22, -5, 8, 15);
        graphics.fill();
        graphics.ellipse(22, -5, 8, 15);
        graphics.fill();
        
        // 疾风尾迹
        graphics.strokeColor = new Color(120, 190, 230, 150);
        graphics.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            graphics.moveTo(-18 - (i * 5), 0);
            graphics.lineTo(-25 - (i * 5), 0);
            graphics.stroke();
        }
    }
    
    /**
     * 更新风暴特效和召唤逻辑
     */
    protected update(dt: number): void {
        super.update(dt);
        
        // 更新风暴特效
        this.stormEffectTimer += dt;
        if (this.stormEffectTimer >= 0.5) {
            this.stormEffectTimer = 0;
            this.updateStormEffect();
        }
        
        // 召唤冷却
        this.summonCooldown -= dt;
        if (this.summonCooldown <= 0) {
            this.summonSpeedMinions();
            this.summonCooldown = 8.0; // 8秒召唤一次
        }
    }
    
    /**
     * 更新风暴特效
     */
    private updateStormEffect(): void {
        const graphics = this.getGraphicsComponent();
        if (!graphics) return;
        
        // 重绘基础外观
        graphics.clear();
        this.initializeMouseVisuals();
        
        // 添加动态风暴环
        const time = Date.now() / 1000;
        graphics.strokeColor = new Color(150, 220, 255, 100);
        graphics.lineWidth = 2;
        
        for (let i = 0; i < 3; i++) {
            const radius = 25 + (i * 8) + Math.sin(time * 3 + i) * 5;
            graphics.circle(0, 0, radius);
            graphics.stroke();
        }
    }
    
    /**
     * 召唤疾速小兵
     */
    private summonSpeedMinions(): void {
        const gameManager = GameManager.instance;
        if (!gameManager) {
            console.error("GameManager不存在，无法召唤");
            return;
        }
        
        console.log(`疾风暴君召唤${this.summonCount}只疾速老鼠！`);
        
        // 在周围位置召唤疾速老鼠
        for (let i = 0; i < this.summonCount; i++) {
            const angle = (i * 2 * Math.PI) / this.summonCount;
            const distance = 60;
            const offsetX = Math.cos(angle) * distance;
            const offsetY = Math.sin(angle) * distance;
            
            // 通过GameManager创建新敌人
            gameManager.SpawnEnemyAtPosition(this.summonType, 
                new Vec3(this.node.position.x + offsetX, this.node.position.y + offsetY, 0));
        }
        
        // 召唤特效
        this.showSummonEffect();
    }
    
    /**
     * 显示召唤特效
     */
    private showSummonEffect(): void {
        const graphics = this.getGraphicsComponent();
        if (!graphics) return;
        
        // 添加召唤风暴特效
        graphics.strokeColor = new Color(200, 255, 200, 200);
        graphics.lineWidth = 4;
        graphics.circle(0, 0, 50);
        graphics.stroke();
        
        // 风暴粒子
        graphics.fillColor = new Color(150, 220, 255, 150);
        for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI) / 6;
            const x = Math.cos(angle) * 40;
            const y = Math.sin(angle) * 40;
            graphics.circle(x, y, 3);
            graphics.fill();
        }
        
        // 1秒后恢复正常外观
        tween(this.node)
            .delay(1.0)
            .call(() => {
                const graphics = this.getGraphicsComponent();
                if (graphics) {
                    graphics.clear();
                    this.initializeMouseVisuals();
                }
            })
            .start();
    }
    
    /**
     * 疾风暴君受伤效果
     */
    protected onTakeDamage(damage: number): void {
        console.log("疾风暴君在风暴中闪避攻击！");
        
        // 风暴闪避特效
        const graphics = this.getGraphicsComponent();
        if (graphics) {
            // 添加闪避风暴效果
            graphics.strokeColor = new Color(255, 255, 255, 200);
            graphics.lineWidth = 3;
            graphics.circle(0, 0, 30);
            graphics.stroke();
        }
    }
    
    /**
     * 疾风暴君特殊死亡效果
     */
    /**
     * 获取老鼠标签配置
     */
    
    protected onDie(): void {
        console.log("疾风暴君化作狂风消散...");
        
        // 风暴消散特效
        const graphics = this.getGraphicsComponent();
        if (graphics) {
            graphics.clear();
            
            // 显示消散的风暴
            graphics.strokeColor = new Color(120, 190, 230, 180);
            graphics.lineWidth = 2;
            for (let i = 0; i < 20; i++) {
                const angle = (i * Math.PI) / 10;
                const startRadius = 15;
                const endRadius = 45;
                const startX = Math.cos(angle) * startRadius;
                const startY = Math.sin(angle) * startRadius;
                const endX = Math.cos(angle) * endRadius;
                const endY = Math.sin(angle) * endRadius;
                graphics.moveTo(startX, startY);
                graphics.lineTo(endX, endY);
                graphics.stroke();
            }
        }
        
        // 调用父类死亡处理
        super.onDie();
    }
}