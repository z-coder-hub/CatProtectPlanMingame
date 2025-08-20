import { _decorator, Component, Node, Vec3, Graphics, Color } from 'cc';
import { BaseUnit } from '../base/BaseUnit';
import { HeroType } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';

const { ccclass } = _decorator;

@ccclass('MaineThunder')
export class MaineThunder extends BaseUnit {
    
    // 英雄类型
    public readonly heroType: HeroType = HeroType.MAINE_THUNDER;
    
    protected onLoad(): void {
        super.onLoad();
        this.initializeMaineThunderStats();
        this.initializeVisuals();
    }
    
    // 初始化缅因雷猫属性
    private initializeMaineThunderStats(): void {
        const config = HERO_CONFIGS[HeroType.MAINE_THUNDER];
        
        this.unitName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.moveSpeed = config.moveSpeed;
    }
    
    // 初始化外观
    private initializeVisuals(): void {
        let graphics = this.node.addComponent(Graphics);
        
        this.drawMaineThunderAppearance(graphics);
    }
    
    // 绘制缅因雷猫外观
    private drawMaineThunderAppearance(graphics: Graphics): void {
        graphics.clear();
        
        // 绘制身体和边框（一条路径）
        graphics.rect(-22, -22, 44, 44);
        
        // 填充身体（深蓝色，代表雷电）
        graphics.fillColor = new Color(25, 25, 112); // 深蓝色
        graphics.fill();
        
        // 描边雷电边框（亮蓝色）
        graphics.strokeColor = new Color(0, 191, 255); // 亮蓝色
        graphics.lineWidth = 3;
        graphics.stroke();
        
        // 绘制雷电标识
        graphics.strokeColor = new Color(255, 255, 0); // 黄色闪电
        graphics.lineWidth = 3;
        // 闪电形状
        graphics.moveTo(-10, -15);
        graphics.lineTo(5, -5);
        graphics.lineTo(-5, 0);
        graphics.lineTo(10, 10);
        graphics.stroke();
    }
}