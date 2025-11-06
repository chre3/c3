# C3 SDK

> A lightweight JavaScript SDK for Google AdSense, Google Publisher Tag (GPT), and Google AdSense for Search (AFS) integration.

[中文文档](README.zh.md) | [English Docs](README.md)

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🚀 **AdSense** | Full AdSense integration with advanced ad types |
| 📊 **GPT** | Google Publisher Tag support |
| 🔍 **AFS** | AdSense for Search integration (Coming Soon) |
| ⚡ **Lazy Loading** | Intersection Observer-based lazy loading |
| 🔄 **Auto Refresh** | Configurable ad refresh intervals |
| 📱 **Rewarded Ads** | Support for rewarded/interstitial ads |
| 🎯 **Native Ads** | Native ad format support |

## 📦 Installation

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

## 🚀 Quick Start

### AdSense Example

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

### GPT Example

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

### AFS Example

> ⚠️ **Coming Soon** - AFS support is under development.

## 📖 API Reference

### `c3.init(options)`

Initialize the SDK.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `platform` | `string` | ✅ | - | Platform type: `"ads"` \| `"gpt"` \| `"afs"` |
| `pubId` | `string` | ✅* | - | Publisher ID (*optional for AFS) |
| `nativeAfgSupport` | `boolean` | ❌ | `true` | Enable native ads |
| `channelId` | `string` | ❌ | `""` | Channel ID |
| `useGa` | `boolean` | ❌ | `false` | Enable Google Analytics |
| `gaMeasurementId` | `string` | ❌** | `""` | GA Measurement ID (**required if `useGa: true`) |
| `useGtm` | `boolean` | ❌ | `false` | Enable Google Tag Manager |
| `gtmContainerId` | `string` | ❌*** | `""` | GTM Container ID (***required if `useGtm: true`) |
| `preloadAd` | `boolean` | ❌ | `true` | Preload ads |
| `adsenseConfig` | `object` | ❌ | `{}` | AdSense specific config |

#### `adsenseConfig.vignetteConfig`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable vignette/preroll management |
| `vignetteToPreroll.count` | `number` | `3` | Vignette count threshold |
| `vignetteToPreroll.trigger` | `number` | `1` | Preroll trigger count |
| `prerollToVignette.count` | `number` | `1` | Preroll count threshold |
| `prerollToVignette.trigger` | `number` | `3` | Vignette trigger count |
| `maxVignetteMissed` | `number` | `2` | Max missed vignettes before preroll |
| `initialPrerollDelay` | `number` | `0` | Initial preroll delay (seconds) |

#### `adsenseConfig.rewardConfig`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `string` | `"c3_reward"` | Reward ad name |
| `initialRewardDelay` | `number` | `0` | Initial reward delay (seconds) |
| `beforeAd` | `Function` | - | Callback before ad shows |
| `beforeReward` | `Function` | - | Callback before reward (receives `showAdFn`) |
| `adDismissed` | `Function` | - | Callback when ad is dismissed |
| `adViewed` | `Function` | - | Callback when ad is viewed |
| `afterAd` | `Function` | - | Callback after ad (only if ad shown) |
| `adBreakDone` | `Function` | - | Callback when ad break done (always called) |

### AdSense API

#### `c3.AdSense.createAd(options)`

Create an AdSense ad unit.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `adSlotId` | `string` | ✅ | - | Ad slot ID |
| `adFormat` | `string` | ❌ | `"auto"` | Ad format |
| `fullWidthResponsive` | `boolean` | ❌ | `true` | Full width responsive |
| `containerId` | `string` | ❌ | `"body"` | Container ID |
| `width` | `number\|string` | ❌ | `"100%"` | Ad width |
| `height` | `number\|string` | ❌ | - | Ad height |
| `display` | `string` | ❌ | `"inline-block"` | Display type |
| `lazyLoad` | `boolean` | ❌ | `false` | Enable lazy loading |
| `autoRefreshSeconds` | `number` | ❌ | `0` | Auto refresh interval (seconds) |

**Example:**

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

Show rewarded ad manually.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | ❌ | Reward ad name |
| `beforeAd` | `Function` | ❌ | Callback before ad |
| `beforeReward` | `Function` | ❌ | Callback before reward |
| `adViewed` | `Function` | ❌ | Callback when viewed |
| `adBreakDone` | `Function` | ❌ | Callback when done |

**Example:**

```javascript
c3.AdSense.showReward({
  adViewed: () => {
    console.log("User watched ad, give reward");
    giveReward();
  }
});
```

#### `c3.AdSense.showPreroll(options)`

Show preroll ad manually.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `beforeAd` | `Function` | ❌ | Callback before ad shows |
| `adDismissed` | `Function` | ❌ | Callback when ad dismissed |
| `adViewed` | `Function` | ❌ | Callback when ad viewed |
| `afterAd` | `Function` | ❌ | Callback after ad (only if ad shown) |
| `adBreakDone` | `Function` | ❌ | Callback when ad break done (always called) |

**Example:**

```javascript
c3.AdSense.showPreroll({
  beforeAd: () => {
    console.log("Preroll will show");
  },
  adViewed: () => {
    console.log("Preroll viewed");
  },
  adBreakDone: () => {
    console.log("Preroll completed");
  }
});
```

#### `c3.AdSense.triggerPreroll(options)`

Alias for `showPreroll()`. Manually trigger preroll ad.

**Example:**

```javascript
c3.AdSense.triggerPreroll({
  adBreakDone: () => {
    console.log("Preroll done");
  }
});
```

#### `c3.AdSense.triggerReward(options)`

Alias for `showReward()`. Manually trigger rewarded ad.

#### `c3.AdSense.refresh(identifier)`

Refresh ad(s). Each ad instance has a unique ID, allowing multiple ads with the same `adSlotId` to be refreshed independently.

| Parameter | Type | Description |
|-----------|------|-------------|
| `identifier` | `string\|Object\|undefined` | Ad slot ID, unique ad ID (starts with `c3_ad_`), ad object, or `undefined` to refresh all |

**Examples:**

```javascript
// Refresh all ads
c3.AdSense.refresh();

// Refresh all ads with matching adSlotId
c3.AdSense.refresh("1234567890");

// Refresh specific ad by ad object
const ad = c3.AdSense.createAd({
  adSlotId: "1234567890",
  containerId: "ad1"
});
c3.AdSense.refresh(ad);

// Refresh specific ad by unique ID
c3.AdSense.refresh(ad.id); // ad.id is like "c3_ad_1234567890_1_abc123"
```

**Note:** When using `autoRefreshSeconds`, each ad instance automatically refreshes using its unique ID, ensuring multiple ads with the same `adSlotId` refresh independently.

### GPT API

#### `c3.GPT.defineSlot(options)`

Define a GPT ad slot.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `adUnitPath` | `string` | ✅ | - | Ad unit path |
| `size` | `array` | ✅ | - | Ad size `[width, height]` |
| `divId` | `string` | ✅ | - | Container div ID |
| `targeting` | `object` | ❌ | `{}` | Targeting parameters |
| `lazyLoad` | `boolean` | ❌ | `false` | Enable lazy loading |
| `autoRefreshSeconds` | `number` | ❌ | `0` | Auto refresh interval |

**Example:**

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

> ⚠️ **Coming Soon** - AFS API documentation is under development.

## 🔧 Advanced Examples

### AdSense with Vignette/Preroll

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

### AdSense with Rewarded Ads

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

// Or manually trigger
c3.AdSense.showReward({
  adViewed: () => giveReward()
});
```

### AdSense Manual Preroll

```javascript
// Manually trigger preroll ad
c3.AdSense.showPreroll({
  beforeAd: () => {
    console.log("About to show preroll");
  },
  adViewed: () => {
    console.log("User viewed preroll");
  },
  adBreakDone: () => {
    console.log("Preroll completed");
  }
});

// Or use alias
c3.AdSense.triggerPreroll({
  adBreakDone: () => console.log("Done")
});
```

### Lazy Loading + Auto Refresh

```javascript
c3.AdSense.createAd({
  adSlotId: "1234567890",
  lazyLoad: true,        // Load when in viewport
  autoRefreshSeconds: 30 // Refresh every 30s
});
```

### Multiple Ads with Same adSlotId

```javascript
// Create multiple ads with the same adSlotId
const ad1 = c3.AdSense.createAd({
  adSlotId: "1234567890",
  containerId: "ad-container-1",
  autoRefreshSeconds: 30 // Refreshes every 30s using unique ID
});

const ad2 = c3.AdSense.createAd({
  adSlotId: "1234567890", // Same adSlotId
  containerId: "ad-container-2",
  autoRefreshSeconds: 60 // Refreshes every 60s using unique ID
});

// Each ad refreshes independently
// Refresh specific ad
c3.AdSense.refresh(ad1);

// Refresh all ads with this adSlotId
c3.AdSense.refresh("1234567890");
```

## 🛠️ Development

```bash
# Install
npm install

# Dev
npm run dev

# Build
npm run build

# Preview
npm run preview
```

## 📝 License

MIT
