import { _decorator, Color, Graphics, Vec3, Node, tween, UIOpacity } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyConfig, EnemyCategory } from '../../types/GameTypes';
import { GameManager } from '../../managers/GameManager';

const { ccclass, property } = _decorator;

/**
 * 老鼠王 - 召唤型BOSS，定期召唤基础老鼠
 * 特点：血量300，移速35，定期召唤3只基础老鼠，奖励25金币
 */
@ccclass('MouseKing')
export class MouseKing extends BaseMouse {
    
    public readonly enemyType: EnemyType = EnemyType.MOUSE_KING;
    
    @property({ tooltip: "召唤数量" })
    public summonCount: number = 3;
    
    @property({ tooltip: "召唤的敌人类型" })
    public summonType: EnemyType = EnemyType.BASIC_MOUSE;
    
    @property({ tooltip: "召唤间隔时间(秒)" })
    public summonInterval: number = 8;
    
    // 召唤系统
    private _summonTimer: number = 0;
    private _nextSummonTime: number = 4; // 首次召唤延迟4秒
    private _summonCount: number = 0;     // 已召唤次数
    private _maxSummons: number = 5;      // 最大召唤次数
    
    // 实现BaseMouse的抽象方法 - 老鼠王配置
    protected getConfig(): EnemyConfig {
        return {
            type: EnemyType.MOUSE_KING,
            name: "老鼠王",
            category: EnemyCategory.BOSS,
            health: 200,
            maxHealth: 200,
            moveSpeed: 70,
            goldReward: 30,
            summonCount: 2,
            summonType: EnemyType.BASIC_MOUSE
        };
    }

    protected onLoad(): void {
        super.onLoad();

        // 特殊属性：召唤属性
        const config = this.getConfig();
        this.summonCount = config.summonCount || 3;
        this.summonType = config.summonType || EnemyType.BASIC_MOUSE;

        console.log(`初始化${this.unitName}: 血量${this.maxHealth}, 移速${this.moveSpeed}, 召唤${this.summonCount}只${this.summonType}, 奖励${this.goldReward}金币`);
    }

    // 重写基类移动行为初始化，使用老鼠王的参数
    protected initializeMovementBehavior(): void {
        // 老鼠王的移动参数配置：主要curves和spiral，威严优雅
        const patterns: ('curves' | 'spiral')[] = ['curves', 'spiral'];
        this._movementPattern = patterns[Math.floor(Math.random() * patterns.length)];

        // 设置威严的移动参数
        this._zigzagAmplitude = 25 + Math.random() * 15; // 25-40像素（BOSS威严的大幅移动）
        this._segmentCount = 5 + Math.floor(Math.random() * 4); // 5-8段移动（更多分段，更优雅）

        console.log(`${this.unitName}移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }
    
    protected initializeMouseVisuals(): void {
        // 创建老鼠王外观 - 金黄色华贵外观，体型更大
        const graphics = this.getGraphicsComponent();
        
        // 设置节点缩放，老鼠王比普通老鼠大50%
        this.node.setScale(1.5, 1.5, 1.5);
        
        // 绘制老鼠王身体
        this.drawMouseKingAppearance(graphics);
        
        console.log(`${this.unitName}外观创建完成`);
    }
    
    /**
     * 绘制老鼠王外观
     * @param graphics 绘图组件
     */
    private drawMouseKingAppearance(graphics: Graphics): void {
        graphics.clear();
        
        // 绘制华贵的老鼠王身体（金黄色）
        graphics.fillColor = new Color(255, 215, 0, 255);      // 金黄色身体
        graphics.strokeColor = new Color(218, 165, 32, 255);   // 深金色边框
        graphics.lineWidth = 3;
        
        // 主体 - 椭圆形身体，比普通老鼠更大更圆润
        graphics.ellipse(-16, -8, 32, 16);
        graphics.fill();
        graphics.stroke();
        
        // 头部 - 更大的头部
        graphics.fillColor = new Color(255, 235, 50, 255);     // 稍亮的金色头部
        graphics.ellipse(-12, 0, 24, 14);
        graphics.fill();
        graphics.stroke();
        
        // 王冠
        graphics.fillColor = new Color(255, 0, 0, 255);        // 红色王冠
        graphics.moveTo(-10, 8);
        graphics.lineTo(-6, 15);
        graphics.lineTo(-2, 12);
        graphics.lineTo(2, 15);
        graphics.lineTo(6, 12);
        graphics.lineTo(10, 15);
        graphics.lineTo(8, 8);
        graphics.close();
        graphics.fill();
        
        // 王冠宝石
        graphics.fillColor = new Color(0, 255, 255, 255);      // 青色宝石
        graphics.circle(0, 13, 2);
        graphics.fill();
        
        // 眼睛 - 威严的红色眼睛
        graphics.fillColor = new Color(255, 255, 255, 255);    // 白色眼白
        graphics.ellipse(-6, 2, 8, 6);
        graphics.fill();
        graphics.ellipse(6, 2, 8, 6);
        graphics.fill();
        
        // 眼珠 - 红色威严眼神
        graphics.fillColor = new Color(255, 0, 0, 255);
        graphics.circle(-4, 3, 3);
        graphics.fill();
        graphics.circle(4, 3, 3);
        graphics.fill();
        
        // 瞳孔
        graphics.fillColor = new Color(0, 0, 0, 255);
        graphics.circle(-4, 3, 1);
        graphics.fill();
        graphics.circle(4, 3, 1);
        graphics.fill();
        
        // 鼻子
        graphics.fillColor = new Color(255, 100, 100, 255);
        graphics.ellipse(0, -2, 6, 4);
        graphics.fill();
        
        // 胡须
        graphics.strokeColor = new Color(0, 0, 0, 255);
        graphics.lineWidth = 2;
        // 左胡须
        graphics.moveTo(-12, 0);
        graphics.lineTo(-18, -1);
        graphics.moveTo(-12, 2);
        graphics.lineTo(-18, 3);
        // 右胡须
        graphics.moveTo(12, 0);
        graphics.lineTo(18, -1);
        graphics.moveTo(12, 2);
        graphics.lineTo(18, 3);
        graphics.stroke();
        
        // 耳朵 - 大而圆润的耳朵
        graphics.fillColor = new Color(255, 215, 0, 255);
        graphics.circle(-14, 6, 6);
        graphics.fill();
        graphics.circle(14, 6, 6);
        graphics.fill();
        
        // 耳朵内侧
        graphics.fillColor = new Color(255, 180, 180, 255);
        graphics.circle(-14, 6, 3);
        graphics.fill();
        graphics.circle(14, 6, 3);
        graphics.fill();
        
        // 王者斗篷（简化的红色斗篷）
        graphics.fillColor = new Color(139, 0, 0, 255);        // 深红色斗篷
        graphics.ellipse(0, -12, 20, 8);
        graphics.fill();
        
        // 脚部 - 更粗壮的脚
        graphics.fillColor = new Color(218, 165, 32, 255);
        graphics.circle(-8, -16, 4);
        graphics.fill();
        graphics.circle(8, -16, 4);
        graphics.fill();
        
        // 尾巴 - 威严的粗尾巴
        graphics.strokeColor = new Color(255, 215, 0, 255);
        graphics.lineWidth = 6;
        graphics.moveTo(14, -4);
        graphics.quadraticCurveTo(22, -10, 28, -6);
        graphics.stroke();
        
        // 尾巴尖端装饰
        graphics.fillColor = new Color(255, 0, 0, 255);
        graphics.circle(28, -6, 3);
        graphics.fill();
    }
    
    /**
     * 重写update方法，添加召唤逻辑
     */
    protected update(dt: number): void {
        super.update(dt);
        
        if (!this.isAlive) return;
        
        // 召唤系统更新
        this._summonTimer += dt;
        if (this._summonTimer >= this._nextSummonTime && this._summonCount < this._maxSummons) {
            this.performSummon();
            this._summonTimer = 0;
            this._nextSummonTime = this.summonInterval; // 后续召唤按标准间隔
        }
    }
    
    /**
     * 执行召唤
     */
    private performSummon(): void {
        const gameManager = GameManager.instance;
        if (!gameManager) {
            console.error(`${this.unitName}召唤失败：GameManager不存在`);
            return;
        }
        
        console.log(`${this.unitName}开始召唤 ${this.summonCount} 只 ${this.summonType}！`);
        
        const summonPosition = this.node.position.clone();
        
        // 召唤多个基础老鼠
        for (let i = 0; i < this.summonCount; i++) {
            // 在老鼠王周围随机位置召唤
            const offsetX = (Math.random() - 0.5) * 100; // -50到50的随机偏移
            const offsetY = (Math.random() - 0.5) * 60;  // -30到30的随机偏移
            
            const spawnPos = new Vec3(
                summonPosition.x + offsetX,
                summonPosition.y + offsetY,
                summonPosition.z
            );
            
            // 延迟召唤，避免同时创建造成卡顿
            tween(this.node)
                .delay(i * 0.2)
                .call(() => {
                    if (this.node && this.node.isValid) {
                        this.createSummonedEnemy(spawnPos);
                    }
                })
                .start();
        }
        
        this._summonCount++;
        this.createSummonEffect();
        
        console.log(`${this.unitName}已召唤 ${this._summonCount}/${this._maxSummons} 次`);
    }
    
    /**
     * 创建被召唤的敌人
     */
    private createSummonedEnemy(position: Vec3): void {
        const gameManager = GameManager.instance;
        if (!gameManager) return;
        
        try {
            // 通过GameManager创建敌人
            gameManager.SpawnEnemyAtPosition(this.summonType, position);
            console.log(`${this.unitName}召唤了一只${this.summonType}在位置(${position.x.toFixed(1)}, ${position.y.toFixed(1)})`);
        } catch (error) {
            console.error(`${this.unitName}召唤敌人失败:`, error);
        }
    }
    
    /**
     * 创建召唤特效
     */
    private createSummonEffect(): void {
        // 召唤特效 - 老鼠王发光和震动
        const originalScale = this.node.scale.clone();
        
        // 发光效果（放大再缩回）
        this.node.setScale(originalScale.x * 1.2, originalScale.y * 1.2, originalScale.z);
        
        tween(this.node)
            .delay(0.3)
            .call(() => {
                if (this.node && this.node.isValid) {
                    this.node.setScale(originalScale);
                }
            })
            .start();
        
        // 闪烁效果
        const uiOpacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        const originalOpacity = uiOpacity.opacity;
        uiOpacity.opacity = 255;

        for (let i = 1; i <= 3; i++) {
            tween(this.node)
                .delay(i * 0.1)
                .call(() => {
                    if (this.node && this.node.isValid && uiOpacity) {
                        uiOpacity.opacity = i % 2 === 0 ? originalOpacity : 200;
                    }
                })
                .start();
        }
        
        console.log(`${this.unitName}召唤特效完成`);
    }
    
    /**
     * 获取老鼠王标签配置
     */
    
    // 基类已实现完整的Tween移动系统，老鼠王使用统一的移动逻辑
    
    /**
     * 重写城堡到达方法 - 老鼠王到达城堡造成巨大伤害
     */
    protected reachCastle(): void {
        if (!this._gameManager) return;

        // 老鼠王到达城堡造成巨大伤害
        const castleDamage = Math.floor(this.maxHealth / 5); // 基于血量计算的高伤害
        this._gameManager.CastleTakeDamage(castleDamage);

        console.log(`${this.unitName}到达城堡！造成 ${castleDamage} 点巨大伤害！`);

        // 创建BOSS到达特效
        this.createCastleReachEffect();

        // 调用基类处理
        this._gameManager.RemoveActiveEnemy(this.node);
        this.die();
    }
    
    /**
     * 重写创建城堡到达特效方法 - BOSS特殊特效
     */
    protected createCastleReachEffect(): void {
        // BOSS级别的到达特效 - 强烈震动和闪光
        const originalPos = this.node.position.clone();
        const originalScale = this.node.scale.clone();
        
        // 强烈震动
        for (let i = 0; i < 8; i++) {
            tween(this.node)
                .delay(i * 0.05)
                .call(() => {
                    if (this.node && this.node.isValid) {
                        const shakeX = (Math.random() - 0.5) * 20;
                        const shakeY = (Math.random() - 0.5) * 20;
                        this.node.setPosition(originalPos.x + shakeX, originalPos.y + shakeY, originalPos.z);
                        
                        // 同时放大
                        const scaleMultiplier = 1 + (Math.random() * 0.3);
                        this.node.setScale(originalScale.x * scaleMultiplier, originalScale.y * scaleMultiplier, originalScale.z);
                    }
                })
                .start();
        }
    }
    
    /**
     * 创建死亡特效 - BOSS的特殊死亡效果
     */
    protected createDeathEffect(): void {
        // BOSS死亡特效 - 华丽的消失效果
        const originalScale = this.node.scale.clone();
        
        // 膨胀然后收缩消失
        this.node.setScale(originalScale.x * 2, originalScale.y * 2, originalScale.z);
        
        const uiOpacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);

        tween(this.node)
            .delay(0.5)
            .call(() => {
                if (this.node && this.node.isValid && uiOpacity) {
                    this.node.setScale(0, 0, 0);
                    uiOpacity.opacity = 0;
                }
            })
            .start();
        
        console.log(`${this.unitName}王者陨落！`);
    }
}