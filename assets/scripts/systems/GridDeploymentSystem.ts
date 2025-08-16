import { _decorator, Component, Node, Vec3, Graphics, Color } from 'cc';
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
        
        console.log(`网格部署系统初始化完成: ${this.gridColumns}x${this.gridRows}, 单元格大小: ${this.cellSize}`);
    }
    
    protected onDestroy(): void {
        if (GridDeploymentSystem._instance === this) {
            GridDeploymentSystem._instance = null;
        }
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
        // 使用游戏常量中的网格配置
        const gridConfig = GAME_CONSTANTS;
        
        // 计算网格总尺寸
        const totalWidth = this.gridColumns * this.cellSize;
        const totalHeight = this.gridRows * this.cellSize;
        
        // 设置网格起始位置（左上角）
        this._gridStartPos.set(
            -totalWidth / 2,
            gridConfig.GRID_OFFSET_Y + totalHeight / 2,
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
    
    // 部署英雄到指定网格位置
    public deployHero(heroNode: Node, gridPos: GridPosition): boolean {
        if (!this.canDeployAt(gridPos)) {
            return false;
        }
        
        const slot = this._gridData[gridPos.row][gridPos.col];
        slot.state = GridSlotState.OCCUPIED;
        slot.heroNode = heroNode;
        
        // 移动英雄到网格位置
        heroNode.setPosition(slot.worldPosition);
        
        console.log(`英雄部署成功: 位置(${gridPos.row}, ${gridPos.col})`);
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
    
    // 绘制调试网格
    private drawDebugGrid(): void {
        if (!this._debugGraphics) return;
        
        this._debugGraphics.clear();
        this._debugGraphics.strokeColor = Color.GREEN;
        this._debugGraphics.lineWidth = 1;
        
        // 绘制网格线
        for (let row = 0; row <= this.gridRows; row++) {
            const y = this._gridStartPos.y - row * this.cellSize;
            this._debugGraphics.moveTo(this._gridStartPos.x, y);
            this._debugGraphics.lineTo(this._gridStartPos.x + this.gridColumns * this.cellSize, y);
        }
        
        for (let col = 0; col <= this.gridColumns; col++) {
            const x = this._gridStartPos.x + col * this.cellSize;
            this._debugGraphics.moveTo(x, this._gridStartPos.y);
            this._debugGraphics.lineTo(x, this._gridStartPos.y - this.gridRows * this.cellSize);
        }
        
        this._debugGraphics.stroke();
        
        // 绘制槽位状态
        this.drawSlotStates();
    }
    
    // 绘制槽位状态
    private drawSlotStates(): void {
        if (!this._debugGraphics) return;
        
        const halfCell = this.cellSize * 0.4;
        
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridColumns; col++) {
                const slot = this._gridData[row][col];
                const pos = slot.worldPosition;
                
                // 根据状态设置颜色
                switch (slot.state) {
                    case GridSlotState.EMPTY:
                        this._debugGraphics.fillColor = new Color(0, 255, 0, 100);
                        break;
                    case GridSlotState.OCCUPIED:
                        this._debugGraphics.fillColor = new Color(255, 0, 0, 150);
                        break;
                    case GridSlotState.FORBIDDEN:
                        this._debugGraphics.fillColor = new Color(0, 0, 0, 200);
                        break;
                }
                
                // 绘制槽位状态矩形
                this._debugGraphics.rect(
                    pos.x - halfCell,
                    pos.y - halfCell,
                    halfCell * 2,
                    halfCell * 2
                );
                this._debugGraphics.fill();
            }
        }
    }
    
    // 更新调试显示
    public updateDebugDisplay(): void {
        if (this.showDebugGrid && this._debugGraphics) {
            this.drawDebugGrid();
        }
    }
    
    // 静态实例（为了让其他组件能访问）
    private static _instance: GridDeploymentSystem | null = null;
    
    public static get instance(): GridDeploymentSystem | null {
        return GridDeploymentSystem._instance;
    }
    
}