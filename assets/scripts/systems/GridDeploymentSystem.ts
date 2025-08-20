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
    
    // ==================== 配置属性 ====================
    
    @property({ tooltip: "网格行数" })
    public gridRows: number = GAME_CONFIG.gridConfig.rows;
    
    @property({ tooltip: "网格列数" })  
    public gridColumns: number = GAME_CONFIG.gridConfig.cols;
    
    @property({ tooltip: "单元格大小" })
    public cellSize: number = GAME_CONFIG.gridConfig.cellSize;
    
    @property({ tooltip: "是否显示调试网格" })
    public showDebugGrid: boolean = true;
    
    // ==================== 私有成员变量 ====================
    
    // 网格数据存储
    private _gridData: GridSlot[][] = [];
    private _gridStartPos: Vec3 = new Vec3();
    
    // 图形渲染组件
    private _debugGraphics: Graphics | null = null;
    private _previewGraphics: Graphics | null = null;
    
    // 拖拽预览状态
    private _currentHoverGrid: GridPosition | null = null;
    private _isDragMode: boolean = false;
    private _previewAnimationTimer: number = 0;
    
    // 单例实例
    private static _instance: GridDeploymentSystem | null = null;
    
    // ==================== 静态单例访问 ====================
    
    /**
     * 获取网格部署系统的单例实例
     * @returns GridDeploymentSystem实例或null
     */
    public static get instance(): GridDeploymentSystem | null {
        return GridDeploymentSystem._instance;
    }
    
    // ==================== 计算属性 ====================
    
    /**
     * 获取网格总槽位数量
     * @returns 总槽位数
     */
    public get totalSlots(): number {
        return this.gridRows * this.gridColumns;
    }
    
    /**
     * 获取当前可用的空闲槽位数量
     * @returns 空闲槽位数
     */
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
    
    // ==================== 组件生命周期 ====================
    
    /**
     * 组件加载时初始化网格系统
     */
    protected onLoad(): void {
        GridDeploymentSystem._instance = this;
        
        this.initializeGrid();
        this.calculateGridBounds();
        
        if (this.showDebugGrid) {
            this.createDebugGraphics();
        }
        
        // 创建拖拽预览Graphics
        this.createPreviewGraphics();
        
        console.log(`网格部署系统初始化完成: ${this.gridColumns}x${this.gridRows}, 单元格大小: ${this.cellSize}`);
    }
    
    /**
     * 组件销毁时清理资源
     */
    protected onDestroy(): void {
        if (GridDeploymentSystem._instance === this) {
            GridDeploymentSystem._instance = null;
        }
        
        console.log('网格系统销毁完成');
    }
    
    /**
     * 每帧更新，处理拖拽预览动画
     * @param dt 帧时间间隔
     */
    protected update(dt: number): void {
        if (this._isDragMode) {
            this._previewAnimationTimer += dt;
            this.updatePreviewAnimation();
        }
    }
    
    // ==================== 系统初始化 ====================
    
    /**
     * 初始化网格数据结构
     * 创建二维数组存储所有网格槽位信息
     */
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
    
    /**
     * 计算网格的边界和每个槽位的世界坐标
     * 根据网格配置计算起始位置和各槽位的实际坐标
     */
    private calculateGridBounds(): void {
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
    
    // ==================== 坐标转换系统 ====================
    
    /**
     * 将网格坐标转换为世界坐标
     * @param gridPos 网格坐标 {row, col}
     * @returns 对应的世界坐标Vec3
     */
    public gridToWorldPosition(gridPos: GridPosition): Vec3 {
        const x = this._gridStartPos.x + (gridPos.col + 0.5) * this.cellSize;
        const y = this._gridStartPos.y - (gridPos.row + 0.5) * this.cellSize;
        return new Vec3(x, y, 0);
    }
    
    /**
     * 将世界坐标转换为网格坐标
     * @param worldPos 世界坐标Vec3
     * @returns 对应的网格坐标或null（如果超出范围）
     */
    public worldToGridPosition(worldPos: Vec3): GridPosition | null {
        const col = Math.floor((worldPos.x - this._gridStartPos.x) / this.cellSize);
        const row = Math.floor((this._gridStartPos.y - worldPos.y) / this.cellSize);
        
        if (this.isValidGridPosition({ row, col })) {
            return { row, col };
        }
        return null;
    }
    
    /**
     * 检查网格坐标是否在有效范围内
     * @param gridPos 要检查的网格坐标
     * @returns 坐标是否有效
     */
    public isValidGridPosition(gridPos: GridPosition): boolean {
        return gridPos.row >= 0 && gridPos.row < this.gridRows &&
               gridPos.col >= 0 && gridPos.col < this.gridColumns;
    }
    
    // ==================== 英雄部署管理 ====================
    
    /**
     * 检查指定网格位置是否可以部署英雄
     * @param gridPos 网格坐标
     * @returns 是否可以部署
     */
    public canDeployAt(gridPos: GridPosition): boolean {
        if (!this.isValidGridPosition(gridPos)) {
            return false;
        }
        return this._gridData[gridPos.row][gridPos.col].state === GridSlotState.EMPTY;
    }
    
    /**
     * 检查是否可以在指定位置部署英雄（兼容方法）
     * @param row 行索引
     * @param col 列索引
     * @returns 是否可以部署
     */
    public canDeployHero(row: number, col: number): boolean {
        return this.canDeployAt({ row, col });
    }
    
    /**
     * 部署英雄到指定网格位置
     * 支持两种调用方式：deployHero(node, {row, col}) 和 deployHero(node, row, col)
     * @param heroNode 英雄节点
     * @param gridPos 网格坐标对象或行索引
     * @param col 列索引（当第二个参数为行索引时使用）
     * @returns 部署是否成功
     */
    public deployHero(heroNode: Node, gridPos: GridPosition | number, col?: number): boolean {
        // 兼容两种调用方式
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
    
    /**
     * 移除指定位置的英雄
     * @param gridPos 网格坐标
     * @returns 被移除的英雄节点或null
     */
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
    
    /**
     * 查找指定英雄节点在网格中的位置
     * @param heroNode 要查找的英雄节点
     * @returns 网格坐标或null（如果未找到）
     */
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
    
    /**
     * 根据英雄节点从网格中清理该英雄
     * @param heroNode 要清理的英雄节点
     * @returns 清理是否成功
     */
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
    
    /**
     * 清理所有网格位置的英雄（波次重置时使用）
     */
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
    
    // ==================== 数据查询系统 ====================
    
    /**
     * 获取所有已部署的英雄节点列表
     * @returns 英雄节点数组
     */
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
    
    /**
     * 获取指定位置范围内的所有英雄
     * @param centerPos 中心位置
     * @param radius 搜索半径
     * @returns 范围内的英雄节点数组
     */
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
    
    /**
     * 获取网格的统计信息
     * @returns 包含总槽位、已占用、可用槽位和占用率的统计对象
     */
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
    
    // ==================== 调试可视化系统 ====================
    
    /**
     * 创建调试网格的图形组件
     */
    private createDebugGraphics(): void {
        const debugNode = new Node("GridDebug");
        debugNode.parent = this.node;
        
        this._debugGraphics = debugNode.addComponent(Graphics);
        this.drawDebugGrid();
    }
    
    /**
     * 绘制调试网格的主方法
     */
    private drawDebugGrid(): void {
        if (!this._debugGraphics) return;
        
        this._debugGraphics.clear();
        this._debugGraphics.strokeColor = Color.WHITE;
        this._debugGraphics.lineWidth = 2;
        
        this.drawImprovedDashedGrid();
    }
    
    /**
     * 绘制改进的虚线网格
     * 使用虚线效果增强视觉效果
     */
    private drawImprovedDashedGrid(): void {
        if (!this._debugGraphics) return;
        
        const dashLength = 6;
        const gapLength = 6;
        
        this._debugGraphics.moveTo(0, 0);
        
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
        
        this._debugGraphics.stroke();
    }
    
    /**
     * 绘制连续的虚线段
     * @param x1 起始X坐标
     * @param y1 起始Y坐标
     * @param x2 结束X坐标
     * @param y2 结束Y坐标
     * @param dashLength 虚线段长度
     * @param gapLength 间隔长度
     */
    private drawContinuousDashedLine(x1: number, y1: number, x2: number, y2: number, dashLength: number, gapLength: number): void {
        if (!this._debugGraphics) return;
        
        const totalLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        
        const dirX = (x2 - x1) / totalLength;
        const dirY = (y2 - y1) / totalLength;
        
        let currentDistance = 0;
        let isDrawing = true;
        
        while (currentDistance < totalLength) {
            const segmentLength = isDrawing ? dashLength : gapLength;
            const segmentEnd = Math.min(currentDistance + segmentLength, totalLength);
            
            const startX = x1 + dirX * currentDistance;
            const startY = y1 + dirY * currentDistance;
            const endX = x1 + dirX * segmentEnd;
            const endY = y1 + dirY * segmentEnd;
            
            if (isDrawing) {
                this._debugGraphics.moveTo(startX, startY);
                this._debugGraphics.lineTo(endX, endY);
            }
            
            currentDistance = segmentEnd;
            isDrawing = !isDrawing;
        }
    }
    
    /**
     * 更新调试显示
     * 在网格状态发生变化时调用
     */
    public updateDebugDisplay(): void {
        if (this.showDebugGrid && this._debugGraphics) {
            this.drawDebugGrid();
        }
    }
    
    // ==================== 拖拽预览系统 ====================
    
    /**
     * 创建拖拽预览的图形组件
     */
    private createPreviewGraphics(): void {
        const previewNode = new Node("GridPreview");
        previewNode.parent = this.node;
        
        this._previewGraphics = previewNode.addComponent(Graphics);
        // 设置较高的渲染层级，确保预览在网格之上
        previewNode.setSiblingIndex(999);
    }
    
    /**
     * 开始拖拽模式
     * 激活网格预览功能
     */
    public startDragMode(): void {
        this._isDragMode = true;
        this._previewAnimationTimer = 0;
        console.log("网格拖拽模式已开启");
    }
    
    /**
     * 结束拖拽模式
     * 清理预览状态
     */
    public endDragMode(): void {
        this._isDragMode = false;
        this._currentHoverGrid = null;
        this.clearPreview();
        console.log("网格拖拽模式已关闭");
    }
    
    /**
     * 更新鼠标悬停位置
     * @param worldPosition 鼠标的世界坐标
     */
    public updateHoverPosition(worldPosition: Vec3): void {
        if (!this._isDragMode) return;
        
        const gridPos = this.worldToGridPosition(worldPosition);
        
        // 检查是否切换到新的网格
        if (!this.isGridPositionEqual(gridPos, this._currentHoverGrid)) {
            this._currentHoverGrid = gridPos;
            this.updatePreview();
        }
    }
    
    /**
     * 检查两个网格位置是否相等
     * @param pos1 第一个位置
     * @param pos2 第二个位置
     * @returns 位置是否相等
     */
    private isGridPositionEqual(pos1: GridPosition | null, pos2: GridPosition | null): boolean {
        if (pos1 === null && pos2 === null) return true;
        if (pos1 === null || pos2 === null) return false;
        return pos1.row === pos2.row && pos1.col === pos2.col;
    }
    
    /**
     * 更新预览显示
     * 根据当前悬停位置绘制预览效果
     */
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
        
        this.drawHighlightGrid(worldPos, color, canDeploy);
    }
    
    /**
     * 获取当前悬停的网格位置
     * @returns 当前悬停位置或null
     */
    public getCurrentHoverGrid(): GridPosition | null {
        return this._currentHoverGrid;
    }
    
    /**
     * 检查是否处于拖拽模式
     * @returns 是否在拖拽模式
     */
    public isDragMode(): boolean {
        return this._isDragMode;
    }
    
    /**
     * 清除预览显示
     */
    private clearPreview(): void {
        if (this._previewGraphics) {
            this._previewGraphics.clear();
        }
    }
    
    // ==================== 图形绘制系统 ====================
    
    /**
     * 绘制高亮网格
     * @param worldPos 世界坐标位置
     * @param color 填充颜色
     * @param canDeploy 是否可部署
     */
    private drawHighlightGrid(worldPos: Vec3, color: Color, canDeploy: boolean): void {
        if (!this._previewGraphics) return;
        
        const halfCell = this.cellSize / 2;
        
        // 绘制填充背景和边框
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
        
        // 添加状态指示器
        if (canDeploy) {
            this.drawDeployIndicator(worldPos);
        } else {
            this.drawForbiddenIndicator(worldPos);
        }
    }
    
    /**
     * 绘制部署指示器（可部署时显示加号）
     * @param worldPos 世界坐标位置
     */
    private drawDeployIndicator(worldPos: Vec3): void {
        if (!this._previewGraphics) return;
        
        const indicatorSize = this.cellSize * 0.3;
        
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
    
    /**
     * 绘制禁止指示器（不可部署时显示X）
     * @param worldPos 世界坐标位置
     */
    private drawForbiddenIndicator(worldPos: Vec3): void {
        if (!this._previewGraphics) return;
        
        const indicatorSize = this.cellSize * 0.4;
        
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
    
    // ==================== 动画系统 ====================
    
    /**
     * 更新预览动画效果
     * 创建呼吸效果的脉动动画
     */
    private updatePreviewAnimation(): void {
        if (!this._previewGraphics || !this._currentHoverGrid) return;
        
        const pulseSpeed = 3.0;
        const alpha = 0.3 + 0.2 * Math.sin(this._previewAnimationTimer * pulseSpeed);
        
        this.updatePreviewWithAlpha(alpha);
    }
    
    /**
     * 使用指定透明度更新预览
     * @param alpha 透明度值 (0-1)
     */
    private updatePreviewWithAlpha(alpha: number): void {
        if (!this._previewGraphics || !this._currentHoverGrid) return;
        
        this._previewGraphics.clear();
        
        const worldPos = this.gridToWorldPosition(this._currentHoverGrid);
        const canDeploy = this.canDeployAt(this._currentHoverGrid);
        
        // 根据是否可部署选择颜色，应用动态透明度
        const color = canDeploy ? 
            new Color(0, 255, 0, Math.floor(alpha * 255)) :  
            new Color(255, 0, 0, Math.floor(alpha * 255));   
        
        this.drawHighlightGrid(worldPos, color, canDeploy);
    }
    
    
}