# 🎨 猫咪城堡防御游戏美术资源需求文档 (ARD)

**文档版本**: v1.0  
**创建日期**: 2025年1月  
**总体风格**: 卡通风格 + 温馨可爱  
**色彩基调**: 暖色调为主，鲜艳饱和

---

## 📋 目录
1. [美术风格指南](#美术风格指南)
2. [角色美术资源](#角色美术资源)
3. [敌人美术资源](#敌人美术资源)
4. [UI美术资源](#ui美术资源)
5. [场景环境资源](#场景环境资源)
6. [特效动画资源](#特效动画资源)
7. [音效资源需求](#音效资源需求)

---

## 🎨 美术风格指南

### 整体风格定位
- **风格类型**: 2D卡通风格，类似《植物大战僵尸》+ 日式可爱风格
- **色彩方案**: 以暖色调为主，橙色、粉色、黄色、绿色等饱和度较高的颜色
- **线条风格**: 圆润的线条，避免尖锐的边角
- **光影效果**: 柔和的光影，突出可爱氛围

### 设计原则
1. **可爱至上**: 所有角色设计都要体现萌萌的可爱感
2. **识别度高**: 不同单位要有明显的视觉区别，便于玩家快速识别
3. **动画友好**: 角色设计要考虑动画制作的方便性
4. **屏幕适配**: 素材要在小屏幕上清晰可见

### 技术规格
- **文件格式**: PNG (透明背景)
- **色彩深度**: 32位 RGBA
- **分辨率**: 根据不同资源类型有所区别
- **动画帧率**: 12-24 FPS
- **压缩方式**: 使用纹理压缩，保持质量与性能平衡

---

## 🐱 角色美术资源

### 1. 橘猫射手 (Orange Cat Archer)

#### 角色设计要求
- **外观特点**: 橘色毛发，圆润身材，温和表情
- **装备特征**: 手持小弓箭，背着箭筒
- **性格体现**: 专注、可靠的射手形象
- **配色方案**: 主色橘色 (#FF8C42)，辅色白色 (#FFFFFF)，装备棕色 (#8B4513)

#### 动画资源需求

**待机动画 (Idle Animation)**
```
文件名: orange_cat_idle_01.png ~ orange_cat_idle_04.png
尺寸: 128×128px
帧数: 4帧
帧间隔: 0.5秒
描述: 猫咪站立摇尾巴，偶尔眨眼睛
```

**移动动画 (Move Animation)**
```
文件名: orange_cat_move_01.png ~ orange_cat_move_06.png
尺寸: 128×128px
帧数: 6帧
帧间隔: 0.15秒
描述: 四足走路循环动画，尾巴摇摆
```

**攻击动画 (Attack Animation)**
```
文件名: orange_cat_attack_01.png ~ orange_cat_attack_08.png
尺寸: 128×128px
帧数: 8帧
帧间隔: 0.1秒
描述: 拉弓→瞄准→射箭→收弓的完整动作
```

**技能动画 (Skill Animation)**
```
文件名: orange_cat_skill_01.png ~ orange_cat_skill_12.png
尺寸: 128×128px
帧数: 12帧
帧间隔: 0.08秒
描述: 蓄力精准射击，弓箭发光特效
```

**死亡动画 (Death Animation)**
```
文件名: orange_cat_death_01.png ~ orange_cat_death_06.png
尺寸: 128×128px
帧数: 6帧
帧间隔: 0.2秒
描述: 倒下→消失的温和死亡动画
```

**头像图标**
```
文件名: orange_cat_portrait.png
尺寸: 256×256px
描述: 用于UI界面的高清头像
```

### 2. 暹罗猫法师 (Siamese Cat Mage)

#### 角色设计要求
- **外观特点**: 浅色身体配深色四肢和尾巴，优雅身材
- **装备特征**: 手持魔法杖，头戴小法师帽
- **性格体现**: 神秘、智慧的法师气质
- **配色方案**: 主色米白 (#F5F5DC)，重点色深褐 (#654321)，魔法蓝 (#4169E1)

#### 动画资源需求

**待机动画**
```
文件名: siamese_cat_idle_01.png ~ siamese_cat_idle_04.png
尺寸: 128×128px
帧数: 4帧
描述: 魔法杖轻微浮动，帽子上的星星闪烁
```

**移动动画**
```
文件名: siamese_cat_move_01.png ~ siamese_cat_move_06.png
尺寸: 128×128px
帧数: 6帧
描述: 优雅的猫步，魔法杖跟随摆动
```

**攻击动画**
```
文件名: siamese_cat_attack_01.png ~ siamese_cat_attack_08.png
尺寸: 128×128px
帧数: 8帧
描述: 举起法杖→念咒→发射魔法弹
```

**技能动画**
```
文件名: siamese_cat_skill_01.png ~ siamese_cat_skill_15.png
尺寸: 128×128px
帧数: 15帧
描述: 魔法风暴技能，法杖高举，周围魔法光环
```

**死亡动画**
```
文件名: siamese_cat_death_01.png ~ siamese_cat_death_06.png
尺寸: 128×128px
帧数: 6帧
描述: 魔法消散效果的死亡动画
```

### 3. 波斯猫辅助 (Persian Cat Support)

#### 角色设计要求
- **外观特点**: 长毛蓬松，白色或银色毛发
- **装备特征**: 手持治疗法杖，身披轻纱
- **性格体现**: 温柔、慈爱的治疗者形象
- **配色方案**: 主色纯白 (#FFFFFF)，辅色淡粉 (#FFB6C1)，治疗绿 (#90EE90)

#### 动画资源需求

**待机动画**
```
文件名: persian_cat_idle_01.png ~ persian_cat_idle_04.png
尺寸: 128×128px
帧数: 4帧
描述: 毛发轻微飘动，治疗法杖发出温和光芒
```

**移动动画**
```
文件名: persian_cat_move_01.png ~ persian_cat_move_06.png
尺寸: 128×128px
帧数: 6帧
描述: 轻盈的移动，毛发飘逸
```

**攻击动画**
```
文件名: persian_cat_attack_01.png ~ persian_cat_attack_08.png
尺寸: 128×128px
帧数: 8帧
描述: 挥动法杖发出光弹攻击
```

**技能动画**
```
文件名: persian_cat_skill_01.png ~ persian_cat_skill_10.png
尺寸: 128×128px
帧数: 10帧
描述: 治愈光环技能，身体发光，散发治疗粒子
```

### 4. 英短猫坦克 (British Shorthair Tank)

#### 角色设计要求
- **外观特点**: 圆胖身材，短毛，憨厚表情
- **装备特征**: 身穿轻型护甲，手持小盾牌
- **性格体现**: 稳重、可靠的坦克形象
- **配色方案**: 主色蓝灰 (#708090)，护甲银色 (#C0C0C0)，重点金色 (#FFD700)

#### 动画资源需求

**待机动画**
```
文件名: british_cat_idle_01.png ~ british_cat_idle_04.png
尺寸: 128×128px
帧数: 4帧
描述: 稳重站立，盾牌反光
```

**移动动画**
```
文件名: british_cat_move_01.png ~ british_cat_move_06.png
尺寸: 128×128px
帧数: 6帧
描述: 沉稳的步伐，护甲摆动
```

**攻击动画**
```
文件名: british_cat_attack_01.png ~ british_cat_attack_08.png
尺寸: 128×128px
帧数: 8帧
描述: 盾牌撞击攻击动作
```

**技能动画**
```
文件名: british_cat_skill_01.png ~ british_cat_skill_08.png
尺寸: 128×128px
帧数: 8帧
描述: 嘲讽咆哮，身体发出威慑光环
```

### 5. 缅因猫重炮 (Maine Coon Artillery)

#### 角色设计要求
- **外观特点**: 大型身材，长毛，威武表情
- **装备特征**: 手持大型火炮，身穿军官服
- **性格体现**: 威严、强大的重炮形象
- **配色方案**: 主色深棕 (#8B4513)，军服绿 (#556B2F)，火炮黑 (#2F4F4F)

#### 动画资源需求

**待机动画**
```
文件名: maine_cat_idle_01.png ~ maine_cat_idle_04.png
尺寸: 128×128px
帧数: 4帧
描述: 威武站立，火炮冒烟
```

**移动动画**
```
文件名: maine_cat_move_01.png ~ maine_cat_move_06.png
尺寸: 128×128px
帧数: 6帧
描述: 沉重的步伐，拖拽大炮
```

**攻击动画**
```
文件名: maine_cat_attack_01.png ~ maine_cat_attack_08.png
尺寸: 128×128px
帧数: 8帧
描述: 瞄准→装弹→开火的完整动作
```

**技能动画**
```
文件名: maine_cat_skill_01.png ~ maine_cat_skill_12.png
尺寸: 128×128px
帧数: 12帧
描述: 炮击轰炸技能，火炮升级变大，发射巨型炮弹
```

---

## 👹 敌人美术资源

### 1. 基础老鼠 (Basic Mouse)

#### 设计要求
- **外观特点**: 小型老鼠，灰色毛发，机灵表情
- **行为特征**: 快速移动，略带慌张
- **配色方案**: 主色灰色 (#808080)，腹部白色 (#F5F5F5)

#### 动画资源需求

**移动动画**
```
文件名: basic_mouse_move_01.png ~ basic_mouse_move_06.png
尺寸: 64×64px
帧数: 6帧
帧间隔: 0.15秒
描述: 四足奔跑，尾巴摆动
```

**攻击动画**
```
文件名: basic_mouse_attack_01.png ~ basic_mouse_attack_04.png
尺寸: 64×64px
帧数: 4帧
描述: 扑咬攻击城堡的动作
```

**死亡动画**
```
文件名: basic_mouse_death_01.png ~ basic_mouse_death_04.png
尺寸: 64×64px
帧数: 4帧
描述: 简单的倒下消失动画
```

### 2. 装甲老鼠 (Armored Mouse)

#### 设计要求
- **外观特点**: 身穿简易护甲的老鼠，比基础老鼠大
- **装备特征**: 头盔和胸甲，带有金属光泽
- **配色方案**: 灰色 (#696969) + 银色护甲 (#C0C0C0)

#### 动画资源需求

**移动动画**
```
文件名: armored_mouse_move_01.png ~ armored_mouse_move_06.png
尺寸: 80×80px
帧数: 6帧
描述: 略显沉重的移动，护甲摆动
```

**攻击动画**
```
文件名: armored_mouse_attack_01.png ~ armored_mouse_attack_04.png
尺寸: 80×80px
帧数: 4帧
描述: 用头盔撞击的攻击动作
```

**死亡动画**
```
文件名: armored_mouse_death_01.png ~ armored_mouse_death_04.png
尺寸: 80×80px
帧数: 4帧
描述: 护甲散落的死亡效果
```

### 3. 快速老鼠 (Speed Mouse)

#### 设计要求
- **外观特点**: 瘦小身材，长腿，运动员造型
- **行为特征**: 极速移动，留下残影
- **配色方案**: 主色棕色 (#D2691E)，运动服红色 (#DC143C)

#### 动画资源需求

**移动动画**
```
文件名: fast_mouse_move_01.png ~ fast_mouse_move_08.png
尺寸: 64×64px
帧数: 8帧
帧间隔: 0.08秒
描述: 高速奔跑，腿部动作夸张
```

**攻击动画**
```
文件名: fast_mouse_attack_01.png ~ fast_mouse_attack_04.png
尺寸: 64×64px
帧数: 4帧
描述: 快速连击攻击
```

### 4. 飞行蝙蝠 (Flying Bat)

#### 设计要求
- **外观特点**: 小型蝙蝠，张开翅膀
- **飞行特效**: 翅膀扇动带有风的效果
- **配色方案**: 深紫色 (#483D8B)，翅膀膜半透明

#### 动画资源需求

**飞行动画**
```
文件名: flying_bat_fly_01.png ~ flying_bat_fly_06.png
尺寸: 64×64px
帧数: 6帧
描述: 翅膀扇动的飞行循环动画
```

**攻击动画**
```
文件名: flying_bat_attack_01.png ~ flying_bat_attack_04.png
尺寸: 64×64px
帧数: 4帧
描述: 俯冲攻击动作
```

### 5. Boss鼠王 (Boss Rat King)

#### 设计要求
- **外观特点**: 大型老鼠，王者气质，戴王冠
- **装备特征**: 华丽王冠，权杖，披风
- **配色方案**: 深红色 (#8B0000)，金色装饰 (#FFD700)

#### 动画资源需求

**移动动画**
```
文件名: boss_rat_move_01.png ~ boss_rat_move_08.png
尺寸: 256×256px
帧数: 8帧
描述: 威严的王者步伐，披风飘动
```

**攻击动画**
```
文件名: boss_rat_attack_01.png ~ boss_rat_attack_12.png
尺寸: 256×256px
帧数: 12帧
描述: 挥舞权杖的强力攻击
```

**技能动画**
```
文件名: boss_rat_skill_01.png ~ boss_rat_skill_16.png
尺寸: 256×256px
帧数: 16帧
描述: 召唤小弟技能，权杖发光
```

**死亡动画**
```
文件名: boss_rat_death_01.png ~ boss_rat_death_08.png
尺寸: 256×256px
帧数: 8帧
描述: 王冠掉落的壮烈死亡动画
```

---

## 🖼️ UI美术资源

### 主界面UI

#### 背景资源
```
文件名: main_menu_bg.png
尺寸: 1080×1920px (竖屏)
描述: 温馨的猫咪主题背景，包含城堡和花园元素
色调: 暖色调，蓝天白云
```

#### 游戏Logo
```
文件名: game_logo.png
尺寸: 800×200px
描述: "猫咪城堡防御"艺术字体，带有猫爪装饰
字体: 圆润可爱的卡通字体
颜色: 渐变橙色到粉色
```

### 按钮UI资源

#### 标准按钮 (9宫格切片)
```
普通状态: button_normal.png (200×80px)
按下状态: button_pressed.png (200×80px)
禁用状态: button_disabled.png (200×80px)
描述: 圆角矩形按钮，温暖的橙色渐变
边角: 圆角半径20px
```

#### 技能按钮
```
普通状态: skill_button_normal.png (120×120px)
按下状态: skill_button_pressed.png (120×120px)
冷却状态: skill_button_cooldown.png (120×120px)
描述: 圆形按钮，带有外发光效果
特效: 冷却时有灰色蒙版和转圈动画
```

#### 特殊按钮
```
暂停按钮: pause_button.png (80×80px)
播放按钮: play_button.png (80×80px)
设置按钮: settings_button.png (80×80px)
返回按钮: back_button.png (80×80px)
描述: 圆形图标按钮，白色图标配彩色背景
```

### 面板UI资源

#### 信息面板 (9宫格)
```
文件名: info_panel.png
尺寸: 400×300px
描述: 半透明背景的信息展示面板
边框: 金色装饰边框
背景: 半透明白色 (透明度60%)
```

#### 英雄面板
```
文件名: hero_panel.png
尺寸: 500×400px
描述: 英雄信息展示面板，包含头像框架
装饰: 猫爪印和星星装饰
```

#### 升级面板
```
文件名: upgrade_panel.png
尺寸: 450×350px
描述: 英雄升级界面面板
特效: 升级时有金色光芒效果
```

### 状态栏UI

#### 生命值条
```
背景: health_bar_bg.png (200×20px)
填充: health_bar_fill.png (196×16px)
描述: 红色渐变的血条，边框有暗色描边
```

#### 经验条
```
背景: exp_bar_bg.png (300×15px)
填充: exp_bar_fill.png (296×11px)
描述: 蓝色渐变的经验条
```

#### 技能冷却条
```
背景: skill_cooldown_bg.png (100×10px)
填充: skill_cooldown_fill.png (96×6px)
描述: 紫色的冷却进度条
```

### 图标资源

#### 资源图标
```
金币图标: gold_icon.png (64×64px)
生命图标: life_icon.png (64×64px)
经验图标: exp_icon.png (64×64px)
星星图标: star_icon.png (64×64px)
描述: 卡通风格的小图标，带有外发光
```

#### 功能图标
```
音量图标: volume_icon.png (48×48px)
静音图标: mute_icon.png (48×48px)
帮助图标: help_icon.png (48×48px)
成就图标: achievement_icon.png (48×48px)
```

---

## 🏞️ 场景环境资源

### 世界1：猫咪客厅 (Living Room)

#### 分层背景 (视差滚动)
```
远景层: living_room_bg_layer1.png (1080×1920px)
内容: 窗外的花园景色，阳光透射
色调: 明亮的暖色调

中景层: living_room_bg_layer2.png (1080×1920px)
内容: 客厅家具，沙发，书架，壁炉
细节: 温馨的家具摆设

近景层: living_room_bg_layer3.png (1080×1920px)
内容: 地毯，猫玩具，前景装饰物
特效: 半透明的光影效果
```

#### 装饰物件
```
猫爬架: cat_tree_01.png ~ cat_tree_03.png (128×256px)
猫玩具: cat_toy_ball.png, cat_toy_mouse.png (64×64px)
花盆: flower_pot_01.png ~ flower_pot_04.png (96×128px)
书籍: books_stack.png (80×60px)
```

### 世界2：后花园 (Garden)

#### 分层背景
```
远景层: garden_bg_layer1.png (1080×1920px)
内容: 天空，云朵，远山
特效: 云朵缓慢移动

中景层: garden_bg_layer2.png (1080×1920px)
内容: 花园景观，花坛，小径
植物: 各种颜色的花朵和绿植

近景层: garden_bg_layer3.png (1080×1920px)
内容: 草地纹理，前景花丛
```

#### 植物装饰
```
大树: big_tree_01.png ~ big_tree_02.png (200×300px)
花丛: flower_bush_01.png ~ flower_bush_05.png (120×80px)
草地: grass_patch_01.png ~ grass_patch_03.png (100×50px)
蘑菇: mushroom_01.png ~ mushroom_02.png (40×50px)
```

### 世界3：屋顶平台 (Rooftop)

#### 分层背景
```
远景层: rooftop_bg_layer1.png (1080×1920px)
内容: 城市天际线，夕阳
色调: 橙红色的黄昏色调

中景层: rooftop_bg_layer2.png (1080×1920px)
内容: 屋顶平台，水箱，天线
建筑: 各种屋顶设施

近景层: rooftop_bg_layer3.png (1080×1920px)
内容: 地面瓦片，边缘护栏
```

#### 建筑装饰
```
水箱: water_tank.png (150×200px)
天线: antenna_01.png ~ antenna_02.png (60×120px)
屋顶瓦片: roof_tiles.png (100×100px, 可平铺)
护栏: guardrail.png (200×50px)
```

### 世界4：猫咪咖啡厅 (Cat Cafe)

#### 分层背景
```
远景层: cafe_bg_layer1.png (1080×1920px)
内容: 咖啡厅外景，街道
氛围: 温馨的咖啡厅环境

中景层: cafe_bg_layer2.png (1080×1920px)
内容: 咖啡厅内部，桌椅，柜台
装饰: 猫咪主题的装饰品

近景层: cafe_bg_layer3.png (1080×1920px)
内容: 地板，前景桌椅
```

#### 咖啡厅装饰
```
咖啡桌: coffee_table_01.png ~ coffee_table_03.png (100×100px)
椅子: chair_01.png ~ chair_02.png (60×80px)
咖啡机: coffee_machine.png (120×150px)
菜单板: menu_board.png (80×120px)
```

### 世界5：猫咪城堡 (Cat Castle)

#### 分层背景
```
远景层: castle_bg_layer1.png (1080×1920px)
内容: 壮丽的城堡远景
特效: 旗帜飘动动画

中景层: castle_bg_layer2.png (1080×1920px)
内容: 城堡主体建筑
细节: 塔楼，城墙，大门

近景层: castle_bg_layer3.png (1080×1920px)
内容: 城堡内部地面，台阶
```

#### 城堡建筑
```
主城堡: main_castle.png (256×384px)
塔楼: castle_tower_01.png ~ castle_tower_02.png (128×192px)
大门: castle_gate.png (192×128px)
旗帜: castle_flag_01.png ~ castle_flag_04.png (64×96px, 动画)
城墙: castle_wall.png (200×100px, 可平铺)
```

---

## ✨ 特效动画资源

### 攻击特效

#### 子弹轨迹
```
普通子弹: bullet_trail_normal_01.png ~ bullet_trail_normal_03.png
尺寸: 32×128px
描述: 橙色的箭矢轨迹效果

魔法子弹: bullet_trail_magic_01.png ~ bullet_trail_magic_03.png
尺寸: 32×128px
描述: 蓝色的魔法弹轨迹，带星光粒子

重炮子弹: bullet_trail_heavy_01.png ~ bullet_trail_heavy_03.png
尺寸: 64×256px
描述: 巨大的炮弹轨迹，带火花效果
```

#### 爆炸效果
```
小型爆炸: explosion_small_01.png ~ explosion_small_08.png
尺寸: 64×64px
帧数: 8帧
描述: 黄色的小型爆炸动画

中型爆炸: explosion_medium_01.png ~ explosion_medium_10.png
尺寸: 128×128px
帧数: 10帧
描述: 橙红色的中型爆炸

大型爆炸: explosion_large_01.png ~ explosion_large_12.png
尺寸: 256×256px
帧数: 12帧
描述: 巨大的爆炸效果，带冲击波
```

#### 命中特效
```
物理命中: hit_physical_01.png ~ hit_physical_06.png
尺寸: 80×80px
描述: 白色的物理撞击效果

魔法命中: hit_magic_01.png ~ hit_magic_08.png
尺寸: 80×80px
描述: 蓝色的魔法命中特效，带星光
```

### 技能特效

#### 治疗特效
```
治疗光芒: heal_effect_01.png ~ heal_effect_10.png
尺寸: 128×128px
帧数: 10帧
描述: 绿色的治疗光芒，从下往上升起
```

#### 增益特效
```
攻击增益: buff_attack_01.png ~ buff_attack_06.png
尺寸: 100×100px
描述: 红色的增益光环效果

防御增益: buff_defense_01.png ~ buff_defense_06.png
尺寸: 100×100px
描述: 蓝色的防御光环效果
```

#### 状态特效
```
减速效果: debuff_slow_01.png ~ debuff_slow_04.png
尺寸: 64×64px
描述: 蓝色的冰霜效果

中毒效果: debuff_poison_01.png ~ debuff_poison_04.png
尺寸: 64×64px
描述: 绿色的毒气效果

眩晕效果: debuff_stun_01.png ~ debuff_stun_04.png
尺寸: 80×80px
描述: 黄色的眩晕星星效果
```

### 环境特效

#### 选择指示
```
选中圆圈: selection_circle.png
尺寸: 256×256px
描述: 金色发光的选中圆圈，可缩放

攻击范围: attack_range_circle.png
尺寸: 512×512px
描述: 红色半透明的攻击范围指示器

移动范围: move_range_circle.png
尺寸: 512×512px
描述: 绿色半透明的移动范围指示器
```

#### 升级特效
```
升级闪光: levelup_flash_01.png ~ levelup_flash_08.png
尺寸: 256×256px
帧数: 8帧
描述: 金色的升级光芒效果
```

#### 金币特效
```
金币获得: gold_pickup_01.png ~ gold_pickup_06.png
尺寸: 64×64px
帧数: 6帧
描述: 金币飞向UI的动画轨迹
```

### 伤害数字

#### 数字字体
```
普通伤害: damage_numbers_0.png ~ damage_numbers_9.png
尺寸: 32×32px (每个数字)
颜色: 白色，红色描边

暴击伤害: critical_numbers_0.png ~ critical_numbers_9.png
尺寸: 48×48px (每个数字)
颜色: 金黄色，闪光效果

治疗数字: heal_numbers_0.png ~ heal_numbers_9.png
尺寸: 32×32px (每个数字)
颜色: 绿色，温和光芒
```

---

## 🔊 音效资源需求

### 背景音乐 (BGM)

#### 主菜单音乐
```
文件名: main_menu_bgm.mp3
时长: 2-3分钟 (循环)
风格: 轻快活泼的猫咪主题曲
乐器: 钢琴主旋律 + 弦乐 + 轻快节拍
情绪: 温馨欢快
```

#### 战斗音乐
```
文件名: battle_bgm_01.mp3 ~ battle_bgm_03.mp3
时长: 3-4分钟 (循环)
风格: 紧张但不失可爱的战斗音乐
特点: 有节奏感，能烘托战斗氛围
变化: 3种不同的战斗音乐轮换
```

#### 胜利音乐
```
文件名: victory_bgm.mp3
时长: 30-45秒
风格: 欢快的胜利庆祝音乐
特点: 高潮部分突出，给玩家成就感
```

#### 失败音乐
```
文件名: defeat_bgm.mp3
时长: 20-30秒
风格: 略显失落但不沮丧的音乐
情绪: 鼓励玩家重新挑战
```

### 音效 (SFX)

#### UI音效
```
按钮点击: button_click.ogg (0.2秒)
面板打开: panel_open.ogg (0.5秒)
面板关闭: panel_close.ogg (0.3秒)
升级提示: levelup_notification.ogg (1秒)
金币获得: coin_pickup.ogg (0.3秒)
```

#### 角色音效

**橘猫射手**
```
攻击音效: orange_cat_attack.ogg (0.5秒)
技能音效: orange_cat_skill.ogg (1.2秒)
死亡音效: orange_cat_death.ogg (1秒)
```

**暹罗猫法师**
```
攻击音效: siamese_cat_attack.ogg (0.8秒)
技能音效: siamese_cat_skill.ogg (2秒)
死亡音效: siamese_cat_death.ogg (1秒)
```

**波斯猫辅助**
```
攻击音效: persian_cat_attack.ogg (0.6秒)
技能音效: persian_cat_skill.ogg (1.5秒)
治疗音效: healing_sound.ogg (1秒)
```

**英短猫坦克**
```
攻击音效: british_cat_attack.ogg (0.7秒)
技能音效: british_cat_skill.ogg (1.8秒)
嘲讽音效: taunt_roar.ogg (1秒)
```

**缅因猫重炮**
```
攻击音效: maine_cat_attack.ogg (1秒)
技能音效: maine_cat_skill.ogg (2.5秒)
炮击音效: artillery_blast.ogg (1.5秒)
```

#### 敌人音效
```
老鼠死亡: mouse_death_01.ogg ~ mouse_death_03.ogg
蝙蝠死亡: bat_death.ogg
Boss死亡: boss_death.ogg (2秒)
敌人受击: enemy_hit_01.ogg ~ enemy_hit_03.ogg
```

#### 战斗音效
```
子弹射击: bullet_shot_01.ogg ~ bullet_shot_03.ogg
爆炸音效: explosion_01.ogg ~ explosion_03.ogg
魔法施放: magic_cast.ogg
治疗施放: heal_cast.ogg
城堡受击: castle_hit.ogg
```

#### 环境音效
```
波次开始: wave_start.ogg
波次完成: wave_complete.ogg
游戏胜利: game_victory.ogg
游戏失败: game_defeat.ogg
```

---

## 📊 资源制作优先级

### 高优先级 (核心游戏功能)
1. **1个猫咪英雄完整动画** (橘猫射手)
2. **1种敌人完整动画** (基础老鼠)
3. **基础UI资源** (按钮、面板、图标)
4. **1个测试场景背景** (客厅场景)
5. **基础特效** (攻击命中、爆炸)

### 中优先级 (扩展内容)
1. **其余4个猫咪英雄动画**
2. **其余4种敌人动画**
3. **所有技能特效**
4. **完整UI系统**
5. **5个场景背景**

### 低优先级 (美化内容)
1. **高级特效动画**
2. **环境装饰物**
3. **粒子特效**
4. **完整音效系统**
5. **背景音乐**

---

## 📋 制作规范总结

### 文件命名规范
- 使用英文小写字母和下划线
- 动画帧按数字编号 (01, 02, 03...)
- 包含资源类型前缀 (如: cat_, mouse_, ui_)

### 技术规格
- **图片格式**: PNG (RGBA 32位)
- **分辨率**: 根据用途区分 (64px~256px)
- **优化**: 适当压缩，保持清晰度
- **动画**: 12-24 FPS，流畅自然

### 质量标准
- **风格一致性**: 所有资源保持统一的美术风格
- **识别度**: 不同单位有明显的视觉区别
- **可爱度**: 符合游戏温馨可爱的主题
- **屏幕适配**: 在手机小屏幕上清晰可见

---

**文档结束**

总计美术资源约 **400+ 个文件**，涵盖角色动画、敌人动画、UI界面、场景背景、特效动画和音效资源等全方位的美术需求。