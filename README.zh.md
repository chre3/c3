# C3 SDK

> 一个轻量级的 JavaScript SDK，用于集成 Google AdSense、Google Publisher Tag (GPT) 和 Google AdSense for Search (AFS)。

[English Docs](README.md) | [中文文档](README.zh.md)

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🚀 **AdSense** | 完整的 AdSense 集成，支持高级广告类型 |
| 📊 **GPT** | Google Publisher Tag 支持 |
| 🔍 **AFS** | AdSense for Search 集成（待完成） |
| ⚡ **懒加载** | 基于 Intersection Observer 的懒加载 |
| 🔄 **自动刷新** | 可配置的广告刷新间隔 |
| 📱 **激励广告** | 支持激励/插屏广告 |
| 🎯 **原生广告** | 原生广告格式支持 |

## 📦 安装

### CDN

#### jsDelivr

```html
<script src="https://cdn.jsdelivr.net/npm/c3-sdk@latest/dist/c3-sdk.umd.js"></script>
```

#### unpkg

```html
<script src="https://unpkg.com/c3-sdk@latest/dist/c3-sdk.umd.js"></script>
```

### NPM

```bash
npm install c3-sdk
```

## 🚀 快速开始

### AdSense 示例

```html
<script src="./dist/c3-sdk.umd.js"></script>
<script>
  c3.init({
    platform: "ads",
    pubId: "ca-pub-xxxxxxxxxxxxxxxx"
  }).then(() => {
    c3.AdSense.createAd({
      adSlotId: "1234567890",
      containerId: "ad-container"
    });
  });
</script>
```

### GPT 示例

```html
<script src="./dist/c3-sdk.umd.js"></script>
<script>
  c3.init({
    platform: "gpt",
    pubId: "ca-pub-xxxxxxxxxxxxxxxx"
  }).then(() => {
    c3.GPT.defineSlot({
      adUnitPath: "/12345678/example",
      size: [300, 250],
      divId: "gpt-ad"
    });
  });
</script>
```

### AFS 示例

> ⚠️ **待完成** - AFS 支持正在开发中。

## 📖 API 参考

### `c3.init(options)`

初始化 SDK。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `platform` | `string` | ✅ | - | 平台类型: `"ads"` \| `"gpt"` \| `"afs"` |
| `pubId` | `string` | ✅* | - | 发布商 ID (*AFS 平台可选) |
| `nativeAfgSupport` | `boolean` | ❌ | `true` | 启用原生广告 |
| `channelId` | `string` | ❌ | `""` | 频道 ID |
| `useGa` | `boolean` | ❌ | `false` | 启用 Google Analytics |
| `gaMeasurementId` | `string` | ❌** | `""` | GA 测量 ID (**`useGa: true` 时必填) |
| `useGtm` | `boolean` | ❌ | `false` | 启用 Google Tag Manager |
| `gtmContainerId` | `string` | ❌*** | `""` | GTM 容器 ID (***`useGtm: true` 时必填) |
| `preloadAd` | `boolean` | ❌ | `true` | 预加载广告 |
| `adsenseConfig` | `object` | ❌ | `{}` | AdSense 专用配置 |

#### `adsenseConfig.vignetteConfig`

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `boolean` | `false` | 启用穿插/插屏广告管理 |
| `vignetteToPreroll.count` | `number` | `3` | 穿插广告数量阈值 |
| `vignetteToPreroll.trigger` | `number` | `1` | 插屏触发次数 |
| `prerollToVignette.count` | `number` | `1` | 插屏数量阈值 |
| `prerollToVignette.trigger` | `number` | `3` | 穿插触发次数 |
| `maxVignetteMissed` | `number` | `2` | 最大未出现穿插次数（触发插屏） |
| `initialPrerollDelay` | `number` | `0` | 初始插屏延迟（秒） |

#### `adsenseConfig.rewardConfig`

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | `string` | `"c3_reward"` | 激励广告名称 |
| `initialRewardDelay` | `number` | `0` | 初始激励延迟（秒） |
| `beforeAd` | `Function` | - | 广告显示前回调 |
| `beforeReward` | `Function` | - | 奖励前回调（接收 `showAdFn`） |
| `adDismissed` | `Function` | - | 广告关闭回调 |
| `adViewed` | `Function` | - | 广告观看回调 |
| `afterAd` | `Function` | - | 广告后回调（仅广告显示时调用） |
| `adBreakDone` | `Function` | - | 广告中断完成回调（始终调用） |

### AdSense API

#### `c3.AdSense.createAd(options)`

创建 AdSense 广告单元。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `adSlotId` | `string` | ✅ | - | 广告位 ID |
| `adFormat` | `string` | ❌ | `"auto"` | 广告格式 |
| `fullWidthResponsive` | `boolean` | ❌ | `true` | 全宽响应式 |
| `containerId` | `string` | ❌ | `"body"` | 容器 ID |
| `width` | `number\|string` | ❌ | `"100%"` | 广告宽度 |
| `height` | `number\|string` | ❌ | - | 广告高度 |
| `display` | `string` | ❌ | `"inline-block"` | 显示方式 |
| `lazyLoad` | `boolean` | ❌ | `false` | 启用懒加载 |
| `autoRefreshSeconds` | `number` | ❌ | `0` | 自动刷新间隔（秒） |

**示例：**

```javascript
c3.AdSense.createAd({
  adSlotId: "1234567890",
  width: 300,
  height: 250,
  lazyLoad: true,
  autoRefreshSeconds: 30
});
```

#### `c3.AdSense.showReward(options)`

手动显示激励广告。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | `string` | ❌ | 激励广告名称 |
| `beforeAd` | `Function` | ❌ | 广告显示前回调 |
| `beforeReward` | `Function` | ❌ | 奖励前回调 |
| `adViewed` | `Function` | ❌ | 观看回调 |
| `adBreakDone` | `Function` | ❌ | 完成回调 |

**示例：**

```javascript
c3.AdSense.showReward({
  adViewed: () => {
    console.log("用户观看广告，给予奖励");
    giveReward();
  }
});
```

#### `c3.AdSense.showPreroll(options)`

手动显示插屏广告。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `beforeAd` | `Function` | ❌ | 广告显示前回调 |
| `adDismissed` | `Function` | ❌ | 广告关闭回调 |
| `adViewed` | `Function` | ❌ | 广告观看回调 |
| `afterAd` | `Function` | ❌ | 广告后回调（仅广告显示时调用） |
| `adBreakDone` | `Function` | ❌ | 广告中断完成回调（始终调用） |

**示例：**

```javascript
c3.AdSense.showPreroll({
  beforeAd: () => {
    console.log("即将显示插屏广告");
  },
  adViewed: () => {
    console.log("用户观看了插屏广告");
  },
  adBreakDone: () => {
    console.log("插屏广告完成");
  }
});
```

#### `c3.AdSense.triggerPreroll(options)`

`showPreroll()` 的别名。手动触发插屏广告。

**示例：**

```javascript
c3.AdSense.triggerPreroll({
  adBreakDone: () => {
    console.log("插屏完成");
  }
});
```

#### `c3.AdSense.triggerReward(options)`

`showReward()` 的别名。手动触发激励广告。

#### `c3.AdSense.refresh(identifier)`

刷新广告。每个广告实例都有唯一 ID，允许具有相同 `adSlotId` 的多个广告独立刷新。

| 参数 | 类型 | 说明 |
|------|------|------|
| `identifier` | `string\|Object\|undefined` | 广告位 ID、唯一广告 ID（以 `c3_ad_` 开头）、广告对象，或 `undefined` 刷新所有 |

**示例：**

```javascript
// 刷新所有广告
c3.AdSense.refresh();

// 刷新所有匹配 adSlotId 的广告
c3.AdSense.refresh("1234567890");

// 通过广告对象刷新特定广告
const ad = c3.AdSense.createAd({
  adSlotId: "1234567890",
  containerId: "ad1"
});
c3.AdSense.refresh(ad);

// 通过唯一 ID 刷新特定广告
c3.AdSense.refresh(ad.id); // ad.id 类似 "c3_ad_1234567890_1_abc123"
```

**注意：** 使用 `autoRefreshSeconds` 时，每个广告实例会使用其唯一 ID 自动刷新，确保具有相同 `adSlotId` 的多个广告独立刷新。

### GPT API

#### `c3.GPT.defineSlot(options)`

定义 GPT 广告位。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `adUnitPath` | `string` | ✅ | - | 广告单元路径 |
| `size` | `array` | ✅ | - | 广告尺寸 `[宽, 高]` |
| `divId` | `string` | ✅ | - | 容器 div ID |
| `targeting` | `object` | ❌ | `{}` | 目标定位参数 |
| `lazyLoad` | `boolean` | ❌ | `false` | 启用懒加载 |
| `autoRefreshSeconds` | `number` | ❌ | `0` | 自动刷新间隔 |

**示例：**

```javascript
c3.GPT.defineSlot({
  adUnitPath: "/12345678/example",
  size: [300, 250],
  divId: "gpt-ad",
  targeting: { pos: "top" },
  lazyLoad: true
});
```

### AFS API

> ⚠️ **待完成** - AFS API 文档正在开发中。

## 🔧 高级示例

### AdSense 穿插/插屏广告

```javascript
c3.init({
  platform: "ads",
  pubId: "ca-pub-xxxxxxxxxxxxxxxx",
  adsenseConfig: {
    vignetteConfig: {
      enabled: true,
      vignetteToPreroll: { count: 3, trigger: 1 },
      initialPrerollDelay: 10
    }
  }
});
```

### AdSense 激励广告

```javascript
c3.init({
  platform: "ads",
  pubId: "ca-pub-xxxxxxxxxxxxxxxx",
  adsenseConfig: {
    rewardConfig: {
      initialRewardDelay: 15,
      adViewed: () => giveReward()
    }
  }
});

// 或手动触发
c3.AdSense.showReward({
  adViewed: () => giveReward()
});
```

### AdSense 手动插屏

```javascript
// 手动触发插屏广告
c3.AdSense.showPreroll({
  beforeAd: () => {
    console.log("即将显示插屏");
  },
  adViewed: () => {
    console.log("用户观看了插屏");
  },
  adBreakDone: () => {
    console.log("插屏完成");
  }
});

// 或使用别名
c3.AdSense.triggerPreroll({
  adBreakDone: () => console.log("完成")
});
```

### 懒加载 + 自动刷新

```javascript
c3.AdSense.createAd({
  adSlotId: "1234567890",
  lazyLoad: true,        // 进入视口时加载
  autoRefreshSeconds: 30 // 每 30 秒刷新
});
```

### 多个相同 adSlotId 的广告

```javascript
// 创建多个相同 adSlotId 的广告
const ad1 = c3.AdSense.createAd({
  adSlotId: "1234567890",
  containerId: "ad-container-1",
  autoRefreshSeconds: 30 // 每 30 秒使用唯一 ID 刷新
});

const ad2 = c3.AdSense.createAd({
  adSlotId: "1234567890", // 相同的 adSlotId
  containerId: "ad-container-2",
  autoRefreshSeconds: 60 // 每 60 秒使用唯一 ID 刷新
});

// 每个广告独立刷新
// 刷新特定广告
c3.AdSense.refresh(ad1);

// 刷新所有具有此 adSlotId 的广告
c3.AdSense.refresh("1234567890");
```

## 🛠️ 开发

```bash
# 安装
npm install

# 开发
npm run dev

# 构建
npm run build

# 预览
npm run preview
```

## 📝 许可证

MIT

