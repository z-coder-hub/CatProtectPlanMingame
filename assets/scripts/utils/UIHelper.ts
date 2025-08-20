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
    static SetupRightAlignWidget(node: Node, width: number, height: number, rightOffset: number): void {
        const transform = node.addComponent(UITransform);
        transform.setContentSize(width, height);

        const widget = node.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignRight = true;
        widget.top = 0;
        widget.right = rightOffset;
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
            graphics.rect(-width / 2, -height / 2, width, height);
            graphics.fill();
        }
        
        return graphics;
    }

    /**
     * 创建圆形图标
     */
    static CreateCircleIcon(node: Node, radius: number, fillColor: Color, strokeColor: Color, lineWidth: number = 2): Graphics {
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = fillColor;
        graphics.circle(0, 0, radius);
        graphics.fill();
        
        graphics.strokeColor = strokeColor;
        graphics.lineWidth = lineWidth;
        graphics.circle(0, 0, radius);
        graphics.stroke();
        
        return graphics;
    }

    /**
     * 绘制按钮背景
     */
    static DrawButtonBackground(graphics: Graphics, width: number, height: number, color: Color): void {
        graphics.clear();
        graphics.fillColor = color;
        graphics.rect(-width / 2, -height / 2, width, height);
        graphics.fill();

        graphics.strokeColor = new Color(255, 255, 255);
        graphics.lineWidth = 1;
        graphics.rect(-width / 2, -height / 2, width, height);
        graphics.stroke();
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
     * 创建带位置的按钮（用于需要手动设置位置的场景）
     */
    static CreateButtonWithPosition(text: string, xPos: number, yPos: number, width: number, height: number, bgColor: Color, callback: () => void, target?: any): Node {
        const buttonNode = UIHelper.CreateButton(text, width, height, bgColor, callback, target);
        buttonNode.setPosition(xPos, yPos);
        return buttonNode;
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