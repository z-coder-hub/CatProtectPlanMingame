import { _decorator, Graphics, Color, Node, Label, UITransform } from 'cc';

const { ccclass } = _decorator;

// 绘制样式配置
export interface DrawStyle {
    fillColor?: Color;
    strokeColor?: Color;
    lineWidth?: number;
}

// 标签配置
export interface LabelConfig {
    text: string;
    fontSize: number;
    color: Color;
    position: { x: number; y: number; z: number };
    size?: { width: number; height: number };
}

@ccclass('DrawingHelper')
export class DrawingHelper {
    
    // 英雄外观绘制方法已移除 - 现在使用placed图片或白色圆点显示
    // 如果需要恢复Graphics绘制，请参考项目历史版本
    
    // 英雄绘制方法已移除 - 橘猫外观现在使用placed图片显示
    
    // 英雄绘制方法已移除 - 暹罗猫外观现在使用白色圆点显示
    
    // 英雄绘制方法已移除 - 缅因猫外观现在使用placed图片显示
    
    // 绘制敌人外观的通用方法
    public static drawEnemyAppearance(
        graphics: Graphics,
        enemyType: 'basicMouse',
        scale: number = 1
    ): void {
        graphics.clear();
        
        switch (enemyType) {
            case 'basicMouse':
                this.drawBasicMouse(graphics, scale);
                break;
        }
    }
    
    // 绘制基础老鼠外观
    private static drawBasicMouse(graphics: Graphics, scale: number): void {
        const width = 26.4 * scale;
        const height = 18 * scale;
        
        // 绘制身体（灰色椭圆）
        graphics.fillColor = new Color(128, 128, 128);
        graphics.ellipse(0, 0, width, height);
        graphics.fill();
        
        // 绘制轮廓
        graphics.strokeColor = new Color(64, 64, 64);
        graphics.lineWidth = 1;
        graphics.ellipse(0, 0, width, height);
        graphics.stroke();
        
        // 绘制耳朵
        graphics.fillColor = new Color(100, 100, 100);
        graphics.circle(-width * 0.54, height * 0.8, 4.8 * scale);
        graphics.fill();
        graphics.circle(width * 0.54, height * 0.8, 4.8 * scale);
        graphics.fill();
        
        // 绘制尾巴
        graphics.strokeColor = new Color(100, 100, 100);
        graphics.lineWidth = 2;
        graphics.moveTo(0, -height);
        graphics.lineTo(-width * 0.32, -height * 1.67);
        graphics.stroke();
    }
    
    // 绘制星星形状
    private static drawStar(graphics: Graphics, x: number, y: number, size: number, color: Color): void {
        graphics.fillColor = color;
        
        const points = 5;
        const outerRadius = size;
        const innerRadius = size * 0.4;
        
        graphics.moveTo(x, y - outerRadius);
        
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const px = x + Math.sin(angle) * radius;
            const py = y - Math.cos(angle) * radius;
            graphics.lineTo(px, py);
        }
        
        graphics.close();
        graphics.fill();
    }
    
    // 创建标签的通用方法
    public static createLabel(parent: Node, config: LabelConfig): Label {
        const labelNode = new Node(`Label_${config.text}`);
        labelNode.parent = parent;
        labelNode.setPosition(config.position.x, config.position.y, config.position.z);
        
        // 设置UITransform
        const uiTransform = labelNode.addComponent(UITransform);
        if (config.size) {
            uiTransform.setContentSize(config.size.width, config.size.height);
        } else {
            uiTransform.setContentSize(config.text.length * config.fontSize, config.fontSize);
        }
        
        // 创建Label组件
        const label = labelNode.addComponent(Label);
        label.string = config.text;
        label.fontSize = config.fontSize;
        label.color = config.color;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        
        return label;
    }
    
    
    // 绘制受伤效果 - 英雄绘制方法已移除，简化为基本红色效果
    public static drawHurtEffect(graphics: Graphics, heroType: 'orange' | 'siamese' | 'maine' | 'basicMouse', scale: number = 1): void {
        graphics.clear();

        // 简单红色覆盖表示受伤，不再调用具体绘制方法
        if (heroType === 'basicMouse') {
            graphics.fillColor = new Color(255, 100, 100);
            graphics.ellipse(0, 0, 26.4 * scale, 18 * scale);
            graphics.fill();
        } else {
            // 英雄现在使用placed图片或白色圆点，受伤效果简化为红色圆形
            graphics.fillColor = new Color(255, 100, 100);
            graphics.circle(0, 0, 30 * scale); // 固定尺寸，与白色圆点一致
            graphics.fill();
        }
    }
    
    // 创建血条的通用方法
    public static createHealthBar(parent: Node, config: {
        width: number;
        height: number;
        position: { x: number; y: number; z: number };
        backgroundColor?: Color;
        foregroundColor?: Color;
        borderColor?: Color;
        borderWidth?: number;
    }): { container: Node; background: Graphics; foreground: Graphics } {
        
        // 创建血条容器
        const healthBarContainer = new Node("HealthBar");
        healthBarContainer.parent = parent;
        healthBarContainer.setPosition(config.position.x, config.position.y, config.position.z);
        
        // 设置UITransform
        const transform = healthBarContainer.addComponent(UITransform);
        transform.setContentSize(config.width, config.height);
        
        // 创建背景
        const backgroundNode = new Node("HealthBarBackground");
        backgroundNode.parent = healthBarContainer;
        const background = backgroundNode.addComponent(Graphics);
        
        // 绘制背景路径（包括边框）
        background.rect(-config.width / 2, -config.height / 2, config.width, config.height);
        
        // 填充背景
        background.fillColor = config.backgroundColor || new Color(100, 100, 100);
        background.fill();
        
        // 描边（可选）
        if (config.borderColor && config.borderWidth) {
            background.strokeColor = config.borderColor;
            background.lineWidth = config.borderWidth;
            background.stroke();
        }
        
        // 创建前景（血量条）
        const foregroundNode = new Node("HealthBarForeground");
        foregroundNode.parent = healthBarContainer;
        const foreground = foregroundNode.addComponent(Graphics);
        foreground.fillColor = config.foregroundColor || new Color(255, 0, 0);
        foreground.rect(-config.width / 2, -config.height / 2, config.width, config.height);
        foreground.fill();
        
        return {
            container: healthBarContainer,
            background: background,
            foreground: foreground
        };
    }
    
    // 更新血条显示
    public static updateHealthBar(foregroundGraphics: Graphics, healthPercent: number, width: number, height: number): void {
        if (!foregroundGraphics) return;
        
        // 限制血量百分比在0-1之间
        healthPercent = Math.max(0, Math.min(1, healthPercent));
        
        // 根据血量百分比改变颜色
        let color: Color;
        if (healthPercent > 0.6) {
            color = new Color(0, 255, 0); // 绿色 - 健康
        } else if (healthPercent > 0.3) {
            color = new Color(255, 255, 0); // 黄色 - 受伤
        } else {
            color = new Color(255, 0, 0); // 红色 - 危险
        }
        
        // 重绘血量条
        foregroundGraphics.clear();
        foregroundGraphics.fillColor = color;
        
        const currentWidth = width * healthPercent;
        if (currentWidth > 0) {
            foregroundGraphics.rect(-width / 2, -height / 2, currentWidth, height);
            foregroundGraphics.fill();
        }
    }
    
    // 英雄绘制方法已移除 - 波斯猫外观现在使用placed图片显示
    
    // 英雄绘制方法已移除 - 英国短毛猫外观现在使用白色圆点显示
    
    // 英雄绘制方法已移除 - 孟加拉猫外观现在使用placed图片显示
    
    // 所有英雄绘制方法已移除 - 现在使用placed图片或白色圆点显示
    // 英雄外观：挪威森林猫 - 白色圆点
    // 英雄外观：布偶猫守护者 - 白色圆点
    // 英雄外观：苏格兰折耳猫 - 白色圆点
    // 英雄外观：阿比西尼亚猫 - 白色圆点
    // 英雄外观：俄罗斯蓝猫 - placed图片
    // 英雄外观：美国短毛猫 - placed图片
}