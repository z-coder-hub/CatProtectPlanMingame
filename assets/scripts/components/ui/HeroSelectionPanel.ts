import { _decorator, Color, Component, EventTouch, Graphics, Label, Mask, Node, ScrollView, UITransform, Vec2, Vec3, view } from 'cc';
import { GameManager } from '../../managers/GameManager';
import { GridDeploymentSystem } from '../../systems/GridDeploymentSystem';
import { HeroFactory } from '../../systems/HeroFactory';
import { HeroType } from '../../types/GameTypes';

const { ccclass } = _decorator;

/**
 * 英雄部署接口 - 定义英雄部署的回调函数类型
 */
export interface IHeroDeploymentHandler {
    deployHeroToGrid(heroType: HeroType, gridRow: number, gridCol: number): boolean;
}

/**
 * 英雄选择面板组件
 * 负责显示可选英雄、处理英雄拖拽和部署逻辑
 */
@ccclass('HeroSelectionPanel')
export class HeroSelectionPanel extends Component {

    // UI组件引用
    private _heroScrollView: ScrollView | null = null;
    private _heroButtons: Node[] = [];
    private _selectedHeroType: HeroType | null = null;
    private _dragPreviewNode: Node | null = null;
    private _isDragging: boolean = false;
    private _touchStartPos: Vec3 | null = null;
    private _touchStartTime: number = 0;
    private _lastTouchTime: number = 0;

    // 管理器引用
    private _gameManager: GameManager | null = null;
    private _gridSystem: GridDeploymentSystem | null = null;

    // 部署处理器
    private _deploymentHandler: IHeroDeploymentHandler | null = null;

    protected onLoad(): void {
        this.createHeroSelectionPanel();
        console.log("HeroSelectionPanel 初始化完成");
    }

    protected start(): void {
        // 获取管理器引用
        this._gameManager = GameManager.instance;
        this._gridSystem = GridDeploymentSystem.instance;

        if (!this._gameManager) {
            console.error("未找到GameManager实例");
        }
        if (!this._gridSystem) {
            console.error("未找到GridDeploymentSystem实例");
        }
    }

    // ========== 公共接口 ==========

    /**
     * 设置英雄部署处理器
     */
    public setDeploymentHandler(handler: IHeroDeploymentHandler): void {
        this._deploymentHandler = handler;
    }

    /**
     * 获取当前选中的英雄类型
     */
    public getSelectedHeroType(): HeroType | null {
        return this._selectedHeroType;
    }

    /**
     * 更新英雄按钮状态（通常在金币变化时调用）
     */
    public updateHeroButtonStates(): void {
        this._heroButtons.forEach(buttonNode => {
            const heroType = buttonNode.name.replace('HeroButton_', '') as HeroType;
            const isSelected = heroType === this._selectedHeroType;

            const buttonGraphics = buttonNode.getComponent(Graphics);
            if (buttonGraphics) {
                const buttonTransform = buttonNode.getComponent(UITransform);
                const size = buttonTransform ? buttonTransform.contentSize.width : 80;
                this.drawHeroButtonBackground(buttonGraphics, size, isSelected);
            }
        });
    }

    // ========== 面板创建 ==========

    /**
     * 创建英雄选择面板
     */
    private createHeroSelectionPanel(): void {
        // 定位到屏幕底部
        const screenHeight = view.getVisibleSize().height;
        const screenWidth = view.getVisibleSize().width;
        this.node.setPosition(0, -screenHeight / 2 + 100);

        // 设置面板的UITransform
        const panelTransform = this.node.addComponent(UITransform);
        panelTransform.setContentSize(screenWidth, 160);

        // 面板背景
        const panelBg = this.node.addComponent(Graphics);
        panelBg.fillColor = new Color(20, 20, 20, 220);
        panelBg.rect(-screenWidth / 2, -80, screenWidth, 160);
        panelBg.fill();

        // 添加面板边框
        panelBg.strokeColor = new Color(100, 100, 100, 150);
        panelBg.lineWidth = 2;
        panelBg.rect(-screenWidth / 2, -80, screenWidth, 160);
        panelBg.stroke();

        // 创建ScrollView
        this.createScrollableHeroPanel();

        console.log("英雄选择面板创建完成");
    }

    /**
     * 创建可滚动的英雄面板
     */
    private createScrollableHeroPanel(): void {
        const screenWidth = view.getVisibleSize().width;

        // 创建ScrollView节点
        const scrollViewNode = new Node("HeroScrollView");
        scrollViewNode.parent = this.node;
        scrollViewNode.setPosition(0, 0);

        // 设置ScrollView的UITransform
        const scrollTransform = scrollViewNode.addComponent(UITransform);
        const scrollViewWidth = screenWidth - 40;
        scrollTransform.setContentSize(scrollViewWidth, 140);
        scrollTransform.setAnchorPoint(0.5, 0.5);

        // 添加Mask组件进行裁剪
        const mask = scrollViewNode.addComponent(Mask);
        mask.type = Mask.Type.GRAPHICS_RECT;

        // 添加ScrollView组件
        const scrollView = scrollViewNode.addComponent(ScrollView);
        this._heroScrollView = scrollView;

        // 配置ScrollView基本属性
        scrollView.horizontal = true;
        scrollView.vertical = false;
        scrollView.inertia = true;
        scrollView.brake = 0.75;
        scrollView.elastic = true;
        scrollView.bounceDuration = 0.23;

        // 显式启用ScrollView组件
        scrollView.enabled = true;
        scrollViewNode.active = true;

        console.log("📋 ScrollView基本配置完成，启用水平滚动");

        // 创建Content节点
        const contentNode = new Node("Content");

        // 确保Content节点先添加UITransform组件，再进行后续配置
        const contentTransform = contentNode.addComponent(UITransform);

        // 验证UITransform创建成功
        if (!contentTransform) {
            console.error("❌ 无法为Content节点创建UITransform组件");
            return;
        }

        const availableHeroes = HeroFactory.getAvailableHeroTypes();
        const buttonSize = 80;
        const buttonSpacing = 20;
        const paddingTotal = buttonSpacing * 2;

        // 计算Content尺寸 - 确保可以滚动
        const minContentWidth = availableHeroes.length * (buttonSize + buttonSpacing) + paddingTotal;
        let contentWidth = Math.max(minContentWidth, scrollViewWidth + 100);

        console.log(`📋 ScrollView配置:
            • ScrollView宽度: ${scrollViewWidth}px
            • 英雄数量: ${availableHeroes.length}
            • 需要的Content宽度: ${minContentWidth}px
            • 最终Content宽度: ${contentWidth}px
            • 🔄 可以滚动: ${contentWidth > scrollViewWidth}
            • 英雄列表: ${availableHeroes.join(', ')}`);

        // 确保ScrollView确实可以滚动
        if (contentWidth <= scrollViewWidth) {
            console.warn(`⚠️ Content宽度不足以启用滚动，强制设置更大的宽度`);
            contentWidth = scrollViewWidth + 200;
        }

        // 在设置父节点之前完成所有Content配置
        contentTransform.setContentSize(contentWidth, 140);
        contentTransform.setAnchorPoint(0.5, 0.5);
        contentNode.setPosition(0, 0);

        console.log(`📋 Content节点配置完成，准备设置父节点...`);

        // 设置父节点
        contentNode.parent = scrollViewNode;

        // 验证所有UITransform组件存在
        const scrollViewTransform = scrollView.node.getComponent(UITransform);
        const panelTransform = this.node.getComponent(UITransform);
        const parentTransform = this.node.parent?.getComponent(UITransform);

        if (!scrollViewTransform || !contentTransform || !panelTransform || !parentTransform) {
            console.error("❌ 缺少必要的UITransform组件");
            return;
        }

        // 直接设置ScrollView content
        scrollView.content = contentNode;

        // 验证设置成功
        if (scrollView.content !== contentNode) {
            console.error("❌ ScrollView content设置失败");
            return;
        }

        // 创建英雄按钮
        this.createHeroButtonsManualLayout(contentNode, buttonSize, buttonSpacing);

        // 强制刷新ScrollView配置
        scrollView.node.setPosition(scrollView.node.position);

        console.log(`✅ Content节点设置完成`);
    }

    /**
     * 手动布局创建英雄按钮
     */
    private createHeroButtonsManualLayout(contentNode: Node, buttonSize: number, buttonSpacing: number): void {
        const availableHeroes = HeroFactory.getAvailableHeroTypes();

        // 计算起始位置（左对齐）
        const contentWidth = contentNode.getComponent(UITransform)?.contentSize.width || 0;
        const startX = -contentWidth / 2 + buttonSpacing + buttonSize / 2;

        availableHeroes.forEach((heroType, index) => {
            const heroConfig = HeroFactory.getHeroConfig(heroType);
            if (!heroConfig) return;

            // 计算每个按钮的X位置
            const buttonX = startX + index * (buttonSize + buttonSpacing);
            const heroButton = this.createHeroButton(heroType, heroConfig, buttonX, 0, buttonSize);

            // 设置父节点之前先完成所有组件创建
            heroButton.parent = contentNode;
            this._heroButtons.push(heroButton);
        });

        console.log(`手动布局创建了 ${this._heroButtons.length} 个英雄按钮`);
    }

    /**
     * 创建单个英雄按钮
     */
    private createHeroButton(heroType: HeroType, heroConfig: any, x: number, y: number, size: number): Node {
        const buttonNode = new Node(`HeroButton_${heroType}`);

        // 设置位置
        buttonNode.setPosition(x, y);

        const buttonTransform = buttonNode.addComponent(UITransform);
        buttonTransform.setContentSize(size, size);
        buttonTransform.setAnchorPoint(0.5, 0.5);

        // 按钮背景
        const buttonBg = buttonNode.addComponent(Graphics);
        this.drawHeroButtonBackground(buttonBg, size, false);

        // 英雄图标
        this.createHeroIcon(buttonNode, heroType, size);

        // 价格标签
        this.createPriceLabel(buttonNode, heroConfig.cost, size);

        // 添加触摸事件
        this.setupHeroButtonEvents(buttonNode, heroType);

        return buttonNode;
    }

    /**
     * 绘制英雄按钮背景
     */
    private drawHeroButtonBackground(graphics: Graphics, size: number, isSelected: boolean): void {
        graphics.clear();

        // 检查是否可购买
        const canAfford = this._gameManager ? this._gameManager.getGameStats().gold >= 40 : true;

        // 背景色
        let bgColor: Color;
        if (isSelected) {
            bgColor = new Color(100, 255, 100, 200); // 选中：亮绿色
        } else if (!canAfford) {
            bgColor = new Color(100, 50, 50, 200); // 买不起：暗红色
        } else {
            bgColor = new Color(70, 70, 70, 200); // 普通：深灰色
        }

        graphics.fillColor = bgColor;
        graphics.rect(-size / 2, -size / 2, size, size);
        graphics.fill();

        // 边框
        const borderColor = isSelected ? new Color(0, 255, 0) :
            !canAfford ? new Color(255, 0, 0) : new Color(150, 150, 150);
        graphics.strokeColor = borderColor;
        graphics.lineWidth = isSelected ? 3 : 2;
        graphics.rect(-size / 2, -size / 2, size, size);
        graphics.stroke();
    }

    /**
     * 创建英雄图标
     */
    private createHeroIcon(parent: Node, heroType: HeroType, _size: number): void {
        const iconNode = new Node("HeroIcon");
        iconNode.setPosition(0, 8);

        // 添加Graphics组件
        const iconGraphics = iconNode.addComponent(Graphics);

        // 设置父节点
        iconNode.parent = parent;

        // 根据英雄类型绘制不同图标
        switch (heroType) {
            case HeroType.ORANGE_CAT:
                // 橘猫 - 橙色圆形 + 弓箭
                iconGraphics.fillColor = new Color(255, 165, 0);
                iconGraphics.circle(0, 0, 18);
                iconGraphics.fill();

                iconGraphics.strokeColor = new Color(139, 69, 19);
                iconGraphics.lineWidth = 3;
                iconGraphics.moveTo(-10, 0);
                iconGraphics.lineTo(10, 0);
                iconGraphics.moveTo(8, -3);
                iconGraphics.lineTo(10, 0);
                iconGraphics.lineTo(8, 3);
                iconGraphics.stroke();
                break;

            case HeroType.PERSIAN_SNIPER:
                // 波斯猫 - 银色圆形 + 准星
                iconGraphics.fillColor = new Color(192, 192, 192);
                iconGraphics.circle(0, 0, 18);
                iconGraphics.fill();

                iconGraphics.strokeColor = new Color(64, 64, 64);
                iconGraphics.lineWidth = 2;
                iconGraphics.circle(0, 0, 12);
                iconGraphics.moveTo(0, -15);
                iconGraphics.lineTo(0, 15);
                iconGraphics.moveTo(-15, 0);
                iconGraphics.lineTo(15, 0);
                iconGraphics.stroke();
                break;

            case HeroType.SIAMESE_MAGE:
                // 暹罗法师 - 蓝色方形 + 魔法帽
                iconGraphics.fillColor = new Color(100, 100, 255);
                iconGraphics.rect(-15, -15, 30, 30);
                iconGraphics.fill();

                iconGraphics.fillColor = new Color(128, 0, 128);
                iconGraphics.moveTo(0, 15);
                iconGraphics.lineTo(-8, -5);
                iconGraphics.lineTo(8, -5);
                iconGraphics.close();
                iconGraphics.fill();
                break;

            case HeroType.BENGAL_HUNTER:
                // 孟加拉猎手 - 金色圆形 + 双弓
                iconGraphics.fillColor = new Color(255, 215, 0);
                iconGraphics.circle(0, 0, 18);
                iconGraphics.fill();

                iconGraphics.strokeColor = new Color(139, 69, 19);
                iconGraphics.lineWidth = 2;
                iconGraphics.moveTo(-8, -15);
                iconGraphics.lineTo(8, -15);
                iconGraphics.moveTo(-8, 15);
                iconGraphics.lineTo(8, 15);
                iconGraphics.stroke();
                break;

            case HeroType.MAINE_THUNDER:
                // 缅因雷猫 - 深蓝色方形 + 闪电
                iconGraphics.fillColor = new Color(25, 25, 112);
                iconGraphics.rect(-18, -18, 36, 36);
                iconGraphics.fill();

                iconGraphics.strokeColor = new Color(255, 255, 0);
                iconGraphics.lineWidth = 2;
                iconGraphics.moveTo(-8, -12);
                iconGraphics.lineTo(4, -2);
                iconGraphics.lineTo(-4, 2);
                iconGraphics.lineTo(8, 12);
                iconGraphics.stroke();
                break;

            case HeroType.NORWEGIAN_ICE:
                // 挪威冰猫 - 冰蓝色菱形 + 雪花
                iconGraphics.fillColor = new Color(173, 216, 230);
                iconGraphics.moveTo(0, -16);
                iconGraphics.lineTo(12, 0);
                iconGraphics.lineTo(0, 16);
                iconGraphics.lineTo(-12, 0);
                iconGraphics.close();
                iconGraphics.fill();

                iconGraphics.strokeColor = new Color(255, 255, 255);
                iconGraphics.lineWidth = 2;
                iconGraphics.moveTo(0, -8);
                iconGraphics.lineTo(0, 8);
                iconGraphics.moveTo(-8, 0);
                iconGraphics.lineTo(8, 0);
                iconGraphics.stroke();
                break;

            case HeroType.BRITISH_KNIGHT:
                // 英国骑士 - 蓝色方形 + 盾牌
                iconGraphics.fillColor = new Color(100, 149, 237);
                iconGraphics.rect(-16, -16, 32, 32);
                iconGraphics.fill();

                iconGraphics.fillColor = new Color(192, 192, 192);
                iconGraphics.moveTo(0, -12);
                iconGraphics.lineTo(-8, 0);
                iconGraphics.lineTo(0, 12);
                iconGraphics.lineTo(8, 0);
                iconGraphics.close();
                iconGraphics.fill();
                break;

            case HeroType.RAGDOLL_GUARDIAN:
                // 布偶守护者 - 粉色方形 + 十字
                iconGraphics.fillColor = new Color(255, 182, 193);
                iconGraphics.rect(-16, -16, 32, 32);
                iconGraphics.fill();

                iconGraphics.strokeColor = new Color(255, 255, 255);
                iconGraphics.lineWidth = 3;
                iconGraphics.moveTo(0, -10);
                iconGraphics.lineTo(0, 10);
                iconGraphics.moveTo(-10, 0);
                iconGraphics.lineTo(10, 0);
                iconGraphics.stroke();
                break;

            case HeroType.SCOTTISH_ENGINEER:
                // 苏格兰工程师 - 橙色圆形 + 扳手
                iconGraphics.fillColor = new Color(255, 140, 0);
                iconGraphics.circle(0, 0, 14);
                iconGraphics.fill();

                iconGraphics.strokeColor = new Color(128, 128, 128);
                iconGraphics.lineWidth = 3;
                iconGraphics.moveTo(10, -6);
                iconGraphics.lineTo(16, -6);
                iconGraphics.moveTo(13, -9);
                iconGraphics.lineTo(13, -3);
                iconGraphics.stroke();
                break;

            case HeroType.ABYSSINIAN_SCOUT:
                // 阿比西尼亚侦察兵 - 棕色六边形 + 望远镜
                iconGraphics.fillColor = new Color(160, 82, 45);
                const sides = 6;
                const radius = 14;
                iconGraphics.moveTo(radius, 0);
                for (let i = 1; i <= sides; i++) {
                    const angle = (i * 2 * Math.PI) / sides;
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);
                    iconGraphics.lineTo(x, y);
                }
                iconGraphics.fill();

                iconGraphics.fillColor = new Color(255, 255, 0);
                iconGraphics.circle(6, -6, 4);
                iconGraphics.fill();
                break;

            case HeroType.RUSSIAN_BLUE:
                // 俄罗斯蓝猫 - 蓝灰色星形 + 穿透箭
                iconGraphics.fillColor = new Color(106, 90, 205);
                const points = 8;
                const outerR = 16;
                const innerR = 8;
                iconGraphics.moveTo(outerR, 0);
                for (let i = 0; i < points; i++) {
                    const outerAngle = (i * 2 * Math.PI) / points;
                    const innerAngle = ((i + 0.5) * 2 * Math.PI) / points;
                    const outerX = outerR * Math.cos(outerAngle);
                    const outerY = outerR * Math.sin(outerAngle);
                    const innerX = innerR * Math.cos(innerAngle);
                    const innerY = innerR * Math.sin(innerAngle);
                    iconGraphics.lineTo(outerX, outerY);
                    iconGraphics.lineTo(innerX, innerY);
                }
                iconGraphics.close();
                iconGraphics.fill();

                iconGraphics.strokeColor = new Color(255, 255, 255);
                iconGraphics.lineWidth = 2;
                iconGraphics.moveTo(-12, 0);
                iconGraphics.lineTo(12, 0);
                iconGraphics.moveTo(8, -3);
                iconGraphics.lineTo(12, 0);
                iconGraphics.lineTo(8, 3);
                iconGraphics.stroke();
                break;

            case HeroType.AMERICAN_BOMBER:
                // 美国爆破兵 - 红白蓝方形 + 炸弹
                // 红色底部
                iconGraphics.fillColor = new Color(220, 20, 60);
                iconGraphics.rect(-16, -16, 32, 10);
                iconGraphics.fill();
                // 白色中部
                iconGraphics.fillColor = new Color(255, 255, 255);
                iconGraphics.rect(-16, -6, 32, 12);
                iconGraphics.fill();
                // 蓝色顶部
                iconGraphics.fillColor = new Color(0, 0, 139);
                iconGraphics.rect(-16, 6, 32, 10);
                iconGraphics.fill();

                // 炸弹
                iconGraphics.fillColor = new Color(0, 0, 0);
                iconGraphics.circle(8, -8, 4);
                iconGraphics.fill();
                break;
        }
    }

    /**
     * 创建价格标签
     */
    private createPriceLabel(parent: Node, cost: number, size: number): void {
        const priceNode = new Node("PriceLabel");
        priceNode.setPosition(0, -size / 2 + 12);

        // 价格背景
        const priceBg = priceNode.addComponent(Graphics);
        priceBg.fillColor = new Color(0, 0, 0, 150);
        priceBg.rect(-20, -8, 40, 16);
        priceBg.fill();

        // 价格文本
        const priceLabel = priceNode.addComponent(Label);

        // 设置父节点
        priceNode.parent = parent;
        priceLabel.string = `${cost}`;
        priceLabel.fontSize = 14;
        priceLabel.color = new Color(255, 215, 0);
    }

    // ========== 英雄交互系统 ==========

    /**
     * 设置英雄按钮事件
     */
    private setupHeroButtonEvents(buttonNode: Node, heroType: HeroType): void {
        buttonNode.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            this.onHeroButtonTouchStart(heroType, buttonNode, event);
        }, this);

        buttonNode.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => {
            this.onHeroButtonTouchMove(event);
        }, this);

        buttonNode.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            this.onHeroButtonTouchEnd(event);
        }, this);

        buttonNode.on(Node.EventType.TOUCH_CANCEL, (_event: EventTouch) => {
            this.onHeroButtonTouchCancel();
        }, this);
    }

    /**
     * 英雄按钮触摸开始
     */
    private onHeroButtonTouchStart(heroType: HeroType, buttonNode: Node, event: EventTouch): void {
        console.log(`🟡 触摸开始: ${heroType}`);

        // 检查金币是否足够
        const heroCost = HeroFactory.getHeroCost(heroType);
        if (this._gameManager && this._gameManager.getGameStats().gold < heroCost) {
            console.log(`❌ 金币不足，需要 ${heroCost} 金币，当前: ${this._gameManager.getGameStats().gold}`);
            this.showInsufficientFundsEffect(buttonNode);
            return;
        }

        // 检测双击以测试ScrollView
        const currentTime = Date.now();
        if (this._lastTouchTime && (currentTime - this._lastTouchTime) < 300) {
            console.log("🧪 双击检测到，测试ScrollView滚动...");
            this.testScrollView();
        }
        this._lastTouchTime = currentTime;

        // 记录触摸开始，但不立即开始拖拽 - 允许ScrollView正常处理
        this._selectedHeroType = heroType;
        this._touchStartPos = new Vec3(event.getUILocation().x, event.getUILocation().y, 0);
        this._touchStartTime = Date.now();
        console.log(`✅ 选中英雄: ${heroType}, 位置: (${this._touchStartPos.x}, ${this._touchStartPos.y})`);
    }

    /**
     * 开始英雄拖拽
     */
    private startHeroDrag(heroType: HeroType, event: EventTouch): void {
        this._selectedHeroType = heroType;
        this._isDragging = true;

        console.log(`开始拖拽英雄: ${heroType}`);

        // 更新按钮状态
        this.updateHeroButtonStates();

        // 创建拖拽预览
        this.createDragPreview(heroType);

        // 启动网格预览模式
        if (this._gridSystem) {
            this._gridSystem.startDragMode();
        }

        // 更新预览位置
        this.updateDragPreview(event);
    }

    /**
     * 创建拖拽预览
     */
    private createDragPreview(heroType: HeroType): void {
        if (this._dragPreviewNode) {
            this._dragPreviewNode.destroy();
        }

        this._dragPreviewNode = new Node(`DragPreview_${heroType}`);
        this._dragPreviewNode.parent = this.node.parent; // 设置为GameHUD的子节点

        const previewSize = 50;
        const previewTransform = this._dragPreviewNode.addComponent(UITransform);
        previewTransform.setContentSize(previewSize, previewSize);

        const previewGraphics = this._dragPreviewNode.addComponent(Graphics);
        this.drawDragPreview(previewGraphics, heroType, previewSize);

        console.log(`创建拖拽预览: ${heroType}, 节点: ${this._dragPreviewNode.name}`);
    }

    /**
     * 绘制拖拽预览
     */
    private drawDragPreview(graphics: Graphics, heroType: HeroType, size: number): void {
        graphics.clear();

        const alpha = 180;
        const halfSize = size / 2;

        switch (heroType) {
            case HeroType.ORANGE_CAT:
                graphics.fillColor = new Color(255, 165, 0, alpha);
                graphics.circle(0, 0, halfSize);
                graphics.fill();
                break;

            case HeroType.PERSIAN_SNIPER:
                graphics.fillColor = new Color(192, 192, 192, alpha);
                graphics.circle(0, 0, halfSize);
                graphics.fill();
                break;

            case HeroType.BENGAL_HUNTER:
                graphics.fillColor = new Color(255, 215, 0, alpha);
                graphics.circle(0, 0, halfSize);
                graphics.fill();
                break;

            case HeroType.SIAMESE_MAGE:
                graphics.fillColor = new Color(100, 100, 255, alpha);
                graphics.rect(-halfSize, -halfSize, size, size);
                graphics.fill();
                break;

            case HeroType.MAINE_THUNDER:
                graphics.fillColor = new Color(25, 25, 112, alpha);
                graphics.rect(-halfSize, -halfSize, size, size);
                graphics.fill();
                break;

            case HeroType.NORWEGIAN_ICE:
                graphics.fillColor = new Color(173, 216, 230, alpha);
                graphics.moveTo(0, -halfSize);
                graphics.lineTo(halfSize * 0.8, 0);
                graphics.lineTo(0, halfSize);
                graphics.lineTo(-halfSize * 0.8, 0);
                graphics.close();
                graphics.fill();
                break;

            case HeroType.BRITISH_KNIGHT:
                graphics.fillColor = new Color(100, 149, 237, alpha);
                graphics.rect(-halfSize, -halfSize, size, size);
                graphics.fill();
                break;

            case HeroType.RAGDOLL_GUARDIAN:
                graphics.fillColor = new Color(255, 182, 193, alpha);
                graphics.rect(-halfSize, -halfSize, size, size);
                graphics.fill();
                break;

            case HeroType.SCOTTISH_ENGINEER:
                graphics.fillColor = new Color(255, 140, 0, alpha);
                graphics.circle(0, 0, halfSize * 0.8);
                graphics.fill();
                break;

            case HeroType.ABYSSINIAN_SCOUT:
                graphics.fillColor = new Color(160, 82, 45, alpha);
                graphics.circle(0, 0, halfSize * 0.9);
                graphics.fill();
                break;

            case HeroType.RUSSIAN_BLUE:
                graphics.fillColor = new Color(106, 90, 205, alpha);
                graphics.circle(0, 0, halfSize);
                graphics.fill();
                break;

            case HeroType.AMERICAN_BOMBER:
                graphics.fillColor = new Color(220, 20, 60, alpha);
                graphics.rect(-halfSize, -halfSize, size, size);
                graphics.fill();
                break;

            default:
                graphics.fillColor = new Color(128, 128, 128, alpha);
                graphics.circle(0, 0, halfSize);
                graphics.fill();
                console.warn(`未定义的英雄拖拽预览: ${heroType}`);
                break;
        }

        console.log(`绘制拖拽预览: ${heroType}, 尺寸: ${size}`);
    }

    /**
     * 英雄按钮触摸移动
     */
    private onHeroButtonTouchMove(event: EventTouch): void {
        // 如果还没开始拖拽，检查拖动方向来决定是滚动还是拖拽
        if (!this._isDragging && this._selectedHeroType && this._touchStartPos) {
            const currentPos = new Vec3(event.getUILocation().x, event.getUILocation().y, 0);
            const deltaX = currentPos.x - this._touchStartPos.x;
            const deltaY = currentPos.y - this._touchStartPos.y;
            const distance = Vec3.distance(this._touchStartPos, currentPos);
            const currentTime = Date.now();
            const holdTime = currentTime - this._touchStartTime;

            // 只有在移动距离足够大时才判断方向
            if (distance > 8) {
                const isHorizontalMove = Math.abs(deltaX) > Math.abs(deltaY);
                const isVerticalMove = Math.abs(deltaY) > Math.abs(deltaX);

                if (isHorizontalMove) {
                    // 水平移动：允许ScrollView处理滚动
                    console.log(`➡️ 水平滑动检测，允许ScrollView处理，ΔX=${deltaX.toFixed(1)}, ΔY=${deltaY.toFixed(1)}`);
                    return;
                } else if (isVerticalMove && Math.abs(deltaY) > 15) {
                    // 垂直移动且超过阈值：开始英雄拖拽
                    console.log(`⬇️ 垂直拖拽检测，开始拖拽英雄，ΔX=${deltaX.toFixed(1)}, ΔY=${deltaY.toFixed(1)}`);
                    this.startHeroDrag(this._selectedHeroType, event);
                    event.propagationStopped = true;
                    return;
                }
            }

            // 支持长按拖拽（无论方向）
            if (holdTime > 500) {
                console.log(`⏰ 长按检测(${holdTime}ms)，开始拖拽英雄`);
                this.startHeroDrag(this._selectedHeroType, event);
                event.propagationStopped = true;
                return;
            }

            console.log(`📱 允许滚动，距离: ${distance.toFixed(1)}px, ΔX=${deltaX.toFixed(1)}, ΔY=${deltaY.toFixed(1)}, 时间: ${holdTime}ms`);
            return;
        }

        // 如果已经在拖拽中
        if (this._isDragging) {
            event.propagationStopped = true;
            this.updateDragPreview(event);
        }
    }

    /**
     * 更新拖拽预览位置
     */
    private updateDragPreview(event: EventTouch): void {
        if (!this._dragPreviewNode || !this._isDragging) return;

        const touchLocation = event.getUILocation();
        const parentTransform = this.node.parent?.getComponent(UITransform);

        if (parentTransform) {
            const worldPos = parentTransform.convertToNodeSpaceAR(new Vec3(touchLocation.x, touchLocation.y, 0));
            this._dragPreviewNode.setPosition(worldPos);

            // 更新网格预览
            if (this._gridSystem) {
                this._gridSystem.updateHoverPosition(worldPos);
            }
        }
    }

    /**
     * 英雄按钮触摸结束
     */
    private onHeroButtonTouchEnd(event: EventTouch): void {
        console.log(`🔚 英雄按钮触摸结束: 拖拽=${this._isDragging}, 选中=${this._selectedHeroType}`);

        if (this._isDragging) {
            // 如果正在拖拽，完成拖拽
            console.log("🎯 完成拖拽部署");
            this.finishHeroDrag(event);
        } else if (this._selectedHeroType) {
            // 如果只是点击（没有拖拽），清理选择状态，允许ScrollView处理
            console.log(`📱 简单点击，清理选择: ${this._selectedHeroType}`);
            this._selectedHeroType = null;
            this._touchStartPos = null;
            this._touchStartTime = 0;
        }
    }

    /**
     * 完成英雄拖拽
     */
    private finishHeroDrag(event: EventTouch): void {
        console.log(`🎯 完成拖拽部署: 英雄=${this._selectedHeroType}`);

        if (!this._selectedHeroType || !this._gridSystem) {
            console.log("❌ 拖拽完成检查失败，清理状态");
            this.cleanupDrag();
            return;
        }

        const touchLocation = event.getUILocation();
        console.log(`📍 触摸位置: (${touchLocation.x.toFixed(1)}, ${touchLocation.y.toFixed(1)})`);

        // 先将UI触摸坐标转换为世界坐标
        const parentTransform = this.node.parent?.getComponent(UITransform);
        if (!parentTransform) {
            console.log("❌ 未找到父节点的UITransform组件");
            this.cleanupDrag();
            return;
        }

        // 将UI坐标转换为父节点的本地坐标
        const parentLocalPos = parentTransform.convertToNodeSpaceAR(new Vec3(touchLocation.x, touchLocation.y, 0));
        console.log(`🗺️ 父节点本地坐标: (${parentLocalPos.x.toFixed(1)}, ${parentLocalPos.y.toFixed(1)})`);

        // 使用网格系统的坐标转换方法
        const gridPos = this._gridSystem.worldToGridPosition(parentLocalPos);

        if (gridPos) {
            console.log(`📍 网格位置: (${gridPos.row}, ${gridPos.col})`);
            const canDeploy = this._gridSystem.canDeployAt(gridPos);
            console.log(`🎯 可部署: ${canDeploy}`);

            if (canDeploy) {
                // 通过部署处理器执行部署
                if (this._deploymentHandler) {
                    const success = this._deploymentHandler.deployHeroToGrid(this._selectedHeroType, gridPos.row, gridPos.col);
                    if (success) {
                        console.log(`✅ 成功部署 ${this._selectedHeroType} 到网格 (${gridPos.row}, ${gridPos.col})`);
                    } else {
                        console.log(`❌ 英雄部署失败: ${this._selectedHeroType}`);
                    }
                } else {
                    console.log("❌ 未设置部署处理器");
                }
            } else {
                console.log(`❌ 网格位置 (${gridPos.row}, ${gridPos.col}) 已被占用`);
            }
        } else {
            console.log("❌ 触摸位置超出网格范围");
        }

        this.cleanupDrag();
    }

    /**
     * 英雄按钮触摸取消
     */
    private onHeroButtonTouchCancel(): void {
        this.cleanupDrag();
    }

    /**
     * 清理拖拽状态
     */
    private cleanupDrag(): void {
        this._isDragging = false;
        this._selectedHeroType = null;
        this._touchStartPos = null;
        this._touchStartTime = 0;

        // 销毁拖拽预览
        if (this._dragPreviewNode) {
            this._dragPreviewNode.destroy();
            this._dragPreviewNode = null;
        }

        // 结束网格预览模式
        if (this._gridSystem) {
            this._gridSystem.endDragMode();
        }

        // 更新按钮状态
        this.updateHeroButtonStates();
    }

    // ========== 辅助方法 ==========

    /**
     * 显示金币不足效果
     */
    private showInsufficientFundsEffect(buttonNode: Node): void {
        const originalScale = buttonNode.scale;
        buttonNode.setScale(originalScale.x * 0.9, originalScale.y * 0.9);

        setTimeout(() => {
            if (buttonNode && buttonNode.isValid) {
                buttonNode.setScale(originalScale);
            }
        }, 200);
    }

    /**
     * 测试ScrollView滚动功能
     */
    private testScrollView(): void {
        if (!this._heroScrollView) {
            console.error("❌ 无法测试：_heroScrollView引用为空");
            return;
        }

        const scrollView = this._heroScrollView;
        console.log("🧪 开始ScrollView滚动测试...");

        if (scrollView.content) {
            console.log("📏 测试前状态:", {
                enabled: scrollView.enabled,
                horizontal: scrollView.horizontal,
                contentWidth: scrollView.content.getComponent(UITransform)?.contentSize.width,
                scrollViewWidth: scrollView.node.getComponent(UITransform)?.contentSize.width
            });

            // 尝试手动滚动到偏移位置
            setTimeout(() => {
                scrollView.scrollToOffset(new Vec2(100, 0), 2);
                console.log("✅ 手动滚动命令已发送");
            }, 100);
        } else {
            console.error("❌ 测试失败：ScrollView没有content");
        }
    }

    protected onDestroy(): void {
        this.cleanupDrag();
    }
}