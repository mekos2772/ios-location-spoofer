# Location Picker — Cloudflare Worker

与 `../server.js` API 完全兼容，免 VPS、自带 HTTPS，支持 **Loon / Shadowrocket / Surge** 的 `configUrl`。

## 接口

| 路径 | 方法 | 说明 |
|------|------|------|
| `/?token=` | GET | 地图选点网页（必须带正确 token） |
| `/loc.json?token=` | GET | 读取坐标 JSON |
| `/set?token=` | POST | 保存坐标 |
| `/health` | GET | 健康检查（无需 token） |
| 路径               | 方法 | 说明                                      |
| ------------------ | ---- | ----------------------------------------- |
| `/`                | GET  | 地图选点网页（URL 加 `?token=` 才能保存） |
| `/loc.json?token=` | GET  | 读取坐标 JSON                             |
| `/set?token=`      | POST | 保存坐标                                  |
| `/enable`          | POST | 回到真实位置（再点一下恢复伪造）          |
| `/health`          | GET  | 健康检查（无需 token）                    |

## 部署

> 只想用 Cloudflare 网页后台复制粘贴、不想装 npm / Wrangler 的用户，看这里：[`../cloudflare-webui/`](../cloudflare-webui/)。

### 1. 安装依赖

```bash
cd location-picker/worker
npm install
```

### 2. 创建 KV 命名空间

```bash
npx wrangler kv namespace create LOC_KV
npx wrangler kv namespace create LOC_KV --preview
```

把输出的 `id` 填进 `wrangler.jsonc` 的 `id` 和 `preview_id`。

### 3. 设置访问口令

```bash
npx wrangler secret put TOKEN
# 输入随机字符串，例如 openssl rand -hex 24 生成的值
```

本地开发可复制 `.dev.vars.example` 为 `.dev.vars` 并填写 `TOKEN=...`。

### 4. 部署

```bash
npm run deploy
```

记下输出的地址，例如 `https://ios-location-picker.你的账号.workers.dev`。

## Loon 插件配置

Loon → 设置 → 插件 → iOS Location Spoofer → **远程配置 URL**：

```
https://ios-location-picker.你的账号.workers.dev/loc.json?token=你的TOKEN
```

保存后，在 iPhone 浏览器打开地图页：

```
https://ios-location-picker.你的账号.workers.dev/?token=你的TOKEN
```

点地图 → **保存定位** → 关开 iPhone 定位服务生效（Loon 约 60 秒内刷新缓存）。

## Shadowrocket 配置

模块 `argument=` 末尾追加：

```
&configUrl=https://ios-location-picker.你的账号.workers.dev/loc.json?token=你的TOKEN
```

## 自定义域名（可选）

在 Cloudflare Dashboard → Workers → 你的 Worker → Settings → Domains 绑定子域即可，例如 `loc.example.com`。

## 与 Node 版差异

- 数据存在 **KV**（非本地文件），个人用量免费额度足够
- KV 有秒级最终一致性，保存后 Loon 最多等约 60 秒缓存刷新
- 无需自行管理 HTTPS 证书
