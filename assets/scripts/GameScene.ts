import { _decorator, Component, Node } from 'cc';
import { GameBootstrap } from './systems/GameBootstrap';

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
        
        // 如果没有指定GameBootstrap，自动创建
        if (!this.gameBootstrap) {
            this.createGameBootstrap();
        }
        
        this.log("游戏场景初始化完成");
    }
    
    protected start(): void {
        this.log("游戏场景启动");
        
        // 检查GameBootstrap状态
        if (this.gameBootstrap) {
            const initState = this.gameBootstrap.getInitializationState();
            this.log(`初始化状态: ${initState.phase}, 完成: ${initState.isCompleted}, 失败: ${initState.isFailed}`);
            
            if (initState.isFailed) {
                this.log("游戏初始化失败，请检查控制台错误信息");
            } else if (initState.isCompleted) {
                this.log("游戏系统初始化成功，准备开始游戏");
                this.onGameReady();
            }
        }
    }
    
    // 创建GameBootstrap
    private createGameBootstrap(): void {
        const bootstrapNode = new Node("GameBootstrap");
        bootstrapNode.parent = this.node;
        
        this.gameBootstrap = bootstrapNode.addComponent(GameBootstrap);
        this.log("自动创建GameBootstrap组件");
    }
    
    // 游戏系统准备完成
    private onGameReady(): void {
        this.log("🎮 游戏已准备就绪！");
        this.log("📱 游戏控制说明：");
        this.log("   - 点击底部英雄按钮选择英雄");
        this.log("   - 点击网格位置部署英雄");
        this.log("   - 点击'开始战斗'按钮开始波次");
        this.log("   - 保护城堡免受老鼠攻击");
        
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
    
    // 重新启动游戏
    public restartGame(): void {
        this.log("重新启动游戏...");
        
        if (this.gameBootstrap) {
            // 销毁现有的GameBootstrap
            this.gameBootstrap.node.destroy();
            this.gameBootstrap = null;
        }
        
        // 创建新的GameBootstrap
        this.createGameBootstrap();
        
        this.log("游戏重新启动完成");
    }
    
    // 日志输出
    private log(message: string): void {
        console.log(`[GameScene] ${message}`);
    }
}