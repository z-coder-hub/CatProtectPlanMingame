import { _decorator, Color, Component, EventTouch, Graphics, Label, Node, Sprite, SpriteFrame, UITransform, Widget, resources } from 'cc';
import { GameManager } from '../../managers/GameManager';
import { GameState } from '../../types/GameTypes';
import { UIHelper } from '../../utils/UIHelper';

const { ccclass } = _decorator;

// 启动页布局常量
const DESIGN_WIDTH = 720;                 // 设计分辨率宽
const DESIGN_HEIGHT = 1280;               // 设计分辨率高
const AGE_BADGE_WIDTH = 110;              // 适龄标识宽（源图1317x1659竖版等比）
const AGE_BADGE_HEIGHT = 138;             // 适龄标识高（≥屏幕最小边720的1/10=72）
const BADGE_TOP = 24;                     // 适龄标识距顶
const BADGE_RIGHT = 24;                   // 适龄标识距右
const TITLE_WIDTH = 560;                  // 像素标题位图宽（源图640x160等比缩小）
const TITLE_HEIGHT = 140;                 // 像素标题位图高（等比 560/640*160）
const TITLE_Y = 150;                      // 标题中心y（中部偏上）
const SUBTITLE_WIDTH = 520;               // 副标题宽
const SUBTITLE_HEIGHT = 30;               // 副标题高
const SUBTITLE_Y = 40;                    // 副标题中心y（标题下方约25px）
const HINT_Y = -140;                      // "点击任意启动"提示y
const ADVICE_PANEL_WIDTH = 620;           // 健康忠告面板宽
const ADVICE_PANEL_HEIGHT = 150;          // 健康忠告面板高
const ADVICE_PANEL_BOTTOM = 170;          // 健康忠告面板距底
const COPYRIGHT_BOTTOM = 120;             // 版权信息距底
const DIALOG_WIDTH = 640;                 // 适龄提示弹窗宽
const DIALOG_HEIGHT = 780;                // 适龄提示弹窗高

// 颜色常量
const COLOR_BACKGROUND = new Color(18, 26, 42, 255);      // 启动页深蓝黑背景
const COLOR_GOLD = new Color(255, 200, 60, 255);          // 金色边框/标题
const COLOR_SUBTITLE = new Color(150, 160, 180, 255);     // 副标题灰色
const COLOR_HINT = new Color(255, 215, 0, 255);           // 提示金色
const COLOR_PANEL_FILL = new Color(16, 20, 34, 210);      // 健康忠告面板半透明深色
const COLOR_BODY_TEXT = new Color(255, 255, 255, 255);    // 正文白色
const COLOR_COPYRIGHT = new Color(165, 172, 188, 255);    // 版权信息浅灰
const COLOR_MASK = new Color(0, 0, 0, 200);               // 弹窗遮罩
const COLOR_DIALOG_FILL = new Color(30, 34, 50, 255);     // 弹窗面板深色底
const COLOR_DIALOG_BORDER = new Color(120, 160, 255, 255);// 弹窗面板亮色边框
const COLOR_SECTION_TITLE = new Color(255, 215, 0, 255);  // 区块标题金色
const COLOR_BUTTON_GREEN = new Color(80, 160, 80, 255);   // 按钮绿色

// 健康游戏忠告标准文案（逐字照抄，含标点，不得增删改）
const HEALTH_ADVICE_TEXT = "抵制不良游戏，拒绝盗版游戏。注意自我保护，谨防受骗上当。适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。";

// 适龄提示说明用语
const DIALOG_SECTIONS: { title: string; body: string }[] = [
    {
        title: "一、游戏概况",
        body: "本游戏为猫咪城堡题材的策略塔防类休闲小游戏，画风可爱、玩法轻松，无暴力血腥及恐怖内容，适合年满8周岁及以上的玩家。建议未成年玩家在家长监护和指导下使用本游戏，合理安排游戏时间。"
    },
    {
        title: "二、游戏内容",
        body: "游戏以守护城堡为主题：玩家通过部署不同类型的猫咪英雄，抵御鼠群入侵，保卫城堡。游戏包含英雄部署、波次防守、关卡挑战等核心玩法，无剧情社交、无文字聊天，单机可玩。"
    },
    {
        title: "三、未成年人保护",
        body: "按照国家相关规定，游戏用户需进行实名认证，未实名认证用户无法进入游戏。未成年人将受防沉迷系统时长限制（法定节假日每日不超过3小时，其他时间每日不超过1.5小时，22时至次日8时无法登录），充值亦受严格限制（8-16周岁单次不超过50元、月累计不超过200元；16-18周岁单次不超过100元、月累计不超过400元）。"
    }
];

/**
 * 启动页组件
 * vivo小游戏审核整改：适龄标识8+、健康游戏忠告、著作权人/软著登记号、点击任意处启动
 */
@ccclass('LaunchPage')
export class LaunchPage extends Component {

    // 节点引用
    private _ageBadgeNode: Node | null = null;   // 适龄标识节点
    private _dialogNode: Node | null = null;     // 适龄提示弹窗节点
    private _maskNode: Node | null = null;       // 弹窗遮罩节点

    // 状态
    private _isStarting: boolean = false;        // 防止重复启动

    protected onLoad(): void {
        this.setupRootNode();
        this.createAgeRatingBadge();
        this.createTitleSprite();
        this.createStartHint();
        this.createHealthAdvicePanel();
        this.createCopyrightLabel();

        // 根节点监听：点击任意处启动游戏
        this.node.on(Node.EventType.TOUCH_END, this.onRootTouchEnd, this);

        console.log("LaunchPage启动页初始化完成");
    }

    // ========== 根节点 ==========

    private setupRootNode(): void {
        const transform = this.node.addComponent(UITransform);
        transform.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);

        // 全屏Widget对齐，自动适配不同分辨率
        const widget = this.node.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignBottom = true;
        widget.isAlignLeft = true;
        widget.isAlignRight = true;
        widget.top = 0;
        widget.bottom = 0;
        widget.left = 0;
        widget.right = 0;
        widget.updateAlignment();

        // 绘制不透明深色背景
        const transformAfterAlign = this.node.getComponent(UITransform);
        if (transformAfterAlign) {
            const graphics = this.node.addComponent(Graphics);
            graphics.fillColor = COLOR_BACKGROUND;
            graphics.rect(-transformAfterAlign.contentSize.width / 2, -transformAfterAlign.contentSize.height / 2,
                transformAfterAlign.contentSize.width, transformAfterAlign.contentSize.height);
            graphics.fill();
        }
    }

    // ========== 1. 适龄标识（右上角） ==========

    private createAgeRatingBadge(): void {
        const badgeNode = new Node("AgeRatingBadge");
        badgeNode.parent = this.node;

        const transform = badgeNode.addComponent(UITransform);
        transform.setContentSize(AGE_BADGE_WIDTH, AGE_BADGE_HEIGHT);

        // 右上角对齐
        const widget = badgeNode.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignRight = true;
        widget.top = BADGE_TOP;
        widget.right = BADGE_RIGHT;
        widget.updateAlignment();

        // 提前设置Sprite属性，避免异步加载导致的布局问题
        const sprite = badgeNode.addComponent(Sprite);
        sprite.type = Sprite.Type.SIMPLE;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        resources.load("images/ui/age_rating_8plus/spriteFrame", SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.error("适龄标识加载失败:", err);
                return;
            }
            if (badgeNode.isValid && sprite.isValid && spriteFrame) {
                sprite.spriteFrame = spriteFrame;
            }
        });

        // 点击适龄标识打开适龄提示弹窗，阻止冒泡避免触发"点击任意启动"
        badgeNode.on(Node.EventType.TOUCH_END, this.onAgeBadgeTouchEnd, this);
        this._ageBadgeNode = badgeNode;
    }

    // ========== 2. 像素风标题位图 + 副标题 ==========

    private createTitleSprite(): void {
        const titleNode = new Node("TitleSprite");
        titleNode.parent = this.node;

        const transform = titleNode.addComponent(UITransform);
        transform.setContentSize(TITLE_WIDTH, TITLE_HEIGHT);

        // 水平居中 + 垂直居中偏移（中部偏上）
        const widget = titleNode.addComponent(Widget);
        widget.isAlignHorizontalCenter = true;
        widget.isAlignVerticalCenter = true;
        widget.verticalCenter = TITLE_Y;
        widget.updateAlignment();

        const sprite = titleNode.addComponent(Sprite);
        sprite.type = Sprite.Type.SIMPLE;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        resources.load("images/ui/game_title_pixel/spriteFrame", SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.error("游戏标题位图加载失败:", err);
                return;
            }
            if (titleNode.isValid && sprite.isValid && spriteFrame) {
                sprite.spriteFrame = spriteFrame;
            }
        });

        // 副标题（标题下方）
        const subNode = new Node("SubTitleLabel");
        subNode.parent = this.node;

        const subTransform = subNode.addComponent(UITransform);
        subTransform.setContentSize(SUBTITLE_WIDTH, SUBTITLE_HEIGHT);

        // 水平居中 + 垂直居中偏移（标题下方）
        const subWidget = subNode.addComponent(Widget);
        subWidget.isAlignHorizontalCenter = true;
        subWidget.isAlignVerticalCenter = true;
        subWidget.verticalCenter = SUBTITLE_Y;
        subWidget.updateAlignment();

        const subLabel = subNode.addComponent(Label);
        subLabel.string = "CAT PROTECT PLAN";
        subLabel.fontSize = 20;
        subLabel.color = COLOR_SUBTITLE;
    }

    // ========== 3. "点击任意启动"提示 ==========

    private createStartHint(): void {
        const hintNode = new Node("StartHint");
        hintNode.parent = this.node;

        const transform = hintNode.addComponent(UITransform);
        transform.setContentSize(400, 50);

        // 水平居中 + 垂直居中偏移
        const widget = hintNode.addComponent(Widget);
        widget.isAlignHorizontalCenter = true;
        widget.isAlignVerticalCenter = true;
        widget.verticalCenter = HINT_Y;
        widget.updateAlignment();

        // 左侧箭头装饰
        this.createHintArrow(hintNode, -150, 0, false);
        // 右侧箭头装饰
        this.createHintArrow(hintNode, 150, 0, true);

        const labelNode = new Node("HintLabel");
        labelNode.parent = hintNode;
        const labelTransform = labelNode.addComponent(UITransform);
        labelTransform.setContentSize(260, 40);
        const label = labelNode.addComponent(Label);
        label.string = "点击任意处启动游戏";
        label.fontSize = 30;
        label.color = COLOR_HINT;
    }

    /**
     * 创建提示箭头装饰（像素风小三角）
     */
    private createHintArrow(parent: Node, x: number, y: number, pointRight: boolean): void {
        const arrowNode = new Node(pointRight ? "ArrowRight" : "ArrowLeft");
        arrowNode.parent = parent;
        arrowNode.setPosition(x, y);

        const graphics = arrowNode.addComponent(Graphics);
        graphics.fillColor = COLOR_HINT;
        if (pointRight) {
            graphics.moveTo(10, 0);
            graphics.lineTo(-6, 9);
            graphics.lineTo(-6, -9);
        } else {
            graphics.moveTo(-10, 0);
            graphics.lineTo(6, 9);
            graphics.lineTo(6, -9);
        }
        graphics.close();
        graphics.fill();
    }

    // ========== 4. 健康游戏忠告面板（底部） ==========

    private createHealthAdvicePanel(): void {
        const panelNode = new Node("HealthAdvicePanel");
        panelNode.parent = this.node;

        const transform = panelNode.addComponent(UITransform);
        transform.setContentSize(ADVICE_PANEL_WIDTH, ADVICE_PANEL_HEIGHT);

        // 底部对齐 + 水平居中
        const widget = panelNode.addComponent(Widget);
        widget.isAlignBottom = true;
        widget.isAlignHorizontalCenter = true;
        widget.bottom = ADVICE_PANEL_BOTTOM;
        widget.updateAlignment();

        // 面板背景：单一路径 fill + stroke
        const graphics = panelNode.addComponent(Graphics);
        graphics.fillColor = COLOR_PANEL_FILL;
        graphics.strokeColor = COLOR_GOLD;
        graphics.lineWidth = 2;
        graphics.rect(-ADVICE_PANEL_WIDTH / 2, -ADVICE_PANEL_HEIGHT / 2, ADVICE_PANEL_WIDTH, ADVICE_PANEL_HEIGHT);
        graphics.fill();
        graphics.stroke();

        // 标题
        const titleNode = new Node("AdviceTitle");
        titleNode.parent = panelNode;
        titleNode.setPosition(0, 48);
        const titleTransform = titleNode.addComponent(UITransform);
        titleTransform.setContentSize(ADVICE_PANEL_WIDTH - 40, 30);
        const titleLabel = titleNode.addComponent(Label);
        titleLabel.string = "健康游戏忠告";
        titleLabel.fontSize = 22;
        titleLabel.isBold = true;
        titleLabel.color = COLOR_GOLD;

        // 正文（全文登载，一字不改）
        const bodyNode = new Node("AdviceBody");
        bodyNode.parent = panelNode;
        bodyNode.setPosition(0, -8);
        const bodyTransform = bodyNode.addComponent(UITransform);
        bodyTransform.setContentSize(560, 80);
        const bodyLabel = bodyNode.addComponent(Label);
        bodyLabel.string = HEALTH_ADVICE_TEXT;
        bodyLabel.fontSize = 16;
        bodyLabel.color = COLOR_BODY_TEXT;
        bodyLabel.overflow = Label.Overflow.SHRINK;
        bodyLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        bodyLabel.verticalAlign = Label.VerticalAlign.CENTER;
    }

    // ========== 5. 版权信息（忠告面板下方） ==========

    private createCopyrightLabel(): void {
        const copyrightNode = new Node("CopyrightLabel");
        copyrightNode.parent = this.node;

        const transform = copyrightNode.addComponent(UITransform);
        transform.setContentSize(600, 30);

        // 底部对齐 + 水平居中
        const widget = copyrightNode.addComponent(Widget);
        widget.isAlignBottom = true;
        widget.isAlignHorizontalCenter = true;
        widget.bottom = COPYRIGHT_BOTTOM;
        widget.updateAlignment();

        const label = copyrightNode.addComponent(Label);
        label.string = "著作权人：刘雨　软著登记号：2025SA0165472";
        label.fontSize = 16;
        label.color = COLOR_COPYRIGHT;
    }

    // ========== 适龄提示弹窗 ==========

    // 适龄标识点击回调
    private onAgeBadgeTouchEnd(event: EventTouch): void {
        event.propagationStopped = true; // 阻止冒泡，避免触发"点击任意启动"
        this.showAgeDialog();
    }

    /**
     * 打开适龄提示弹窗（挂在Canvas下并置顶）
     */
    private showAgeDialog(): void {
        if (this._dialogNode && this._dialogNode.isValid) {
            return;
        }

        const canvasNode = this.node.parent;
        if (!canvasNode) {
            console.error("未找到Canvas节点，无法创建弹窗");
            return;
        }

        const dialogNode = new Node("AgeRatingDialog");
        dialogNode.parent = canvasNode;
        dialogNode.setSiblingIndex(99999);
        this._dialogNode = dialogNode;

        // 全屏遮罩
        const maskNode = new Node("DialogMask");
        maskNode.parent = dialogNode;
        this._maskNode = maskNode;

        const maskTransform = maskNode.addComponent(UITransform);
        maskTransform.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
        const maskWidget = maskNode.addComponent(Widget);
        maskWidget.isAlignTop = true;
        maskWidget.isAlignBottom = true;
        maskWidget.isAlignLeft = true;
        maskWidget.isAlignRight = true;
        maskWidget.top = 0;
        maskWidget.bottom = 0;
        maskWidget.left = 0;
        maskWidget.right = 0;
        maskWidget.updateAlignment();

        const maskAfterAlign = maskNode.getComponent(UITransform);
        if (maskAfterAlign) {
            const maskGraphics = maskNode.addComponent(Graphics);
            maskGraphics.fillColor = COLOR_MASK;
            maskGraphics.rect(-maskAfterAlign.contentSize.width / 2, -maskAfterAlign.contentSize.height / 2,
                maskAfterAlign.contentSize.width, maskAfterAlign.contentSize.height);
            maskGraphics.fill();
        }

        // 点击遮罩关闭弹窗（阻止冒泡，避免启动游戏）
        maskNode.on(Node.EventType.TOUCH_END, this.onMaskTouchEnd, this);

        // 中央面板
        this.createDialogPanel(dialogNode);
    }

    private createDialogPanel(dialogNode: Node): void {
        const panelNode = new Node("DialogPanel");
        panelNode.parent = dialogNode;

        const transform = panelNode.addComponent(UITransform);
        transform.setContentSize(DIALOG_WIDTH, DIALOG_HEIGHT);

        // 居中
        const widget = panelNode.addComponent(Widget);
        widget.isAlignHorizontalCenter = true;
        widget.isAlignVerticalCenter = true;
        widget.updateAlignment();

        // 面板背景：单一路径 fill + stroke
        const graphics = panelNode.addComponent(Graphics);
        graphics.fillColor = COLOR_DIALOG_FILL;
        graphics.strokeColor = COLOR_DIALOG_BORDER;
        graphics.lineWidth = 3;
        graphics.rect(-DIALOG_WIDTH / 2, -DIALOG_HEIGHT / 2, DIALOG_WIDTH, DIALOG_HEIGHT);
        graphics.fill();
        graphics.stroke();

        // 标题
        const titleNode = new Node("DialogTitle");
        titleNode.parent = panelNode;
        titleNode.setPosition(0, 330);
        const titleTransform = titleNode.addComponent(UITransform);
        titleTransform.setContentSize(DIALOG_WIDTH - 40, 50);
        const titleLabel = titleNode.addComponent(Label);
        titleLabel.string = "适龄提示";
        titleLabel.fontSize = 36;
        titleLabel.isBold = true;
        titleLabel.color = COLOR_BODY_TEXT;

        // 三个内容区块（自面板中心向上排布，避免与底部按钮重叠）
        const blockLayouts: { titleY: number; bodyY: number }[] = [
            { titleY: 245, bodyY: 165 },
            { titleY: 50, bodyY: -30 },
            { titleY: -145, bodyY: -225 }
        ];

        for (let i = 0; i < DIALOG_SECTIONS.length; i++) {
            this.createDialogSection(panelNode, DIALOG_SECTIONS[i], blockLayouts[i]);
        }

        // 底部按钮
        const buttonNode = UIHelper.CreateButton("我知道了", 200, 64, COLOR_BUTTON_GREEN, () => {
            this.closeAgeDialog();
        }, this);
        buttonNode.parent = panelNode;
        buttonNode.setPosition(0, -345);
    }

    /**
     * 创建弹窗内容区块（小节标题 + 正文）
     */
    private createDialogSection(parent: Node, section: { title: string; body: string }, layout: { titleY: number; bodyY: number }): void {
        // 小节标题
        const titleNode = new Node("SectionTitle");
        titleNode.parent = parent;
        titleNode.setPosition(0, layout.titleY);
        const titleTransform = titleNode.addComponent(UITransform);
        titleTransform.setContentSize(DIALOG_WIDTH - 80, 30);
        const titleLabel = titleNode.addComponent(Label);
        titleLabel.string = section.title;
        titleLabel.fontSize = 22;
        titleLabel.isBold = true;
        titleLabel.color = COLOR_SECTION_TITLE;
        titleLabel.horizontalAlign = Label.HorizontalAlign.LEFT;

        // 正文
        const bodyNode = new Node("SectionBody");
        bodyNode.parent = parent;
        bodyNode.setPosition(0, layout.bodyY);
        const bodyTransform = bodyNode.addComponent(UITransform);
        bodyTransform.setContentSize(560, 110);
        const bodyLabel = bodyNode.addComponent(Label);
        bodyLabel.string = section.body;
        bodyLabel.fontSize = 20;
        bodyLabel.color = COLOR_BODY_TEXT;
        bodyLabel.overflow = Label.Overflow.SHRINK;
        bodyLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        bodyLabel.verticalAlign = Label.VerticalAlign.TOP;
    }

    // 遮罩点击回调
    private onMaskTouchEnd(event: EventTouch): void {
        event.propagationStopped = true; // 阻止冒泡，避免启动游戏
        this.closeAgeDialog();
    }

    /**
     * 关闭适龄提示弹窗
     */
    private closeAgeDialog(): void {
        if (this._dialogNode && this._dialogNode.isValid) {
            this._dialogNode.destroy();
        }
        this._dialogNode = null;
        this._maskNode = null;
    }

    // ========== 启动逻辑 ==========

    // 根节点点击回调：点击任意处启动游戏
    private onRootTouchEnd(_event: EventTouch): void {
        if (this._isStarting) return;
        this._isStarting = true;

        const gm = GameManager.instance;
        if (!gm) {
            console.error("[LaunchPage] 未找到GameManager实例，无法启动游戏");
            this._isStarting = false;
            return;
        }

        gm.StartGame();

        // 与GameHUD的MENU按钮一致的启动流程：短暂延迟确保状态切换完成后开始战斗
        this.scheduleOnce(() => {
            if (gm.gameState === GameState.DEPLOYMENT) {
                gm.StartBattle();
            }
            // 启动流程完成后销毁启动页（先卸载监听）
            this.destroyLaunchPage();
        }, 0.1);
    }

    /**
     * 销毁启动页：先卸载所有监听，再销毁节点
     */
    private destroyLaunchPage(): void {
        // 卸载根节点触摸监听
        this.node.off(Node.EventType.TOUCH_END, this.onRootTouchEnd, this);

        // 卸载适龄标识触摸监听
        if (this._ageBadgeNode && this._ageBadgeNode.isValid) {
            this._ageBadgeNode.off(Node.EventType.TOUCH_END, this.onAgeBadgeTouchEnd, this);
        }

        // 关闭并清理弹窗
        this.closeAgeDialog();

        if (this.node && this.node.isValid) {
            this.node.destroy();
        }
    }

    protected onDestroy(): void {
        // 清理所有注册的节点监听
        this.node.off(Node.EventType.TOUCH_END, this.onRootTouchEnd, this);
        if (this._ageBadgeNode && this._ageBadgeNode.isValid) {
            this._ageBadgeNode.off(Node.EventType.TOUCH_END, this.onAgeBadgeTouchEnd, this);
        }
        if (this._maskNode && this._maskNode.isValid) {
            this._maskNode.off(Node.EventType.TOUCH_END, this.onMaskTouchEnd, this);
        }
        if (this._dialogNode && this._dialogNode.isValid) {
            this._dialogNode.destroy();
        }
        this._ageBadgeNode = null;
        this._dialogNode = null;
        this._maskNode = null;
    }
}
