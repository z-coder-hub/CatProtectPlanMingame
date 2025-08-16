import { _decorator, Component, Node, Graphics, Color, Label, UITransform } from 'cc';
import { GameManager } from '../../managers/GameManager';
import { GAME_CONSTANTS } from '../../types/GameConstants';

const { ccclass, property } = _decorator;

@ccclass('Castle')
export class Castle extends Component {
    
    @property({ tooltip: "城堡血条显示", type: Node })
    public healthBarNode: Node | null = null;
    
    @property({ tooltip: "血量文本显示", type: Label })
    public healthLabel: Label | null = null;
    
    // 私有属性
    private _graphics: Graphics | null = null;
    private _gameManager: GameManager | null = null;
    
    // 城堡尺寸
    private readonly _castleWidth: number = 80;
    private readonly _castleHeight: number = 100;
    
    protected onLoad(): void {
        this.initializeCastleVisuals();
        this.initializeHealthBar();
    }
    
    protected start(): void {
        // 获取GameManager引用
        this._gameManager = GameManager.instance;
        if (!this._gameManager) {
            console.error("未找到GameManager实例");
            return;
        }
        
        // 设置城堡位置
        this.node.setPosition(GAME_CONSTANTS.CASTLE_POSITION.x, GAME_CONSTANTS.CASTLE_POSITION.y);
        
        // 注册到GameManager
        this._gameManager.castleNode = this.node;
        
        // 更新初始血量显示
        this.updateHealthDisplay();
        
        console.log("城堡初始化完成");
    }
    
    // 初始化城堡外观
    private initializeCastleVisuals(): void {
        this._graphics = this.node.getComponent(Graphics);
        if (!this._graphics) {
            this._graphics = this.node.addComponent(Graphics);
        }
        
        this.drawCastle();
    }
    
    // 绘制城堡
    private drawCastle(): void {
        if (!this._graphics) return;
        
        this._graphics.clear();
        
        // 绘制城堡主体（蓝色矩形）
        this._graphics.fillColor = new Color(70, 130, 180); // 钢蓝色
        this._graphics.rect(
            -this._castleWidth / 2, 
            -this._castleHeight / 2, 
            this._castleWidth, 
            this._castleHeight
        );
        this._graphics.fill();
        
        // 绘制城堡轮廓
        this._graphics.strokeColor = new Color(25, 25, 112); // 深蓝色
        this._graphics.lineWidth = 3;
        this._graphics.rect(
            -this._castleWidth / 2, 
            -this._castleHeight / 2, 
            this._castleWidth, 
            this._castleHeight
        );
        this._graphics.stroke();
        
        // 绘制城堡塔楼
        this.drawTowers();
        
        // 绘制城堡门
        this.drawGate();
        
        // 绘制旗帜
        this.drawFlag();
    }
    
    // 绘制塔楼
    private drawTowers(): void {
        if (!this._graphics) return;
        
        const towerWidth = 20;
        const towerHeight = 30;
        
        // 左塔楼
        this._graphics.fillColor = new Color(100, 149, 237); // 浅蓝色
        this._graphics.rect(
            -this._castleWidth / 2 - 5, 
            this._castleHeight / 2 - towerHeight, 
            towerWidth, 
            towerHeight
        );
        this._graphics.fill();
        
        // 右塔楼
        this._graphics.rect(
            this._castleWidth / 2 - 15, 
            this._castleHeight / 2 - towerHeight, 
            towerWidth, 
            towerHeight
        );
        this._graphics.fill();
        
        // 塔楼轮廓
        this._graphics.strokeColor = new Color(25, 25, 112);
        this._graphics.lineWidth = 2;
        this._graphics.rect(
            -this._castleWidth / 2 - 5, 
            this._castleHeight / 2 - towerHeight, 
            towerWidth, 
            towerHeight
        );
        this._graphics.stroke();
        this._graphics.rect(
            this._castleWidth / 2 - 15, 
            this._castleHeight / 2 - towerHeight, 
            towerWidth, 
            towerHeight
        );
        this._graphics.stroke();
    }
    
    // 绘制城门
    private drawGate(): void {
        if (!this._graphics) return;
        
        const gateWidth = 25;
        const gateHeight = 35;
        
        this._graphics.fillColor = new Color(139, 69, 19); // 棕色
        this._graphics.rect(
            -gateWidth / 2, 
            -this._castleHeight / 2, 
            gateWidth, 
            gateHeight
        );
        this._graphics.fill();
        
        // 城门轮廓
        this._graphics.strokeColor = new Color(101, 67, 33);
        this._graphics.lineWidth = 2;
        this._graphics.rect(
            -gateWidth / 2, 
            -this._castleHeight / 2, 
            gateWidth, 
            gateHeight
        );
        this._graphics.stroke();
    }
    
    // 绘制旗帜
    private drawFlag(): void {
        if (!this._graphics) return;
        
        // 旗杆
        this._graphics.strokeColor = new Color(139, 69, 19);
        this._graphics.lineWidth = 3;
        this._graphics.moveTo(0, this._castleHeight / 2);
        this._graphics.lineTo(0, this._castleHeight / 2 + 40);
        this._graphics.stroke();
        
        // 旗帜
        this._graphics.fillColor = new Color(220, 20, 60); // 深红色
        this._graphics.moveTo(0, this._castleHeight / 2 + 40);
        this._graphics.lineTo(20, this._castleHeight / 2 + 35);
        this._graphics.lineTo(0, this._castleHeight / 2 + 25);
        this._graphics.close();
        this._graphics.fill();
    }
    
    // 初始化血条
    private initializeHealthBar(): void {
        if (!this.healthBarNode) {
            this.createHealthBar();
        }
        
        if (!this.healthLabel) {
            this.createHealthLabel();
        }
    }
    
    // 创建血条
    private createHealthBar(): void {
        // 创建血条容器
        this.healthBarNode = new Node("HealthBar");
        this.healthBarNode.parent = this.node;
        this.healthBarNode.setPosition(0, this._castleHeight / 2 + 60);
        
        // 设置血条尺寸
        const healthBarTransform = this.healthBarNode.addComponent(UITransform);
        healthBarTransform.setContentSize(80, 8);
        
        // 血条背景
        const bgGraphics = this.healthBarNode.addComponent(Graphics);
        bgGraphics.fillColor = new Color(128, 128, 128); // 灰色背景
        bgGraphics.rect(-40, -4, 80, 8);
        bgGraphics.fill();
        
        // 血条填充
        const fillNode = new Node("Fill");
        fillNode.parent = this.healthBarNode;
        const fillGraphics = fillNode.addComponent(Graphics);
        fillGraphics.fillColor = new Color(0, 255, 0); // 绿色血条
        fillGraphics.rect(-40, -4, 80, 8);
        fillGraphics.fill();
    }
    
    // 创建血量文本
    private createHealthLabel(): void {
        const labelNode = new Node("HealthLabel");
        labelNode.parent = this.node;
        labelNode.setPosition(0, this._castleHeight / 2 + 75);
        
        this.healthLabel = labelNode.addComponent(Label);
        this.healthLabel.string = "100/100";
        this.healthLabel.fontSize = 16;
        this.healthLabel.color = new Color(255, 255, 255);
    }
    
    // 更新血量显示
    public updateHealthDisplay(): void {
        if (!this._gameManager) return;
        
        const currentHealth = this._gameManager.castleHealth;
        const maxHealth = 100; // 从配置读取
        const healthPercent = currentHealth / maxHealth;
        
        // 更新血条填充
        if (this.healthBarNode) {
            const fillNode = this.healthBarNode.getChildByName("Fill");
            if (fillNode) {
                const fillGraphics = fillNode.getComponent(Graphics);
                if (fillGraphics) {
                    fillGraphics.clear();
                    
                    // 根据血量百分比设置颜色
                    let fillColor: Color;
                    if (healthPercent > 0.6) {
                        fillColor = new Color(0, 255, 0); // 绿色
                    } else if (healthPercent > 0.3) {
                        fillColor = new Color(255, 255, 0); // 黄色
                    } else {
                        fillColor = new Color(255, 0, 0); // 红色
                    }
                    
                    fillGraphics.fillColor = fillColor;
                    fillGraphics.rect(-40, -4, 80 * healthPercent, 8);
                    fillGraphics.fill();
                }
            }
        }
        
        // 更新血量文本
        if (this.healthLabel) {
            this.healthLabel.string = `${Math.ceil(currentHealth)}/${maxHealth}`;
        }
        
        // 根据血量调整城堡外观
        this.updateCastleAppearance(healthPercent);
    }
    
    // 根据血量更新城堡外观
    private updateCastleAppearance(healthPercent: number): void {
        if (!this._graphics) return;
        
        // 重新绘制城堡，血量低时变暗
        const damageTint = 1 - (1 - healthPercent) * 0.5; // 最多变暗50%
        
        // 重新绘制城堡
        this.drawCastle();
        
        // 如果血量很低，添加裂痕效果
        if (healthPercent < 0.3) {
            this.drawDamageEffects();
        }
    }
    
    // 绘制损坏效果
    private drawDamageEffects(): void {
        if (!this._graphics) return;
        
        // 绘制裂痕
        this._graphics.strokeColor = new Color(64, 64, 64);
        this._graphics.lineWidth = 2;
        
        // 裂痕1
        this._graphics.moveTo(-20, 10);
        this._graphics.lineTo(-10, -10);
        this._graphics.lineTo(-5, 0);
        this._graphics.stroke();
        
        // 裂痕2
        this._graphics.moveTo(15, 20);
        this._graphics.lineTo(5, 0);
        this._graphics.lineTo(10, -15);
        this._graphics.stroke();
    }
    
    // 城堡受到攻击时的震动效果
    public playDamageEffect(): void {
        if (!this.node) return;
        
        const originalPos = this.node.position.clone();
        const shakeAmount = 5;
        let shakeCount = 0;
        const maxShakes = 6;
        
        const shake = () => {
            if (shakeCount >= maxShakes) {
                this.node.setPosition(originalPos);
                return;
            }
            
            const offsetX = (Math.random() - 0.5) * shakeAmount;
            const offsetY = (Math.random() - 0.5) * shakeAmount;
            this.node.setPosition(
                originalPos.x + offsetX,
                originalPos.y + offsetY,
                originalPos.z
            );
            
            shakeCount++;
            setTimeout(shake, 50);
        };
        
        shake();
    }
    
    protected update(dt: number): void {
        // 实时更新血量显示
        if (this._gameManager) {
            this.updateHealthDisplay();
        }
    }
    
    // 城堡被摧毁时的特殊效果
    public onCastleDestroyed(): void {
        console.log("城堡被摧毁！");
        
        // 创建爆炸特效
        this.createExplosionEffect();
        
        // 改变外观为废墟
        if (this._graphics) {
            this._graphics.clear();
            this._graphics.fillColor = new Color(64, 64, 64); // 变成灰色废墟
            this._graphics.rect(
                -this._castleWidth / 2, 
                -this._castleHeight / 2, 
                this._castleWidth, 
                this._castleHeight
            );
            this._graphics.fill();
        }
    }
    
    // 创建爆炸特效
    private createExplosionEffect(): void {
        const effectNode = new Node("ExplosionEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        
        // 创建多层爆炸效果
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                if (effectGraphics && effectNode.isValid) {
                    effectGraphics.clear();
                    effectGraphics.fillColor = new Color(255, 100, 0, 200 - i * 50);
                    effectGraphics.circle(0, 0, 30 + i * 20);
                    effectGraphics.fill();
                }
            }, i * 200);
        }
        
        // 清理特效
        setTimeout(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 1000);
    }
}