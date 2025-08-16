import { _decorator, Component, Node, Graphics, Color, Vec3, EventTouch, UITransform } from 'cc';
import { HeroType, GameState } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { GameManager } from '../../managers/GameManager';
import { GridDeploymentSystem } from '../../systems/GridDeploymentSystem';
import { OrangeCat } from '../heroes/OrangeCat';

const { ccclass, property } = _decorator;

@ccclass('HeroDeployment')
export class HeroDeployment extends Component {
    
    @property({ tooltip: "英雄选择面板高度" })
    public panelHeight: number = 120;
    
    // UI组件引用
    private _deploymentPanel: Node | null = null;
    private _heroButtons: Map<HeroType, Node> = new Map();
    private _selectedHeroType: HeroType | null = null;
    
    // 管理器引用
    private _gameManager: GameManager | null = null;
    private _gridSystem: GridDeploymentSystem | null = null;
    
    // 静态实例
    private static _instance: HeroDeployment | null = null;
    
    public static get instance(): HeroDeployment | null {
        return HeroDeployment._instance;
    }
    
    protected onLoad(): void {
        HeroDeployment._instance = this;
        this.log("HeroDeployment初始化开始");
    }
    
    protected start(): void {
        // 获取管理器引用
        this._gameManager = GameManager.instance;
        this._gridSystem = GridDeploymentSystem.instance;
        
        if (!this._gameManager) {
            this.log("未找到GameManager实例");
            return;
        }
        
        if (!this._gridSystem) {
            this.log("未找到GridDeploymentSystem实例");
            return;
        }
        
        // 创建部署面板
        this.createDeploymentPanel();
        
        // 设置网格点击事件
        this.setupGridClickEvents();
        
        this.log("HeroDeployment初始化完成");
    }
    
    protected update(dt: number): void {
        // 根据游戏状态更新面板显示
        if (this._gameManager && this._deploymentPanel) {
            const gameState = this._gameManager.gameState;
            this._deploymentPanel.active = (gameState === GameState.DEPLOYMENT);
        }
    }
    
    protected onDestroy(): void {
        if (HeroDeployment._instance === this) {
            HeroDeployment._instance = null;
        }
    }
    
    // 创建部署面板
    private createDeploymentPanel(): void {
        // 获取Canvas尺寸
        const canvas = this.node.parent;
        if (!canvas) return;
        
        const canvasTransform = canvas.getComponent(UITransform);
        if (!canvasTransform) return;
        
        const canvasSize = canvasTransform.contentSize;
        
        // 创建主面板
        this._deploymentPanel = new Node("DeploymentPanel");
        this._deploymentPanel.parent = this.node;
        
        const panelTransform = this._deploymentPanel.addComponent(UITransform);
        panelTransform.setContentSize(canvasSize.width, this.panelHeight);
        panelTransform.setAnchorPoint(0.5, 0);
        this._deploymentPanel.setPosition(0, -canvasSize.height / 2);
        
        // 绘制面板背景
        const panelGraphics = this._deploymentPanel.addComponent(Graphics);
        panelGraphics.fillColor = new Color(30, 30, 30, 200);
        panelGraphics.strokeColor = new Color(255, 255, 255, 100);
        panelGraphics.lineWidth = 2;
        panelGraphics.rect(
            -canvasSize.width / 2, 
            0, 
            canvasSize.width, 
            this.panelHeight
        );
        panelGraphics.fill();
        panelGraphics.stroke();
        
        // 创建英雄选择按钮
        this.createHeroButtons();
        
        this.log("部署面板创建完成");
    }
    
    // 创建英雄选择按钮
    private createHeroButtons(): void {
        const heroTypes = [HeroType.ORANGE_CAT]; // 目前只有橘猫
        const buttonWidth = 80;
        const buttonHeight = 80;
        const buttonSpacing = 20;
        const startX = -(heroTypes.length * (buttonWidth + buttonSpacing) - buttonSpacing) / 2;
        
        heroTypes.forEach((heroType, index) => {
            const buttonNode = this.createHeroButton(
                heroType,
                startX + index * (buttonWidth + buttonSpacing),
                this.panelHeight / 2,
                buttonWidth,
                buttonHeight
            );
            
            buttonNode.parent = this._deploymentPanel;
            this._heroButtons.set(heroType, buttonNode);
        });
    }
    
    // 创建英雄按钮
    private createHeroButton(heroType: HeroType, x: number, y: number, width: number, height: number): Node {
        const buttonNode = new Node(`HeroButton_${heroType}`);
        buttonNode.setPosition(x, y);
        
        const buttonTransform = buttonNode.addComponent(UITransform);
        buttonTransform.setContentSize(width, height);
        
        // 获取英雄配置
        const heroConfig = HERO_CONFIGS[heroType];
        
        // 绘制按钮背景
        const buttonGraphics = buttonNode.addComponent(Graphics);
        this.drawHeroButton(buttonGraphics, heroType, false, width, height);
        
        // 添加英雄图标
        this.drawHeroIcon(buttonNode, heroType, width, height);
        
        // 添加价格文本
        this.addHeroPriceText(buttonNode, heroConfig.attackDamage, width, height); // 暂时用攻击力作为价格
        
        // 添加点击事件
        buttonNode.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            this.onHeroButtonClick(heroType);
        }, this);
        
        return buttonNode;
    }
    
    // 绘制英雄按钮
    private drawHeroButton(graphics: Graphics, heroType: HeroType, isSelected: boolean, width: number, height: number): void {
        graphics.clear();
        
        // 背景颜色
        if (isSelected) {
            graphics.fillColor = new Color(100, 150, 255, 200);
        } else {
            graphics.fillColor = new Color(70, 70, 70, 200);
        }
        
        graphics.rect(-width / 2, -height / 2, width, height);
        graphics.fill();
        
        // 边框
        graphics.strokeColor = isSelected ? new Color(255, 255, 0) : new Color(200, 200, 200);
        graphics.lineWidth = isSelected ? 3 : 2;
        graphics.rect(-width / 2, -height / 2, width, height);
        graphics.stroke();
    }
    
    // 绘制英雄图标
    private drawHeroIcon(parent: Node, heroType: HeroType, width: number, height: number): void {
        const iconNode = new Node("HeroIcon");
        iconNode.parent = parent;
        iconNode.setPosition(0, 5);
        
        const iconGraphics = iconNode.addComponent(Graphics);
        
        switch (heroType) {
            case HeroType.ORANGE_CAT:
                // 绘制橘猫图标
                iconGraphics.fillColor = new Color(255, 165, 0);
                iconGraphics.circle(0, 0, 20);
                iconGraphics.fill();
                
                iconGraphics.strokeColor = new Color(255, 140, 0);
                iconGraphics.lineWidth = 2;
                iconGraphics.circle(0, 0, 20);
                iconGraphics.stroke();
                
                // 弓箭标识
                iconGraphics.strokeColor = new Color(139, 69, 19);
                iconGraphics.lineWidth = 2;
                iconGraphics.moveTo(-8, 0);
                iconGraphics.lineTo(8, 0);
                iconGraphics.stroke();
                break;
            default:
                // 默认图标
                iconGraphics.fillColor = new Color(128, 128, 128);
                iconGraphics.circle(0, 0, 15);
                iconGraphics.fill();
                break;
        }
    }
    
    // 添加价格文本
    private addHeroPriceText(parent: Node, price: number, width: number, height: number): void {
        const textNode = new Node("PriceText");
        textNode.parent = parent;
        textNode.setPosition(0, -height / 2 + 10);
        
        const textGraphics = textNode.addComponent(Graphics);
        textGraphics.fillColor = new Color(255, 215, 0);
        textGraphics.font = "Arial";
        
        // 简单的价格显示（使用Graphics绘制文字替代）
        const priceText = `$${price}`;
        
        // 绘制价格背景
        textGraphics.fillColor = new Color(0, 0, 0, 150);
        textGraphics.rect(-15, -8, 30, 16);
        textGraphics.fill();
        
        // 注意：这里应该使用Label组件，但为了简化示例使用Graphics
        // 实际项目中建议使用Label组件
    }
    
    // 英雄按钮点击事件
    private onHeroButtonClick(heroType: HeroType): void {
        // 检查是否有足够的金币
        if (!this.canAffordHero(heroType)) {
            this.log(`金币不足，无法购买英雄: ${heroType}`);
            return;
        }
        
        // 设置选中状态
        this.setSelectedHero(heroType);
        
        this.log(`选择英雄: ${heroType}`);
    }
    
    // 设置选中的英雄
    private setSelectedHero(heroType: HeroType): void {
        const previousSelected = this._selectedHeroType;
        this._selectedHeroType = heroType;
        
        // 更新按钮显示
        if (previousSelected) {
            this.updateHeroButtonAppearance(previousSelected, false);
        }
        this.updateHeroButtonAppearance(heroType, true);
    }
    
    // 更新英雄按钮外观
    private updateHeroButtonAppearance(heroType: HeroType, isSelected: boolean): void {
        const buttonNode = this._heroButtons.get(heroType);
        if (!buttonNode) return;
        
        const graphics = buttonNode.getComponent(Graphics);
        if (!graphics) return;
        
        const transform = buttonNode.getComponent(UITransform);
        if (!transform) return;
        
        this.drawHeroButton(graphics, heroType, isSelected, transform.width, transform.height);
    }
    
    // 检查是否能够购买英雄
    private canAffordHero(heroType: HeroType): boolean {
        if (!this._gameManager) return false;
        
        const heroConfig = HERO_CONFIGS[heroType];
        const cost = heroConfig.attackDamage; // 暂时用攻击力作为成本
        
        return this._gameManager.canAfford(cost);
    }
    
    // 设置网格点击事件
    private setupGridClickEvents(): void {
        if (!this.node.parent) return;
        
        this.node.parent.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            this.onGridClick(event);
        }, this);
    }
    
    // 网格点击事件
    private onGridClick(event: EventTouch): void {
        if (!this._selectedHeroType || !this._gridSystem || !this._gameManager) return;
        
        // 只在部署阶段响应点击
        if (this._gameManager.gameState !== GameState.DEPLOYMENT) return;
        
        // 获取点击位置
        const touchPos = event.getUILocation();
        const worldPos = new Vec3(touchPos.x, touchPos.y, 0);
        
        // 转换为网格坐标
        const gridPos = this._gridSystem.worldToGridPosition(worldPos);
        if (!gridPos) return;
        
        // 检查是否可以部署
        if (!this._gridSystem.canDeployAt(gridPos)) {
            this.log(`位置 (${gridPos.row}, ${gridPos.col}) 无法部署英雄`);
            return;
        }
        
        // 部署英雄
        this.deployHero(this._selectedHeroType, gridPos);
    }
    
    // 部署英雄
    private deployHero(heroType: HeroType, gridPos: any): void {
        if (!this._gameManager || !this._gridSystem) return;
        
        const heroConfig = HERO_CONFIGS[heroType];
        const cost = heroConfig.attackDamage; // 暂时用攻击力作为成本
        
        // 扣除金币
        if (!this._gameManager.spendGold(cost)) {
            this.log("金币不足，无法部署英雄");
            return;
        }
        
        // 创建英雄节点
        const heroNode = new Node(`Hero_${heroType}_${Date.now()}`);
        
        // 添加英雄组件
        switch (heroType) {
            case HeroType.ORANGE_CAT:
                heroNode.addComponent(OrangeCat);
                break;
            default:
                this.log(`未知的英雄类型: ${heroType}`);
                return;
        }
        
        // 将英雄添加到场景
        heroNode.parent = this.node.parent;
        
        // 部署到网格
        if (this._gridSystem.deployHero(heroNode, gridPos)) {
            // 注册到GameManager
            this._gameManager.addDeployedHero(heroNode);
            
            this.log(`英雄 ${heroType} 部署成功于位置 (${gridPos.row}, ${gridPos.col})`);
            
            // 清除选中状态
            this.clearSelection();
        } else {
            // 部署失败，退还金币
            this._gameManager.addGold(cost);
            heroNode.destroy();
            this.log("英雄部署失败");
        }
    }
    
    // 清除选中状态
    private clearSelection(): void {
        if (this._selectedHeroType) {
            this.updateHeroButtonAppearance(this._selectedHeroType, false);
            this._selectedHeroType = null;
        }
    }
    
    // 重置部署面板
    public resetDeployment(): void {
        this.clearSelection();
        this.log("部署面板已重置");
    }
    
    // 获取当前选中的英雄类型
    public getSelectedHeroType(): HeroType | null {
        return this._selectedHeroType;
    }
    
    // 日志输出
    private log(message: string): void {
        console.log(`[HeroDeployment] ${message}`);
    }
}