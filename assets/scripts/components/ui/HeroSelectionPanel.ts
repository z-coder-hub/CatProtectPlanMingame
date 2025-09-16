import { _decorator, Color, Component, EventTouch, Graphics, Label, Mask, Node, resources, ScrollView, Sprite, SpriteFrame, UITransform, Vec3, Widget } from 'cc';
import { BattleManager } from '../../managers/BattleManager';
import { GameManager } from '../../managers/GameManager';
import { LevelManager } from '../../managers/LevelManager';
import { GridDeploymentSystem } from '../../systems/GridDeploymentSystem';
import { HeroFactory } from '../../systems/HeroFactory';
import { HeroType } from '../../types/GameTypes';
import { UIHelper } from '../../utils/UIHelper';

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

    // 管理器引用
    private _gameManager: GameManager | null = null;
    private _levelManager: LevelManager | null = null;
    private _gridSystem: GridDeploymentSystem | null = null;

    // 缓存上次的解锁状态，用于检测变化
    private _lastUnlockedHeroes: Set<HeroType> = new Set();

    // ========== 生命周期方法 ==========

    protected onLoad(): void {
        this.createHeroSelectionPanel();
        console.log("HeroSelectionPanel 初始化完成");
    }

    protected start(): void {
        // 获取管理器引用
        this._gameManager = GameManager.instance;
        this._levelManager = LevelManager.instance;
        this._gridSystem = GridDeploymentSystem.instance;

        if (!this._gameManager) {
            console.error("未找到GameManager实例");
        }
        if (!this._levelManager) {
            console.error("未找到LevelManager实例");
        }
        if (!this._gridSystem) {
            console.error("未找到GridDeploymentSystem实例");
        }

        // 监听英雄解锁事件和金币变化事件
        if (this._gameManager) {
            this._gameManager.AddEventListener('hero-unlocked', this.onHeroUnlocked);
            this._gameManager.AddEventListener('gold-changed', this.onGoldChanged);
        }

        // 初始化解锁状态缓存
        const initialUnlockedHeroes = this.getUnlockedHeroTypes();
        this._lastUnlockedHeroes = new Set(initialUnlockedHeroes);

        // 初始更新按钮状态
        this.UpdateHeroButtonStates();
    }


    protected onDestroy(): void {
        this.cleanupDrag();

        // 清理事件监听
        if (this._gameManager) {
            this._gameManager.RemoveEventListener('hero-unlocked', this.onHeroUnlocked);
            this._gameManager.RemoveEventListener('gold-changed', this.onGoldChanged);
        }
    }

    // ========== 事件处理方法 ==========

    /**
     * 英雄解锁事件处理
     */
    private onHeroUnlocked = (data: { heroType: HeroType }): void => {
        const heroType = data.heroType;
        console.log(`🎉 收到英雄解锁事件: ${heroType}`);

        // 刷新英雄面板以显示新解锁的英雄
        this.RefreshHeroPanel();
    }

    /**
     * 金币变化事件处理
     */
    private onGoldChanged = (data: { currentGold: number; previousGold: number; change: number }): void => {
        console.log(`💰 金币变化: ${data.previousGold} → ${data.currentGold} (${data.change > 0 ? '+' : ''}${data.change})`);

        // 更新英雄按钮状态以反映新的金币状况
        this.UpdateHeroButtonStates();
    }

    // ========== 公共接口方法 ==========

    /**
     * 获取所有英雄类型列表（按解锁顺序排序）
     */
    private getAllHeroTypes(): HeroType[] {
        // 返回所有英雄类型，按解锁顺序排序
        return [
            // 关卡1解锁（新手训练）
            HeroType.ORANGE_CAT,        // 默认英雄
            HeroType.PERSIAN_SNIPER,    // 波斯狙击手
            HeroType.SIAMESE_MAGE,      // 暹罗法师
            HeroType.BRITISH_KNIGHT,    // 英短骑士
            HeroType.SCOTTISH_MARKSMAN, // 苏格兰射手

            // 关卡2解锁（进阶学习）
            HeroType.BENGAL_HUNTER,     // 孟加拉猎手
            HeroType.MAINE_THUNDER,     // 缅因雷法
            HeroType.ABYSSINIAN_ARCHER, // 阿比西尼亚弓箭手

            // 关卡3解锁（精英训练）
            HeroType.NORWEGIAN_ICE,     // 挪威冰法
            HeroType.RUSSIAN_BLUE,      // 俄罗斯蓝猫
            HeroType.AMERICAN_BOMBER    // 美国爆破兵
        ];
    }

    /**
     * 获取已解锁的英雄类型列表（保留兼容性）
     */
    private getUnlockedHeroTypes(): HeroType[] {
        // 如果LevelManager还未初始化，使用默认解锁英雄
        if (!this._levelManager) {
            console.warn("LevelManager未初始化，使用默认英雄列表");
            return [HeroType.ORANGE_CAT]; // 默认只有橘猫可用
        }

        const unlockedHeroes = this._levelManager.GetUnlockedHeroes();
        console.log(`获取已解锁英雄: ${unlockedHeroes.length} 个英雄`);

        // 确保至少有一个英雄可用
        if (unlockedHeroes.length === 0) {
            console.warn("没有解锁的英雄，使用默认橘猫");
            return [HeroType.ORANGE_CAT];
        }

        return unlockedHeroes;
    }

    /**
     * 检查英雄是否已解锁
     */
    public IsHeroUnlocked(heroType: HeroType): boolean {
        if (!this._levelManager) {
            return heroType === HeroType.ORANGE_CAT; // 默认只有橘猫可用
        }
        return this._levelManager.IsHeroUnlocked(heroType);
    }

    /**
     * 部署英雄到网格
     */
    public DeployHeroToGrid(heroType: HeroType, gridRow: number, gridCol: number): boolean {
        console.log(`🚀 开始部署英雄: ${heroType} 到位置 (${gridRow}, ${gridCol})`);

        if (!this._gameManager || !this._gridSystem) {
            console.log("❌ 缺少必要的管理器引用");
            return false;
        }

        // 检查英雄是否已解锁
        if (!this.IsHeroUnlocked(heroType)) {
            console.log(`❌ 英雄 ${heroType} 尚未解锁`);
            return false;
        }

        const heroCost = HeroFactory.GetHeroCost(heroType);

        // 检查金币
        if (this._gameManager.GetGameStats().gold < heroCost) {
            console.log("金币不足，无法部署英雄");
            return false;
        }

        // 检查网格位置
        if (!this._gridSystem.CanDeployHero(gridRow, gridCol)) {
            console.log("网格位置不可用");
            return false;
        }

        // 创建英雄
        console.log(`🏭 创建英雄: ${heroType}`);
        const heroNode = HeroFactory.CreateHero(heroType, this._gridSystem.node);
        if (!heroNode) {
            console.log("❌ 英雄创建失败");
            return false;
        }
        console.log(`✅ 英雄创建成功: ${heroNode.name}`);

        // 部署到网格
        console.log(`🗺️ 部署英雄到网格位置 (${gridRow}, ${gridCol})`);
        const success = this._gridSystem.DeployHero(heroNode, gridRow, gridCol);
        if (success) {
            // 扣除金币
            console.log(`💰 扣除金币: ${heroCost}`);
            this._gameManager.SpendGold(heroCost);

            // 添加到已部署列表
            // 直接注册到BattleManager
            const battleManager = BattleManager.instance;
            if (battleManager) {
                battleManager.RegisterHero(heroNode);
            }

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
    public GetSelectedHeroType(): HeroType | null {
        return this._selectedHeroType;
    }

    /**
     * 更新英雄按钮状态（通常在金币变化时调用）
     */
    public UpdateHeroButtonStates(): void {
        this._heroButtons.forEach(buttonNode => {
            const heroType = buttonNode.name.replace('HeroButton_', '') as HeroType;
            const isSelected = heroType === this._selectedHeroType;

            const buttonGraphics = buttonNode.getComponent(Graphics);
            if (buttonGraphics) {
                const buttonTransform = buttonNode.getComponent(UITransform);
                const width = buttonTransform ? buttonTransform.contentSize.width : 96;
                const height = buttonTransform ? buttonTransform.contentSize.height : 120;
                this.drawHeroButtonBackground(buttonGraphics, width, height, isSelected, heroType);
            }
        });
    }

    /**
     * 刷新英雄面板（当有新英雄解锁时调用）
     */
    public RefreshHeroPanel(): void {
        console.log("智能刷新英雄选择面板");

        const currentAllHeroes = this.getAllHeroTypes();
        const currentUnlockedHeroes = this.getUnlockedHeroTypes();
        console.log(`所有英雄数量: ${currentAllHeroes.length}, 已解锁: ${currentUnlockedHeroes.length}`);

        // 检查是否有新英雄需要添加
        const needsFullRefresh = this.checkIfNeedsFullRefresh(currentAllHeroes);

        if (needsFullRefresh) {
            console.log("检测到需要重建按钮（英雄数量变化）");
            this.recreateHeroButtons();
        } else {
            console.log("英雄数量未变，检查解锁状态变化");
            // 检查是否有解锁状态变化
            if (this.hasUnlockStatusChanged(currentUnlockedHeroes)) {
                console.log("检测到解锁状态变化，重新创建按钮");
                this.recreateHeroButtons();
            } else {
                console.log("没有状态变化，只更新按钮外观");
                this.UpdateHeroButtonStates();
            }
        }
    }

    /**
     * 检查解锁状态是否发生变化
     */
    private hasUnlockStatusChanged(currentUnlockedHeroes: HeroType[]): boolean {
        const currentSet = new Set(currentUnlockedHeroes);

        // 比较新旧解锁状态
        if (this._lastUnlockedHeroes.size !== currentSet.size) {
            console.log(`解锁数量变化: ${this._lastUnlockedHeroes.size} → ${currentSet.size}`);
            this._lastUnlockedHeroes = currentSet;
            return true;
        }

        // 检查具体的解锁英雄是否有变化
        for (const hero of currentSet) {
            if (!this._lastUnlockedHeroes.has(hero)) {
                console.log(`新解锁英雄: ${hero}`);
                this._lastUnlockedHeroes = currentSet;
                return true;
            }
        }

        for (const hero of this._lastUnlockedHeroes) {
            if (!currentSet.has(hero)) {
                console.log(`英雄被锁定: ${hero}`);
                this._lastUnlockedHeroes = currentSet;
                return true;
            }
        }

        return false;
    }

    /**
     * 检查是否需要完全刷新面板
     */
    private checkIfNeedsFullRefresh(currentAllHeroes: HeroType[]): boolean {
        // 如果按钮数量与所有英雄数量不匹配，需要刷新
        if (this._heroButtons.length !== currentAllHeroes.length) {
            return true;
        }

        // 检查每个英雄是否都有对应按钮
        for (const heroType of currentAllHeroes) {
            const hasButton = this._heroButtons.some(button =>
                button && button.isValid && button.name === `HeroButton_${heroType}`
            );
            if (!hasButton) {
                return true;
            }
        }

        return false;
    }

    /**
     * 重新创建英雄按钮（保持面板结构不变）
     */
    private recreateHeroButtons(): void {
        // 只清理按钮，保持ScrollView和面板结构
        this._heroButtons.forEach(button => {
            if (button && button.isValid) {
                button.destroy();
            }
        });
        this._heroButtons = [];

        // 找到Content节点
        const contentNode = this.findContentNode();
        if (!contentNode) {
            console.error("找不到Content节点，进行完整面板重建");
            this.fullPanelRebuild();
            return;
        }

        // 清理Content节点的子节点（按钮容器）
        const contentChildren = contentNode.children.slice();
        contentChildren.forEach(child => {
            if (child && child.isValid) {
                child.destroy();
            }
        });

        // 重新创建按钮
        const buttonWidth = 110; // 增加宽度以容纳完整英雄名称
        const buttonHeight = 120;
        const buttonSpacing = 24;

        this.createHeroButtonsAdaptiveLayout(contentNode, buttonWidth, buttonHeight, buttonSpacing);

        // 更新Content尺寸
        this.updateContentSize(contentNode);

        console.log(`成功重新创建 ${this._heroButtons.length} 个英雄按钮`);
    }

    /**
     * 查找Content节点
     */
    private findContentNode(): Node | null {
        const scrollViewNode = this.node.getChildByName("HeroScrollView");
        if (!scrollViewNode) return null;

        const viewNode = scrollViewNode.getChildByName("View");
        if (!viewNode) return null;

        const contentNode = viewNode.getChildByName("Content");
        return contentNode;
    }

    /**
     * 更新Content节点尺寸
     */
    private updateContentSize(contentNode: Node): void {
        const availableHeroes = this.getAllHeroTypes();
        const buttonWidth = 110; // 增加宽度以容纳完整英雄名称
        const buttonSpacing = 24;
        const paddingTotal = buttonSpacing * 2;

        const contentTransform = contentNode.getComponent(UITransform);
        if (contentTransform) {
            const panelTransform = this.node.getComponent(UITransform);
            const panelWidth = panelTransform ? panelTransform.width : 800;

            const minContentWidth = availableHeroes.length * (buttonWidth + buttonSpacing) + paddingTotal;
            const contentWidth = Math.max(minContentWidth, (panelWidth - 36) + 120);

            contentTransform.setContentSize(contentWidth, contentTransform.height);
            console.log(`更新Content尺寸: 宽度=${contentWidth}, 英雄数量=${availableHeroes.length}`);
        }
    }

    /**
     * 完整面板重建（兜底方案）
     */
    private fullPanelRebuild(): void {
        console.warn("执行完整面板重建");

        // 清理现有按钮
        this._heroButtons.forEach(button => {
            if (button && button.isValid) {
                button.destroy();
            }
        });
        this._heroButtons = [];
        this._heroScrollView = null;

        // 清理子节点
        const panelChildren = this.node.children.slice();
        panelChildren.forEach(child => {
            if (child && child.isValid) {
                child.destroy();
            }
        });

        // 清理主节点组件
        const existingGraphics = this.node.getComponent(Graphics);
        if (existingGraphics) {
            existingGraphics.destroy();
        }

        const existingWidget = this.node.getComponent(Widget);
        if (existingWidget) {
            existingWidget.destroy();
        }

        // 重新创建面板
        this.createHeroSelectionPanel();
    }

    // ========== 面板创建方法 ==========

    /**
     * 创建英雄选择面板
     */
    private createHeroSelectionPanel(): void {
        // 使用Widget进行底部对齐，增加高度以容纳更高的按钮 (140 * 1.2 = 168)
        UIHelper.SetupBottomAlignWidget(this.node, 168, 0);

        // 面板背景（边框和填充是一个路径线）
        const panelBg = UIHelper.CreatePanelWithBackground(this.node, new Color(20, 20, 20, 220));

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
        // 获取面板的尺寸（由Widget设置）
        const panelTransform = this.node.getComponent(UITransform);
        if (!panelTransform) {
            console.error("面板缺少UITransform组件");
            return;
        }

        // 创建ScrollView节点，使用Widget居中对齐 (30 * 1.2 = 36)
        const scrollViewNode = new Node("HeroScrollView");
        scrollViewNode.parent = this.node;
        UIHelper.SetupCenterWidget(scrollViewNode, panelTransform.width - 36, panelTransform.height);

        // 添加ScrollView组件
        const scrollView = scrollViewNode.addComponent(ScrollView);
        this._heroScrollView = scrollView;

        // 配置ScrollView基本属性
        scrollView.horizontal = true;
        scrollView.vertical = false;
        scrollView.inertia = true;
        scrollView.brake = 0.6;

        // 创建View节点（带遮罩）
        const viewNode = new Node('View');
        viewNode.parent = scrollViewNode;
        const viewTransform = viewNode.addComponent(UITransform);
        viewTransform.setContentSize(panelTransform.width - 36, panelTransform.height);

        const mask = viewNode.addComponent(Mask);
        mask.type = Mask.Type.GRAPHICS_RECT;

        // 创建Content节点
        const contentNode = new Node("Content");
        contentNode.parent = viewNode;
        const contentTransform = contentNode.addComponent(UITransform);

        const availableHeroes = this.getAllHeroTypes();
        const buttonWidth = 110; // 增加宽度以容纳完整英雄名称
        const buttonHeight = 120; // 增加高度以容纳名称标签，100 * 1.2 = 120
        const buttonSpacing = 24; // 20 * 1.2 = 24
        const paddingTotal = buttonSpacing * 2;

        // 计算Content尺寸
        const minContentWidth = availableHeroes.length * (buttonWidth + buttonSpacing) + paddingTotal;
        const contentWidth = Math.max(minContentWidth, (panelTransform.width - 36) + 120); // 100 * 1.2 = 120

        contentTransform.setContentSize(contentWidth, panelTransform.height);
        contentTransform.setAnchorPoint(0, 0.5);

        // 设置ScrollView的content
        scrollView.content = contentNode;

        // 创建英雄按钮
        this.createHeroButtonsAdaptiveLayout(contentNode, buttonWidth, buttonHeight, buttonSpacing);

        console.log(`✅ ScrollView创建完成，英雄数量: ${availableHeroes.length}`);
    }

    /**
     * 自适应布局创建英雄按钮 - 使用Widget相对布局
     */
    private createHeroButtonsAdaptiveLayout(contentNode: Node, buttonWidth: number, buttonHeight: number, buttonSpacing: number): void {
        const availableHeroes = this.getAllHeroTypes();
        const contentTransform = contentNode.getComponent(UITransform);
        if (!contentTransform) {
            console.error("Content节点缺少UITransform组件");
            return;
        }

        const containerWidth = buttonWidth + buttonSpacing; // 每个容器的宽度

        availableHeroes.forEach((heroType, index) => {
            const heroConfig = HeroFactory.GetHeroConfig(heroType);
            if (!heroConfig) return;

            // 创建按钮容器，使用Widget进行相对定位
            const buttonContainer = this.createHeroButtonContainer(index, containerWidth, buttonHeight);
            buttonContainer.parent = contentNode;

            // 在容器内创建英雄按钮，居中对齐
            const heroButton = this.createAdaptiveHeroButton(heroType, heroConfig, buttonWidth, buttonHeight);
            heroButton.parent = buttonContainer;

            // 为按钮设置居中Widget
            this.setupButtonCenterWidget(heroButton);

            this._heroButtons.push(heroButton);
        });

        console.log(`使用Widget布局创建了 ${this._heroButtons.length} 个英雄按钮`);
    }

    /**
     * 创建英雄按钮容器，使用Widget进行相对定位
     */
    private createHeroButtonContainer(index: number, containerWidth: number, containerHeight: number): Node {
        const container = new Node(`HeroButtonContainer_${index}`);

        // 设置容器的UITransform
        const containerTransform = container.addComponent(UITransform);
        containerTransform.setContentSize(containerWidth, containerHeight);
        containerTransform.setAnchorPoint(0, 0.5); // 左对齐，垂直居中

        // 使用Widget进行相对定位
        const widget = container.addComponent(Widget);
        widget.isAlignLeft = true;
        widget.isAlignVerticalCenter = true;

        // 计算左边距 - 基于索引和容器宽度
        const leftOffset = index * containerWidth;
        widget.left = leftOffset;
        widget.verticalCenter = 0; // 垂直居中

        widget.updateAlignment();

        return container;
    }

    /**
     * 为按钮设置居中Widget
     */
    private setupButtonCenterWidget(buttonNode: Node): void {
        const widget = buttonNode.addComponent(Widget);
        widget.isAlignHorizontalCenter = true;
        widget.isAlignVerticalCenter = true;
        widget.horizontalCenter = 0;
        widget.verticalCenter = 0;
        widget.updateAlignment();
    }

    /**
     * 创建自适应英雄按钮 - Widget布局版本
     */
    private createAdaptiveHeroButton(heroType: HeroType, heroConfig: any, width: number, height: number): Node {
        const buttonNode = new Node(`HeroButton_${heroType}`);

        const buttonTransform = buttonNode.addComponent(UITransform);
        buttonTransform.setContentSize(width, height);
        buttonTransform.setAnchorPoint(0.5, 0.5);

        // 按钮背景
        const buttonBg = buttonNode.addComponent(Graphics);
        this.drawHeroButtonBackground(buttonBg, width, height, false, heroType);

        // 检查英雄解锁状态
        const isUnlocked = this.IsHeroUnlocked(heroType);

        // 英雄图标
        this.createHeroIcon(buttonNode, heroType, isUnlocked);

        // 名称标签
        this.createAdaptiveNameLabel(buttonNode, heroType, isUnlocked);

        // 价格标签
        this.createAdaptivePriceLabel(buttonNode, heroConfig.cost, isUnlocked);

        // 添加触摸事件
        this.setupHeroButtonEvents(buttonNode, heroType);

        return buttonNode;
    }

    /**
     * 创建自适应价格标签
     */
    private createAdaptivePriceLabel(parent: Node, cost: number, isUnlocked: boolean = true): void {

        // 创建价格背景节点
        const priceBgNode = new Node("PriceBackground");
        priceBgNode.parent = parent;

        // 设置价格背景的UITransform
        const bgTransform = priceBgNode.addComponent(UITransform);
        bgTransform.setContentSize(48, 19.2);

        // 使用Widget进行底部对齐
        const bgWidget = priceBgNode.addComponent(Widget);
        bgWidget.isAlignBottom = true;
        bgWidget.isAlignHorizontalCenter = true;
        bgWidget.bottom = 10; // 从底部偏移
        bgWidget.horizontalCenter = 0;
        bgWidget.updateAlignment();

        // 价格背景
        const priceBg = priceBgNode.addComponent(Graphics);
        priceBg.fillColor = isUnlocked
            ? new Color(0, 0, 0, 150)       // 解锁时：正常黑色背景
            : new Color(60, 60, 60, 120);   // 未解锁时：深灰色背景，降低透明度
        priceBg.rect(-24, -9.6, 48, 19.2); // (-20, -8, 40, 16) * 1.2
        priceBg.fill();

        // 创建价格文本节点
        const priceNode = new Node("PriceLabel");
        priceNode.parent = parent;

        // 设置价格文本的UITransform
        const priceTransform = priceNode.addComponent(UITransform);
        priceTransform.setContentSize(48, 19.2);

        // 使用Widget进行底部居中对齐
        const priceWidget = priceNode.addComponent(Widget);
        priceWidget.isAlignBottom = true;
        priceWidget.isAlignHorizontalCenter = true;
        priceWidget.bottom = 10; // 与背景相同位置
        priceWidget.horizontalCenter = 0;
        priceWidget.updateAlignment();

        // 价格文本
        const priceLabel = priceNode.addComponent(Label);
        priceLabel.string = isUnlocked ? `${cost}` : '🔒'; // 未解锁时显示锁定图标
        priceLabel.fontSize = isUnlocked ? 14.4 : 16; // 未解锁时稍大的字体显示锁定图标
        priceLabel.color = isUnlocked ? new Color(255, 215, 0) : new Color(100, 100, 100); // 未解锁时更深的灰色
    }

    /**
     * 创建自适应名称标签
     */
    private createAdaptiveNameLabel(parent: Node, heroType: HeroType, isUnlocked: boolean = true): void {

        // 获取英雄名称
        const heroName = this.getHeroDisplayName(heroType);

        // 创建名称背景节点
        const nameBgNode = new Node("NameBackground");
        nameBgNode.parent = parent;

        // 设置名称背景的UITransform
        const bgTransform = nameBgNode.addComponent(UITransform);
        const bgWidth = Math.max(60, heroName.length * 10); // 调整宽度计算以适应完整名称
        bgTransform.setContentSize(bgWidth, 19.2);

        // 使用Widget进行顶部对齐
        const bgWidget = nameBgNode.addComponent(Widget);
        bgWidget.isAlignTop = true;
        bgWidget.isAlignHorizontalCenter = true;
        bgWidget.top = 10; // 从顶部偏移
        bgWidget.horizontalCenter = 0;
        bgWidget.updateAlignment();

        // 名称背景
        const nameBg = nameBgNode.addComponent(Graphics);
        nameBg.fillColor = isUnlocked
            ? new Color(0, 0, 0, 150)       // 解锁时：正常黑色背景
            : new Color(60, 60, 60, 120);   // 未解锁时：深灰色背景，降低透明度
        nameBg.rect(-bgWidth / 2, -9.6, bgWidth, 19.2);
        nameBg.fill();

        // 创建名称文本节点
        const nameNode = new Node("NameLabel");
        nameNode.parent = parent;

        // 设置名称文本的UITransform
        const nameTransform = nameNode.addComponent(UITransform);
        nameTransform.setContentSize(bgWidth, 19.2);

        // 使用Widget进行顶部居中对齐
        const nameWidget = nameNode.addComponent(Widget);
        nameWidget.isAlignTop = true;
        nameWidget.isAlignHorizontalCenter = true;
        nameWidget.top = 10; // 与背景相同位置
        nameWidget.horizontalCenter = 0;
        nameWidget.updateAlignment();

        // 名称文本
        const nameLabel = nameNode.addComponent(Label);
        nameLabel.string = heroName;
        nameLabel.fontSize = 18; // 18px字体，与游戏内标签保持一致
        nameLabel.color = isUnlocked ? new Color(255, 255, 255) : new Color(120, 120, 120); // 未解锁时更深的灰色文字
    }

    /**
     * 获取英雄显示名称 - 使用完整的英雄名称
     */
    private getHeroDisplayName(heroType: HeroType): string {
        const heroConfig = HeroFactory.GetHeroConfig(heroType);
        return heroConfig ? heroConfig.name : "未知英雄";
    }


    // ========== UI绘制方法 ==========

    /**
     * 绘制英雄按钮背景
     */
    private drawHeroButtonBackground(graphics: Graphics, width: number, height: number, isSelected: boolean, heroType?: HeroType): void {
        graphics.clear();

        // 检查英雄解锁状态
        let isUnlocked = true;
        let canAfford = true;

        if (heroType) {
            isUnlocked = this.IsHeroUnlocked(heroType);

            if (this._gameManager && isUnlocked) {
                const currentGold = this._gameManager.GetGameStats().gold;
                const heroCost = HeroFactory.GetHeroCost(heroType);
                canAfford = currentGold >= heroCost;
            }
        }

        // 背景色
        let bgColor: Color;
        if (!isUnlocked) {
            bgColor = new Color(25, 25, 25, 180); // 未解锁：更深的灰色背景，降低透明度
        } else if (isSelected) {
            bgColor = new Color(100, 255, 100, 200); // 选中：亮绿色
        } else if (!canAfford) {
            bgColor = new Color(100, 50, 50, 200); // 买不起：暗红色
        } else {
            bgColor = new Color(70, 70, 70, 200); // 普通：深灰色
        }

        graphics.fillColor = bgColor;
        graphics.rect(-width / 2, -height / 2, width, height);
        graphics.fill();

        // 边框
        let borderColor: Color;
        if (!isUnlocked) {
            borderColor = new Color(80, 80, 80); // 未解锁：深灰色边框，稍微提亮以保持可见性
        } else if (isSelected) {
            borderColor = new Color(0, 255, 0); // 选中：绿色边框
        } else if (!canAfford) {
            borderColor = new Color(255, 0, 0); // 买不起：红色边框
        } else {
            borderColor = new Color(150, 150, 150); // 普通：浅灰色边框
        }

        graphics.strokeColor = borderColor;
        graphics.lineWidth = isSelected ? 3 : 2;
        graphics.rect(-width / 2, -height / 2, width, height);
        graphics.stroke();

        // 如果未解锁，添加锁定图标
        if (!isUnlocked) {
            this.drawLockIcon(graphics, width, height);
        }
    }

    /**
     * 绘制锁定图标
     */
    private drawLockIcon(graphics: Graphics, width: number, height: number): void {
        const lockSize = Math.min(width, height) * 0.4; // 增大锁定图标尺寸
        const lockX = 0;
        const lockY = 0;

        // 锁身（改为更明显的白色）
        graphics.fillColor = new Color(200, 200, 200); // 浅灰色锁身，在深灰背景上更明显
        graphics.rect(lockX - lockSize / 2, lockY - lockSize / 3, lockSize, lockSize * 0.6);
        graphics.fill();

        // 锁环
        graphics.strokeColor = new Color(200, 200, 200);
        graphics.lineWidth = lockSize * 0.15;
        graphics.arc(lockX, lockY - lockSize / 6, lockSize * 0.3, Math.PI, 0, false);
        graphics.stroke();

        // 添加一个锁孔
        graphics.fillColor = new Color(100, 100, 100);
        graphics.circle(lockX, lockY, lockSize * 0.08);
        graphics.fill();
    }

    /**
     * 创建英雄图标
     */
    private createHeroIcon(parent: Node, heroType: HeroType, isUnlocked: boolean = true): void {
        const iconNode = new Node("HeroIcon");
        iconNode.parent = parent;

        // 设置图标的UITransform
        const iconTransform = iconNode.addComponent(UITransform);
        iconTransform.setContentSize(60, 60); // 图标固定尺寸

        // 使用Widget进行居中对齐
        const iconWidget = iconNode.addComponent(Widget);
        iconWidget.isAlignHorizontalCenter = true;
        iconWidget.isAlignVerticalCenter = true;
        iconWidget.horizontalCenter = 0;
        iconWidget.verticalCenter = 0;
        iconWidget.updateAlignment();

        // 获取英雄对应的图片路径
        const imagePath = this.getHeroImagePath(heroType);

        if (imagePath) {
            // 使用真实图片
            this.loadHeroImage(iconNode, imagePath, isUnlocked);
        } else {
            // 回退到几何图形（用于没有图片的英雄）
            this.createGeometricIcon(iconNode, heroType, isUnlocked);
        }
    }

    /**
     * 获取英雄对应的图片路径
     */
    private getHeroImagePath(heroType: HeroType): string | null {
        const imageMap: { [key in HeroType]?: string } = {
            [HeroType.ORANGE_CAT]: "images/OrangeCat",
            [HeroType.PERSIAN_SNIPER]: "images/PersianSniper",
            [HeroType.BENGAL_HUNTER]: "images/BengalHunter",
            [HeroType.MAINE_THUNDER]: "images/MaineThunder",
            [HeroType.RUSSIAN_BLUE]: "images/RussianBlue",
            [HeroType.AMERICAN_BOMBER]: "images/AmericanBomber_icon"
        };

        return imageMap[heroType] || null;
    }


    /**
     * 加载英雄图片
     */
    private loadHeroImage(iconNode: Node, imagePath: string, isUnlocked: boolean): void {
        // 添加Sprite组件
        const sprite = iconNode.addComponent(Sprite);

        // 加载SpriteFrame资源（Cocos Creator 3.x需要指定子资源类型）
        resources.load(imagePath + "/spriteFrame", SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.error(`加载英雄图片失败: ${imagePath}`, err);
                console.warn("请确保在Cocos Creator编辑器中正确配置了resources目录");
                // 加载失败时回退到几何图形
                if (sprite && sprite.isValid) {
                    sprite.destroy();
                }
                const heroType = this.getHeroTypeFromImagePath(imagePath);
                this.createGeometricIcon(iconNode, heroType, isUnlocked);
                return;
            }

            if (!iconNode || !iconNode.isValid || !sprite || !sprite.isValid) {
                return;
            }

            // 设置SpriteFrame
            sprite.spriteFrame = spriteFrame;

            // 设置图片显示模式为自定义尺寸
            sprite.type = Sprite.Type.SIMPLE;
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;

            // 约束图片到适合的尺寸（智能适配到60x60区域）
            const iconTransform = iconNode.getComponent(UITransform);
            if (iconTransform) {
                const maxSize = 55; // 最大尺寸，留一点边距（60px容器-5px边距）
                const minSize = 40; // 最小尺寸，避免图片太小

                // 获取原始图片尺寸
                const originalWidth = spriteFrame.originalSize.width;
                const originalHeight = spriteFrame.originalSize.height;

                // 计算缩放比例，保持宽高比
                const scaleX = maxSize / originalWidth;
                const scaleY = maxSize / originalHeight;
                let scale = Math.min(scaleX, scaleY); // 使用较小的缩放比例

                // 确保缩放后的尺寸不会太小
                const scaledWidth = originalWidth * scale;
                const scaledHeight = originalHeight * scale;
                const maxDimension = Math.max(scaledWidth, scaledHeight);

                if (maxDimension < minSize) {
                    // 如果缩放后太小，重新计算以达到最小尺寸
                    scale = minSize / Math.min(originalWidth, originalHeight);
                }

                const finalWidth = Math.min(originalWidth * scale, maxSize);
                const finalHeight = Math.min(originalHeight * scale, maxSize);

                // 设置Sprite节点的UITransform尺寸
                const spriteTransform = sprite.node.getComponent(UITransform);
                if (spriteTransform) {
                    spriteTransform.setContentSize(finalWidth, finalHeight);
                    console.log(`${imagePath}: 原始${originalWidth}x${originalHeight} → 显示${finalWidth.toFixed(1)}x${finalHeight.toFixed(1)}`);
                }

                // 确保图片在图标容器中居中显示
                sprite.node.setPosition(0, 0);
            }

            // 应用未解锁状态的视觉效果
            if (!isUnlocked) {
                // 置灰效果
                sprite.color = new Color(120, 120, 120);
            }

            console.log(`成功加载英雄图片: ${imagePath}`);
        });
    }

    /**
     * 从图片路径反推英雄类型（用于错误回退）
     */
    private getHeroTypeFromImagePath(imagePath: string): HeroType {
        if (imagePath.includes("OrangeCat")) return HeroType.ORANGE_CAT;
        if (imagePath.includes("PersianSniper")) return HeroType.PERSIAN_SNIPER;
        if (imagePath.includes("BengalHunter")) return HeroType.BENGAL_HUNTER;
        if (imagePath.includes("MaineThunder")) return HeroType.MAINE_THUNDER;
        if (imagePath.includes("RussianBlue")) return HeroType.RUSSIAN_BLUE;
        if (imagePath.includes("AmericanBomber")) return HeroType.AMERICAN_BOMBER;
        return HeroType.ORANGE_CAT; // 默认值
    }


    /**
     * 创建几何图形图标（回退方案，用于没有图片的英雄）
     */
    private createGeometricIcon(iconNode: Node, heroType: HeroType, isUnlocked: boolean): void {
        // 添加Graphics组件
        const iconGraphics = iconNode.addComponent(Graphics);

        // 1.2倍缩放因子
        const scale = 1.2;

        // 未解锁英雄的透明度和饱和度调整
        const alpha = isUnlocked ? 255 : 80;

        // 应用置灰效果的颜色转换函数
        const applyGrayEffect = (color: Color): Color => {
            if (isUnlocked) return color;

            const gray = (color.r * 0.299 + color.g * 0.587 + color.b * 0.114);
            return new Color(
                Math.round(gray * 0.9 + color.r * 0.1),
                Math.round(gray * 0.9 + color.g * 0.1),
                Math.round(gray * 0.9 + color.b * 0.1),
                alpha
            );
        };

        // 根据英雄类型绘制不同图标（保持原有几何图形作为回退）
        switch (heroType) {
            case HeroType.ORANGE_CAT:
                // 橘猫 - 橙色圆形 + 弓箭
                iconGraphics.fillColor = applyGrayEffect(new Color(255, 165, 0));
                iconGraphics.circle(0, 0, 18 * scale);
                iconGraphics.fill();

                iconGraphics.strokeColor = applyGrayEffect(new Color(139, 69, 19));
                iconGraphics.lineWidth = 3 * scale;
                iconGraphics.moveTo(-10 * scale, 0);
                iconGraphics.lineTo(10 * scale, 0);
                iconGraphics.moveTo(8 * scale, -3 * scale);
                iconGraphics.lineTo(10 * scale, 0);
                iconGraphics.lineTo(8 * scale, 3 * scale);
                iconGraphics.stroke();
                break;

            case HeroType.PERSIAN_SNIPER:
                // 波斯猫 - 银色圆形 + 准星
                iconGraphics.fillColor = applyGrayEffect(new Color(192, 192, 192));
                iconGraphics.circle(0, 0, 18 * scale);
                iconGraphics.fill();

                iconGraphics.strokeColor = applyGrayEffect(new Color(64, 64, 64));
                iconGraphics.lineWidth = 2 * scale;
                iconGraphics.circle(0, 0, 12 * scale);
                iconGraphics.moveTo(0, -15 * scale);
                iconGraphics.lineTo(0, 15 * scale);
                iconGraphics.moveTo(-15 * scale, 0);
                iconGraphics.lineTo(15 * scale, 0);
                iconGraphics.stroke();
                break;

            case HeroType.BENGAL_HUNTER:
                // 孟加拉猎手 - 金色圆形 + 双弓
                iconGraphics.fillColor = applyGrayEffect(new Color(255, 215, 0));
                iconGraphics.circle(0, 0, 18 * scale);
                iconGraphics.fill();

                iconGraphics.strokeColor = applyGrayEffect(new Color(139, 69, 19));
                iconGraphics.lineWidth = 2 * scale;
                iconGraphics.moveTo(-8 * scale, -15 * scale);
                iconGraphics.lineTo(8 * scale, -15 * scale);
                iconGraphics.moveTo(-8 * scale, 15 * scale);
                iconGraphics.lineTo(8 * scale, 15 * scale);
                iconGraphics.stroke();
                break;

            case HeroType.MAINE_THUNDER:
                // 缅因雷猫 - 深蓝色方形 + 闪电
                iconGraphics.fillColor = applyGrayEffect(new Color(25, 25, 112));
                iconGraphics.rect(-18 * scale, -18 * scale, 36 * scale, 36 * scale);
                iconGraphics.fill();

                iconGraphics.strokeColor = applyGrayEffect(new Color(255, 255, 0));
                iconGraphics.lineWidth = 2 * scale;
                iconGraphics.moveTo(-8 * scale, -12 * scale);
                iconGraphics.lineTo(4 * scale, -2 * scale);
                iconGraphics.lineTo(-4 * scale, 2 * scale);
                iconGraphics.lineTo(8 * scale, 12 * scale);
                iconGraphics.stroke();
                break;

            case HeroType.RUSSIAN_BLUE:
                // 俄罗斯蓝猫 - 蓝灰色星形 + 穿透箭
                iconGraphics.fillColor = applyGrayEffect(new Color(106, 90, 205));
                const points = 8;
                const outerR = 16 * scale;
                const innerR = 8 * scale;
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

                iconGraphics.strokeColor = applyGrayEffect(new Color(255, 255, 255));
                iconGraphics.lineWidth = 2 * scale;
                iconGraphics.moveTo(-12 * scale, 0);
                iconGraphics.lineTo(12 * scale, 0);
                iconGraphics.moveTo(8 * scale, -3 * scale);
                iconGraphics.lineTo(12 * scale, 0);
                iconGraphics.lineTo(8 * scale, 3 * scale);
                iconGraphics.stroke();
                break;

            case HeroType.AMERICAN_BOMBER:
                // 美国爆破兵 - 红白蓝方形 + 炸弹
                iconGraphics.fillColor = applyGrayEffect(new Color(220, 20, 60));
                iconGraphics.rect(-16 * scale, -16 * scale, 32 * scale, 10 * scale);
                iconGraphics.fill();
                iconGraphics.fillColor = applyGrayEffect(new Color(255, 255, 255));
                iconGraphics.rect(-16 * scale, -6 * scale, 32 * scale, 12 * scale);
                iconGraphics.fill();
                iconGraphics.fillColor = applyGrayEffect(new Color(0, 0, 139));
                iconGraphics.rect(-16 * scale, 6 * scale, 32 * scale, 10 * scale);
                iconGraphics.fill();

                iconGraphics.fillColor = applyGrayEffect(new Color(0, 0, 0));
                iconGraphics.circle(8 * scale, -8 * scale, 4 * scale);
                iconGraphics.fill();
                break;

            case HeroType.SIAMESE_MAGE:
                // 暹罗法师 - 蓝色方形 + 魔法帽
                iconGraphics.fillColor = applyGrayEffect(new Color(100, 100, 255));
                iconGraphics.rect(-15 * scale, -15 * scale, 30 * scale, 30 * scale);
                iconGraphics.fill();

                iconGraphics.fillColor = applyGrayEffect(new Color(128, 0, 128));
                iconGraphics.moveTo(0, 15 * scale);
                iconGraphics.lineTo(-8 * scale, -5 * scale);
                iconGraphics.lineTo(8 * scale, -5 * scale);
                iconGraphics.close();
                iconGraphics.fill();
                break;

            case HeroType.NORWEGIAN_ICE:
                // 挪威冰猫 - 冰蓝色菱形 + 雪花
                iconGraphics.fillColor = applyGrayEffect(new Color(173, 216, 230));
                iconGraphics.moveTo(0, -16 * scale);
                iconGraphics.lineTo(12 * scale, 0);
                iconGraphics.lineTo(0, 16 * scale);
                iconGraphics.lineTo(-12 * scale, 0);
                iconGraphics.close();
                iconGraphics.fill();

                iconGraphics.strokeColor = applyGrayEffect(new Color(255, 255, 255));
                iconGraphics.lineWidth = 2 * scale;
                iconGraphics.moveTo(0, -8 * scale);
                iconGraphics.lineTo(0, 8 * scale);
                iconGraphics.moveTo(-8 * scale, 0);
                iconGraphics.lineTo(8 * scale, 0);
                iconGraphics.stroke();
                break;

            case HeroType.BRITISH_KNIGHT:
                // 英国骑士 - 蓝色方形 + 盾牌
                iconGraphics.fillColor = applyGrayEffect(new Color(100, 149, 237));
                iconGraphics.rect(-16 * scale, -16 * scale, 32 * scale, 32 * scale);
                iconGraphics.fill();

                iconGraphics.fillColor = applyGrayEffect(new Color(192, 192, 192));
                iconGraphics.moveTo(0, -12 * scale);
                iconGraphics.lineTo(-8 * scale, 0);
                iconGraphics.lineTo(0, 12 * scale);
                iconGraphics.lineTo(8 * scale, 0);
                iconGraphics.close();
                iconGraphics.fill();
                break;

            case HeroType.SCOTTISH_MARKSMAN:
                // 苏格兰射手 - 橙色圆形 + 弓箭
                iconGraphics.fillColor = applyGrayEffect(new Color(255, 140, 0));
                iconGraphics.circle(0, 0, 14 * scale);
                iconGraphics.fill();

                iconGraphics.strokeColor = applyGrayEffect(new Color(128, 128, 128));
                iconGraphics.lineWidth = 3 * scale;
                iconGraphics.moveTo(10 * scale, -6 * scale);
                iconGraphics.lineTo(16 * scale, -6 * scale);
                iconGraphics.moveTo(13 * scale, -9 * scale);
                iconGraphics.lineTo(13 * scale, -3 * scale);
                iconGraphics.stroke();
                break;

            case HeroType.ABYSSINIAN_ARCHER:
                // 阿比西尼亚弓箭手 - 棕色六边形 + 箭矢
                iconGraphics.fillColor = applyGrayEffect(new Color(160, 82, 45));
                const sides = 6;
                const radius = 14 * scale;
                iconGraphics.moveTo(radius, 0);
                for (let i = 1; i <= sides; i++) {
                    const angle = (i * 2 * Math.PI) / sides;
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);
                    iconGraphics.lineTo(x, y);
                }
                iconGraphics.fill();

                iconGraphics.fillColor = applyGrayEffect(new Color(255, 255, 0));
                iconGraphics.circle(6 * scale, -6 * scale, 4 * scale);
                iconGraphics.fill();
                break;

            default:
                // 默认几何图形
                iconGraphics.fillColor = applyGrayEffect(new Color(128, 128, 128));
                iconGraphics.circle(0, 0, 18 * scale);
                iconGraphics.fill();
                console.warn(`英雄类型 ${heroType} 没有对应的图标`);
                break;
        }
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

        // 检查英雄是否已解锁
        if (!this.IsHeroUnlocked(heroType)) {
            console.log(`❌ 英雄 ${heroType} 尚未解锁`);
            this.showLockedHeroEffect(buttonNode);
            return;
        }

        // 检查金币是否足够
        const heroCost = HeroFactory.GetHeroCost(heroType);
        if (this._gameManager && this._gameManager.GetGameStats().gold < heroCost) {
            console.log(`❌ 金币不足，需要 ${heroCost} 金币，当前: ${this._gameManager.GetGameStats().gold}`);
            this.showInsufficientFundsEffect(buttonNode);
            return;
        }


        // 记录触摸开始，但不立即开始拖拽 - 允许ScrollView正常处理
        this._selectedHeroType = heroType;
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
        this.UpdateHeroButtonStates();

        // 创建拖拽预览
        this.createDragPreview(heroType);

        // 启动网格预览模式
        if (this._gridSystem) {
            this._gridSystem.StartDragMode();
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

        const previewSize = 60; // 50 * 1.2 = 60
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


            case HeroType.SCOTTISH_MARKSMAN:
                graphics.fillColor = new Color(255, 140, 0, alpha);
                graphics.circle(0, 0, halfSize * 0.8);
                graphics.fill();
                break;

            case HeroType.ABYSSINIAN_ARCHER:
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
            this._gridSystem.UpdateHoverPosition(worldPos);
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
        const gridPos = this._gridSystem.WorldToGridPosition(parentLocalPos);

        if (gridPos) {
            console.log(`📍 网格位置: (${gridPos.row}, ${gridPos.col})`);
            const canDeploy = this._gridSystem.CanDeployAt(gridPos);
            console.log(`🎯 可部署: ${canDeploy}`);

            if (canDeploy) {
                // 直接使用自己的部署方法
                const success = this.DeployHeroToGrid(this._selectedHeroType, gridPos.row, gridPos.col);
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

        // 销毁拖拽预览
        if (this._dragPreviewNode) {
            this._dragPreviewNode.destroy();
            this._dragPreviewNode = null;
        }

        // 结束网格预览模式
        if (this._gridSystem) {
            this._gridSystem.EndDragMode();
        }

        // 重新启用ScrollView滚动
        if (this._heroScrollView) {
            this._heroScrollView.enabled = true;
        }

        // 更新按钮状态
        this.UpdateHeroButtonStates();
    }

    // ========== 辅助工具方法 ==========

    /**
     * 显示金币不足效果
     */
    private showInsufficientFundsEffect(buttonNode: Node): void {
        const originalScale = buttonNode.scale;
        buttonNode.setScale(originalScale.x * 0.9, originalScale.y * 0.9);

        // 使用Cocos Creator的调度系统而不是setTimeout
        this.scheduleOnce(() => {
            if (buttonNode && buttonNode.isValid) {
                buttonNode.setScale(originalScale);
            }
        }, 0.2);
    }

    /**
     * 显示英雄锁定效果
     */
    private showLockedHeroEffect(buttonNode: Node): void {
        const originalScale = buttonNode.scale;

        // 摇摆效果表示锁定
        buttonNode.setScale(originalScale.x * 1.1, originalScale.y * 1.1);

        this.scheduleOnce(() => {
            if (buttonNode && buttonNode.isValid) {
                buttonNode.setScale(originalScale.x * 0.95, originalScale.y * 0.95);
            }
        }, 0.1);

        this.scheduleOnce(() => {
            if (buttonNode && buttonNode.isValid) {
                buttonNode.setScale(originalScale);
            }
        }, 0.2);
    }

}
