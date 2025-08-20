import { _decorator, Component, find, Node } from 'cc';
import { GameHUD } from '../components/ui/GameHUD';
import { HeroSelectionPanel } from '../components/ui/HeroSelectionPanel';
import { ResourceManager } from '../managers/ResourceManager';
import { GridDeploymentSystem } from './GridDeploymentSystem';

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
    private _resourceManager: ResourceManager | null = null;
    private _gridSystem: GridDeploymentSystem | null = null;

    // UI组件引用
    private _gameHUD: GameHUD | null = null;
    private _heroSelectionPanel: HeroSelectionPanel | null = null;

    // 获取Canvas节点
    public get canvasNode(): Node | null {
        return this._canvasNode;
    }

    // 获取资源管理器
    public get resourceManager(): ResourceManager | null {
        return this._resourceManager;
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

        // 创建ResourceManager
        const resourceNode = new Node("ResourceManager");
        resourceNode.parent = this._canvasNode;
        this._resourceManager = resourceNode.addComponent(ResourceManager);

        // 创建GridDeploymentSystem
        const gridNode = new Node("GridDeploymentSystem");
        gridNode.parent = this._canvasNode;
        this._gridSystem = gridNode.addComponent(GridDeploymentSystem);

        // 网格系统已通过默认属性值使用游戏配置

        this.log("基础系统创建完成");
    }

    // 加载游戏资源
    private loadGameResources(): void {
        if (!this._resourceManager) return;

        // 定义需要预加载的资源
        const resourcesToLoad = [
            // 暂时注释预制体加载，后续添加
            // { path: "prefabs/heroes/OrangeCat", type: ResourceType.PREFAB },
            // { path: "prefabs/enemies/BasicMouse", type: ResourceType.PREFAB },
        ];

        // 同步加载资源，暂时不需要异步操作
        // if (resourcesToLoad.length > 0) {
        //     this._resourceManager.preloadResources(resourcesToLoad);
        // }

        this.log("游戏资源加载完成");
    }

    // 创建游戏管理器
    private createGameManagers(): void {
        if (!this._canvasNode) return;

        // 创建BattleManager
        const battleManagerNode = new Node("BattleManager");
        battleManagerNode.parent = this._canvasNode;
        battleManagerNode.addComponent('BattleManager');

        // 创建WaveManager
        const waveManagerNode = new Node("WaveManager");
        waveManagerNode.parent = this._canvasNode;
        waveManagerNode.addComponent('WaveManager');

        // 创建GameManager
        const gameManagerNode = new Node("GameManager");
        gameManagerNode.parent = this._canvasNode;
        gameManagerNode.addComponent('GameManager');

        this.log("游戏管理器创建完成");
    }

    // 创建游戏UI
    private createGameUI(): void {
        if (!this._canvasNode) return;

        // 创建GameHUD（只负责顶部信息显示）
        const hudNode = new Node("GameHUD");
        hudNode.parent = this._canvasNode;
        this._gameHUD = hudNode.addComponent(GameHUD);

        // 创建HeroSelectionPanel（独立的英雄选择面板，处于游戏界面的底部）
        const heroSelectionNode = new Node("HeroSelectionPanel");
        heroSelectionNode.parent = this._canvasNode;
        // 添加自定义组件
        this._heroSelectionPanel = heroSelectionNode.addComponent(HeroSelectionPanel);


        // 创建Castle
        const castleNode = new Node("Castle");
        castleNode.parent = this._canvasNode;
        castleNode.addComponent('Castle');

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
