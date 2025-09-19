import { _decorator, Color, Sprite, Vec3, tween, UIOpacity } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyConfig, EnemyCategory } from '../../types/GameTypes';

const { ccclass } = _decorator;

/**
 * 机械老鼠 - 高科技移动单位，专注突破防线
 * 特点：血量250，移速50，科技外观，奖励30金币
 * 设计原则：不具备攻击能力，专注于到达城堡造成威胁
 */
@ccclass('MechMouse')
export class MechMouse extends BaseMouse {
    
    public readonly enemyType: EnemyType = EnemyType.MECH_MOUSE;
    
    // 私有属性（基类已提供 _gameManager）
    
    // 科技视觉效果属性
    private _engineGlow: number = 0;          // 引擎发光效果
    
    // 实现BaseMouse的抽象方法 - 机械老鼠配置
    protected getConfig(): EnemyConfig {
        return {
            type: EnemyType.MECH_MOUSE,
            name: "机甲鼠",
            category: EnemyCategory.BOSS,
            health: 180,
            maxHealth: 180,
            moveSpeed: 90,
            goldReward: 25
        };
    }

    // 实现抽象方法：获取敌人图片路径
    protected getEnemyImagePath(): string {
        return "images/emeies/MechMouse";
    }

    // 重写：初始化特殊外观（现在基类处理图片加载）
    protected initializeMouseVisuals(): void {
        // 基类已处理图片/Graphics显示，这里可以添加特殊效果
        // 大小由基类的统一尺寸管理系统控制
    }

    // 实现抽象方法：绘制Graphics外观（没有图片资源，使用Graphics绘制）
    protected drawEnemyGraphics(graphics: any): void {
        // 机械老鼠已迁移到Sprite颜色系统
        this.drawMechMouseAppearance();
    }

    /**
     * 绘制机械老鼠外观（改为Sprite颜色）
     */
    private drawMechMouseAppearance(): void {
        // 机械外观颜色 - 银灰色机械身体
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            const bodyColor = new Color(120, 120, 140); // 银灰色机械身体
            sprite.color = bodyColor;
        }
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
        // 更新科技外观 - 改为Sprite颜色变化
        this.drawMechMouseAppearance();

        // 添加引擎发光效果
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            const glowIntensity = this._engineGlow;
            const baseColor = 120;
            sprite.color = new Color(
                baseColor,
                baseColor,
                Math.floor(140 + glowIntensity * 115) // 蓝色引擎发光
            );
        }
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
        this.createCastleReachEffect();

        // 调用基类处理
        // 注意：敌人注销由BattleManager.HandleEnemyKilled统一处理
        this.die();
    }
    
    /**
     * 创建科技到达城堡的特效
     */
    protected createCastleReachEffect(): void {
        // 科技攻击特效 - 电磁脉冲效果
        const originalScale = this.node.scale.clone();
        const uiOpacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        
        // 电磁脉冲扩散
        this.node.setScale(originalScale.x * 0.5, originalScale.y * 0.5, originalScale.z);
        
        // 快速扩散然后消失 - 使用tween系统替代scheduleOnce
        tween(this.node)
            .delay(0.1)
            .call(() => {
                if (this.node && this.node.isValid) {
                    this.node.setScale(originalScale.x * 3, originalScale.y * 3, originalScale.z);
                    uiOpacity.opacity = 100;
                }
            })
            .start();
        
        tween(this.node)
            .delay(0.3)
            .call(() => {
                if (this.node && this.node.isValid) {
                    uiOpacity.opacity = 0;
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
        const uiOpacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        const originalOpacity = uiOpacity.opacity;
        
        // 第一阶段：电路短路闪烁 - 使用tween系统替代scheduleOnce
        for (let i = 1; i <= 8; i++) {
            tween(this.node)
                .delay(i * 0.05)
                .call(() => {
                    if (this.node && this.node.isValid) {
                        uiOpacity.opacity = i % 2 === 0 ? originalOpacity : 50;
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
                    uiOpacity.opacity = 200;
                }
            })
            .start();
        
        // 第三阶段：消失 - 使用tween系统替代scheduleOnce
        tween(this.node)
            .delay(0.7)
            .call(() => {
                if (this.node && this.node.isValid) {
                    this.node.setScale(0, 0, 0);
                    uiOpacity.opacity = 0;
                }
            })
            .start();
        
        console.log(`${this.unitName}机械系统损毁，爆炸解体！`);
    }
}