import { _decorator, Node, Graphics, Color, Vec3, tween } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyConfig, EnemyCategory } from '../../types/GameTypes';
import { GameManager } from '../../managers/GameManager';
import { BattleManager } from '../../managers/BattleManager';
import { DrawingHelper } from '../../utils/DrawingHelper';

const { ccclass, property } = _decorator;

@ccclass('ArmoredMouse')
export class ArmoredMouse extends BaseMouse {
    
    @property({ tooltip: "金币奖励", override: true })
    public goldReward: number = 6;
    
    @property({ tooltip: "护甲值（减伤）" })
    public armor: number = 3;
    
    // 私有属性（基类已提供 _graphics, _gameManager, _nameLabel, _healthBarContainer, _healthBarForeground）
    
    // 装甲老鼠使用BaseMouse统一移动系统，移动相关属性已在基类中管理
    
    // 敌人类型
    public readonly enemyType: EnemyType = EnemyType.ARMORED_MOUSE;

    // 实现BaseMouse的抽象方法 - 装甲老鼠配置
    protected GetConfig(): EnemyConfig {
        return {
            type: EnemyType.ARMORED_MOUSE,
            name: "装甲老鼠",
            category: EnemyCategory.ARMORED,
            health: 60,
            maxHealth: 60,
            moveSpeed: 100,
            goldReward: 6,
            armorValue: 3  // 护甲值降低，减少伤害减免
        };
    }
    
    // 实现BaseMouse的抽象方法
    protected initializeMouseVisuals(): void {
        this.initializeVisuals();
        this.initializeHealthBar();
    }
    
    // 装甲老鼠不再有攻击能力，移除 performAttack 方法
    
    protected onLoad(): void {
        // 先调用父类初始化
        super.onLoad();
    }
    
    protected start(): void {
        super.start();
        
        // 获取GameManager引用
        this._gameManager = GameManager.instance;
        
        // 注册到BattleManager
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.RegisterEnemy(this.node);
        }
    }
    
    // 初始化移动行为
    protected initializeMovementBehavior(): void {
        // 覆盖基类方法，装甲老鼠移动稳重，很少变化方向
        const patterns: ('zigzag' | 'curves' | 'spiral' | 'dash' | 'straight' | 'stealth_sway')[] = ['straight', 'zigzag', 'curves'];
        this._movementPattern = patterns[Math.floor(Math.random() * patterns.length)];

        // 装甲老鼠使用BaseMouse统一的移动参数，无需自定义停顿逻辑

        console.log(`装甲老鼠移动模式: ${this._movementPattern}`);
    }
    
    
    // 初始化外观
    private initializeVisuals(): void {
        // 获取Graphics组件绘制外观
        this._graphics = this.getGraphicsComponent();
        
        this.drawArmoredMouseAppearance();
    }
    
    // 初始化血条
    private initializeHealthBar(): void {
        const healthBarData = DrawingHelper.createHealthBar(this.node, {
            width: 35,              // 更宽的血条
            height: 5,              // 更厚的血条
            position: { x: 0, y: 30, z: 0 }, // 在装甲老鼠上方
            backgroundColor: new Color(60, 60, 60), // 深灰色背景
            foregroundColor: new Color(255, 0, 0), // 红色前景（表示危险）
            borderColor: new Color(255, 215, 0), // 金色边框（表示装甲）
            borderWidth: 2
        });
        
        this._healthBarContainer = healthBarData.container;
        this._healthBarForeground = healthBarData.foreground;
        
        // 血条始终显示
        this._healthBarContainer.active = true;
        
        // 初始化血条显示
        this.updateHealthBarDisplay();
    }
    
    // 绘制装甲老鼠外观
    private drawArmoredMouseAppearance(): void {
        if (!this._graphics) return;
        
        this._graphics.clear();
        
        // 绘制装甲老鼠身体和边框（一条路径）
        this._graphics.rect(-18, -18, 36, 36);
        
        // 填充身体（深灰色，表示金属）
        this._graphics.fillColor = new Color(105, 105, 105); // 深灰色
        this._graphics.fill();
        
        // 描边装甲边框（金色）
        this._graphics.strokeColor = new Color(255, 215, 0); // 金色
        this._graphics.lineWidth = 3;
        this._graphics.stroke();
        
        // 绘制装甲细节（装甲板）
        this._graphics.strokeColor = new Color(192, 192, 192); // 银色细节
        this._graphics.lineWidth = 2;
        // 水平装甲线
        this._graphics.moveTo(-15, -8);
        this._graphics.lineTo(15, -8);
        this._graphics.moveTo(-15, 0);
        this._graphics.lineTo(15, 0);
        this._graphics.moveTo(-15, 8);
        this._graphics.lineTo(15, 8);
        // 垂直装甲线
        this._graphics.moveTo(-8, -15);
        this._graphics.lineTo(-8, 15);
        this._graphics.moveTo(0, -15);
        this._graphics.lineTo(0, 15);
        this._graphics.moveTo(8, -15);
        this._graphics.lineTo(8, 15);
        this._graphics.stroke();
        
        // 绘制盾牌标识
        this._graphics.fillColor = new Color(255, 215, 0); // 金色盾牌
        this._graphics.moveTo(0, -15);
        this._graphics.lineTo(-8, -8);
        this._graphics.lineTo(-8, 8);
        this._graphics.lineTo(0, 15);
        this._graphics.lineTo(8, 8);
        this._graphics.lineTo(8, -8);
        this._graphics.close();
        this._graphics.fill();
        
        // 盾牌轮廓
        this._graphics.strokeColor = new Color(184, 134, 11); // 深金色
        this._graphics.lineWidth = 2;
        this._graphics.moveTo(0, -15);
        this._graphics.lineTo(-8, -8);
        this._graphics.lineTo(-8, 8);
        this._graphics.lineTo(0, 15);
        this._graphics.lineTo(8, 8);
        this._graphics.lineTo(8, -8);
        this._graphics.close();
        this._graphics.stroke();
        
        // 绘制眼睛（蓝色，表示冷静）
        this._graphics.fillColor = new Color(0, 0, 255); // 蓝色眼睛
        this._graphics.circle(-6, -6, 2);
        this._graphics.fill();
        this._graphics.circle(6, -6, 2);
        this._graphics.fill();
    }
    
    // 重写标签配置 - 使用统一大字体
    protected getMouseLabelConfig() {
        return {
            text: "甲鼠",
            fontSize: 22,
            color: new Color(255, 215, 0), // 金色文字
            yOffset: 45, // 装甲老鼠更高，需要更大的偏移
            size: { width: 60, height: 28 }
        };
    }

    // 实现BaseMouse的抽象方法 - 血条配置
    protected getHealthBarConfig() {
        return {
            width: 40,
            height: 5,
            yOffset: 30,
            backgroundColor: new Color(60, 60, 60),
            foregroundColor: new Color(255, 215, 0), // 金色前景
            borderColor: new Color(255, 255, 255),
            borderWidth: 1
        };
    }
    
    // ArmoredMouse使用BaseMouse的统一移动和更新系统
    
    // 装甲老鼠使用BaseMouse的统一移动系统
    
    // 随机停顿逻辑已移至BaseMouse统一管理
    
    // ArmoredMouse使用BaseMouse的统一移动系统，无需自定义移动逻辑
    
    // 重写受伤方法，添加护甲减伤机制
    public takeDamage(damage: number): void {
        if (!this.isAlive) return;
        
        // 护甲减伤计算
        const actualDamage = Math.max(1, damage - this.armor); // 至少造成1点伤害

        // 调用父类方法但传入减伤后的伤害
        this.currentHealth = Math.max(0, this.currentHealth - actualDamage);
        this.updateHealthBarDisplay();

        // 触发受伤回调
        this.onTakeDamage(actualDamage);

        // 显示护甲阻挡效果
        if (damage > actualDamage) {
            this.showArmorBlockEffect(damage - actualDamage);
        }
        
        console.log(`装甲老鼠受到 ${damage} 点伤害，护甲阻挡 ${damage - actualDamage} 点，实际受到 ${actualDamage} 点伤害`);
        
        // 检查死亡
        if (this.currentHealth <= 0) {
            this.die();
        }
    }
    
    // 显示护甲阻挡效果
    private showArmorBlockEffect(blockedDamage: number): void {
        const effectNode = new Node("ArmorBlockEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(Vec3.add(new Vec3(), this.node.position, new Vec3(0, 20, 0)));
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.fillColor = new Color(255, 215, 0, 200); // 金色护甲效果
        // 根据阻挡伤害调整效果大小
        const effectSize = Math.min(20, 10 + blockedDamage * 2);
        effectGraphics.circle(0, 0, effectSize);
        effectGraphics.fill();
        
        // 使用Tween系统实现护甲闪光效果，替代requestAnimationFrame
        let scale = 1;
        let opacity = 200;
        const maxFrames = 10; // 控制动画帧数
        let currentFrame = 0;
        
        const updateEffect = () => {
            currentFrame++;
            scale = 1 + currentFrame * 0.1;
            opacity = Math.max(0, 200 - currentFrame * 20);
            
            if (effectGraphics && effectNode.isValid && currentFrame < maxFrames && opacity > 0) {
                effectGraphics.clear();
                effectGraphics.fillColor = new Color(255, 215, 0, opacity);
                effectGraphics.circle(0, 0, 15 * scale);
                effectGraphics.fill();
                
                // 使用Tween进行下一帧更新
                tween(effectNode)
                    .delay(0.05)
                    .call(updateEffect)
                    .start();
            } else {
                if (effectNode && effectNode.isValid) {
                    effectNode.destroy();
                }
            }
        };
        
        updateEffect();
    }
    
    // 攻击城堡
    // 移除攻击城堡方法，使用父类的 reachCastle 方法
    
    // 移除攻击特效方法
    
    // 重写受伤方法，添加受伤反馈
    protected onTakeDamage(damage: number): void {
        console.log(`装甲老鼠实际受到 ${damage} 点伤害，剩余血量: ${this.currentHealth}`);
        
        // 更新血条显示
        this.updateHealthBarDisplay();
        
        // 受伤闪烁效果
        this.playHurtEffect();
    }
    
    // 更新血条显示
    private updateHealthBarDisplay(): void {
        if (this._healthBarForeground && this._healthBarContainer) {
            const healthPercent = this.currentHealth / this.maxHealth;
            DrawingHelper.updateHealthBar(this._healthBarForeground, healthPercent, 35, 5);
            
            // 血条始终显示，只有死亡时才隐藏
            this._healthBarContainer.active = healthPercent > 0;
        }
    }
    
    // 播放受伤效果
    private playHurtEffect(): void {
        if (!this._graphics) return;
        
        // 装甲受伤效果 - 金色闪光
        this._graphics.clear();
        this._graphics.fillColor = new Color(255, 215, 100); // 亮金色受伤效果
        this._graphics.rect(-18, -18, 36, 36);
        this._graphics.fill();
        
        // 300ms后恢复原色，使用Tween系统替代scheduleOnce
        tween(this.node)
            .delay(0.3)
            .call(() => {
                if (this._graphics && this.node.isValid) {
                    this.drawArmoredMouseAppearance();
                }
            })
            .start();
    }
    
    // 重写死亡方法
    protected onDie(): void {
        console.log(`装甲老鼠死亡，奖励 ${this.goldReward} 金币`);
        
        // 从BattleManager注销
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.UnregisterEnemy(this.node);
        }
        
        // 给予金币奖励
        if (this._gameManager) {
            this._gameManager.AddGold(this.goldReward);
            this._gameManager.RemoveActiveEnemy(this.node);
        }
        
        // 创建死亡特效
        this.createDeathEffect();
        
        // 隐藏血条
        if (this._healthBarContainer) {
            this._healthBarContainer.active = false;
        }
        
        // 销毁节点，清理尸体
        this.node.destroy();
    }
    
    // 创建装甲老鼠死亡特效
    protected createDeathEffect(): void {
        if (this.node.parent) {
            // 创建装甲破碎特效
            this.createArmorBreakEffect();
        }
    }
    
    // 创建装甲破碎特效
    private createArmorBreakEffect(): void {
        const effectNode = new Node("ArmorBreakEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        
        // 创建多个破碎片段
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * 20;
            const y = Math.sin(angle) * 20;
            
            effectGraphics.fillColor = new Color(255, 215, 0, 150); // 半透明金色
            effectGraphics.rect(x - 3, y - 3, 6, 6);
            effectGraphics.fill();
        }
        
        // 使用Tween系统进行延迟销毁，避免在已销毁的节点上调用scheduleOnce
        tween(effectNode)
            .delay(0.5)
            .call(() => {
                if (effectNode && effectNode.isValid) {
                    effectNode.destroy();
                }
            })
            .start();
    }
    
    // 装甲老鼠使用BaseMouse的统一待机状态处理
    
    // 移除攻击英雄方法，装甲老鼠不再攻击
}