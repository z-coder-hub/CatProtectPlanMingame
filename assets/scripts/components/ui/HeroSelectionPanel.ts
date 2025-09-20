import { _decorator, Color, Component, EventTouch, Graphics, Label, Mask, Node, resources, ScrollView, Sprite, SpriteFrame, UIOpacity, UITransform, Vec3, Widget } from 'cc';
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

    // ========== 增量更新核心方法 ==========

    /**
     * 统一的按钮状态获取方法
     */
    private getButtonState(heroType: HeroType): { isUnlocked: boolean; canAfford: boolean; isSelected: boolean } {
        const isUnlocked = this.IsHeroUnlocked(heroType);
        const isSelected = heroType === this._selectedHeroType;

        let canAfford = true;
        if (this._gameManager && isUnlocked) {
            const currentGold = this._gameManager.GetGameStats().gold;
            const heroCost = HeroFactory.GetHeroCost(heroType);
            canAfford = currentGold >= heroCost;
        }

        return { isUnlocked, canAfford, isSelected };
    }

    /**
     * 批量处理解锁状态变化的增量更新
     */
    private updateHeroUnlockStates(unlockedHeroes: HeroType[]): void {
        console.log("🔄 开始增量更新英雄解锁状态");

        const currentUnlockedSet = new Set(unlockedHeroes);
        const previousUnlockedSet = this._lastUnlockedHeroes;

        let updateCount = 0;

        // 遍历所有按钮，检查状态变化
        this._heroButtons.forEach(buttonNode => {
            if (!buttonNode || !buttonNode.isValid) return;

            const heroType = buttonNode.name.replace('HeroButton_', '') as HeroType;
            const wasUnlocked = previousUnlockedSet.has(heroType);
            const isNowUnlocked = currentUnlockedSet.has(heroType);

            // 只更新解锁状态发生变化的按钮
            if (wasUnlocked !== isNowUnlocked) {
                console.log(`📝 更新英雄 ${heroType}: ${wasUnlocked ? '已解锁' : '锁定'} -> ${isNowUnlocked ? '已解锁' : '锁定'}`);
                this.updateIndividualHeroButton(buttonNode, heroType);
                updateCount++;
            }
        });

        console.log(`✅ 增量更新完成，共更新 ${updateCount} 个按钮状态`);
    }

    /**
     * 单个按钮的完整状态更新
     */
    private updateIndividualHeroButton(buttonNode: Node, heroType: HeroType): void {
        const state = this.getButtonState(heroType);

        // 更新按钮背景
        const buttonGraphics = buttonNode.getComponent(Graphics);
        if (buttonGraphics) {
            const buttonTransform = buttonNode.getComponent(UITransform);
            const width = buttonTransform ? buttonTransform.contentSize.width : 96;
            const height = buttonTransform ? buttonTransform.contentSize.height : 120;
            this.drawHeroButtonBackground(buttonGraphics, width, height, state.isSelected, heroType);
        }

        // 刷新按钮内容（标签、图标等）
        this.refreshHeroButtonContent(buttonNode, heroType, state);
    }

    /**
     * 按钮内容刷新（标签、图标状态更新）
     */
    private refreshHeroButtonContent(buttonNode: Node, heroType: HeroType, state?: { isUnlocked: boolean; canAfford: boolean; isSelected: boolean }): void {
        if (!state) {
            state = this.getButtonState(heroType);
        }

        // 更新价格标签
        this.updatePriceLabel(buttonNode, heroType, state.isUnlocked);

        // 更新名称标签
        this.updateNameLabel(buttonNode, heroType, state.isUnlocked);

        // 更新图标状态
        this.updateHeroIcon(buttonNode, heroType, state.isUnlocked);
    }

    /**
     * 更新价格标签状态
     */
    private updatePriceLabel(buttonNode: Node, heroType: HeroType, isUnlocked: boolean): void {
        const priceNode = buttonNode.getChildByName("PriceLabel");
        const priceBgNode = buttonNode.getChildByName("PriceBackground");

        if (priceNode && priceBgNode) {
            const priceLabel = priceNode.getComponent(Label);
            const priceBg = priceBgNode.getComponent(Graphics);

            if (priceLabel && priceBg) {
                // 更新标签内容和样式
                const heroCost = HeroFactory.GetHeroCost(heroType);
                priceLabel.string = isUnlocked ? `${heroCost}` : '🔒';
                priceLabel.fontSize = isUnlocked ? 14.4 : 16;
                priceLabel.color = isUnlocked ? new Color(255, 215, 0) : new Color(100, 100, 100);

                // 更新背景色
                priceBg.clear();
                priceBg.fillColor = isUnlocked
                    ? new Color(0, 0, 0, 150)
                    : new Color(60, 60, 60, 120);
                priceBg.rect(-24, -9.6, 48, 19.2);
                priceBg.fill();
            }
        }
    }

    /**
     * 更新名称标签状态
     */
    private updateNameLabel(buttonNode: Node, heroType: HeroType, isUnlocked: boolean): void {
        const nameNode = buttonNode.getChildByName("NameLabel");
        const nameBgNode = buttonNode.getChildByName("NameBackground");

        if (nameNode && nameBgNode) {
            const nameLabel = nameNode.getComponent(Label);
            const nameBg = nameBgNode.getComponent(Graphics);

            if (nameLabel && nameBg) {
                // 更新标签颜色
                nameLabel.color = isUnlocked ? new Color(255, 255, 255) : new Color(120, 120, 120);

                // 更新背景色
                const heroName = this.getHeroDisplayName(heroType);
                // 使用更精确的宽度计算，确保背景完全覆盖文字
                const bgWidth = Math.max(80, heroName.length * 16 + 10);

                nameBg.clear();
                nameBg.fillColor = isUnlocked
                    ? new Color(0, 0, 0, 150)
                    : new Color(60, 60, 60, 120);
                nameBg.rect(-bgWidth / 2, -9.6, bgWidth, 19.2);
                nameBg.fill();
            }
        }
    }

    /**
     * 更新英雄图标状态
     */
    private updateHeroIcon(buttonNode: Node, heroType: HeroType, isUnlocked: boolean): void {
        const iconNode = buttonNode.getChildByName("HeroIcon");
        if (!iconNode) return;

        // 更新父节点的背景Graphics（如果存在）
        const bgGraphics = iconNode.getComponent(Graphics);
        if (bgGraphics) {
            // 重新绘制肉色背景
            bgGraphics.clear();
            bgGraphics.fillColor = new Color(255, 218, 185, 255); // 肉色背景

            // 根据图标容器尺寸计算背景大小
            const iconTransform = iconNode.getComponent(UITransform);
            let maxSize = 50; // 默认尺寸
            if (iconTransform) {
                const containerWidth = iconTransform.contentSize.width;
                const containerHeight = iconTransform.contentSize.height;
                const availableWidth = Math.max(containerWidth - 10, 20);
                const availableHeight = Math.max(containerHeight - 10, 20);
                maxSize = Math.min(availableWidth, availableHeight);
            }

            bgGraphics.rect(-maxSize / 2, -maxSize / 2, maxSize, maxSize);
            bgGraphics.fill();
        }

        // 更新Sprite颜色（如果存在子节点sprite）
        const spriteNode = iconNode.getChildByName("sprite");
        if (spriteNode) {
            const sprite = spriteNode.getComponent(Sprite);
            if (sprite) {
                sprite.color = isUnlocked ? new Color(255, 255, 255) : new Color(120, 120, 120);
            }
        }

        // 更新直接在iconNode上的Sprite（兼容旧结构）
        const directSprite = iconNode.getComponent(Sprite);
        if (directSprite) {
            directSprite.color = isUnlocked ? new Color(255, 255, 255) : new Color(120, 120, 120);
        }

        // 更新Graphics图标（如果存在子节点icon，这是回退图标情况）
        const iconSubNode = iconNode.getChildByName("icon");
        if (iconSubNode) {
            const iconGraphics = iconSubNode.getComponent(Graphics);
            if (iconGraphics) {
                // 重新绘制回退图标（不需要背景，父节点已有）
                iconGraphics.clear();
                const color = isUnlocked ? new Color(128, 128, 128) : new Color(80, 80, 80);
                iconGraphics.fillColor = color;
                iconGraphics.circle(0, 0, 20);
                iconGraphics.fill();
            }
        }
    }


    /**
     * 创建简单的回退图标（用于图片资源缺失时）
     */
    private createSimpleFallbackIcon(iconNode: Node, heroType: HeroType, isUnlocked: boolean): void {
        // 在父节点上添加Graphics组件绘制背景
        const bgGraphics = iconNode.addComponent(Graphics);

        // 绘制肉色背景
        bgGraphics.fillColor = new Color(255, 218, 185, 255); // 肉色背景
        bgGraphics.rect(-25, -25, 50, 50);
        bgGraphics.fill();

        // 创建前景子节点放置图标
        const iconSubNode = new Node("icon");
        iconNode.addChild(iconSubNode);
        const iconTransform = iconSubNode.addComponent(UITransform);
        const iconGraphics = iconSubNode.addComponent(Graphics);

        // 设置子节点尺寸和位置
        iconTransform.setContentSize(50, 50);
        iconSubNode.setPosition(0, 0);

        // 简单的灰色圆形作为基本回退图标
        const color = isUnlocked ? new Color(128, 128, 128) : new Color(80, 80, 80);
        iconGraphics.fillColor = color;
        iconGraphics.circle(0, 0, 20);
        iconGraphics.fill();

        console.log(`创建基本回退图标: ${heroType}, 解锁=${isUnlocked}`);
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
     * 更新英雄按钮状态（金币变化或状态更新时调用 - 优化版本）
     */
    public UpdateHeroButtonStates(): void {
        console.log("🎨 更新所有英雄按钮状态");

        this._heroButtons.forEach(buttonNode => {
            if (!buttonNode || !buttonNode.isValid) return;

            const heroType = buttonNode.name.replace('HeroButton_', '') as HeroType;
            const state = this.getButtonState(heroType);

            const buttonGraphics = buttonNode.getComponent(Graphics);
            if (buttonGraphics) {
                const buttonTransform = buttonNode.getComponent(UITransform);
                const width = buttonTransform ? buttonTransform.contentSize.width : 96;
                const height = buttonTransform ? buttonTransform.contentSize.height : 120;
                this.drawHeroButtonBackground(buttonGraphics, width, height, state.isSelected, heroType);
            }
        });
    }

    /**
     * 刷新英雄面板（优化版本 - 使用增量更新替代重建）
     */
    public RefreshHeroPanel(): void {
        console.log("🔄 智能刷新英雄选择面板");

        const currentUnlockedHeroes = this.getUnlockedHeroTypes();
        console.log(`当前已解锁英雄数量: ${currentUnlockedHeroes.length}`);

        // 只在按钮不存在时重建（初始化场景）
        if (this._heroButtons.length === 0) {
            console.log("🏗️ 初始化场景，创建所有按钮");
            this.recreateHeroButtons();
        } else {
            console.log("💡 使用增量更新优化性能");
            // 使用增量更新替代重建，大幅提升性能
            this.updateHeroUnlockStates(currentUnlockedHeroes);
        }

        // 更新缓存的解锁状态
        this._lastUnlockedHeroes = new Set(currentUnlockedHeroes);
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
        const buttonWidth = 120; // 适中宽度，配合简化后的英雄名称
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
        const buttonWidth = 120; // 适中宽度，配合简化后的英雄名称
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
        const buttonWidth = 120; // 适中宽度，配合简化后的英雄名称
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

        // 使用统一的状态检查方法
        const state = this.getButtonState(heroType);

        // 按钮背景
        const buttonBg = buttonNode.addComponent(Graphics);
        this.drawHeroButtonBackground(buttonBg, width, height, state.isSelected, heroType);

        // 英雄图标
        this.createHeroIcon(buttonNode, heroType, state.isUnlocked);

        // 名称标签
        this.createAdaptiveNameLabel(buttonNode, heroType, state.isUnlocked);

        // 价格标签
        this.createAdaptivePriceLabel(buttonNode, heroConfig.cost, state.isUnlocked);

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
        // 中文字符宽度计算，增加字符宽度和额外边距确保完全覆盖
        const bgWidth = Math.max(80, heroName.length * 16 + 10); // 16像素每字符 + 10像素额外边距
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
     * 绘制英雄按钮背景（优化版本 - 使用统一状态检查）
     */
    private drawHeroButtonBackground(graphics: Graphics, width: number, height: number, isSelected: boolean, heroType?: HeroType): void {
        graphics.clear();

        // 使用统一的状态检查方法
        let isUnlocked = true;
        let canAfford = true;

        if (heroType) {
            const state = this.getButtonState(heroType);
            isUnlocked = state.isUnlocked;
            canAfford = state.canAfford;
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


        // 使用Widget实现自适应布局，适配父节点大小
        const iconWidget = iconNode.addComponent(Widget);
        iconWidget.isAlignTop = true;
        iconWidget.isAlignBottom = true;
        iconWidget.isAlignLeft = true;
        iconWidget.isAlignRight = true;
        iconWidget.top = 3;
        iconWidget.bottom = 3;
        iconWidget.left = 3;
        iconWidget.right = 3;
        iconWidget.updateAlignment();


        // 获取英雄对应的图片路径
        const imagePath = this.getHeroImagePath(heroType);

        if (imagePath) {
            // 使用真实图片
            this.loadHeroImage(iconNode, imagePath, isUnlocked);
        } else {
            // 图片资源缺失，提供基本回退方案
            console.warn(`英雄 ${heroType} 缺少图标资源，使用基本回退图标`);
            this.createSimpleFallbackIcon(iconNode, heroType, isUnlocked);
        }
    }

    /**
     * 获取英雄对应的图片路径
     */
    private getHeroImagePath(heroType: HeroType): string | null {
        const imageMap: { [key in HeroType]?: string } = {
            // 射击英雄 - 物理射击子类
            [HeroType.ORANGE_CAT]: "images/icon/OrangeCat_icon",
            [HeroType.PERSIAN_SNIPER]: "images/icon/PersianSniper_icon",
            [HeroType.BENGAL_HUNTER]: "images/icon/BengalHunter_icon",
            [HeroType.SCOTTISH_MARKSMAN]: "images/icon/ScottishMarksman_icon",

            // 射击英雄 - 魔法射击子类
            [HeroType.SIAMESE_MAGE]: "images/icon/SiameseMage_icon",
            [HeroType.MAINE_THUNDER]: "images/icon/MaineThunder_icon",
            [HeroType.NORWEGIAN_ICE]: "images/icon/NorwegianIce_icon",
            [HeroType.ABYSSINIAN_ARCHER]: "images/icon/AbyssinianArcher_icon",

            // 近战英雄
            [HeroType.BRITISH_KNIGHT]: "images/icon/BritishKnight_icon",
            [HeroType.RUSSIAN_BLUE]: "images/icon/RussianBlue_icon",
            [HeroType.AMERICAN_BOMBER]: "images/icon/AmericanBomber_icon"
        };

        return imageMap[heroType] || null;
    }


    /**
     * 加载英雄图片
     */
    private loadHeroImage(iconNode: Node, imagePath: string, isUnlocked: boolean): void {
        // 在父节点上添加Graphics组件绘制背景
        const graphics = iconNode.addComponent(Graphics);

        // 创建前景子节点放置Sprite
        const spriteNode = new Node("sprite");
        iconNode.addChild(spriteNode);
        const spriteTransform = spriteNode.addComponent(UITransform);
        const sprite = spriteNode.addComponent(Sprite);

        // 提前设置Sprite属性和尺寸，避免异步加载导致的布局问题
        sprite.type = Sprite.Type.SIMPLE;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        // 预设Sprite尺寸 - 基于容器大小计算
        const iconTransform = iconNode.getComponent(UITransform);
        if (iconTransform) {
            // 获取容器的实际尺寸（由Widget计算得出）
            const containerWidth = iconTransform.contentSize.width;
            const containerHeight = iconTransform.contentSize.height;

            // 计算可用空间（留一点边距）
            const availableWidth = Math.max(containerWidth - 10, 20);
            const availableHeight = Math.max(containerHeight - 10, 20);
            const maxSize = Math.min(availableWidth, availableHeight);

            // 绘制肉色背景
            graphics.fillColor = new Color(255, 218, 185, 255); // 肉色背景
            graphics.rect(-maxSize / 2, -maxSize / 2, maxSize, maxSize);
            graphics.fill();

            // 设置Sprite子节点的尺寸和位置
            spriteTransform.setContentSize(maxSize, maxSize);
            spriteNode.setPosition(0, 0);
            console.log(`预设Sprite尺寸: ${maxSize}x${maxSize} (容器: ${containerWidth.toFixed(1)}x${containerHeight.toFixed(1)})`);

            // 确保图片在图标容器中居中显示
        }

        // 应用未解锁状态的视觉效果
        if (!isUnlocked) {
            sprite.color = new Color(120, 120, 120);
        }

        // 加载SpriteFrame资源（Cocos Creator 3.x需要指定子资源类型）
        resources.load(imagePath + "/spriteFrame", SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.error(`加载英雄图片失败: ${imagePath}`, err);
                console.warn("请确保在Cocos Creator编辑器中正确配置了resources目录");
                // 加载失败时使用基本回退图标
                if (sprite && sprite.isValid) {
                    sprite.destroy();
                }
                const heroType = this.getHeroTypeFromImagePath(imagePath);
                this.createSimpleFallbackIcon(iconNode, heroType, isUnlocked);
                return;
            }

            if (!iconNode || !iconNode.isValid || !sprite || !sprite.isValid) {
                return;
            }

            // 只设置SpriteFrame，其他属性已经预设好了
            sprite.spriteFrame = spriteFrame;

            console.log(`成功加载英雄图片: ${imagePath}`);
        });
    }


    /**
     * 从图片路径反推英雄类型（用于错误回退）
     */
    private getHeroTypeFromImagePath(imagePath: string): HeroType {
        // 射击英雄 - 物理射击子类
        if (imagePath.includes("OrangeCat")) return HeroType.ORANGE_CAT;
        if (imagePath.includes("PersianSniper")) return HeroType.PERSIAN_SNIPER;
        if (imagePath.includes("BengalHunter")) return HeroType.BENGAL_HUNTER;
        if (imagePath.includes("ScottishMarksman")) return HeroType.SCOTTISH_MARKSMAN;

        // 射击英雄 - 魔法射击子类
        if (imagePath.includes("SiameseMage")) return HeroType.SIAMESE_MAGE;
        if (imagePath.includes("MaineThunder")) return HeroType.MAINE_THUNDER;
        if (imagePath.includes("NorwegianIce")) return HeroType.NORWEGIAN_ICE;
        if (imagePath.includes("AbyssinianArcher")) return HeroType.ABYSSINIAN_ARCHER;

        // 近战英雄
        if (imagePath.includes("BritishKnight")) return HeroType.BRITISH_KNIGHT;
        if (imagePath.includes("RussianBlue")) return HeroType.RUSSIAN_BLUE;
        if (imagePath.includes("AmericanBomber")) return HeroType.AMERICAN_BOMBER;

        return HeroType.ORANGE_CAT; // 默认值
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
     * 创建拖拽预览 - 仅使用placed图片或白色圆点
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

        // 设置透明度组件
        const opacity = this._dragPreviewNode.addComponent(UIOpacity);
        opacity.opacity = 200; // 约78%透明度，提供更好的拖拽反馈

        // 尝试使用placed图片，否则使用白色圆点
        const placedPath = this.getHeroPlacedImagePath(heroType);
        if (placedPath) {
            this.createDragPreviewWithSprite(placedPath, previewSize);
        } else {
            this.createWhiteDotDragPreview(previewSize);
        }

        console.log(`创建拖拽预览: ${heroType}, 节点: ${this._dragPreviewNode.name}`);
    }

    /**
     * 获取英雄的placed图片路径
     */
    private getHeroPlacedImagePath(heroType: HeroType): string | null {
        const placedMap: Partial<Record<HeroType, string>> = {
            [HeroType.ORANGE_CAT]: "images/placed/OrangeCat_placed",
            [HeroType.PERSIAN_SNIPER]: "images/placed/PersianSniper_placed",
            [HeroType.BENGAL_HUNTER]: "images/placed/BengalHunter_placed",
            [HeroType.MAINE_THUNDER]: "images/placed/MaineThunder_placed",
            [HeroType.RUSSIAN_BLUE]: "images/placed/RussianBlue_placed",
            [HeroType.AMERICAN_BOMBER]: "images/placed/AmericanBomber_placed"
        };

        return placedMap[heroType] || null;
    }

    /**
     * 使用placed Sprite组件创建拖拽预览
     */
    private createDragPreviewWithSprite(imagePath: string, size: number): void {
        // 加载SpriteFrame资源
        resources.load(imagePath + "/spriteFrame", SpriteFrame, (err, spriteFrame) => {
            if (err || !this._dragPreviewNode) {
                console.warn(`加载拖拽预览placed图片失败: ${imagePath}`, err);
                // 回退到白色圆点
                this.createWhiteDotDragPreview(size);
                return;
            }

            // 添加Sprite组件并设置图片
            const sprite = this._dragPreviewNode.addComponent(Sprite);
            sprite.spriteFrame = spriteFrame;
            sprite.type = Sprite.Type.SIMPLE;
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;

            // 设置拖拽预览的尺寸
            const spriteTransform = sprite.node.getComponent(UITransform);
            if (spriteTransform) {
                spriteTransform.setContentSize(size, size);
            }

            console.log(`使用placed图片创建拖拽预览: ${imagePath}`);
        });
    }

    /**
     * 创建白色圆点拖拽预览
     */
    private createWhiteDotDragPreview(size: number): void {
        const graphics = this._dragPreviewNode.addComponent(Graphics);

        // 绘制纯白色圆点
        graphics.fillColor = new Color(255, 255, 255);
        graphics.circle(0, 0, size / 2);
        graphics.fill();

        // 添加简单的边框以提高可见性
        graphics.strokeColor = new Color(200, 200, 200);
        graphics.lineWidth = 2;
        graphics.circle(0, 0, size / 2);
        graphics.stroke();

        console.log(`使用白色圆点创建拖拽预览，尺寸: ${size}`);
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
