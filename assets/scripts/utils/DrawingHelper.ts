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
    
    // 绘制英雄外观的通用方法
    public static drawHeroAppearance(
        graphics: Graphics, 
        heroType: 'orange' | 'siamese' | 'maine' | 'persian' | 'british' | 'bengal' | 'norwegian' | 'ragdoll' | 'scottish' | 'abyssinian' | 'russian' | 'american',
        scale: number = 1
    ): void {
        graphics.clear();
        
        switch (heroType) {
            case 'orange':
                this.drawOrangeCat(graphics, scale);
                break;
            case 'siamese':
                this.drawSiameseCat(graphics, scale);
                break;
            case 'maine':
                this.drawMaineCat(graphics, scale);
                break;
            case 'persian':
                this.drawPersianCat(graphics, scale);
                break;
            case 'british':
                this.drawBritishCat(graphics, scale);
                break;
            case 'bengal':
                this.drawBengalCat(graphics, scale);
                break;
            case 'norwegian':
                this.drawNorwegianCat(graphics, scale);
                break;
            case 'ragdoll':
                this.drawRagdollCat(graphics, scale);
                break;
            case 'scottish':
                this.drawScottishCat(graphics, scale);
                break;
            case 'abyssinian':
                this.drawAbyssinianCat(graphics, scale);
                break;
            case 'russian':
                this.drawRussianCat(graphics, scale);
                break;
            case 'american':
                this.drawAmericanCat(graphics, scale);
                break;
        }
    }
    
    // 绘制橘猫外观
    private static drawOrangeCat(graphics: Graphics, scale: number): void {
        const size = 20 * scale;
        
        // 绘制身体（橘色圆形）
        graphics.fillColor = new Color(255, 165, 0);
        graphics.circle(0, 0, size);
        graphics.fill();
        
        // 绘制轮廓
        graphics.strokeColor = new Color(255, 140, 0);
        graphics.lineWidth = 2;
        graphics.circle(0, 0, size);
        graphics.stroke();
        
        // 绘制弓箭标识
        graphics.strokeColor = new Color(139, 69, 19);
        graphics.lineWidth = 3;
        graphics.moveTo(-size * 0.5, 0);
        graphics.lineTo(size * 0.5, 0);
        graphics.stroke();
        
        // 绘制箭头
        graphics.moveTo(size * 0.35, -size * 0.15);
        graphics.lineTo(size * 0.5, 0);
        graphics.lineTo(size * 0.35, size * 0.15);
        graphics.stroke();
    }
    
    // 绘制暹罗猫外观
    private static drawSiameseCat(graphics: Graphics, scale: number): void {
        const size = 20 * scale;
        
        // 绘制身体（奶白色圆形）
        graphics.fillColor = new Color(245, 245, 220);
        graphics.circle(0, 0, size);
        graphics.fill();
        
        // 绘制深色四肢标记
        graphics.fillColor = new Color(139, 69, 19);
        graphics.circle(-size * 0.6, size * 0.6, size * 0.3);
        graphics.fill();
        graphics.circle(size * 0.6, size * 0.6, size * 0.3);
        graphics.fill();
        
        // 绘制魔法杖标识
        graphics.strokeColor = new Color(138, 43, 226);
        graphics.lineWidth = 3;
        graphics.moveTo(0, -size * 0.8);
        graphics.lineTo(0, size * 0.5);
        graphics.stroke();
        
        // 魔法星星
        this.drawStar(graphics, 0, -size * 0.8, size * 0.3, new Color(255, 215, 0));
    }
    
    // 绘制缅因猫外观
    private static drawMaineCat(graphics: Graphics, scale: number): void {
        const size = 22 * scale; // 缅因猫稍大
        
        // 绘制身体（深棕色椭圆）
        graphics.fillColor = new Color(139, 69, 19);
        graphics.ellipse(0, 0, size, size * 0.8);
        graphics.fill();
        
        // 绘制毛发纹理
        graphics.strokeColor = new Color(160, 82, 45);
        graphics.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const y = -size * 0.3 + i * size * 0.3;
            graphics.moveTo(-size * 0.6, y);
            graphics.lineTo(size * 0.6, y);
            graphics.stroke();
        }
        
        // 绘制大炮标识
        graphics.fillColor = new Color(64, 64, 64);
        graphics.rect(-size * 0.7, -size * 0.15, size * 1.4, size * 0.3);
        graphics.fill();
        
        // 炮口
        graphics.fillColor = new Color(32, 32, 32);
        graphics.circle(size * 0.7, 0, size * 0.1);
        graphics.fill();
    }
    
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
    
    // 绘制简单形状的工具方法
    public static drawCircle(graphics: Graphics, x: number, y: number, radius: number, style: DrawStyle): void {
        if (style.fillColor) {
            graphics.fillColor = style.fillColor;
            graphics.circle(x, y, radius);
            graphics.fill();
        }
        
        if (style.strokeColor && style.lineWidth) {
            graphics.strokeColor = style.strokeColor;
            graphics.lineWidth = style.lineWidth;
            graphics.circle(x, y, radius);
            graphics.stroke();
        }
    }
    
    public static drawRect(graphics: Graphics, x: number, y: number, width: number, height: number, style: DrawStyle): void {
        // 绘制矩形路径（一次）
        graphics.rect(x, y, width, height);
        
        // 填充
        if (style.fillColor) {
            graphics.fillColor = style.fillColor;
            graphics.fill();
        }
        
        // 描边
        if (style.strokeColor && style.lineWidth) {
            graphics.strokeColor = style.strokeColor;
            graphics.lineWidth = style.lineWidth;
            graphics.stroke();
        }
    }
    
    public static drawLine(graphics: Graphics, x1: number, y1: number, x2: number, y2: number, style: DrawStyle): void {
        if (style.strokeColor && style.lineWidth) {
            graphics.strokeColor = style.strokeColor;
            graphics.lineWidth = style.lineWidth;
            graphics.moveTo(x1, y1);
            graphics.lineTo(x2, y2);
            graphics.stroke();
        }
    }
    
    // 绘制受伤效果
    public static drawHurtEffect(graphics: Graphics, heroType: 'orange' | 'siamese' | 'maine' | 'basicMouse', scale: number = 1): void {
        // 临时变红表示受伤
        const originalDrawMethod = heroType === 'basicMouse' ? this.drawBasicMouse : 
                                 heroType === 'orange' ? this.drawOrangeCat :
                                 heroType === 'siamese' ? this.drawSiameseCat : this.drawMaineCat;
        
        graphics.clear();
        
        // 保存原始颜色设置方法，用红色覆盖
        if (heroType === 'basicMouse') {
            graphics.fillColor = new Color(255, 100, 100);
            graphics.ellipse(0, 0, 26.4 * scale, 18 * scale);
            graphics.fill();
        } else {
            graphics.fillColor = new Color(255, 100, 100);
            graphics.circle(0, 0, 20 * scale);
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
    
    // === 新增的英雄外观绘制方法 ===
    
    // 绘制波斯猫外观（狙击手）
    private static drawPersianCat(graphics: Graphics, scale: number): void {
        const size = 18 * scale;
        
        // 身体（银白色，优雅）
        graphics.fillColor = new Color(245, 245, 245);
        graphics.circle(0, 0, size);
        graphics.fill();
        
        // 蓝色眼睛
        graphics.fillColor = new Color(70, 130, 180);
        graphics.circle(-size * 0.3, size * 0.2, size * 0.15);
        graphics.fill();
        graphics.circle(size * 0.3, size * 0.2, size * 0.15);
        graphics.fill();
        
        // 狙击镜标识
        graphics.strokeColor = new Color(64, 64, 64);
        graphics.lineWidth = 3;
        graphics.circle(0, 0, size * 0.6);
        graphics.stroke();
        graphics.circle(0, 0, size * 0.3);
        graphics.stroke();
        
        // 十字准星
        graphics.moveTo(0, -size * 0.4);
        graphics.lineTo(0, size * 0.4);
        graphics.moveTo(-size * 0.4, 0);
        graphics.lineTo(size * 0.4, 0);
        graphics.stroke();
    }
    
    // 绘制英国短毛猫外观（骑士）
    private static drawBritishCat(graphics: Graphics, scale: number): void {
        const size = 24 * scale; // 较大体型
        
        // 身体（蓝灰色，厚实）
        graphics.fillColor = new Color(100, 149, 237);
        graphics.circle(0, 0, size);
        graphics.fill();
        
        // 盔甲边框
        graphics.strokeColor = new Color(192, 192, 192);
        graphics.lineWidth = 4;
        graphics.circle(0, 0, size);
        graphics.stroke();
        
        // 盾牌标识
        graphics.fillColor = new Color(255, 215, 0);
        graphics.moveTo(0, -size * 0.7);
        graphics.lineTo(-size * 0.4, -size * 0.2);
        graphics.lineTo(-size * 0.4, size * 0.4);
        graphics.lineTo(0, size * 0.7);
        graphics.lineTo(size * 0.4, size * 0.4);
        graphics.lineTo(size * 0.4, -size * 0.2);
        graphics.close();
        graphics.fill();
        
        // 十字标记
        graphics.strokeColor = new Color(178, 34, 34);
        graphics.lineWidth = 3;
        graphics.moveTo(0, -size * 0.3);
        graphics.lineTo(0, size * 0.3);
        graphics.moveTo(-size * 0.2, 0);
        graphics.lineTo(size * 0.2, 0);
        graphics.stroke();
    }
    
    // 绘制孟加拉猫外观（猎手）
    private static drawBengalCat(graphics: Graphics, scale: number): void {
        const size = 19 * scale;
        
        // 身体（金棕色豹纹）
        graphics.fillColor = new Color(218, 165, 32);
        graphics.circle(0, 0, size);
        graphics.fill();
        
        // 豹纹图案
        graphics.fillColor = new Color(160, 82, 45);
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const x = Math.cos(angle) * size * 0.5;
            const y = Math.sin(angle) * size * 0.5;
            graphics.circle(x, y, size * 0.15);
            graphics.fill();
        }
        
        // 连射标识（三支箭）
        graphics.strokeColor = new Color(139, 69, 19);
        graphics.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const offset = (i - 1) * size * 0.3;
            graphics.moveTo(-size * 0.6, offset);
            graphics.lineTo(size * 0.6, offset);
            // 箭头
            graphics.moveTo(size * 0.4, offset - size * 0.1);
            graphics.lineTo(size * 0.6, offset);
            graphics.lineTo(size * 0.4, offset + size * 0.1);
        }
        graphics.stroke();
    }
    
    // 绘制挪威森林猫外观（冰法）
    private static drawNorwegianCat(graphics: Graphics, scale: number): void {
        const size = 21 * scale;
        
        // 身体（银色，长毛）
        graphics.fillColor = new Color(192, 192, 192);
        graphics.circle(0, 0, size);
        graphics.fill();
        
        // 长毛效果
        graphics.strokeColor = new Color(169, 169, 169);
        graphics.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.cos(angle) * size * 1.2;
            const y = Math.sin(angle) * size * 1.2;
            graphics.moveTo(0, 0);
            graphics.lineTo(x, y);
        }
        graphics.stroke();
        
        // 冰雪标识
        graphics.fillColor = new Color(173, 216, 230);
        this.drawStar(graphics, 0, 0, size * 0.6, new Color(135, 206, 250));
        
        // 冰晶
        graphics.strokeColor = new Color(135, 206, 250);
        graphics.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * size * 0.4;
            const y = Math.sin(angle) * size * 0.4;
            graphics.moveTo(0, 0);
            graphics.lineTo(x, y);
        }
        graphics.stroke();
    }
    
    // 绘制布偶猫外观（守护者）
    private static drawRagdollCat(graphics: Graphics, scale: number): void {
        const size = 22 * scale;
        
        // 身体（奶油色）
        graphics.fillColor = new Color(255, 228, 196);
        graphics.circle(0, 0, size);
        graphics.fill();
        
        // 深色四肢标记
        graphics.fillColor = new Color(139, 69, 19);
        graphics.circle(-size * 0.7, size * 0.7, size * 0.3);
        graphics.fill();
        graphics.circle(size * 0.7, size * 0.7, size * 0.3);
        graphics.fill();
        graphics.circle(-size * 0.7, -size * 0.7, size * 0.3);
        graphics.fill();
        graphics.circle(size * 0.7, -size * 0.7, size * 0.3);
        graphics.fill();
        
        // 守护标识（环形护盾）
        graphics.strokeColor = new Color(0, 191, 255);
        graphics.lineWidth = 4;
        graphics.circle(0, 0, size * 0.8);
        graphics.stroke();
        graphics.circle(0, 0, size * 0.6);
        graphics.stroke();
    }
    
    // 绘制苏格兰折耳猫外观（工程师）
    private static drawScottishCat(graphics: Graphics, scale: number): void {
        const size = 20 * scale;
        
        // 身体（橙白色）
        graphics.fillColor = new Color(255, 218, 185);
        graphics.circle(0, 0, size);
        graphics.fill();
        
        // 折耳特征
        graphics.fillColor = new Color(255, 160, 122);
        graphics.ellipse(-size * 0.6, size * 0.6, size * 0.3, size * 0.2);
        graphics.fill();
        graphics.ellipse(size * 0.6, size * 0.6, size * 0.3, size * 0.2);
        graphics.fill();
        
        // 工具标识（扳手）
        graphics.strokeColor = new Color(64, 64, 64);
        graphics.lineWidth = 3;
        graphics.moveTo(-size * 0.5, -size * 0.3);
        graphics.lineTo(size * 0.5, size * 0.3);
        graphics.stroke();
        
        // 螺栓标识
        graphics.fillColor = new Color(192, 192, 192);
        graphics.circle(-size * 0.3, -size * 0.3, size * 0.1);
        graphics.fill();
        graphics.circle(size * 0.3, size * 0.3, size * 0.1);
        graphics.fill();
        graphics.circle(0, 0, size * 0.1);
        graphics.fill();
    }
    
    // 绘制阿比西尼亚猫外观（侦察兵）
    private static drawAbyssinianCat(graphics: Graphics, scale: number): void {
        const size = 18 * scale;
        
        // 身体（红棕色）
        graphics.fillColor = new Color(205, 92, 92);
        graphics.circle(0, 0, size);
        graphics.fill();
        
        // 机警的大耳朵
        graphics.fillColor = new Color(178, 34, 34);
        graphics.moveTo(-size * 0.5, size * 0.3);
        graphics.lineTo(-size * 0.8, size * 0.8);
        graphics.lineTo(-size * 0.2, size * 0.6);
        graphics.close();
        graphics.fill();
        
        graphics.moveTo(size * 0.5, size * 0.3);
        graphics.lineTo(size * 0.8, size * 0.8);
        graphics.lineTo(size * 0.2, size * 0.6);
        graphics.close();
        graphics.fill();
        
        // 望远镜标识
        graphics.strokeColor = new Color(64, 64, 64);
        graphics.lineWidth = 3;
        graphics.circle(-size * 0.2, 0, size * 0.2);
        graphics.stroke();
        graphics.circle(size * 0.2, 0, size * 0.2);
        graphics.stroke();
        graphics.moveTo(-size * 0.4, 0);
        graphics.lineTo(size * 0.4, 0);
        graphics.stroke();
        
        // 雷达扫描线
        graphics.strokeColor = new Color(0, 255, 0);
        graphics.lineWidth = 2;
        graphics.moveTo(0, 0);
        graphics.lineTo(size * 0.7, -size * 0.7);
        graphics.stroke();
    }
    
    // 绘制俄罗斯蓝猫外观（精英）
    private static drawRussianCat(graphics: Graphics, scale: number): void {
        const size = 19 * scale;
        
        // 身体（蓝灰色）
        graphics.fillColor = new Color(112, 128, 144);
        graphics.circle(0, 0, size);
        graphics.fill();
        
        // 绿眼睛
        graphics.fillColor = new Color(0, 255, 0);
        graphics.circle(-size * 0.3, size * 0.2, size * 0.1);
        graphics.fill();
        graphics.circle(size * 0.3, size * 0.2, size * 0.1);
        graphics.fill();
        
        // 精英标识（双箭穿透）
        graphics.strokeColor = new Color(255, 215, 0);
        graphics.lineWidth = 3;
        graphics.moveTo(-size * 0.7, 0);
        graphics.lineTo(size * 0.7, 0);
        graphics.stroke();
        
        // 穿透箭头
        graphics.moveTo(size * 0.5, -size * 0.2);
        graphics.lineTo(size * 0.7, 0);
        graphics.lineTo(size * 0.5, size * 0.2);
        graphics.stroke();
        
        // 第二支箭
        graphics.moveTo(-size * 0.6, -size * 0.3);
        graphics.lineTo(size * 0.6, size * 0.3);
        graphics.stroke();
        graphics.moveTo(size * 0.4, size * 0.1);
        graphics.lineTo(size * 0.6, size * 0.3);
        graphics.lineTo(size * 0.4, size * 0.5);
        graphics.stroke();
    }
    
    // 绘制美国短毛猫外观（爆破兵）
    private static drawAmericanCat(graphics: Graphics, scale: number): void {
        const size = 21 * scale;
        
        // 身体（银色带条纹）
        graphics.fillColor = new Color(192, 192, 192);
        graphics.circle(0, 0, size);
        graphics.fill();
        
        // 黑色条纹
        graphics.strokeColor = new Color(64, 64, 64);
        graphics.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const y = -size * 0.6 + i * size * 0.4;
            graphics.moveTo(-size * 0.8, y);
            graphics.lineTo(size * 0.8, y);
        }
        graphics.stroke();
        
        // 炸弹标识
        graphics.fillColor = new Color(64, 64, 64);
        graphics.circle(0, 0, size * 0.4);
        graphics.fill();
        
        // 引信
        graphics.strokeColor = new Color(255, 69, 0);
        graphics.lineWidth = 3;
        graphics.moveTo(0, -size * 0.4);
        graphics.lineTo(-size * 0.2, -size * 0.8);
        graphics.stroke();
        
        // 火花
        graphics.fillColor = new Color(255, 255, 0);
        graphics.circle(-size * 0.2, -size * 0.8, size * 0.08);
        graphics.fill();
        
        // 爆炸标识
        graphics.strokeColor = new Color(255, 0, 0);
        graphics.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * size * 0.6;
            const y = Math.sin(angle) * size * 0.6;
            graphics.moveTo(x * 0.5, y * 0.5);
            graphics.lineTo(x, y);
        }
        graphics.stroke();
    }
}