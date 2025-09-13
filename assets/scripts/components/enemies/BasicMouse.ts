import { _decorator, Node, Vec3, Graphics, Color, tween } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyState } from '../../types/GameTypes';
import { ENEMY_CONFIGS } from '../../types/GameConstants';
import { DrawingHelper } from '../../utils/DrawingHelper';
import { EffectHelper } from '../../utils/EffectHelper';

const { ccclass } = _decorator;

@ccclass('BasicMouse')
export class BasicMouse extends BaseMouse {
    
    // 私有属性
    private _graphics: Graphics | null = null;
    private _healthBarContainer: Node | null = null;
    private _healthBarForeground: Graphics | null = null;
    
    // Tween移动行为相关属性
    private _zigzagAmplitude: number = 0;                 // 蜿蜒幅度
    private _movementPattern: 'zigzag' | 'curves' | 'spiral' = 'zigzag'; // 移动模式
    private _segmentCount: number = 6;                    // 移动分段数量
    
    // 敌人类型
    public readonly enemyType: EnemyType = EnemyType.BASIC_MOUSE;
    
    // 实现抽象方法：初始化老鼠属性
    protected initializeMouseStats(): void {
        const config = ENEMY_CONFIGS[EnemyType.BASIC_MOUSE];
        
        this.unitName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.moveSpeed = config.moveSpeed;
        this.goldReward = config.goldReward;
        
        // 初始化随机移动行为参数
        this.initializeMovementBehavior();
    }
    
    // 实现抽象方法：初始化老鼠外观
    protected initializeMouseVisuals(): void {
        // 初始化外观
        this.initializeVisuals();
        
        // 初始化血条
        this.initializeHealthBar();
    }
    
    // 初始化移动行为
    private initializeMovementBehavior(): void {
        // 随机选择移动模式，新增螺旋模式
        const patterns: ('zigzag' | 'curves' | 'spiral')[] = ['zigzag', 'curves', 'spiral'];
        this._movementPattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        // 设置蜿蜒参数
        this._zigzagAmplitude = 20 + Math.random() * 30; // 20-50像素的摆动幅度
        this._segmentCount = 4 + Math.floor(Math.random() * 4); // 4-7段移动
        
        console.log(`老鼠移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }
    
    // 初始化外观
    private initializeVisuals(): void {
        // 获取Graphics组件绘制外观
        this._graphics = this.getGraphicsComponent();
        
        this.drawMouseAppearance();
    }
    
    // 初始化血条
    private initializeHealthBar(): void {
        const healthBarData = DrawingHelper.createHealthBar(this.node, {
            width: 30,
            height: 4,
            position: { x: 0, y: 25, z: 0 }, // 在老鼠上方
            backgroundColor: new Color(60, 60, 60), // 深灰色背景
            foregroundColor: new Color(0, 255, 0), // 绿色前景
            borderColor: new Color(255, 255, 255), // 白色边框
            borderWidth: 1
        });
        
        this._healthBarContainer = healthBarData.container;
        this._healthBarForeground = healthBarData.foreground;
        
        // 血条始终显示
        this._healthBarContainer.active = true;
        
        // 初始化血条显示
        this.updateHealthBarDisplay();
    }
    
    // 绘制老鼠外观
    private drawMouseAppearance(): void {
        if (!this._graphics) return;
        DrawingHelper.drawEnemyAppearance(this._graphics, 'basicMouse', 1.2);
    }
    
    // 实现BaseMouse的抽象方法 - 老鼠标签配置
    protected getMouseLabelConfig() {
        return {
            text: "鼠",
            fontSize: 22,
            color: new Color(255, 255, 255),
            yOffset: 35,
            size: { width: 60, height: 28 }
        };
    }
    
    protected update(dt: number): void {
        super.update(dt);
        // Tween系统自动处理移动，无需手动更新
    }
    
    // 重写基于Tween的移动方法 - 实现蜿蜒移动
    protected startMovementTowardsCastle(): void {
        if (!this._gameManager || !this._gameManager.castleNode || this._isMoving) return;
        
        const currentPos = this.node.position;
        const castlePos = this._gameManager.castleNode.position;
        
        // 检查是否已经在城堡位置
        if (this.isReachedCastle(currentPos)) {
            this.reachCastle();
            return;
        }
        
        // 根据移动模式创建不同的移动路径
        this.createWeavingMovementPath(currentPos, castlePos);
    }
    
    // 创建蜿蜒移动路径
    private createWeavingMovementPath(startPos: Vec3, castlePos: Vec3): void {
        this._isMoving = true;
        this.enemyState = EnemyState.MOVING;
        
        // 停止之前的移动
        this.stopMovement();
        
        // 计算总距离和每段距离
        const totalDistance = Math.abs(startPos.y - castlePos.y - 50);
        const segmentDistance = totalDistance / this._segmentCount;
        const totalDuration = totalDistance / this.moveSpeed;
        const segmentDuration = totalDuration / this._segmentCount;
        
        // 根据移动模式生成路径点
        const pathPoints = this.generatePathPoints(startPos, castlePos, totalDistance);
        
        // 创建链式缓动动画
        this.createChainedTweenMovement(pathPoints, segmentDuration);
    }
    
    // 根据移动模式生成路径点
    private generatePathPoints(startPos: Vec3, castlePos: Vec3, totalDistance: number): Vec3[] {
        const points: Vec3[] = [startPos];
        const segmentDistance = totalDistance / this._segmentCount;
        
        for (let i = 1; i <= this._segmentCount; i++) {
            const progress = i / this._segmentCount;
            const yPos = startPos.y - (segmentDistance * i);
            let xOffset = 0;
            
            switch (this._movementPattern) {
                case 'zigzag':
                    // Z字形移动：每段改变方向
                    xOffset = Math.sin(i * Math.PI * 0.6) * this._zigzagAmplitude;
                    break;
                case 'curves':
                    // S形曲线移动：平滑曲线
                    xOffset = Math.sin(progress * Math.PI * 2) * this._zigzagAmplitude;
                    break;
                case 'spiral':
                    // 螺旋移动：螺旋下降
                    xOffset = Math.cos(progress * Math.PI * 4) * this._zigzagAmplitude * (1 - progress * 0.5);
                    break;
            }
            
            // 限制X坐标不要移动到屏幕外
            const maxX = 300;
            xOffset = Math.max(-maxX, Math.min(maxX, startPos.x + xOffset)) - startPos.x;
            
            points.push(new Vec3(startPos.x + xOffset, yPos, 0));
        }
        
        // 最后一个点是城堡位置
        points[points.length - 1] = new Vec3(points[points.length - 1].x, castlePos.y + 50, 0);
        
        return points;
    }
    
    // 创建链式缓动移动
    private createChainedTweenMovement(pathPoints: Vec3[], segmentDuration: number): void {
        let currentTween = tween(this.node);
        
        // 为每个路径点创建缓动
        for (let i = 1; i < pathPoints.length; i++) {
            const targetPos = pathPoints[i];
            const isLastSegment = i === pathPoints.length - 1;
            
            // 根据移动模式选择缓动效果
            let easingType = 'linear';
            switch (this._movementPattern) {
                case 'zigzag':
                    easingType = 'sineInOut'; // 平滑的进出效果
                    break;
                case 'curves':
                    easingType = 'cubicInOut'; // 更平滑的曲线
                    break;
                case 'spiral':
                    easingType = 'quadInOut'; // 螺旋的加速减速
                    break;
            }
            
            currentTween = currentTween.to(segmentDuration, 
                { position: targetPos }, 
                { easing: easingType }
            );
            
            // 如果是最后一段，添加到达城堡的回调
            if (isLastSegment) {
                currentTween = currentTween.call(() => {
                    this._isMoving = false;
                    this.reachCastle();
                });
            }
        }
        
        // 启动缓动链
        this._movementTween = currentTween.start();
        
        console.log(`开始${this._movementPattern}移动，路径点数量: ${pathPoints.length}, 总时长: ${(segmentDuration * (pathPoints.length - 1)).toFixed(2)}秒`);
    }
    
    // 重写城堡到达特效方法
    protected createCastleReachEffect(): void {
        if (this.node.parent) {
            EffectHelper.createAttackEffect(this.node.position, this.node.parent);
        }
    }
    
    // 重写受伤方法，添加受伤反馈
    protected onTakeDamage(damage: number): void {
        console.log(`基础老鼠受到 ${damage} 点伤害，剩余血量: ${this.currentHealth}`);
        
        // 更新血条显示
        this.updateHealthBarDisplay();
        
        // 受伤闪烁效果
        this.playHurtEffect();
    }
    
    // 更新血条显示
    private updateHealthBarDisplay(): void {
        if (this._healthBarForeground && this._healthBarContainer) {
            const healthPercent = this.currentHealth / this.maxHealth;
            DrawingHelper.updateHealthBar(this._healthBarForeground, healthPercent, 30, 4);
            
            // 血条始终显示，只有死亡时才隐藏
            this._healthBarContainer.active = healthPercent > 0;
        }
    }
    
    // 播放受伤效果
    private playHurtEffect(): void {
        if (!this._graphics) return;
        
        // 使用DrawingHelper绘制受伤效果
        DrawingHelper.drawHurtEffect(this._graphics, 'basicMouse', 1.2);
        
        // 200ms后恢复原色
        tween(this.node)
            .delay(0.2)
            .call(() => {
                if (this._graphics && this.node.isValid) {
                    this.drawMouseAppearance();
                }
            })
            .start();
    }
    
    // 重写死亡特效方法
    protected createDeathEffect(): void {
        if (this.node.parent) {
            EffectHelper.createDeathEffect(this.node.position, this.node.parent);
        }
        
        // 隐藏血条
        if (this._healthBarContainer) {
            this._healthBarContainer.active = false;
        }
        
        // 改变外观表示死亡
        if (this._graphics) {
            this._graphics.clear();
            this._graphics.fillColor = new Color(64, 64, 64); // 变暗
            DrawingHelper.drawEnemyAppearance(this._graphics, 'basicMouse', 1.2);
        }
    }
    
    // 实现抽象方法：执行攻击
    // 老鼠不再有攻击能力，移除 performAttack 方法
    // 基础老鼠只会朝城堡移动
    
}