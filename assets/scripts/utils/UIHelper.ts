import { Button, Color, Graphics, Label, Node, UITransform, Widget } from 'cc';

/**
 * UI Helper - 通用UI布局和创建工具
 * 提供统一的Widget配置、背景创建、图标绘制等功能
 */
export class UIHelper {
    
    /**
     * 为节点设置UITransform和Widget组件进行全宽顶部对齐
     */
    static SetupFullWidthTopWidget(node: Node, height: number, topOffset: number = 0): void {
        const transform = node.addComponent(UITransform);
        transform.setContentSize(1000, height);

        const widget = node.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignLeft = true;
        widget.isAlignRight = true;
        widget.top = topOffset;
        widget.left = 0;
        widget.right = 0;
        widget.updateAlignment();
    }

    /**
     * 为节点设置UITransform和Widget组件进行左对齐
     */
    static SetupLeftAlignWidget(node: Node, width: number, height: number, leftOffset: number, topOffset: number = 15, bottomOffset: number = 15): void {
        const transform = node.addComponent(UITransform);
        transform.setContentSize(width, height);

        const widget = node.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignLeft = true;
        widget.isAlignBottom = true;
        widget.top = topOffset;
        widget.left = leftOffset;
        widget.bottom = bottomOffset;
        widget.updateAlignment();
    }

    /**
     * 为节点设置UITransform和Widget组件进行右对齐
     */
    static SetupRightAlignWidget(node: Node, width: number, height: number, rightOffset: number, topOffset: number = 0): void {
        const transform = node.addComponent(UITransform);
        transform.setContentSize(width, height);

        const widget = node.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignRight = true;
        widget.top = topOffset;
        widget.right = rightOffset;
        widget.updateAlignment();
    }

    /**
     * 为节点设置UITransform和Widget组件进行底部对齐
     */
    static SetupBottomAlignWidget(node: Node, height: number, bottomOffset: number): void {
        const transform = node.addComponent(UITransform);
        transform.setContentSize(1000, height);

        const widget = node.addComponent(Widget);
        widget.isAlignBottom = true;
        widget.isAlignLeft = true;
        widget.isAlignRight = true;
        widget.bottom = bottomOffset;
        widget.left = 0;
        widget.right = 0;
        widget.updateAlignment();
    }

    /**
     * 为节点设置UITransform和Widget组件进行居中对齐
     */
    static SetupCenterWidget(node: Node, width: number, height: number): void {
        const transform = node.addComponent(UITransform);
        transform.setContentSize(width, height);

        const widget = node.addComponent(Widget);
        widget.isAlignHorizontalCenter = true;
        widget.isAlignVerticalCenter = true;
        widget.updateAlignment();
    }

    /**
     * 创建带背景的面板
     */
    static CreatePanelWithBackground(node: Node, color: Color): Graphics {
        const graphics = node.addComponent(Graphics);
        
        graphics.fillColor = color;
        
        const transform = node.getComponent(UITransform);
        if (transform) {
            const width = transform.width;
            const height = transform.height;
            // 使用单一路径同时绘制填充和描边边框，避免重复rect调用
            graphics.strokeColor = new Color(255, 255, 255);
            graphics.lineWidth = 1;
            graphics.rect(-width / 2, -height / 2, width, height);
            graphics.fill();  // 填充路径
            graphics.stroke(); // 描边同一路径
        }
        
        return graphics;
    }

    /**
     * 创建圆形图标
     */
    static CreateCircleIcon(node: Node, radius: number, fillColor: Color, strokeColor: Color, lineWidth: number = 2): Graphics {
        const graphics = node.addComponent(Graphics);
        
        graphics.fillColor = fillColor;
        graphics.strokeColor = strokeColor;
        graphics.lineWidth = lineWidth;
        
        // 使用单一路径同时绘制圆形填充和描边
        graphics.circle(0, 0, radius);
        graphics.fill();  // 填充路径
        graphics.stroke(); // 描边同一路径
        
        return graphics;
    }

    /**
     * 绘制按钮背景
     */
    static DrawButtonBackground(graphics: Graphics, width: number, height: number, color: Color): void {
        graphics.clear();
        
        // 使用单一路径同时绘制填充和描边，避免重复rect调用
        graphics.fillColor = color;
        graphics.strokeColor = new Color(255, 255, 255);
        graphics.lineWidth = 1;
        
        // 开始路径，绘制矩形
        graphics.rect(-width / 2, -height / 2, width, height);
        graphics.fill();  // 填充路径
        graphics.stroke(); // 描边同一路径
    }

    /**
     * 创建按钮
     */
    static CreateButton(text: string, width: number, height: number, bgColor: Color, callback: () => void, target?: any): Node {
        const buttonNode = new Node(`Button_${text}`);

        const transform = buttonNode.addComponent(UITransform);
        transform.setContentSize(width, height);

        const button = buttonNode.addComponent(Button);
        button.target = buttonNode;

        // 创建背景
        const buttonBg = buttonNode.addComponent(Graphics);
        UIHelper.DrawButtonBackground(buttonBg, width, height, bgColor);

        // 创建标签
        const labelNode = new Node("Label");
        labelNode.parent = buttonNode;
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = Math.max(16.38, height * 0.4);
        label.color = new Color(255, 255, 255);

        // 绑定点击事件
        if (callback) {
            button.node.on(Button.EventType.CLICK, callback, target);
        }

        return buttonNode;
    }



    /**
     * 在容器中创建多个等宽按钮
     * @param texts 按钮文本数组
     * @param container 父级容器节点
     * @param heightRatio 按钮高度占容器高度的比例
     * @param spacing 按钮间距（像素）
     * @param bgColor 背景颜色
     * @param callbacks 点击回调数组
     * @param target 回调目标
     */
    static CreateEqualWidthButtons(texts: string[], container: Node, heightRatio: number, spacing: number, bgColor: Color, callbacks: (() => void)[], target?: any): Node[] {
        const containerTransform = container.getComponent(UITransform);
        if (!containerTransform) {
            console.error("容器节点缺少UITransform组件");
            return [];
        }

        const buttonCount = texts.length;
        const totalSpacing = spacing * (buttonCount - 1);
        const buttonWidth = (containerTransform.width - totalSpacing) / buttonCount;
        const buttonHeight = containerTransform.height * heightRatio;

        const buttons: Node[] = [];
        const startX = -(containerTransform.width - buttonWidth) / 2;

        for (let i = 0; i < buttonCount; i++) {
            const button = UIHelper.CreateButton(texts[i], buttonWidth, buttonHeight, bgColor, callbacks[i], target);
            const xPos = startX + i * (buttonWidth + spacing);
            button.setPosition(xPos, 0);
            button.parent = container;
            buttons.push(button);
        }

        return buttons;
    }

    /**
     * 设置按钮文本
     */
    static SetButtonText(button: Node, text: string): void {
        const labelNode = button.getChildByName("Label");
        if (labelNode) {
            const label = labelNode.getComponent(Label);
            if (label) {
                label.string = text;
            }
        }
    }
}