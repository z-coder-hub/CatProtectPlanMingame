# 网格拖拽动画功能实现

## 🎯 功能概述

为网格部署系统添加了丰富的拖拽预览动画效果，让玩家在拖拽英雄时能够清楚地看到部署位置和是否可以部署。

---

## ✨ 主要功能特性

### 1. 拖拽预览模式
- **启动时机**: 玩家开始拖拽英雄按钮时
- **视觉效果**: 
  - 绿色半透明网格 + 绿色边框 + 加号指示器 (可部署)
  - 红色半透明网格 + 红色边框 + X标记指示器 (不可部署)
- **动画效果**: 呼吸效果 - 透明度脉动变化

### 2. 实时位置追踪
- **坐标转换**: UI坐标自动转换为游戏世界坐标
- **网格检测**: 实时检测鼠标悬停的网格位置
- **状态更新**: 动态显示当前网格的部署状态

### 3. 视觉指示器
```typescript
// 可部署指示器 - 绿色加号
drawDeployIndicator(worldPos: Vec3): void {
    // 绘制加号符号
    this._previewGraphics.strokeColor = new Color(0, 150, 0, 255);
    // 横线和竖线
}

// 禁止部署指示器 - 红色X
drawForbiddenIndicator(worldPos: Vec3): void {
    // 绘制X符号  
    this._previewGraphics.strokeColor = new Color(150, 0, 0, 255);
    // 两条对角线
}
```

---

## 🏗️ 技术实现

### GridDeploymentSystem 扩展

#### 新增属性
```typescript
// 拖拽预览相关
private _previewGraphics: Graphics | null = null;
private _currentHoverGrid: GridPosition | null = null;
private _isDragMode: boolean = false;
private _previewAnimationTimer: number = 0;
```

#### 核心方法

**1. 拖拽模式控制**
```typescript
// 开始拖拽模式
public startDragMode(): void {
    this._isDragMode = true;
    this._previewAnimationTimer = 0;
}

// 结束拖拽模式  
public endDragMode(): void {
    this._isDragMode = false;
    this._currentHoverGrid = null;
    this.clearPreview();
}
```

**2. 位置更新和预览**
```typescript
// 更新鼠标悬停位置
public updateHoverPosition(worldPosition: Vec3): void {
    const gridPos = this.worldToGridPosition(worldPosition);
    if (!this.isGridPositionEqual(gridPos, this._currentHoverGrid)) {
        this._currentHoverGrid = gridPos;
        this.updatePreview();
    }
}
```

**3. 动画系统**
```typescript
// 呼吸动画效果
private updatePreviewAnimation(): void {
    const pulseSpeed = 3.0; // 脉动速度
    const alpha = 0.3 + 0.2 * Math.sin(this._previewAnimationTimer * pulseSpeed);
    this.updatePreviewWithAlpha(alpha);
}
```

### HeroDeployment 集成

#### 拖拽流程集成
```typescript
// 开始拖拽时启动网格预览
private startHeroDrag(): void {
    const gridSystem = GridDeploymentSystem.instance;
    if (gridSystem) {
        gridSystem.startDragMode(); // 🔥 启动网格预览
    }
}

// 拖拽移动时更新网格位置
private updateDragPreview(event: EventTouch): void {
    const gridSystem = GridDeploymentSystem.instance;
    if (gridSystem) {
        const gameWorldPos = this.convertUIToGameWorld(worldPos);
        gridSystem.updateHoverPosition(gameWorldPos); // 🔥 更新预览
    }
}

// 结束拖拽时关闭网格预览
private cleanupDragState(): void {
    const gridSystem = GridDeploymentSystem.instance;
    if (gridSystem) {
        gridSystem.endDragMode(); // 🔥 关闭网格预览
    }
}
```

---

## 🎨 视觉设计

### 颜色方案
| 状态 | 背景色 | 边框色 | 指示器色 | 透明度 |
|------|--------|--------|----------|--------|
| 可部署 | 绿色(0,255,0) | 深绿色(0,200,0) | 深绿色(0,150,0) | 动态(0.1-0.5) |
| 不可部署 | 红色(255,0,0) | 深红色(200,0,0) | 深红色(150,0,0) | 动态(0.1-0.5) |

### 动画参数
```typescript
const pulseSpeed = 3.0;  // 呼吸效果速度
const alpha = 0.3 + 0.2 * Math.sin(timer * pulseSpeed); // 透明度范围: 0.1-0.5
```

### 指示器设计
- **可部署**: 十字加号 (30% cellSize)
- **不可部署**: X叉号 (40% cellSize)
- **线条宽度**: 4px
- **居中显示**: 位于网格中心

---

## 🔧 坐标系统

### 坐标转换链
```
触摸屏幕坐标 → UI坐标系 → 游戏世界坐标 → 网格坐标
```

### 关键转换方法
```typescript
// UI坐标转游戏世界坐标
private convertUIToGameWorld(uiPos: Vec3): Vec3 | null {
    return new Vec3(uiPos.x, uiPos.y, 0);
}

// 游戏世界坐标转网格坐标  
public worldToGridPosition(worldPos: Vec3): GridPosition | null {
    const col = Math.floor((worldPos.x - this._gridStartPos.x) / this.cellSize);
    const row = Math.floor((this._gridStartPos.y - worldPos.y) / this.cellSize);
    return this.isValidGridPosition({ row, col }) ? { row, col } : null;
}
```

---

## 📊 性能优化

### 渲染优化
- **分层渲染**: 预览Graphics设置为最高层级 (setSiblingIndex(999))
- **按需更新**: 只在网格位置变化时重新绘制
- **状态缓存**: 缓存当前悬停网格，避免重复计算

### 动画优化
- **60FPS更新**: update方法中处理动画逻辑
- **数学优化**: 使用sin函数实现平滑的呼吸效果
- **内存管理**: 及时清理Graphics内容，避免内存泄漏

---

## 🎮 用户体验提升

### 视觉反馈层次
1. **拖拽开始**: 网格预览模式激活
2. **鼠标移动**: 实时高亮显示目标网格
3. **状态变化**: 颜色和指示器动态切换
4. **动画效果**: 呼吸脉动增加视觉吸引力
5. **拖拽结束**: 预览清除，回到正常状态

### 交互直观性
- ✅ **绿色系**: 直观表示"可以"部署
- ❌ **红色系**: 清晰表示"不能"部署  
- ➕ **加号**: 部署位置指示
- ❌ **X号**: 禁止部署警告
- 🌊 **脉动**: 吸引注意力，增加动感

---

## 🔍 测试验证

### 功能测试点
1. **拖拽启动**: 确认网格预览正确开启
2. **位置追踪**: 验证鼠标移动时网格高亮正确
3. **状态识别**: 测试可部署/不可部署的正确显示
4. **动画流畅**: 确认呼吸效果平滑运行
5. **拖拽结束**: 验证预览正确清除

### 边界情况
- 拖拽到网格外区域的处理
- 快速移动鼠标的响应性
- 多次连续拖拽的状态清理
- 拖拽中途取消的清理

---

## 🚀 扩展可能性

### 高级动画效果
- **粒子效果**: 可部署位置的星光粒子
- **缩放动画**: 网格格子的缩放反馈
- **路径预览**: 显示英雄的攻击范围

### 智能提示
- **最佳位置**: 高亮推荐的部署位置
- **冲突提醒**: 显示与现有英雄的配合关系
- **资源提示**: 显示部署成本和剩余金币

### 触觉反馈
- **震动反馈**: 在移动设备上添加触觉反馈
- **音效配合**: 拖拽时的音效提示

---

## 📋 实现总结

这个功能通过以下几个关键点实现了优秀的用户体验：

✅ **视觉直观**: 绿色/红色的明确视觉反馈  
✅ **动画流畅**: 60FPS的呼吸动画效果  
✅ **响应及时**: 实时的位置追踪和状态更新  
✅ **性能优化**: 按需渲染和状态缓存  
✅ **扩展性强**: 模块化设计便于后续功能扩展  

该功能显著提升了游戏的操作体验，让玩家能够更直观、更准确地进行英雄部署操作。

---

*功能版本: v1.0*  
*实现时间: 2025-08-17*  
*状态: 已完成*