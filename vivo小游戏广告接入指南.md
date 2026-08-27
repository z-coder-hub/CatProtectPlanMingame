---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: f827aeceea9e150d2b5acf221a9b4d52_47252bc7978a11f19c51525400287e28
    ReservedCode1: KCd8HtagNDQGWsDy/GJApKOTD56oJEK+LM+N+/30pgwCcixKD+7GVjf8eR4N+LpmEKHwj0/0v4JkBi3xAvuFdWlsE6G3cuxEWnp7E50v2cmMgd9/MEWsBn7QpJUw2ERZ3c2aKxBUYq5WvnTsfHNrHdu/mEXaX04sZTyJLFkh5tEttmHeOJavvvxx0yM=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: f827aeceea9e150d2b5acf221a9b4d52_47252bc7978a11f19c51525400287e28
    ReservedCode2: KCd8HtagNDQGWsDy/GJApKOTD56oJEK+LM+N+/30pgwCcixKD+7GVjf8eR4N+LpmEKHwj0/0v4JkBi3xAvuFdWlsE6G3cuxEWnp7E50v2cmMgd9/MEWsBn7QpJUw2ERZ3c2aKxBUYq5WvnTsfHNrHdu/mEXaX04sZTyJLFkh5tEttmHeOJavvvxx0yM=
---

# Cocos 发布 vivo 小游戏（rpk）广告接入指南

> 本文档用于指导在 Cocos Creator 构建的 vivo 小游戏（rpk 包）中接入 vivo 广告。
> 适用对象：Cocos 开发者 / 需要为项目添加广告逻辑的 AI 助手。
> 信息来源：vivo 小游戏官方开发者文档（https://minigame.vivo.com.cn/documents/）。

## 一、背景

- 游戏引擎：Cocos Creator（构建发布时选择 vivo 小游戏平台一键导出 rpk 包）。
- 广告体系：vivo 小游戏平台自带广告 API，通过全局对象 `qg` 调用，**无需引入任何原生 aar SDK**。
- 广告位 ID（posId）与包名必须在 vivo 开发者平台/广告联盟后台申请，两者必须匹配。

## 二、接入前须知

1. 广告拉取不到，先检查**包名与 posId** 是否配置正确；若正确可能是填充率问题，多拉取几次，能拉到一次即说明接入无问题。
2. 小游戏调试器默认自动添加广告预览；若不想默认使用预览，关闭调试器"上架审核开关"并打开"调试模式"。
3. 手动配置预览：登录 vivo 广告联盟后台（adnet.vivo.com.cn）→ 接入管理-广告预览 → 新增预览配置 → 手机拨号输入 `*#06#` 获取 IMEI（两个 IMEI 通常用 IMEI1；Android 10 以上可配置 OAID）→ 选择应用保存。
4. 广告有填充率，属正常现象；只要能拉到一次广告，说明接入无问题。
5. 不能同时展示两个相同类型广告（如两个激励视频、两个 banner），需按官方规范控制展示时机。
6. 广告位 ID 是以当前游戏包名申请的，申请时注意包名一致。

## 三、广告 API 总览

| 广告类型 | 创建 API | 说明 |
|---|---|---|
| Banner 广告 | `qg.createBannerAd({ posId })` | 横幅广告，可设样式与自动刷新间隔 |
| 插屏广告 | `qg.createInterstitialAd({ posId })` | 图片/半屏视频插屏 |
| 激励视频 | `qg.createRewardedVideoAd({ posId })` | 完整观看后发奖励 |
| 原生模板广告 | `qg.createCustomAd({ posId })` | 需判断 API 存在 `if (qg.createCustomAd)` |

## 四、各广告位代码示例

### 1. 激励视频（RewardedVideoAd）

```js
function initRewardedAd() {
  const rewardedAd = qg.createRewardedVideoAd({
    posId: 'xxx', // 替换为申请的激励视频广告位 id
  });

  rewardedAd.onError(err => {
    console.log('激励视频广告加载失败', err);
  });

  rewardedAd.onLoad(function (res) {
    console.log('激励视频广告加载完成-onload触发', JSON.stringify(res));
    rewardedAd.show()
      .then(() => {
        console.log('激励视频广告展示完成');
      })
      .catch((err) => {
        console.log('激励视频广告展示失败', JSON.stringify(err));
      });
  });

  const func = (res) => {
    console.log('视频广告关闭回调');
    if (res && res.isEnded) {
      console.log('正常播放结束，可以下发游戏奖励');
      // TODO: 在这里发放游戏奖励
    } else {
      console.log('播放中途退出，不下发游戏奖励');
    }
  };
  rewardedAd.onClose(func);
}
```

回调说明：
- `onClose` 回调参数 `res.isEnded`：`true` 表示用户完整看完视频（可发奖励）；`false` 表示中途关闭（不发奖励）。
- `onError` 回调参数：`errMsg`（错误信息）、`errCode`（错误码）。

### 2. 插屏广告（InterstitialAd）

```js
function initInterstitialAd() {
  const interstitialAd = qg.createInterstitialAd({
    posId: 'xxx', // 替换为申请的插屏广告位 id
  });

  interstitialAd.onError(err => {
    console.log('插屏广告加载失败', err);
  });

  interstitialAd.show()
    .then(() => {
      console.log('插屏广告展示完成');
    })
    .catch((err) => {
      console.log('插屏广告展示失败', JSON.stringify(err));
    });
}
```

### 3. Banner 广告（BannerAd）

```js
function initBannerAd() {
  const bannerAd = qg.createBannerAd({
    posId: 'xxx', // 替换为申请的 Banner 广告位 id
  });

  bannerAd.onError(err => {
    console.log('banner广告加载失败', err);
  });

  bannerAd.show()
    .then(() => {
      console.log('banner广告展示完成');
    })
    .catch((err) => {
      console.log('banner广告展示失败', JSON.stringify(err));
    });
}
```

Banner 可选参数（createBannerAd 的 object 属性）：

| 属性 | 类型 | 必填 | 说明 |
|---|---|---|---|
| posId | string | 是 | Banner 广告位标识 |
| style | Object | 否 | Banner 广告组件的样式 |
| adIntervals | Number | 否 | 广告自动刷新间隔（秒），必须 >= 30 |

style 样式属性：

| 属性 | 类型 | 说明 |
|---|---|---|
| left | number | 左上角横坐标，当前不支持更改横坐标位置，建议设为 0 |
| top | number | 左上角纵坐标；若想将 banner 在最上面，可将 top 设置为 0 |

### 4. 原生模板广告（CustomAd，1104+ 版本）

```js
if (qg.createCustomAd) {
  function initCustomAd() {
    const customAd = qg.createCustomAd({
      posId: 'xxx', // 替换为申请的原生模板广告位 id
    });

    customAd.onError(err => {
      console.log('原生模板广告加载失败', err);
    });

    customAd.show()
      .then(() => {
        console.log('原生模板广告展示完成');
      })
      .catch((err) => {
        console.log('原生模板广告展示失败', JSON.stringify(err));
      });
  }
}
```

原生模板广告样式参数：

| 属性 | 类型 | 说明 |
|---|---|---|
| left | number | 左上角横坐标 |
| top | number | 左上角纵坐标 |
| width | number | 宽度，高度跟随广告样式自适应（宽度 720-1080px 范围内） |
| gravity | String | 广告容器相对位置：top、bottom、left、right、center，如 `top\|center` |

## 五、生命周期 API（广告逻辑常用）

```js
// 监听游戏切入前台（冷启动/热启动可做广告预加载等逻辑）
const showf = function (res) {
  console.log('game enter foreground', res);
  // res.type: 1=冷启动（首次启动） 2=热启动（非首次启动）
  // res.query: 启动 query 参数（含 deeplink 参数）
};
qg.onShow(showf);
// qg.offShow(showf); // 取消监听，参数为空取消所有

// 监听游戏切入后台
const hidef = function () {
  console.log('game enter background');
};
qg.onHide(hidef);
// qg.offHide(hidef);

// 退出游戏（同步）
qg.exitApplication();
```

## 六、广告错误码参考（排查用）

### 常用错误码

| 错误码 | 含义 | 处理 |
|---|---|---|
| 4012 | 广告位 id 不存在 | 检查广告位 id 是否存在 |
| 4014 | 无广告（请求成功但无填充） | 多刷几次，填充率问题 |
| 4015 | 请求异常 | 重试几遍 |
| 40120000 | 媒体ID错误、广告位不存在、Json格式错误、参数缺失 | 核对参数 |
| 40120001 | 媒体 id 无效 | 核对媒体 id |
| 40120002 | 媒体包名和注册包名不一致 | 检查包名 |
| 40120003 | 广告位 id 与广告类型不匹配 | 核对广告位类型 |
| 40120005 | 设备厂商不支持 | 检查手机厂商 |
| 40120006 | 超出请求上限 | 限制每天请求量 |
| 40120007 | 缺少唯一 id 信息 | 检查是否获取 imei 权限 |
| 40211 | 初始化参数异常 | 检查初始化参数 |
| 40212 | 配置未获取 | 杀进程重新进应用 |
| 40213 | 请求超时 | 检查网络 |
| 40217 | 广告拉取太频繁 | 间隔一定时间请求 |
| 402111 / 402118 | SDK 未初始化 | 先初始化再请求 |
| 402113 | 广告过期 | 不要缓存广告过久 |
| 402114 | 暂无广告 | 重试 |

### 频控类错误码（300xx 系列）

| 错误码 | 含义 |
|---|---|
| 30002 | 加载广告失败，重新拉取 |
| 30003 | 新手广告保护（测试时可将手机时间调成一天之后） |
| 30004 | 小游戏启动一定时间内不允许展示广告 |
| 30005 | 距离上次广告展示时间间隔不足 |
| 30006 | 新安装用户若干天后才允许展示广告 |
| 30007 | 单进程内广告播放次数已达限制 |
| 30008 | 启动来源不支持展示广告（检查申请广告位时填写的启动来源范围） |
| 30009 | 1 秒内调用广告次数超过 1 次（建议最少间隔 1s） |
| 30010 | 检测到用户频繁关闭广告，暂时不展示 |
| 30011 | 用户第几次启动游戏才可出现广告 |
| 30012 | 该广告一天内最大曝光次数已到 |
| 30013 | 单个游戏启动次数过少，不允许请求广告 |
| 30014 | 免广告特权保护中 |
| 30015 | 盒子广告限制触发，九宫格和 banner 样式只能同时展示一个广告 |

### 其他常见错误码

| 错误码 | 含义 |
|---|---|
| 108 | 不存在广告（填充率问题，忽略即可） |
| 200 | 不需要处理，忽略 |
| 500 | 网络问题，可换 4G 或换网络测试 |
| 30000 | 广告对象长时间不用被回收，或创建初始化未完成/未初始化；重新创建或等 onload 后再 show |
| 103060 | 应用包名和注册包名不一致 |
| 107000 | 广告位 ID 缺失，确认 posId 参数正确填写 |
| 200000 | 无广告返回，检查 posId 是否正确填写 |

## 七、接入检查清单（提测/上线前）

1. 广告位 ID（posId）、包名与 vivo 后台申请的完全一致，无字符错误；
2. 广告位 ID 是以当前游戏包名申请的；
3. 首次测试建议先在 vivo 广告联盟后台配置广告预览（IMEI），确认能拉到广告；
4. 测试时注意频控限制（30003/30004/30005/30009 等），必要时把手机时间调后一天；
5. 激励视频必须根据 `onClose` 的 `isEnded` 判断是否发放奖励；
6. 不要同时展示两个相同类型广告；
7. 广告拉取间隔建议 >= 1 秒；
8. 上线自测表中"广告功能正常（不允许自有广告）"。

## 八、给 deepseek 的补充说明（需求上下文）

- 游戏引擎：Cocos Creator（vivo 小游戏平台导出 rpk）。
- 广告 API 通过全局 `qg` 对象调用，在 Cocos 中建议封装为独立的广告管理模块（如 `AdManager.ts`），在游戏启动场景初始化，在对应业务节点（复活、翻牌、关卡结束等）触发展示。
- 激励视频是重点：`onLoad` 后调 `show()`，`onClose` 回调中根据 `res.isEnded` 发放奖励。
- 需要处理广告失败降级：`onError` / `show().catch()` 时给出提示并继续游戏流程，避免阻塞玩家。
- 广告位 id 用常量集中配置（如 `AD_POS_ID = { reward: 'xxx', interstitial: 'xxx', banner: 'xxx' }`），方便替换。
- 若需要测试广告，先按第二节配置广告预览，否则可能因填充率/频控拉不到广告。

## 九、API 对接小节（广告接口 ↔ posID 映射，供 DeepSeek 直接对接）

> 说明：广告位名称（如"6-5"、"9-84"）由平台自动生成，仅后台识别用，**代码中一律以 posID 为准**，勿按名称拼逻辑。

### 9.1 媒体 ID（MediaID，后台核对用）

```
e4b247e1dbed4d62ab79388373b4680a
```

MediaID 与游戏包名在 vivo 广告联盟后台绑定，**代码创建广告时只需传 posID，无需传 MediaID**；仅在排查"媒体ID错误"(40120000) 时核对此项。

### 9.2 广告位与 API 映射表（核心）

| 广告类型 | posID | 创建 API | 关键注意点 |
|---|---|---|---|
| 退出浮层（盒子/原生模板） | `ef55f9b0760041328e9f0c32a58595f5` | `qg.createCustomAd({ posId })` | 实例不能复用、会被回收，每次展示前重新 create |
| 退出浮层（盒子/原生模板） | `f498f24a47c44f37bd6833d54433fd9b` | `qg.createCustomAd({ posId })` | 同上；与上一个盒子广告位不可同时展示 |
| 开屏 | `3489cf281e244475809599b635cf8175` | `qg.createSplashAd()`（先判断存在性） | 官方示例无参调用；如需传 posId 按实际 SDK 版本适配 |
| 激励视频 | `acc2fdc5ee1b466db8a2f8e387591551` | `qg.createRewardedVideoAd({ posId })` | 发奖励以 `onClose` 的 `res.isEnded` 为准 |
| 原生浮窗（悬浮 Icon） | `da16dd65a167442eb133609dd8fac4d1` | `qg.createFloatIconAd({ posId })`（1206+） | 实例不能复用、会被回收，重复使用前重新 create |

### 9.3 统一常量配置（AdConfig.ts，DeepSeek 直接使用）

```ts
// 广告位 id 集中配置，新增/替换广告位只改这里
export const AD_POS_ID = {
    original: '50eccf517765419aa97dca1ed2a6c1b8', // 原生通用通用（盒子）我打算用在退出app时
    splash:     'a344099f2fe34b528e2503583008b841', // 开屏
    reward:     '86abf35b72d4497ba47cc1bb49477355', // 激励视频
};
```

### 9.4 各 API 对接要点

| API | 何时调用 | 回调/奖励要点 | 环境兼容 |
|---|---|---|---|
| `createSplashAd()` | 冷启动、进 Splash 前 | `onShow` / `onClick` | `if (qg.createSplashAd)` |
| `createRewardedVideoAd({posId})` | 业务激励点（复活、翻牌等） | `onClose` 里 `res.isEnded===true` 才发奖励 | 直接调用，无需判断（平台普遍支持） |
| `createCustomAd({posId})` | 退出浮层/游戏结束面板弹出时 | `show().catch` 失败降级继续流程 | `if (qg.createCustomAd)` |
| `createFloatIconAd({posId})` | 创建后 `show()` 常驻/按场景展示 | `onLoad` / `onClose` / `onError` | `if (qg.createFloatIconAd)`（1206+） |

通用注意点：
- 原生模板（盒子）与悬浮 Icon 广告实例**不能复用、会被回收**，每次展示前重新 create；
- **不要同时展示两个同类广告**（两个盒子广告位只展示其一，错误码 30015）；
- 激励视频必须用 `onClose` 的 `isEnded` 判断是否发放奖励；
- 所有广告调用包一层 `qg` 存在性判断，浏览器调试环境静默降级，不阻塞游戏。

### 9.5 项目接入落点（对应现有代码）

| 广告位 | 接入文件/函数 | 说明 |
|---|---|---|
| 开屏 | `Main.ts` 的 `onLoad()`/`start()` 最前 | 冷启动最早时机 |
| 退出浮层（盒子） | `Main.ts` 的 `endGame()` | gameOverNode 弹出时展示，两广告位轮换 |
| 激励视频 | 按业务激励点新增调用 | 本项目当前无复活/翻牌逻辑，可在游戏结束时作为"再来一局"激励入口（可选） |
| 原生浮窗 | `Main.ts` 初始化后 `show()` | 常驻悬浮入口，进入主场景后创建展示 |

建议模块结构：`assets/script/ad/AdConfig.ts`（常量）+ `AdManager.ts`（统一入口封装）。

*（内容由AI生成，仅供参考）*
