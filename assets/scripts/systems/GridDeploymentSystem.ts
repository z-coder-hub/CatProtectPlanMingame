import { _decorator, Component, Node, Vec3, Vec2, Graphics, Color, UITransform } from 'cc';
import { GridPosition } from '../types/GameTypes';
import { GAME_CONSTANTS, GAME_CONFIG } from '../types/GameConstants';

const { ccclass, property } = _decorator;

// 网格槽位状态
export enum GridSlotState {
    EMPTY = 0,      // 空闲可部署
    OCCUPIED = 1,   // 已被占用
    FORBIDDEN = -1  // 禁止部署
}

// 网格槽位数据
export interface GridSlot {
    state: GridSlotState;
    heroNode: Node | null;
    worldPosition: Vec3;
}

@ccclass('GridDeploymentSystem')
export class GridDeploymentSystem extends Component {
    
    @property({ tooltip: "网格行数" })
    public gridRows: number = GAME_CONFIG.gridConfig.rows;
    
    @property({ tooltip: "网格列数" })  
    public gridColumns: number = GAME_CONFIG.gridConfig.cols;
    
    @property({ tooltip: "单元格大小" })
    public cellSize: number = GAME_CONFIG.gridConfig.cellSize;
    
    @property({ tooltip: "是否显示调试网格" })
    public showDebugGrid: boolean = true;
    
    // 网格数据
    private _gridData: GridSlot[][] = [];
    private _gridStartPos: Vec3 = new Vec3();
    private _debugGraphics: Graphics | null = null;
    
    // 拖拽预览相关
    private _previewGraphics: Graphics | null = null;
    private _currentHoverGrid: GridPosition | null = null;
    private _isDragMode: boolean = false;
    private _previewAnimationTimer: number = 0;
    
    // UI交互相关（保留拖拽预览功能）
    
    // 获取网格总数
    public get totalSlots(): number {
        return this.gridRows * this.gridColumns;
    }
    
    // 获取空闲槽位数量
    public get availableSlots(): number {
        let count = 0;
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridColumns; col++) {
                if (this._gridData[row][col].state === GridSlotState.EMPTY) {
                    count++;
                }
            }
        }
        return count;
    }
    
    protected onLoad(): void {
        GridDeploymentSystem._instance = this;
        
        this.initializeGrid();
        this.calculateGridBounds();
        
        if (this.showDebugGrid) {
            this.createDebugGraphics();
        }
        
        // 创建拖拽预览Graphics
        this.createPreviewGraphics();
        
        // 英雄部署交互现在由HeroSelectionPanel处理
        console.log('网格系统初始化完成，英雄部署交互由HeroSelectionPanel处理');
        
        console.log(`网格部署系统初始化完成: ${this.gridColumns}x${this.gridRows}, 单元格大小: ${this.cellSize}`);
    }
    
    protected onDestroy(): void {
        if (GridDeploymentSystem._instance === this) {
            GridDeploymentSystem._instance = null;
        }
        
        // 英雄部署交互现在由HeroSelectionPanel处理，无需清理
        console.log('网格系统销毁，无需清理输入事件');
    }
    
    // 初始化网格数据
    private initializeGrid(): void {
        this._gridData = [];
        
        for (let row = 0; row < this.gridRows; row++) {
            this._gridData[row] = [];
            for (let col = 0; col < this.gridColumns; col++) {
                this._gridData[row][col] = {
                    state: GridSlotState.EMPTY,
                    heroNode: null,
                    worldPosition: new Vec3()
                };
            }
        }
    }
    
    // 计算网格边界和位置
    private calculateGridBounds(): void {
        // 使用游戏常量
        
        // 计算网格总尺寸
        const totalWidth = this.gridColumns * this.cellSize;
        const totalHeight = this.gridRows * this.cellSize;
        
        // 设置网格起始位置（左上角）
        this._gridStartPos.set(
            -totalWidth / 2,
            GAME_CONSTANTS.GRID_OFFSET_Y + totalHeight / 2,
            0
        );
        
        // 更新每个网格槽位的世界坐标
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridColumns; col++) {
                const worldPos = this.gridToWorldPosition({ row, col });
                this._gridData[row][col].worldPosition = worldPos;
            }
        }
    }
    
    // 网格坐标转世界坐标
    public gridToWorldPosition(gridPos: GridPosition): Vec3 {
        const x = this._gridStartPos.x + (gridPos.col + 0.5) * this.cellSize;
        const y = this._gridStartPos.y - (gridPos.row + 0.5) * this.cellSize;
        return new Vec3(x, y, 0);
    }
    
    // 世界坐标转网格坐标
    public worldToGridPosition(worldPos: Vec3): GridPosition | null {
        const col = Math.floor((worldPos.x - this._gridStartPos.x) / this.cellSize);
        const row = Math.floor((this._gridStartPos.y - worldPos.y) / this.cellSize);
        
        if (this.isValidGridPosition({ row, col })) {
            return { row, col };
        }
        return null;
    }
    
    // 检查网格坐标是否有效
    public isValidGridPosition(gridPos: GridPosition): boolean {
        return gridPos.row >= 0 && gridPos.row < this.gridRows &&
               gridPos.col >= 0 && gridPos.col < this.gridColumns;
    }
    
    // 检查网格槽位是否可部署
    public canDeployAt(gridPos: GridPosition): boolean {
        if (!this.isValidGridPosition(gridPos)) {
            return false;
        }
        return this._gridData[gridPos.row][gridPos.col].state === GridSlotState.EMPTY;
    }
    
    // 检查是否可以在指定位置部署英雄（兼容方法）
    public canDeployHero(row: number, col: number): boolean {
        return this.canDeployAt({ row, col });
    }
    
    // 部署英雄到指定网格位置
    public deployHero(heroNode: Node, gridPos: GridPosition | number, col?: number): boolean {
        // 兼容两种调用方式：deployHero(node, {row, col}) 和 deployHero(node, row, col)
        let position: GridPosition;
        if (typeof gridPos === 'number' && col !== undefined) {
            position = { row: gridPos, col: col };
        } else if (typeof gridPos === 'object') {
            position = gridPos;
        } else {
            console.error('Invalid parameters for deployHero');
            return false;
        }
        
        if (!this.canDeployAt(position)) {
            return false;
        }
        
        const slot = this._gridData[position.row][position.col];
        slot.state = GridSlotState.OCCUPIED;
        slot.heroNode = heroNode;
        
        // 移动英雄到网格位置
        heroNode.setPosition(slot.worldPosition);
        
        console.log(`英雄部署成功: 位置(${position.row}, ${position.col})`);
        return true;
    }
    
    // 移除指定位置的英雄
    public removeHero(gridPos: GridPosition): Node | null {
        if (!this.isValidGridPosition(gridPos)) {
            return null;
        }
        
        const slot = this._gridData[gridPos.row][gridPos.col];
        const heroNode = slot.heroNode;
        
        if (heroNode) {
            slot.state = GridSlotState.EMPTY;
            slot.heroNode = null;
            console.log(`英雄移除成功: 位置(${gridPos.row}, ${gridPos.col})`);
        }
        
        return heroNode;
    }
    
    // 查找英雄所在的网格位置
    public findHeroPosition(heroNode: Node): GridPosition | null {
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridColumns; col++) {
                if (this._gridData[row][col].heroNode === heroNode) {
                    return { row, col };
                }
            }
        }
        return null;
    }
    
    // 根据英雄节点清理网格位置
    public clearHeroFromGrid(heroNode: Node): boolean {
        const position = this.findHeroPosition(heroNode);
        if (position) {
            const removedHero = this.removeHero(position);
            if (removedHero) {
                console.log(`网格位置 (${position.row}, ${position.col}) 已清理，英雄: ${heroNode.name}`);
                this.updateDebugDisplay();
                return true;
            }
        }
        return false;
    }
    
    // 清理所有网格位置（波次重置时使用）
    public clearAllGridPositions(): void {
        let clearedCount = 0;
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridColumns; col++) {
                const slot = this._gridData[row][col];
                if (slot.state === GridSlotState.OCCUPIED) {
                    slot.state = GridSlotState.EMPTY;
                    slot.heroNode = null;
                    clearedCount++;
                }
            }
        }
        
        if (clearedCount > 0) {
            console.log(`已清理 ${clearedCount} 个网格位置`);
            this.updateDebugDisplay();
        }
    }
    
    // 获取所有已部署的英雄
    public getAllDeployedHeroes(): Node[] {
        const heroes: Node[] = [];
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridColumns; col++) {
                const heroNode = this._gridData[row][col].heroNode;
                if (heroNode) {
                    heroes.push(heroNode);
                }
            }
        }
        return heroes;
    }
    
    // 获取指定位置附近的英雄
    public getHeroesInRadius(centerPos: Vec3, radius: number): Node[] {
        const heroes: Node[] = [];
        
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridColumns; col++) {
                const slot = this._gridData[row][col];
                if (slot.heroNode) {
                    const distance = Vec3.distance(centerPos, slot.worldPosition);
                    if (distance <= radius) {
                        heroes.push(slot.heroNode);
                    }
                }
            }
        }
        
        return heroes;
    }
    
    // 创建调试图形
    private createDebugGraphics(): void {
        const debugNode = new Node("GridDebug");
        debugNode.parent = this.node;
        
        this._debugGraphics = debugNode.addComponent(Graphics);
        this.drawDebugGrid();
    }
    
    // 创建拖拽预览Graphics
    private createPreviewGraphics(): void {
        const previewNode = new Node("GridPreview");
        previewNode.parent = this.node;
        
        this._previewGraphics = previewNode.addComponent(Graphics);
        // 设置较高的渲染层级，确保预览在网格之上
        previewNode.setSiblingIndex(999);
    }
    
    // 绘制调试网格
    private drawDebugGrid(): void {
        if (!this._debugGraphics) return;
        
        this._debugGraphics.clear();
        this._debugGraphics.strokeColor = Color.WHITE;
        this._debugGraphics.lineWidth = 2; // 增加线宽提高可见性
        
        // 绘制改进的虚线网格
        this.drawImprovedDashedGrid();
    }
    
    // 绘制改进的虚线网格
    private drawImprovedDashedGrid(): void {
        if (!this._debugGraphics) return;
        
        const dashLength = 6;
        const gapLength = 6;
        
        // 统一收集所有线段，然后一次性绘制
        this._debugGraphics.moveTo(0, 0); // 重置画笔
        
        // 绘制水平线
        for (let row = 0; row <= this.gridRows; row++) {
            const y = this._gridStartPos.y - row * this.cellSize;
            const startX = this._gridStartPos.x;
            const endX = this._gridStartPos.x + this.gridColumns * this.cellSize;
            this.drawContinuousDashedLine(startX, y, endX, y, dashLength, gapLength);
        }
        
        // 绘制垂直线
        for (let col = 0; col <= this.gridColumns; col++) {
            const x = this._gridStartPos.x + col * this.cellSize;
            const startY = this._gridStartPos.y;
            const endY = this._gridStartPos.y - this.gridRows * this.cellSize;
            this.drawContinuousDashedLine(x, startY, x, endY, dashLength, gapLength);
        }
        
        // 一次性绘制所有线段
        this._debugGraphics.stroke();
    }
    
    // 绘制连续的虚线（改进版本）
    private drawContinuousDashedLine(x1: number, y1: number, x2: number, y2: number, dashLength: number, gapLength: number): void {
        if (!this._debugGraphics) return;
        
        const totalLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        
        // 计算方向向量
        const dirX = (x2 - x1) / totalLength;
        const dirY = (y2 - y1) / totalLength;
        
        let currentDistance = 0;
        let isDrawing = true; // 开始时绘制虚线段
        
        while (currentDistance < totalLength) {
            const segmentLength = isDrawing ? dashLength : gapLength;
            const segmentEnd = Math.min(currentDistance + segmentLength, totalLength);
            
            const startX = x1 + dirX * currentDistance;
            const startY = y1 + dirY * currentDistance;
            const endX = x1 + dirX * segmentEnd;
            const endY = y1 + dirY * segmentEnd;
            
            if (isDrawing) {
                // 绘制实线段
                this._debugGraphics.moveTo(startX, startY);
                this._debugGraphics.lineTo(endX, endY);
            }
            
            currentDistance = segmentEnd;
            isDrawing = !isDrawing; // 切换绘制/间隔状态
        }
    }
    
    
    
    // 更新调试显示
    public updateDebugDisplay(): void {
        if (this.showDebugGrid && this._debugGraphics) {
            this.drawDebugGrid();
        }
    }
    
    // ========== 拖拽预览功能 ==========
    
    // 开始拖拽模式
    public startDragMode(): void {
        this._isDragMode = true;
        this._previewAnimationTimer = 0;
        console.log("网格拖拽模式已开启");
    }
    
    // 结束拖拽模式
    public endDragMode(): void {
        this._isDragMode = false;
        this._currentHoverGrid = null;
        this.clearPreview();
        console.log("网格拖拽模式已关闭");
    }
    
    // 更新鼠标悬停位置
    public updateHoverPosition(worldPosition: Vec3): void {
        if (!this._isDragMode) return;
        
        const gridPos = this.worldToGridPosition(worldPosition);
        
        // 检查是否切换到新的网格
        if (!this.isGridPositionEqual(gridPos, this._currentHoverGrid)) {
            this._currentHoverGrid = gridPos;
            this.updatePreview();
        }
    }
    
    // 检查两个网格位置是否相等
    private isGridPositionEqual(pos1: GridPosition | null, pos2: GridPosition | null): boolean {
        if (pos1 === null && pos2 === null) return true;
        if (pos1 === null || pos2 === null) return false;
        return pos1.row === pos2.row && pos1.col === pos2.col;
    }
    
    // 更新预览显示
    private updatePreview(): void {
        if (!this._previewGraphics) return;
        
        this._previewGraphics.clear();
        
        if (!this._currentHoverGrid) return;
        
        const worldPos = this.gridToWorldPosition(this._currentHoverGrid);
        const canDeploy = this.canDeployAt(this._currentHoverGrid);
        
        // 根据是否可部署选择颜色
        const color = canDeploy ? 
            new Color(0, 255, 0, 150) :  // 绿色半透明 - 可部署
            new Color(255, 0, 0, 150);   // 红色半透明 - 不可部署
        
        // 绘制高亮网格
        this.drawHighlightGrid(worldPos, color, canDeploy);
    }
    
    // 绘制高亮网格
    private drawHighlightGrid(worldPos: Vec3, color: Color, canDeploy: boolean): void {
        if (!this._previewGraphics) return;
        
        const halfCell = this.cellSize / 2;
        
        // 绘制填充背景和边框（一条路径）
        this._previewGraphics.rect(
            worldPos.x - halfCell, 
            worldPos.y - halfCell, 
            this.cellSize, 
            this.cellSize
        );
        
        // 填充
        this._previewGraphics.fillColor = color;
        this._previewGraphics.fill();
        
        // 描边
        const borderColor = canDeploy ? 
            new Color(0, 200, 0, 255) :  // 深绿色 - 可部署
            new Color(200, 0, 0, 255);   // 深红色 - 不可部署
        this._previewGraphics.strokeColor = borderColor;
        this._previewGraphics.lineWidth = 3;
        this._previewGraphics.stroke();
        
        // 如果可部署，添加额外的装饰
        if (canDeploy) {
            this.drawDeployIndicator(worldPos);
        } else {
            this.drawForbiddenIndicator(worldPos);
        }
    }
    
    // 绘制部署指示器（可部署时）
    private drawDeployIndicator(worldPos: Vec3): void {
        if (!this._previewGraphics) return;
        
        const indicatorSize = this.cellSize * 0.3;
        
        // 绘制加号符号
        this._previewGraphics.strokeColor = new Color(0, 150, 0, 255);
        this._previewGraphics.lineWidth = 4;
        
        // 横线
        this._previewGraphics.moveTo(worldPos.x - indicatorSize/2, worldPos.y);
        this._previewGraphics.lineTo(worldPos.x + indicatorSize/2, worldPos.y);
        
        // 竖线
        this._previewGraphics.moveTo(worldPos.x, worldPos.y - indicatorSize/2);
        this._previewGraphics.lineTo(worldPos.x, worldPos.y + indicatorSize/2);
        
        this._previewGraphics.stroke();
    }
    
    // 绘制禁止指示器（不可部署时）
    private drawForbiddenIndicator(worldPos: Vec3): void {
        if (!this._previewGraphics) return;
        
        const indicatorSize = this.cellSize * 0.4;
        
        // 绘制X符号
        this._previewGraphics.strokeColor = new Color(150, 0, 0, 255);
        this._previewGraphics.lineWidth = 4;
        
        // 左上到右下的斜线
        this._previewGraphics.moveTo(worldPos.x - indicatorSize/2, worldPos.y - indicatorSize/2);
        this._previewGraphics.lineTo(worldPos.x + indicatorSize/2, worldPos.y + indicatorSize/2);
        
        // 右上到左下的斜线
        this._previewGraphics.moveTo(worldPos.x + indicatorSize/2, worldPos.y - indicatorSize/2);
        this._previewGraphics.lineTo(worldPos.x - indicatorSize/2, worldPos.y + indicatorSize/2);
        
        this._previewGraphics.stroke();
    }
    
    // 清除预览
    private clearPreview(): void {
        if (this._previewGraphics) {
            this._previewGraphics.clear();
        }
    }
    
    // 获取当前悬停的网格位置
    public getCurrentHoverGrid(): GridPosition | null {
        return this._currentHoverGrid;
    }
    
    // 检查是否在拖拽模式
    public isDragMode(): boolean {
        return this._isDragMode;
    }
    
    // 添加update方法来处理动画
    protected update(dt: number): void {
        if (this._isDragMode) {
            this._previewAnimationTimer += dt;
            this.updatePreviewAnimation();
        }
    }
    
    // 更新预览动画效果
    private updatePreviewAnimation(): void {
        if (!this._previewGraphics || !this._currentHoverGrid) return;
        
        // 创建呼吸效果：通过改变透明度来实现脉动效果
        const pulseSpeed = 3.0; // 脉动速度
        const alpha = 0.3 + 0.2 * Math.sin(this._previewAnimationTimer * pulseSpeed);
        
        // 重新绘制预览，应用新的透明度
        this.updatePreviewWithAlpha(alpha);
    }
    
    // 使用指定透明度更新预览
    private updatePreviewWithAlpha(alpha: number): void {
        if (!this._previewGraphics || !this._currentHoverGrid) return;
        
        this._previewGraphics.clear();
        
        const worldPos = this.gridToWorldPosition(this._currentHoverGrid);
        const canDeploy = this.canDeployAt(this._currentHoverGrid);
        
        // 根据是否可部署选择颜色，应用动态透明度
        const color = canDeploy ? 
            new Color(0, 255, 0, Math.floor(alpha * 255)) :  
            new Color(255, 0, 0, Math.floor(alpha * 255));   
        
        // 绘制带动画效果的高亮网格
        this.drawHighlightGrid(worldPos, color, canDeploy);
    }
    
    // 静态实例（为了让其他组件能访问）
    private static _instance: GridDeploymentSystem | null = null;
    
    public static get instance(): GridDeploymentSystem | null {
        return GridDeploymentSystem._instance;
    }
    
    
    
    
    
    
    
    
    // 获取网格统计信息
    public getGridStats(): {
        totalSlots: number;
        occupiedSlots: number;
        availableSlots: number;
        occupancyRate: number;
    } {
        let occupiedCount = 0;
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridColumns; col++) {
                if (this._gridData[row][col].state === GridSlotState.OCCUPIED) {
                    occupiedCount++;
                }
            }
        }
        
        const total = this.totalSlots;
        const available = total - occupiedCount;
        const occupancyRate = total > 0 ? (occupiedCount / total) * 100 : 0;
        
        return {
            totalSlots: total,
            occupiedSlots: occupiedCount,
            availableSlots: available,
            occupancyRate: occupancyRate
        };
    }
    
}