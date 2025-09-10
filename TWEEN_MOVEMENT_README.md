# Tween移动系统重构说明

## 已完成的重构

### BaseMouse基类
- ✅ 移除了逐帧移动系统（update中的移动逻辑）
- ✅ 新增Tween移动控制属性
- ✅ 实现`startMovementTowardsCastle()`基础方法
- ✅ 实现`createMovementTween()`基础缓动创建
- ✅ 新增移动控制方法：`stopMovement()`, `pauseMovement()`, `resumeMovement()`

### BasicMouse子类
- ✅ 重写`startMovementTowardsCastle()`实现蜿蜒移动
- ✅ 新增三种移动模式：zigzag（Z字形）、curves（S形曲线）、spiral（螺旋）
- ✅ 实现链式缓动动画，支持多段路径移动
- ✅ 根据移动模式自动选择合适的缓动效果

## 新移动系统特性

### 1. 性能提升
- **旧系统**: 每帧计算位置，CPU密集型
- **新系统**: 使用引擎优化的Tween系统，性能更佳

### 2. 视觉效果
- **zigzag模式**: 使用`sineInOut`缓动，平滑的Z字形移动
- **curves模式**: 使用`cubicInOut`缓动，流畅的S形曲线
- **spiral模式**: 使用`quadInOut`缓动，螺旋下降效果

### 3. 移动控制
```typescript
// 获取移动状态
mouse.isMoving // boolean
mouse.movementStarted // boolean

// 控制移动
mouse.stopMovement() // 停止移动
mouse.pauseMovement() // 暂停移动  
mouse.resumeMovement() // 恢复移动
```

## 测试建议

### 1. 基础功能测试
- [ ] 验证BasicMouse能正常生成并移动到城堡
- [ ] 验证三种移动模式（zigzag/curves/spiral）的视觉效果
- [ ] 验证老鼠被攻击后移动不受影响
- [ ] 验证老鼠死亡时正确停止移动

### 2. 性能测试
- [ ] 对比旧系统：生成20只BasicMouse的性能表现
- [ ] 验证Tween系统的内存占用情况
- [ ] 检查是否有Tween泄漏（老鼠死亡后是否正确清理）

### 3. 边界情况测试
- [ ] 验证屏幕边界限制（maxX = 300）
- [ ] 验证城堡距离检测（阈值 = 50）
- [ ] 验证移动中途被销毁的情况

## 其他老鼠类的迁移

当前只有`BasicMouse`完成了重构，其他老鼠类仍使用旧移动系统：

### 需要更新的类
- `FastMouse` - 应该使用更快的缓动效果（如`quadIn`）
- `GiantMouse` - 应该使用更慢的缓动效果（如`quadOut`）
- `ArmoredMouse` - 可以使用带有"重量感"的缓动（如`backOut`）
- `StealthMouse` - 可以使用不规则的移动路径
- 其他BOSS类老鼠 - 各自实现特色移动模式

### 迁移步骤
1. 移除旧的移动相关属性和方法
2. 重写`startMovementTowardsCastle()`方法
3. 根据老鼠特性选择合适的缓动效果
4. 实现特殊的移动模式（如BOSS的复杂路径）

## 代码质量检查

### 已解决的问题
- ✅ 移除了update()中的性能密集计算
- ✅ 统一了移动控制接口
- ✅ 简化了移动状态管理
- ✅ 提供了更丰富的视觉效果

### 注意事项
- 确保所有Tween在节点销毁前正确停止
- 新移动模式的参数需要游戏平衡性测试
- 其他老鼠类需要逐步迁移到新系统