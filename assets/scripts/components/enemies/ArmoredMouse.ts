import { _decorator, Color, Node, tween, Vec3, Sprite } from 'cc';
import { EnemyCategory, EnemyConfig, EnemyType } from '../../types/GameTypes';
import { BaseMouse } from './BaseMouse';

const { ccclass, property } = _decorator;

@ccclass('ArmoredMouse')
export class ArmoredMouse extends BaseMouse {

    @property({ tooltip: "金币奖励", override: true })
    public goldReward: number = 6;

    // 护甲值从配置中动态获取，确保对象池重用时正确
    public get armor(): number {
        return this.getConfig().armorValue || 3;
    }

    // 私有属性（基类已提供 _gameManager, _nameLabel, _healthBarContainer, _healthBarForeground）

    // 装甲老鼠使用BaseMouse统一移动系统，移动相关属性已在基类中管理

    // 敌人类型
    public readonly enemyType: EnemyType = EnemyType.ARMORED_MOUSE;

    // 实现BaseMouse的抽象方法 - 装甲老鼠配置
    protected getConfig(): EnemyConfig {
        return {
            type: EnemyType.ARMORED_MOUSE,
            name: "钢甲鼠",
            category: EnemyCategory.ARMORED,
            health: 60,
            maxHealth: 60,
            moveSpeed: 100,
            goldReward: 6,
            armorValue: 3  // 护甲值降低，减少伤害减免
        };
    }

    // 实现抽象方法：获取敌人图片路径
    protected getEnemyImagePath(): string {
        return "images/emeies/ArmoredMouse";
    }

    // 重写：初始化特殊外观（现在基类处理图片加载）
    protected initializeMouseVisuals(): void {
        // 基类已处理图片/Graphics显示，这里可以添加特殊效果
        // 无需额外的外观初始化
    }


    // 装甲老鼠不再有攻击能力，移除 performAttack 方法

    // 继承父类的onLoad和start方法，无需重写
    // 基类已经处理了所有必要的初始化工作

    // 初始化移动行为
    protected initializeMovementBehavior(): void {
        // 覆盖基类方法，装甲老鼠移动稳重，很少变化方向
        const patterns: ('zigzag' | 'curves' | 'spiral' | 'dash' | 'straight' | 'stealth_sway')[] = ['straight', 'zigzag', 'curves'];
        this._movementPattern = patterns[Math.floor(Math.random() * patterns.length)];

        // 设置装甲老鼠的移动参数
        this._zigzagAmplitude = 8 + Math.random() * 10; // 8-18像素（中等摆动）
        this._segmentCount = 4 + Math.floor(Math.random() * 3); // 4-6段移动


        console.log(`${this.unitName}移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }


    // 删除不必要的中间层函数initializeVisuals()

    // 删除重复的血条创建系统！
    // BaseMouse已统一处理所有血条创建和管理，并根据EnemyCategory自动配置样式


    // 重写标签配置 - 使用统一大字体

    // ArmoredMouse使用BaseMouse的统一移动和更新系统

    // 装甲老鼠使用BaseMouse的统一移动系统

    // 随机停顿逻辑已移至BaseMouse统一管理

    // ArmoredMouse使用BaseMouse的统一移动系统，无需自定义移动逻辑

    // 重写受伤方法，添加护甲减伤机制
    public takeDamage(damage: number): void {
        if (!this.isAlive) return;

        // 护甲减伤计算
        const actualDamage = Math.max(1, damage - this.armor); // 至少造成1点伤害

        // 调用基类的takeDamage方法，让基类统一处理血条更新
        this.currentHealth = Math.max(0, this.currentHealth - actualDamage);
        this.updateMouseHealthBarDisplay(); // 使用基类的血条更新方法

        // 触发受伤回调
        this.onTakeDamage(actualDamage);

        // 简化的受伤效果
        this.playHurtEffect();

        // 显示护甲阻挡效果
        if (damage > actualDamage) {
            console.log(`护甲阻挡了 ${damage - actualDamage} 点伤害`);
        }

        console.log(`装甲老鼠受到 ${damage} 点伤害，护甲阻挡 ${damage - actualDamage} 点，实际受到 ${actualDamage} 点伤害`);

        // 检查死亡
        if (this.currentHealth <= 0) {
            this.die();
        }
    }


    // 攻击城堡
    // 移除攻击城堡方法，使用父类的 reachCastle 方法

    // 移除攻击特效方法

    // 重写受伤方法，添加受伤反馈
    protected onTakeDamage(damage: number): void {
        console.log(`装甲老鼠实际受到 ${damage} 点伤害，剩余血量: ${this.currentHealth}`);

        // 受伤闪烁效果（血条更新已在takeDamage中处理）
        this.playHurtEffect();
    }

    // 已删除自定义血条更新方法，使用基类的updateMouseHealthBarDisplay()

    // 播放受伤效果
    private playHurtEffect(): void {
        const sprite = this.node.getComponent(Sprite);
        if (!sprite) return;

        // 受伤闪红效果
        sprite.color = new Color(255, 100, 100);

        // 300ms后恢复原色
        tween(this.node)
            .delay(0.3)
            .call(() => {
                if (sprite && this.node.isValid) {
                    sprite.color = Color.WHITE;
                }
            })
            .start();
    }

    // 重写死亡方法
    // 使用基类的onDie实现，无需重复实现金币奖励和清理逻辑
    // 基类已统一处理所有逻辑：金币奖励、注销、清理、销毁
    protected onDie(): void {
        console.log(`装甲老鼠死亡，奖励 ${this.goldReward} 金币`);

        // 调用基类实现，它已统一处理所有必要逻辑
        super.onDie();
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
        // 简化的死亡效果
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(255, 215, 0, 150); // 金色半透明

            tween(sprite)
                .to(0.5, { color: new Color(255, 215, 0, 0) })
                .start();
        }
    }

    // 装甲老鼠使用BaseMouse的统一待机状态处理

    // 移除攻击英雄方法，装甲老鼠不再攻击
}
