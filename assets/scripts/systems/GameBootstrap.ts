import { _decorator, Component, find, Node, Sprite, UITransform, Widget, resources, SpriteFrame, Color, Graphics } from 'cc';
import { GameHUD } from '../components/ui/GameHUD';
import { HeroSelectionPanel } from '../components/ui/HeroSelectionPanel';
import { GridDeploymentSystem } from './GridDeploymentSystem';
// 导入管理器类以实现类型安全的组件添加
import { BattleManager } from '../managers/BattleManager';
import { WaveManager } from '../managers/WaveManager';
import { GameManager } from '../managers/GameManager';
import { LevelManager } from '../managers/LevelManager';
import { Castle } from '../components/game/Castle';

const { ccclass, property } = _decorator;

// 初始化阶段枚举
enum InitPhase {
    STARTING = "starting",
    LOADING_RESOURCES = "loading_resources",
    CREATING_SYSTEMS = "creating_systems",
    CREATING_MANAGERS = "creating_managers",
    CREATING_UI = "creating_ui",
    COMPLETED = "completed",
    FAILED = "failed"
}

@ccclass('GameBootstrap')
export class GameBootstrap extends Component {

    @property({ tooltip: "是否启用调试日志" })
    public enableDebugLogs: boolean = true;

    @property({ tooltip: "初始化超时时间(秒)" })
    public initTimeout: number = 10;

    // 当前初始化阶段
    private _currentPhase: InitPhase = InitPhase.STARTING;

    // Canvas节点引用
    private _canvasNode: Node | null = null;

    // 系统组件引用
    private _gridSystem: GridDeploymentSystem | null = null;

    // UI组件引用

    // 获取Canvas节点
    public get canvasNode(): Node | null {
        return this._canvasNode;
    }


    // 获取网格系统
    public get gridSystem(): GridDeploymentSystem | null {
        return this._gridSystem;
    }

    protected onLoad(): void {
        this.log("GameBootstrap开始初始化...");

        // 获取Canvas节点
        this._canvasNode = find("Canvas");
        if (!this._canvasNode) {
            this.error("未找到Canvas节点");
            this._currentPhase = InitPhase.FAILED;
            return;
        }

        // 开始初始化流程
        this.startInitialization();
    }

    // 开始初始化流程
    private startInitialization(): void {
        try {
            // 执行初始化步骤
            this.runInitializationSteps();

            this._currentPhase = InitPhase.COMPLETED;
            this.log("游戏初始化完成！");

        } catch (error) {
            this._currentPhase = InitPhase.FAILED;
            this.error("游戏初始化失败:", error);
        }
    }

    // 执行初始化步骤
    private runInitializationSteps(): void {

        // 第一阶段：创建基础系统
        this._currentPhase = InitPhase.CREATING_SYSTEMS;
        this.log("创建基础系统...");
        this.createBasicSystems();

        // 第二阶段：加载资源
        this._currentPhase = InitPhase.LOADING_RESOURCES;
        this.log("加载游戏资源...");
        this.loadGameResources();

        // 第三阶段：创建管理器
        this._currentPhase = InitPhase.CREATING_MANAGERS;
        this.log("创建游戏管理器...");
        this.createGameManagers();

        // 第四阶段：创建UI
        this._currentPhase = InitPhase.CREATING_UI;
        this.log("创建游戏界面...");
        this.createGameUI();

        this.log("所有初始化步骤完成");
    }

    // 创建基础系统
    private createBasicSystems(): void {
        if (!this._canvasNode) return;

        // 首先创建游戏背景
        this.createGameBackground();

        // 创建GridDeploymentSystem
        const gridNode = new Node("GridDeploymentSystem");
        gridNode.parent = this._canvasNode;
        this._gridSystem = gridNode.addComponent(GridDeploymentSystem);

        // 网格系统已通过默认属性值使用游戏配置

        this.log("基础系统创建完成");
    }

    // 创建游戏背景
    private createGameBackground(): void {
        if (!this._canvasNode) return;

        // 创建背景节点
        const backgroundNode = new Node("GameBackground");
        backgroundNode.parent = this._canvasNode;

        // 添加UITransform组件并设置为全屏尺寸
        const transform = backgroundNode.addComponent(UITransform);

        // 添加Sprite组件
        const sprite = backgroundNode.addComponent(Sprite);

        // 添加Widget组件实现全屏填充
        const widget = backgroundNode.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignBottom = true;
        widget.isAlignLeft = true;
        widget.isAlignRight = true;
        widget.top = 0;
        widget.bottom = 0;
        widget.left = 0;
        widget.right = 0;
        widget.updateAlignment();

        // 打印Canvas和背景节点尺寸信息用于调试
        const canvasTransform = this._canvasNode.getComponent(UITransform);
        if (canvasTransform) {
            this.log(`Canvas尺寸: ${canvasTransform.contentSize.width} x ${canvasTransform.contentSize.height}`);
        }
        this.log(`背景节点尺寸: ${transform.contentSize.width} x ${transform.contentSize.height}`);

        // 加载背景图片（Cocos Creator 3.x需要指定子资源类型）
        resources.load("images/backgroup/spriteFrame", SpriteFrame, (err, spriteFrame) => {
            if (err) {
                this.error("背景图片加载失败:", err);
                console.warn("使用纯色背景作为回退方案");
                // 回退到纯色背景
                this.createFallbackBackground(sprite);
                return;
            }

            if (sprite && sprite.isValid && spriteFrame) {
                sprite.spriteFrame = spriteFrame;
                sprite.type = Sprite.Type.SIMPLE;
                sprite.sizeMode = Sprite.SizeMode.CUSTOM;

                // 设置背景调暗效果 (RGB值调低，Alpha保持255)
                sprite.color = new Color(120, 120, 120, 255);

                // 强制更新Widget对齐，确保节点尺寸正确
                widget.updateAlignment();

                // 打印图片和Sprite尺寸信息用于调试
                this.log(`原图尺寸: ${spriteFrame.originalSize.width} x ${spriteFrame.originalSize.height}`);
                this.log(`Widget对齐后节点尺寸: ${transform.contentSize.width} x ${transform.contentSize.height}`);
                this.log("背景图片加载成功并已调暗");
            }
        });

        this.log("游戏背景创建完成");
    }

    /**
     * 创建回退背景（当图片资源加载失败时使用纯色背景）
     */
    private createFallbackBackground(sprite: Sprite): void {
        if (!sprite || !sprite.isValid) return;

        // 移除Sprite组件，改用Graphics绘制纯色背景
        const node = sprite.node;
        sprite.destroy();

        // 检查是否已有Graphics组件，避免重复添加
        let graphics = node.getComponent(Graphics);
        if (!graphics) {
            graphics = node.addComponent(Graphics);
        }
        const transform = node.getComponent(UITransform);

        if (graphics && transform) {
            graphics.clear();

            // 使用深绿色作为游戏背景（模拟草地）
            graphics.fillColor = new Color(34, 82, 34, 255); // 深绿色
            graphics.rect(-transform.contentSize.width / 2, -transform.contentSize.height / 2,
                         transform.contentSize.width, transform.contentSize.height);
            graphics.fill();

            // 添加网格线条来增加视觉效果
            graphics.strokeColor = new Color(48, 96, 48, 255); // 稍浅的绿色
            graphics.lineWidth = 1;

            const gridSize = 100;
            const width = transform.contentSize.width;
            const height = transform.contentSize.height;

            // 画垂直网格线
            for (let x = 0; x <= width; x += gridSize) {
                graphics.moveTo(x - width / 2, -height / 2);
                graphics.lineTo(x - width / 2, height / 2);
            }

            // 画水平网格线
            for (let y = 0; y <= height; y += gridSize) {
                graphics.moveTo(-width / 2, y - height / 2);
                graphics.lineTo(width / 2, y - height / 2);
            }

            graphics.stroke();

            this.log("已创建回退背景：深绿色网格背景");
        }
    }

    // 加载游戏资源
    private loadGameResources(): void {
        // 资源预加载暂时不需要，使用动态创建组件的方式

        this.log("游戏资源加载完成");
    }

    // 创建游戏管理器
    private createGameManagers(): void {
        if (!this._canvasNode) return;

        // 创建LevelManager（必须在其他管理器之前创建，因为它们有依赖关系）
        const levelManagerNode = new Node("LevelManager");
        levelManagerNode.parent = this._canvasNode;
        levelManagerNode.addComponent(LevelManager);
        this.log("LevelManager创建完成");

        // 创建BattleManager（使用类型安全的组件添加）
        const battleManagerNode = new Node("BattleManager");
        battleManagerNode.parent = this._canvasNode;
        battleManagerNode.addComponent(BattleManager);
        this.log("BattleManager创建完成");

        // 创建WaveManager
        const waveManagerNode = new Node("WaveManager");
        waveManagerNode.parent = this._canvasNode;
        waveManagerNode.addComponent(WaveManager);
        this.log("WaveManager创建完成");

        // 创建GameManager（最后创建，因为它需要引用其他管理器）
        const gameManagerNode = new Node("GameManager");
        gameManagerNode.parent = this._canvasNode;
        gameManagerNode.addComponent(GameManager);
        this.log("GameManager创建完成");

        this.log("游戏管理器创建完成");
    }

    // 创建游戏UI
    private createGameUI(): void {
        if (!this._canvasNode) return;

        // 创建GameHUD（只负责顶部信息显示）
        const hudNode = new Node("GameHUD");
        hudNode.parent = this._canvasNode;
        hudNode.addComponent(GameHUD);

        // 创建HeroSelectionPanel（独立的英雄选择面板，处于游戏界面的底部）
        const heroSelectionNode = new Node("HeroSelectionPanel");
        heroSelectionNode.parent = this._canvasNode;
        // 添加自定义组件
        heroSelectionNode.addComponent(HeroSelectionPanel);


        // 创建Castle（使用类型安全的组件添加）
        const castleNode = new Node("Castle");
        castleNode.parent = this._canvasNode;
        castleNode.addComponent(Castle);
        this.log("Castle创建完成");

        this.log("游戏界面创建完成");
    }

    // 获取当前初始化状态
    public getInitializationState(): {
        phase: InitPhase;
        isCompleted: boolean;
        isFailed: boolean;
    } {
        return {
            phase: this._currentPhase,
            isCompleted: this._currentPhase === InitPhase.COMPLETED,
            isFailed: this._currentPhase === InitPhase.FAILED
        };
    }

    // 日志输出方法
    private log(message: string, ...args: any[]): void {
        if (this.enableDebugLogs) {
            console.log(`[GameBootstrap] ${message}`, ...args);
        }
    }

    private error(message: string, ...args: any[]): void {
        console.error(`[GameBootstrap] ${message}`, ...args);
    }

    // 静态方法，方便其他组件访问
    private static _instance: GameBootstrap | null = null;

    public static get instance(): GameBootstrap | null {
        return GameBootstrap._instance;
    }

    protected start(): void {
        GameBootstrap._instance = this;
    }

    protected onDestroy(): void {
        if (GameBootstrap._instance === this) {
            GameBootstrap._instance = null;
        }
    }
}
