import { _decorator, Component, Node } from 'cc';
import { GameBootstrap } from './systems/GameBootstrap';
import { AdManager } from './ad/AdManager';

const { ccclass, property } = _decorator;

/**
 * 游戏主场景控制器
 * 负责启动游戏初始化流程
 */
@ccclass('GameScene')
export class GameScene extends Component {
    
    @property({ tooltip: "游戏启动器", type: GameBootstrap })
    public gameBootstrap: GameBootstrap | null = null;
    
    protected onLoad(): void {
        console.log("=== 猫咪城堡防御游戏启动 ===");

        // 开屏广告：在创建GameBootstrap之前尽早展示（AdManager尚未创建时安全跳过）
        AdManager.instance?.showSplashAd();

        // 如果没有指定GameBootstrap，自动创建
        if (!this.gameBootstrap) {
            this.createGameBootstrap();
        }
    }

    protected start(): void {
        // 检查GameBootstrap状态
        if (this.gameBootstrap) {
            const initState = this.gameBootstrap.getInitializationState();

            if (initState.isFailed) {
                console.error("[GameScene] 游戏初始化失败，请检查控制台错误信息");
            } else if (initState.isCompleted) {
                this.onGameReady();
            }
        }
    }
    
    // 创建GameBootstrap
    private createGameBootstrap(): void {
        const bootstrapNode = new Node("GameBootstrap");
        bootstrapNode.parent = this.node;

        this.gameBootstrap = bootstrapNode.addComponent(GameBootstrap);
    }
    
    // 游戏系统准备完成
    private onGameReady(): void {
        console.log("🎮 游戏已准备就绪！");

        // 显示游戏版本和信息
        this.showGameInfo();
    }
    
    // 显示游戏信息
    private showGameInfo(): void {
        console.log(`
╔════════════════════════════════════════╗
║           猫咪城堡防御游戏               ║
║        Cat Protect Plan Mingame        ║
╠════════════════════════════════════════╣
║ 🏰 保护城堡                            ║
║ 🐱 部署猫咪英雄                        ║
║ ⚔️  击退老鼠入侵                       ║
║ 💰 收集金币购买更多英雄                ║
╠════════════════════════════════════════╣
║ 开发版本: TypeScript + Cocos Creator  ║
║ 架构模式: 参考老项目重构               ║
╚════════════════════════════════════════╝
        `);
    }
    
    // 获取游戏状态信息
    public getGameStatus(): {
        isInitialized: boolean;
        hasBootstrap: boolean;
        initPhase: string;
        canPlay: boolean;
    } {
        const hasBootstrap = !!this.gameBootstrap;
        const initState = hasBootstrap ? this.gameBootstrap.getInitializationState() : null;
        
        return {
            isInitialized: !!initState?.isCompleted,
            hasBootstrap: hasBootstrap,
            initPhase: initState?.phase || "none",
            canPlay: !!initState?.isCompleted && !initState?.isFailed
        };
    }
    
    
}