import { _decorator, Color, Component, EventTouch, Graphics, Label, Mask, Node, ScrollView, UITransform, Vec3, view } from 'cc';
import { GameManager } from '../../managers/GameManager';
import { GridDeploymentSystem } from '../../systems/GridDeploymentSystem';
import { HeroFactory } from '../../systems/HeroFactory';
import { HeroType } from '../../types/GameTypes';

const { ccclass } = _decorator;


/**
 * 英雄选择面板组件
 * 负责显示可选英雄、处理英雄拖拽和部署逻辑
 */
@ccclass('HeroSelectionPanel')
export class HeroSelectionPanel extends Component {

    // ========== 属性定义 ==========

    // UI组件引用
    private _heroScrollView: ScrollView | null = null;
    private _heroButtons: Node[] = [];
    private _selectedHeroType: HeroType | null = null;
    private _dragPreviewNode: Node | null = null;
    private _isDragging: boolean = false;
    private _touchStartTime: number = 0;

    // 管理器引用
    private _gameManager: GameManager | null = null;
    private _gridSystem: GridDeploymentSystem | null = null;

    // ========== 生命周期方法 ==========

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

    protected onDestroy(): void {
        this.cleanupDrag();
    }

    // ========== 公共接口方法 ==========

    /**
     * 部署英雄到网格
     */
    public deployHeroToGrid(heroType: HeroType, gridRow: number, gridCol: number): boolean {
        console.log(`🚀 开始部署英雄: ${heroType} 到位置 (${gridRow}, ${gridCol})`);

        if (!this._gameManager || !this._gridSystem) {
            console.log("❌ 缺少必要的管理器引用");
            return false;
        }

        const heroCost = HeroFactory.getHeroCost(heroType);

        // 检查金币
        if (this._gameManager.getGameStats().gold < heroCost) {
            console.log("金币不足，无法部署英雄");
            return false;
        }

        // 检查网格位置
        if (!this._gridSystem.canDeployHero(gridRow, gridCol)) {
            console.log("网格位置不可用");
            return false;
        }

        // 创建英雄
        console.log(`🏭 创建英雄: ${heroType}`);
        const heroNode = HeroFactory.createHero(heroType, this._gridSystem.node);
        if (!heroNode) {
            console.log("❌ 英雄创建失败");
            return false;
        }
        console.log(`✅ 英雄创建成功: ${heroNode.name}`);

        // 部署到网格
        console.log(`🗺️ 部署英雄到网格位置 (${gridRow}, ${gridCol})`);
        const success = this._gridSystem.deployHero(heroNode, gridRow, gridCol);
        if (success) {
            // 扣除金币
            console.log(`💰 扣除金币: ${heroCost}`);
            this._gameManager.spendGold(heroCost);

            // 添加到已部署列表
            this._gameManager.addDeployedHero(heroNode);

            console.log(`✅ 成功部署 ${heroType}，消耗 ${heroCost} 金币`);
            return true;
        } else {
            // 部署失败，销毁英雄节点
            heroNode.destroy();
            console.log("❌ 英雄部署失败");
            return false;
        }
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

    // ========== 面板创建方法 ==========

    /**
     * 创建英雄选择面板
     */
    private createHeroSelectionPanel(): void {
        // 定位到屏幕底部
        const screenHeight = view.getVisibleSize().height;
        const screenWidth = view.getVisibleSize().width;
        // 距离屏幕底部高100个像素单元的中间位置
        this.node.setPosition(0, -screenHeight / 2 + 60);

        // 设置面板的UITransform
        const panelTransform = this.node.addComponent(UITransform);
        // 上下50
        panelTransform.setContentSize(screenWidth, 120);

        // 面板背景（这里边框和填充是一个路径线，主要不要使用两次rect）
        const panelBg = this.node.addComponent(Graphics);
        panelBg.fillColor = new Color(20, 20, 20, 220);
        // 左下角
        panelBg.rect(-screenWidth / 2, -50, screenWidth, 120);
        panelBg.fill();

        // 添加面板边框（不需要重复 rect，只需 stroke）
        panelBg.strokeColor = new Color(100, 100, 100, 150);
        panelBg.lineWidth = 2;
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
        // 屏幕中间位置
        scrollViewNode.setPosition(0, 0);


        // 添加ScrollView组件
        const scrollView = scrollViewNode.addComponent(ScrollView);
        this._heroScrollView = scrollView;

        // 设置ScrollView的UITransform
        const scrollTransform = scrollViewNode.addComponent(UITransform);
        const scrollViewWidth = screenWidth - 30;
        scrollTransform.setAnchorPoint(0.5, 0.5);
        scrollTransform.setContentSize(scrollViewWidth, 120);


        // 配置ScrollView基本属性
        scrollView.horizontal = true; // 启用水平滚动
        scrollView.vertical = false; // 禁用垂直滚动
        scrollView.inertia = true; // 启用惯性滚动
        scrollView.brake = 0.9; // 设置刹车强度


        // 1. 创建父节点 view
        const parentView = new Node('View');
        const ui = parentView.addComponent(UITransform);
        const mask = parentView.addComponent(Mask);
        mask.type = Mask.Type.GRAPHICS_RECT;
        ui.setAnchorPoint(0.5, 0.5);
        ui.setContentSize(scrollViewWidth, 120);
        parentView.parent = scrollViewNode;


        // 2. 创建Content节点
        const contentNode = new Node("Content");

        // 确保Content节点先添加UITransform组件，再进行后续配置
        const contentTransform = contentNode.addComponent(UITransform);

        const availableHeroes = HeroFactory.getAvailableHeroTypes();
        // 将这些常量配置，抽取出来到类外部，加上注释
        const buttonSize = 80; // 按钮大小
        const buttonSpacing = 20; // 按钮间距
        const paddingTotal = buttonSpacing * 2; // 内边距总和

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



        // 在设置父节点之前完成所有Content配置
        contentTransform.setContentSize(contentWidth, 120);
        contentTransform.setAnchorPoint(0, 0.5);
        contentNode.setPosition(-scrollViewWidth / 2, 0); // 确保Content在父节点中居中


        console.log(`📋 Content节点配置完成，准备设置父节点...`);


        contentNode.parent = parentView;
        scrollView.content = contentNode;
        console.log(`✅ Content节点设置为ScrollView的内容, ${scrollView.view}`);

        // 创建英雄按钮
        this.createHeroButtonsManualLayout(contentNode, buttonSize, buttonSpacing);


        console.log(`✅ Content节点设置完成`);
    }

    /**
     * 手动布局创建英雄按钮
     */
    private createHeroButtonsManualLayout(contentNode: Node, buttonSize: number, buttonSpacing: number): void {
        const availableHeroes = HeroFactory.getAvailableHeroTypes();

        // 计算起始位置（左对齐）
        const startX = buttonSpacing + buttonSize / 2;

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

    // ========== UI绘制方法 ==========

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
        // 创建价格背景节点
        const priceBgNode = new Node("PriceBackground");
        priceBgNode.setPosition(0, -size / 2 + 12);

        // 价格背景
        const priceBg = priceBgNode.addComponent(Graphics);
        priceBg.fillColor = new Color(0, 0, 0, 150);
        priceBg.rect(-20, -8, 40, 16);
        priceBg.fill();

        // 设置背景节点的父节点
        priceBgNode.parent = parent;

        // 创建价格文本节点
        const priceNode = new Node("PriceLabel");
        priceNode.setPosition(0, -size / 2 + 12);

        // 价格文本
        const priceLabel = priceNode.addComponent(Label);
        priceLabel.string = `${cost}`;
        priceLabel.fontSize = 14;
        priceLabel.color = new Color(255, 215, 0);

        // 设置文本节点的父节点
        priceNode.parent = parent;
    }

    // ========== 触摸事件处理方法 ==========

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

        buttonNode.on(Node.EventType.TOUCH_CANCEL, (event: EventTouch) => {
            console.log(`🟡 触摸取消: ${heroType}, event: ${event.getLocation()}`);
            this.onHeroButtonTouchCancelOrEnd(event)
        }, this);


        buttonNode.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            console.log(`🟡 触摸结束: ${heroType}, event: ${event.getLocation()}`);
            this.onHeroButtonTouchCancelOrEnd(event)
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


        // 记录触摸开始，但不立即开始拖拽 - 允许ScrollView正常处理
        this._selectedHeroType = heroType;
        this._touchStartTime = Date.now();
        const startLocation = event.getUIStartLocation();
        console.log(`✅ 选中英雄: ${heroType}, 位置: (${startLocation.x}, ${startLocation.y})`);
    }

    /**
     * 英雄按钮触摸移动
     */
    private onHeroButtonTouchMove(event: EventTouch): void {
        // 如果还没开始拖拽，检查拖动方向来决定是滚动还是拖拽
        if (!this._isDragging && this._selectedHeroType) {
            // 使用累积距离来判断拖拽方向
            const startLocation = event.getUIStartLocation();
            const currentLocation = event.getUILocation();
            const deltaX = currentLocation.x - startLocation.x;
            const deltaY = currentLocation.y - startLocation.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            const isVerticalMove = Math.abs(deltaY) > Math.abs(deltaX) * 1.5 && Math.abs(deltaY) > 8;
            // 在垂直方向有移动，并且移动有一定的距离
            if (isVerticalMove && distance > 40) {
                // 垂直移动：开始英雄拖拽
                console.log(`distance, ${distance} ⬇️ 垂直拖拽检测，开始拖拽英雄，ΔX=${deltaX.toFixed(1)}, ΔY=${deltaY.toFixed(1)}`);
                this.startHeroDrag(this._selectedHeroType, event);
                event.propagationStopped = true;
                return;
            }
        }

        // 如果已经在拖拽中
        if (this._isDragging) {
            event.propagationStopped = true;
            this.updateDragPreview(event);
        }
    }

    /**
     * 英雄按钮触摸结束
     */
    private onHeroButtonTouchCancelOrEnd(event: EventTouch): void {
        console.log(`🔚 英雄按钮触摸结束: 拖拽=${this._isDragging}, 选中=${this._selectedHeroType}`);
        if (this._isDragging) {
            // 如果正在拖拽，完成拖拽
            console.log("🎯 完成拖拽部署");
            this.finishHeroDrag(event);
        }
    }


    // ========== 拖拽系统方法 ==========

    /**
     * 开始英雄拖拽
     */
    private startHeroDrag(heroType: HeroType, event: EventTouch): void {
        this._selectedHeroType = heroType;
        this._isDragging = true;

        console.log(`开始拖拽英雄: ${heroType}`);

        // 禁用ScrollView滚动
        if (this._heroScrollView) {
            this._heroScrollView.enabled = false;
        }

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
        this._dragPreviewNode.parent = this.node.parent; // 设置为Canvas的子节点

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
     * 更新拖拽预览位置
     */
    private updateDragPreview(event: EventTouch): void {
        if (!this._dragPreviewNode || !this._isDragging) return;

        const touchLocation = event.getUILocation();
        const parentTransform = this.node.parent.getComponent(UITransform);

        const worldPos = parentTransform.convertToNodeSpaceAR(new Vec3(touchLocation.x, touchLocation.y, 0));
        this._dragPreviewNode.setPosition(worldPos);
        console.log(`📍 更新拖拽预览位置: (${worldPos.x.toFixed(1)}, ${worldPos.y.toFixed(1)})`);
        // 更新网格预览
        if (this._gridSystem) {
            this._gridSystem.updateHoverPosition(worldPos);
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
                // 直接使用自己的部署方法
                const success = this.deployHeroToGrid(this._selectedHeroType, gridPos.row, gridPos.col);
                if (success) {
                    console.log(`✅ 成功部署 ${this._selectedHeroType} 到网格 (${gridPos.row}, ${gridPos.col})`);
                } else {
                    console.log(`❌ 英雄部署失败: ${this._selectedHeroType}`);
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
     * 清理拖拽状态
     */
    private cleanupDrag(): void {
        // 如果已经清理过了，直接返回
        if (!this._isDragging && !this._selectedHeroType && !this._dragPreviewNode) {
            return;
        }

        console.log("🧹 清理拖拽状态");
        this._isDragging = false;
        this._selectedHeroType = null;
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

        // 重新启用ScrollView滚动
        if (this._heroScrollView) {
            this._heroScrollView.enabled = true;
        }

        // 更新按钮状态
        this.updateHeroButtonStates();
    }

    // ========== 辅助工具方法 ==========

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

}
