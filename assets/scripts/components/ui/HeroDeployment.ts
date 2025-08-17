import { _decorator, Component, Node, Graphics, Color, Vec3, EventTouch, UITransform, Canvas } from 'cc';
import { HeroType, GameState } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { GameManager } from '../../managers/GameManager';
import { GridDeploymentSystem } from '../../systems/GridDeploymentSystem';
import { OrangeCat } from '../heroes/OrangeCat';
import { SiameseCat } from '../heroes/SiameseCat';
import { MaineCat } from '../heroes/MaineCat';

const { ccclass, property } = _decorator;

@ccclass('HeroDeployment')
export class HeroDeployment extends Component {
    
    @property({ tooltip: "英雄选择面板高度" })
    public panelHeight: number = 120;
    
    @property({ tooltip: "拖拽预览透明度" })
    public dragPreviewOpacity: number = 180;
    
    // UI组件引用
    private _deploymentPanel: Node | null = null;
    private _heroButtons: Map<HeroType, Node> = new Map();
    private _selectedHeroType: HeroType | null = null;
    
    // 拖拽相关属性
    private _isDragging: boolean = false;
    private _currentDragHero: HeroType | null = null;
    private _dragPreviewNode: Node | null = null;
    private _lastTouchPosition: Vec3 | null = null;
    
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
        
        this.log("HeroDeployment初始化完成");
        
        // 添加调试信息
        if (this._deploymentPanel) {
            this.log(`部署面板已创建，位置: ${this._deploymentPanel.position}, 激活状态: ${this._deploymentPanel.active}`);
        }
    }
    
    protected update(dt: number): void {
        // 根据游戏状态更新面板显示
        if (this._gameManager && this._deploymentPanel) {
            const gameState = this._gameManager.gameState;
            const shouldBeActive = (gameState === GameState.DEPLOYMENT || gameState === GameState.MENU);
            
            // 只在状态改变时更新并输出日志
            if (this._deploymentPanel.active !== shouldBeActive) {
                this._deploymentPanel.active = shouldBeActive;
                this.log(`面板显示状态更新: ${shouldBeActive ? '显示' : '隐藏'}, 游戏状态: ${gameState}`);
            }
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
        
        this.log(`部署面板创建完成，包含 ${this._heroButtons.size} 个英雄按钮`);
    }
    
    // 创建英雄选择按钮
    private createHeroButtons(): void {
        const heroTypes = [HeroType.ORANGE_CAT, HeroType.SIAMESE_CAT, HeroType.MAINE_CAT];
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
            this.log(`创建英雄按钮: ${heroType}, 位置: (${startX + index * (buttonWidth + buttonSpacing)}, ${this.panelHeight / 2})`);
        });
        
        this.log(`所有英雄按钮创建完成，总计: ${this._heroButtons.size} 个`);
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
        
        // 添加拖拽事件监听
        this.setupButtonDragEvents(buttonNode, heroType);
        
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
                
            case HeroType.SIAMESE_CAT:
                // 绘制暹罗猫法师图标
                iconGraphics.fillColor = new Color(0, 0, 255);
                iconGraphics.rect(-15, -15, 30, 30);
                iconGraphics.fill();
                
                iconGraphics.strokeColor = new Color(0, 0, 200);
                iconGraphics.lineWidth = 2;
                iconGraphics.rect(-15, -15, 30, 30);
                iconGraphics.stroke();
                
                // 法师帽子
                iconGraphics.fillColor = new Color(128, 0, 128);
                iconGraphics.moveTo(0, 15);
                iconGraphics.lineTo(-10, -5);
                iconGraphics.lineTo(10, -5);
                iconGraphics.close();
                iconGraphics.fill();
                break;
                
            case HeroType.MAINE_CAT:
                // 绘制缅因猫战士图标
                iconGraphics.fillColor = new Color(139, 0, 0);
                iconGraphics.rect(-18, -18, 36, 36);
                iconGraphics.fill();
                
                // 金色盔甲边框
                iconGraphics.strokeColor = new Color(255, 215, 0);
                iconGraphics.lineWidth = 3;
                iconGraphics.rect(-18, -18, 36, 36);
                iconGraphics.stroke();
                
                // 剑标识
                iconGraphics.strokeColor = new Color(192, 192, 192);
                iconGraphics.lineWidth = 3;
                iconGraphics.moveTo(18, -5);
                iconGraphics.lineTo(25, -5);
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
    
    // 检查是否能够购买英雄
    private canAffordHero(heroType: HeroType): boolean {
        if (!this._gameManager) return false;
        
        const heroConfig = HERO_CONFIGS[heroType];
        const cost = heroConfig.attackDamage; // 暂时用攻击力作为成本
        
        return this._gameManager.currentGold >= cost;
    }
    
    // 部署英雄
    private deployHero(heroType: HeroType, gridPos: any): boolean {
        if (!this._gameManager || !this._gridSystem) return false;
        
        const heroConfig = HERO_CONFIGS[heroType];
        const cost = heroConfig.attackDamage; // 暂时用攻击力作为成本
        
        // 扣除金币
        if (!this._gameManager.spendGold(cost)) {
            this.log("金币不足，无法部署英雄");
            return false;
        }
        
        // 创建英雄节点
        const heroNode = new Node(`Hero_${heroType}_${Date.now()}`);
        
        // 添加英雄组件
        switch (heroType) {
            case HeroType.ORANGE_CAT:
                heroNode.addComponent(OrangeCat);
                break;
            case HeroType.SIAMESE_CAT:
                heroNode.addComponent(SiameseCat);
                break;
            case HeroType.MAINE_CAT:
                heroNode.addComponent(MaineCat);
                break;
            default:
                this.log(`未知的英雄类型: ${heroType}`);
                return false;
        }
        
        // 将英雄添加到场景
        heroNode.parent = this.node.parent;
        
        // 部署到网格
        const success = this._gridSystem.deployHero(heroNode, gridPos);
        if (success) {
            // 注册到GameManager
            this._gameManager.addDeployedHero(heroNode);
            
            this.log(`英雄 ${heroType} 部署成功于位置 (${gridPos.row}, ${gridPos.col})`);
            
        } else {
            // 部署失败，退还金币
            this._gameManager.addGold(cost);
            heroNode.destroy();
            this.log("英雄部署失败");
        }
        
        return success;
    }
    
    // 重置部署面板
    public resetDeployment(): void {
        this.cleanupDragState();
        this.log("部署面板已重置");
    }
    
    // 获取当前选中的英雄类型（保持兼容性）
    public getSelectedHeroType(): HeroType | null {
        return this._currentDragHero;
    }
    
    // 设置按钮拖拽事件
    private setupButtonDragEvents(buttonNode: Node, heroType: HeroType): void {
        buttonNode.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            this.onHeroButtonTouchStart(heroType, buttonNode, event);
        }, this);
        
        buttonNode.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => {
            this.onHeroButtonTouchMove(event);
        }, this);
        
        buttonNode.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            this.onHeroButtonTouchEnd(event);
        }, this);
        
        buttonNode.on(Node.EventType.TOUCH_CANCEL, (event: EventTouch) => {
            this.onHeroButtonTouchCancel(event);
        }, this);
    }
    
    // 英雄按钮触摸开始
    private onHeroButtonTouchStart(heroType: HeroType, buttonNode: Node, event: EventTouch): void {
        this.log(`开始触摸英雄按钮: ${heroType}`);
        
        // 检查是否有足够的金币
        if (!this.canAffordHero(heroType)) {
            this.log(`金币不足，无法拖拽英雄: ${heroType}`);
            this.showInsufficientFundsEffect(buttonNode);
            return;
        }
        
        // 开始拖拽
        this.startHeroDrag(heroType, buttonNode, event);
        
        // 阻止事件传播
        event.propagationStopped = true;
    }
    
    // 英雄按钮触摸移动
    private onHeroButtonTouchMove(event: EventTouch): void {
        if (!this._isDragging || !this._dragPreviewNode) {
            return;
        }
        
        // 保存最后的触摸位置
        this._lastTouchPosition = new Vec3(event.getUILocation().x, event.getUILocation().y, 0);
        
        // 更新拖拽预览位置
        this.updateDragPreview(event);
    }
    
    // 英雄按钮触摸结束
    private onHeroButtonTouchEnd(event: EventTouch): void {
        this.log("英雄按钮触摸结束");
        
        if (!this._isDragging) {
            this.log("非拖拽状态，忽略触摸结束事件");
            return;
        }
        
        // 完成拖拽部署
        this.finishHeroDrag(event);
    }
    
    // 英雄按钮触摸取消
    private onHeroButtonTouchCancel(event: EventTouch): void {
        this.log("英雄按钮触摸取消");
        
        if (!this._isDragging) {
            return;
        }
        
        // 尝试在最后位置完成拖拽，如果没有则取消
        if (this._lastTouchPosition) {
            const mockEvent = {
                getUILocation: () => this._lastTouchPosition!
            } as EventTouch;
            this.finishHeroDrag(mockEvent);
        } else {
            this.cancelHeroDrag();
        }
    }
    
    // 开始英雄拖拽
    private startHeroDrag(heroType: HeroType, buttonNode: Node, event: EventTouch): void {
        this.log(`开始拖拽英雄: ${heroType}`);
        
        this._isDragging = true;
        this._currentDragHero = heroType;
        this._lastTouchPosition = new Vec3(event.getUILocation().x, event.getUILocation().y, 0);
        
        // 创建拖拽预览
        this.createDragPreview(heroType, buttonNode);
        
        // 更新预览位置
        this.updateDragPreview(event);
    }
    
    // 创建拖拽预览节点
    private createDragPreview(heroType: HeroType, originalButton: Node): void {
        if (this._dragPreviewNode) {
            this._dragPreviewNode.destroy();
        }
        
        const heroConfig = HERO_CONFIGS[heroType];
        const previewSize = 60; // 预览大小
        
        // 创建预览节点
        this._dragPreviewNode = new Node(`DragPreview_${heroType}`);
        
        // 添加到Canvas确保在最顶层
        const canvas = this.node.scene?.getChildByName("Canvas");
        if (canvas) {
            this._dragPreviewNode.parent = canvas;
            this._dragPreviewNode.setSiblingIndex(-1); // 设置为最后一个子节点（最顶层）
        } else {
            this._dragPreviewNode.parent = this.node;
        }
        
        // 设置预览节点属性
        const previewTransform = this._dragPreviewNode.addComponent(UITransform);
        previewTransform.setContentSize(previewSize, previewSize);
        
        // 添加图形组件
        const previewGraphics = this._dragPreviewNode.addComponent(Graphics);
        this.drawDragPreviewHero(previewGraphics, heroType, previewSize);
        
        this.log(`创建拖拽预览: ${heroType}, 大小: ${previewSize}`);
    }
    
    // 绘制拖拽预览英雄
    private drawDragPreviewHero(graphics: Graphics, heroType: HeroType, size: number): void {
        graphics.clear();
        
        const halfSize = size / 2;
        const alpha = this.dragPreviewOpacity;
        
        switch (heroType) {
            case HeroType.ORANGE_CAT:
                // 橘猫射手 - 圆形
                graphics.fillColor = new Color(255, 165, 0, alpha);
                graphics.circle(0, 0, halfSize * 0.8);
                graphics.fill();
                
                graphics.strokeColor = new Color(255, 140, 0, alpha);
                graphics.lineWidth = 2;
                graphics.circle(0, 0, halfSize * 0.8);
                graphics.stroke();
                
                // 弓箭标识
                graphics.strokeColor = new Color(139, 69, 19, alpha);
                graphics.lineWidth = 2;
                graphics.moveTo(-halfSize * 0.3, 0);
                graphics.lineTo(halfSize * 0.3, 0);
                graphics.stroke();
                break;
                
            case HeroType.SIAMESE_CAT:
                // 暹罗猫法师 - 方形
                graphics.fillColor = new Color(0, 0, 255, alpha);
                graphics.rect(-halfSize * 0.8, -halfSize * 0.8, size * 0.8, size * 0.8);
                graphics.fill();
                
                graphics.strokeColor = new Color(0, 0, 200, alpha);
                graphics.lineWidth = 2;
                graphics.rect(-halfSize * 0.8, -halfSize * 0.8, size * 0.8, size * 0.8);
                graphics.stroke();
                
                // 法师帽
                graphics.fillColor = new Color(128, 0, 128, alpha);
                graphics.moveTo(0, halfSize * 0.8);
                graphics.lineTo(-halfSize * 0.4, -halfSize * 0.2);
                graphics.lineTo(halfSize * 0.4, -halfSize * 0.2);
                graphics.close();
                graphics.fill();
                break;
                
            case HeroType.MAINE_CAT:
                // 缅因猫战士 - 大方形
                graphics.fillColor = new Color(139, 0, 0, alpha);
                graphics.rect(-halfSize * 0.9, -halfSize * 0.9, size * 0.9, size * 0.9);
                graphics.fill();
                
                // 金色盔甲边框
                graphics.strokeColor = new Color(255, 215, 0, alpha);
                graphics.lineWidth = 3;
                graphics.rect(-halfSize * 0.9, -halfSize * 0.9, size * 0.9, size * 0.9);
                graphics.stroke();
                
                // 剑标识
                graphics.strokeColor = new Color(192, 192, 192, alpha);
                graphics.lineWidth = 3;
                graphics.moveTo(halfSize * 0.6, -halfSize * 0.2);
                graphics.lineTo(halfSize * 0.9, -halfSize * 0.2);
                graphics.stroke();
                break;
        }
    }
    
    // 更新拖拽预览位置
    private updateDragPreview(event: EventTouch): void {
        if (!this._dragPreviewNode || !this._dragPreviewNode.isValid) {
            return;
        }
        
        // 获取触摸位置
        const touchLocation = event.getUILocation();
        const parentNode = this._dragPreviewNode.parent;
        
        if (parentNode) {
            // 将屏幕坐标转换为父节点坐标系
            const worldPos = parentNode.getComponent(UITransform)?.convertToNodeSpaceAR(new Vec3(touchLocation.x, touchLocation.y, 0));
            if (worldPos) {
                this._dragPreviewNode.setPosition(worldPos);
            }
        }
    }
    
    // 完成拖拽部署
    private finishHeroDrag(event: EventTouch): void {
        this.log("完成拖拽部署");
        
        if (!this._isDragging || !this._currentDragHero) {
            this.log("拖拽状态无效，取消部署");
            this.cleanupDragState();
            return;
        }
        
        // 获取触摸位置并转换为世界坐标
        const touchPos = event.getUILocation();
        
        // 获取Canvas节点进行坐标转换
        const canvas = this.node.scene?.getChildByName("Canvas");
        let worldPos: Vec3;
        
        if (canvas) {
            const canvasTransform = canvas.getComponent(UITransform);
            if (canvasTransform) {
                // 将屏幕坐标转换为Canvas坐标系
                worldPos = canvasTransform.convertToNodeSpaceAR(new Vec3(touchPos.x, touchPos.y, 0));
                this.log(`Canvas坐标转换成功: (${worldPos.x}, ${worldPos.y})`);
            } else {
                worldPos = new Vec3(touchPos.x, touchPos.y, 0);
                this.log("Canvas没有UITransform组件，使用原始坐标");
            }
        } else {
            worldPos = new Vec3(touchPos.x, touchPos.y, 0);
            this.log("找不到Canvas节点，使用原始坐标");
        }
        
        this.log(`触摸位置: (${touchPos.x}, ${touchPos.y}), 世界坐标: (${worldPos.x}, ${worldPos.y})`);
        
        if (this._gridSystem) {
            // 输出网格系统信息用于调试
            this.log(`网格配置: ${this._gridSystem.gridColumns}x${this._gridSystem.gridRows}, 单元格大小: ${this._gridSystem.cellSize}`);
            
            const gridPos = this._gridSystem.worldToGridPosition(worldPos);
            this.log(`网格坐标: ${gridPos ? `(${gridPos.row}, ${gridPos.col})` : 'null'}`);
            
            if (gridPos && this._gridSystem.canDeployAt(gridPos)) {
                // 部署英雄
                if (this.deployHero(this._currentDragHero, gridPos)) {
                    this.log(`英雄 ${this._currentDragHero} 部署成功于位置 (${gridPos.row}, ${gridPos.col})`);
                } else {
                    this.log("英雄部署失败");
                }
            } else {
                if (gridPos) {
                    this.log(`位置 (${gridPos.row}, ${gridPos.col}) 无法部署或已被占用`);
                } else {
                    this.log("触摸位置不在网格范围内");
                    // 添加网格边界信息用于调试
                    this.debugGridBounds();
                }
            }
        }
        
        // 清理拖拽状态
        this.cleanupDragState();
    }
    
    // 取消拖拽
    private cancelHeroDrag(): void {
        this.log("取消拖拽");
        this.cleanupDragState();
    }
    
    // 清理拖拽状态
    private cleanupDragState(): void {
        // 销毁预览节点
        if (this._dragPreviewNode && this._dragPreviewNode.isValid) {
            this._dragPreviewNode.destroy();
        }
        this._dragPreviewNode = null;
        
        // 重置拖拽状态
        this._isDragging = false;
        this._currentDragHero = null;
        this._lastTouchPosition = null;
        
        this.log("拖拽状态已清理");
    }
    
    // 显示金币不足效果
    private showInsufficientFundsEffect(buttonNode: Node): void {
        // 简单的缩放动画表示金币不足
        const originalScale = buttonNode.scale;
        buttonNode.setScale(originalScale.x * 0.9, originalScale.y * 0.9);
        
        setTimeout(() => {
            if (buttonNode && buttonNode.isValid) {
                buttonNode.setScale(originalScale);
            }
        }, 200);
        
        this.log("金币不足效果已显示");
    }
    
    // 调试网格边界信息
    private debugGridBounds(): void {
        if (this._gridSystem) {
            // 通过访问私有属性来获取网格信息（仅用于调试）
            const gridSystem = this._gridSystem as any;
            const startPos = gridSystem._gridStartPos;
            const endX = startPos.x + this._gridSystem.gridColumns * this._gridSystem.cellSize;
            const endY = startPos.y - this._gridSystem.gridRows * this._gridSystem.cellSize;
            
            this.log(`网格边界: 左上角(${startPos.x}, ${startPos.y}), 右下角(${endX}, ${endY})`);
            this.log(`网格尺寸: 宽度${this._gridSystem.gridColumns * this._gridSystem.cellSize}, 高度${this._gridSystem.gridRows * this._gridSystem.cellSize}`);
        }
    }
    
    // 重写销毁方法，清理拖拽状态
    protected onDestroy(): void {
        this.cleanupDragState();
        
        if (HeroDeployment._instance === this) {
            HeroDeployment._instance = null;
        }
    }
    
    // 日志输出
    private log(message: string): void {
        console.log(`[HeroDeployment] ${message}`);
    }
}