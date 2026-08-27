import { _decorator, Component, Node, find } from 'cc';
import { AD_POS_ID } from './AdConfig';

const { ccclass } = _decorator;

// vivo小游戏全局对象（浏览器调试环境不存在）
declare const qg: any;

/**
 * 统一广告管理器
 * 封装vivo小游戏广告API：开屏广告、原生盒子广告（退出时）、激励视频广告。
 * 所有广告调用均带qg存在性判断，浏览器调试环境静默降级，不阻塞游戏。
 */
@ccclass('AdManager')
export class AdManager extends Component {

    private static _instance: AdManager | null = null;

    /**
     * 单例实例（懒加载：首次访问时自动创建节点并挂载组件，
     * 确保开屏广告能在游戏启动的第一时间展示）
     */
    public static get instance(): AdManager | null {
        if (!AdManager._instance) {
            const node = new Node('AdManager');
            const canvas = find('Canvas');
            if (canvas) {
                node.parent = canvas;
            }
            AdManager._instance = node.addComponent(AdManager);
        }
        return AdManager._instance;
    }

    protected onLoad(): void {
        // 防止重复实例（懒加载创建的实例与GameBootstrap创建的实例冲突时保留先创建的）
        if (AdManager._instance && AdManager._instance !== this) {
            console.warn("[AdManager] 实例已存在，销毁重复实例");
            this.node.destroy();
            return;
        }

        AdManager._instance = this;
        console.log("[AdManager] 广告管理器初始化完成");
    }

    protected onDestroy(): void {
        if (AdManager._instance === this) {
            AdManager._instance = null;
        }
    }

    /**
     * 展示开屏广告
     * 浏览器环境降级：提示并跳过，不阻塞游戏
     */
    public showSplashAd(): void {
        if (typeof qg === 'undefined' || !qg.createSplashAd) {
            console.log("[AdManager] 浏览器环境不支持开屏广告，跳过");
            return;
        }

        try {
            let splashAd: any = null;

            // 官方示例无参调用，但部分SDK版本支持/要求传入posId，按版本适配
            try {
                splashAd = qg.createSplashAd({ posId: AD_POS_ID.splash });
            } catch (error) {
                splashAd = qg.createSplashAd();
            }

            if (!splashAd) {
                console.error("[AdManager] 创建开屏广告失败");
                return;
            }

            splashAd.onError((err: any) => {
                console.error("[AdManager] 开屏广告错误:", err);
            });

            splashAd.onShow(() => {
                console.log("[AdManager] 开屏广告展示成功");
            });
        } catch (error) {
            console.error("[AdManager] 展示开屏广告异常:", error);
        }
    }

    /**
     * 展示原生盒子广告（退出app时）
     * 实例不能复用、会被回收，每次展示前重新create。
     * 用户关闭盒子广告或展示失败后调用callback继续退出流程。
     * 浏览器环境降级：提示并直接执行callback。
     * @param callback 用户关闭或展示失败时执行（退出游戏）
     */
    public showExitBoxAd(callback: () => void): void {
        if (typeof qg === 'undefined' || !qg.createCustomAd) {
            console.log("[AdManager] 浏览器环境不支持原生盒子广告，直接执行退出回调");
            callback();
            return;
        }

        let customAd: any = null;

        // 防止重复执行退出流程（onClose/onError/展示失败可能同时触发）
        let exited = false;
        const safeExit = (): void => {
            if (exited) return;
            exited = true;

            callback();

            // 广告实例会被回收，退出流程结束后主动销毁
            if (customAd && typeof customAd.destroy === 'function') {
                try {
                    customAd.destroy();
                } catch (error) {
                    console.error("[AdManager] 销毁盒子广告异常:", error);
                }
            }
        };

        try {
            // 每次展示前重新create，实例不能复用
            customAd = qg.createCustomAd({ posId: AD_POS_ID.original });
        } catch (error) {
            console.error("[AdManager] 创建盒子广告异常:", error);
            safeExit();
            return;
        }

        if (!customAd) {
            console.error("[AdManager] 创建盒子广告失败");
            safeExit();
            return;
        }

        // 广告加载成功后展示
        customAd.onLoad(() => {
            console.log("[AdManager] 盒子广告加载成功，开始展示");
            try {
                const showResult = customAd.show();
                if (showResult && typeof showResult.catch === 'function') {
                    showResult.catch((err: any) => {
                        console.error("[AdManager] 盒子广告展示失败:", err);
                        safeExit();
                    });
                }
            } catch (error) {
                console.error("[AdManager] 盒子广告展示异常:", error);
                safeExit();
            }
        });

        // 用户关闭盒子广告 → 继续退出流程
        customAd.onClose(() => {
            console.log("[AdManager] 盒子广告已关闭，继续退出流程");
            safeExit();
        });

        // 广告加载失败 → 直接执行callback退出
        customAd.onError((err: any) => {
            console.error("[AdManager] 盒子广告错误:", err);
            safeExit();
        });
    }

    /**
     * 展示激励视频广告
     * @param onComplete 用户完整看完视频时的奖励回调(res.isEnded === true)
     * @param onCancel 用户取消/没看完时的回调(res.isEnded !== true或广告失败)
     */
    public showRewardedAd(onComplete: () => void, onCancel: () => void): void {
        // 浏览器环境降级：提示并调用onCancel，不阻塞游戏流程
        if (typeof qg === 'undefined') {
            console.log("[AdManager] 浏览器环境不支持激励视频广告，直接走取消回调");
            onCancel();
            return;
        }

        // 防止重复回调（onClose/onError可能同时触发）
        let settled = false;
        const settle = (isComplete: boolean): void => {
            if (settled) return;
            settled = true;
            if (isComplete) {
                onComplete();
            } else {
                onCancel();
            }
        };

        let rewardedAd: any = null;
        try {
            rewardedAd = qg.createRewardedVideoAd({ posId: AD_POS_ID.reward });
        } catch (error) {
            console.error("[AdManager] 创建激励视频广告异常:", error);
            settle(false);
            return;
        }

        if (!rewardedAd) {
            console.error("[AdManager] 创建激励视频广告失败");
            settle(false);
            return;
        }

        // onLoad后调show()，show失败时调用onCancel
        rewardedAd.onLoad(() => {
            console.log("[AdManager] 激励视频广告加载成功");
            try {
                const showResult = rewardedAd.show();
                if (showResult && typeof showResult.catch === 'function') {
                    showResult.catch((err: any) => {
                        console.error("[AdManager] 激励视频展示失败:", err);
                        settle(false);
                    });
                }
            } catch (error) {
                console.error("[AdManager] 激励视频展示异常:", error);
                settle(false);
            }
        });

        // onClose回调：res.isEnded === true 调onComplete，否则调onCancel
        rewardedAd.onClose((res: any) => {
            console.log("[AdManager] 激励视频关闭, isEnded:", res && res.isEnded);
            settle(!!(res && res.isEnded === true));
        });

        // onError回调：调用onCancel
        rewardedAd.onError((err: any) => {
            console.error("[AdManager] 激励视频广告错误:", err);
            settle(false);
        });
    }
}
