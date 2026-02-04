# 游戏截图添加指南 / Screenshot Guide

## 📸 如何添加游戏截图

### 第一步：保存图片

请将你刚才提供的4张图片保存到 `docs/screenshots/` 目录，使用以下文件名：

#### 图片1：战斗场景 - 钢甲鼠
- **文件名**: `gameplay-armored-mouse.png`
- **描述**: 第1/3波，装备精良的英雄对战钢甲鼠
- **特色**: 展示了橘猫射手、缅因雷法师、矮毛骑士等英雄

#### 图片2：战斗场景 - 巨鼠BOSS
- **文件名**: `gameplay-boss-giant.png`
- **描述**: 第1/3波精英训练，对战巨鼠BOSS
- **特色**: 展示了多个英雄协同作战的场景

#### 图片3：早期波次战斗
- **文件名**: `gameplay-early-waves.png`
- **描述**: 第3/3波，对战小老鼠和疾风鼠
- **特色**: 展示了基础敌人和英雄部署

#### 图片4：游戏二维码
- **文件名**: `qrcode-minigame.png`
- **描述**: 微信小程序二维码
- **用途**: 玩家可以扫码试玩

### 第二步：保存图片的方法

#### 方法1：从聊天记录保存（推荐）
1. 在聊天界面点击图片查看大图
2. 右键点击图片
3. 选择"图片另存为..."
4. 导航到项目的 `docs/screenshots/` 目录
5. 使用上述建议的文件名保存

#### 方法2：使用命令行
```bash
# 进入截图目录
cd docs/screenshots/

# 将你下载的图片移动到这里
mv ~/Downloads/图片1.png gameplay-armored-mouse.png
mv ~/Downloads/图片2.png gameplay-boss-giant.png
mv ~/Downloads/图片3.png gameplay-early-waves.png
mv ~/Downloads/图片4.png qrcode-minigame.png
```

### 第三步：验证图片

保存完成后，验证图片是否在正确位置：

```bash
ls -lh docs/screenshots/
```

应该看到：
```
gameplay-armored-mouse.png
gameplay-boss-giant.png
gameplay-early-waves.png
qrcode-minigame.png
README.md
```

### 第四步：提交到Git

图片保存完成后，提交到Git仓库：

```bash
# 查看新增的图片
git status

# 添加图片
git add docs/screenshots/*.png

# 提交
git commit -m "docs: add game screenshots and QR code

- Add 3 gameplay screenshots showing different battle scenarios
- Add WeChat Mini Program QR code for online play
- Update README.md with screenshot gallery

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 推送（如果需要）
git push origin feat/resource_improve
```

## 📝 README已更新

README.md 已经更新，包含了截图展示部分：

- ✅ 英文版截图展示（带表格布局）
- ✅ 中文版截图展示（带表格布局）
- ✅ 图片说明和链接

## 🎯 注意事项

1. **图片格式**: 推荐使用PNG格式以保持最佳质量
2. **图片大小**: 每张图片尽量控制在2MB以内
3. **文件命名**: 使用英文，用连字符(-)分隔单词
4. **版权**: 确保所有截图都是你自己的游戏截图

## ✨ 效果预览

保存图片后，README.md将显示精美的游戏截图画廊，包括：
- 🎮 3张战斗场景截图
- 📱 1个微信小程序二维码
- 📖 中英文双语说明

这将大大提升项目的视觉吸引力！

## 🐛 问题排查

### 图片不显示？
1. 检查文件名是否正确（区分大小写）
2. 检查文件是否在 `docs/screenshots/` 目录
3. 确认图片格式是PNG或JPG

### 提交后图片在GitHub上看不到？
1. 确认图片已通过 `git add` 添加
2. 确认图片已通过 `git commit` 提交
3. 确认已通过 `git push` 推送到远程仓库

---

完成这些步骤后，你的项目就有了完整的视觉展示啦！🎉
