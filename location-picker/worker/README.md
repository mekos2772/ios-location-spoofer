# Location Picker — Cloudflare Worker

免 VPS、自带 HTTPS，支持 **Loon / Shadowrocket / Surge** 的 `configUrl`。管理网页不再把 Token 放进 URL；首次进入或会话过期时通过页面内登录框输入 Token，Worker 校验后设置 7 天有效的 `HttpOnly` Cookie。

线上非 HTTPS 请求会自动跳转到 HTTPS；如果浏览器禁用 Cookie，登录框会提示 Cookie 未保存，而不是反复要求重新登录。

## 接口

| 路径               | 方法 | 说明                                      |
| ------------------ | ---- | ----------------------------------------- |
| `/`                | GET  | 地图选点网页，进入后用页面内登录框输入 Token |
| `/pub.json`        | GET  | 公开读取坐标 JSON，供客户端 `configUrl` 使用 |
| `/login`           | POST | 用 Token 登录，设置 `HttpOnly` 会话 Cookie |
| `/logout`          | POST | 清除会话 Cookie                           |
| `/loc.json`        | GET  | 管理端读取坐标 JSON，需会话 Cookie        |
| `/set`             | POST | 保存坐标，需会话 Cookie                   |
| `/enable`          | POST | 回到真实位置（再点一下恢复伪造），需会话 Cookie |
| `/health`          | GET  | 健康检查（无需 token）                    |

## 部署

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

如果这是个人 fork，建议复制一份本地部署配置：

```bash
cp wrangler.jsonc wrangler.local.jsonc
```

把真实 KV `id` 写进 `wrangler.local.jsonc`，并确保它已被 `.gitignore` 忽略；`wrangler.jsonc` 保留占位符，避免把个人 Cloudflare 配置提交到仓库。

### 3. 设置访问口令

```bash
npx wrangler secret put TOKEN
# 输入随机字符串，例如 openssl rand -hex 24 生成的值
```

可选：单独设置会话签名密钥。未设置时会用 `TOKEN` 作为签名密钥；设置后可以独立轮换会话，轮换会让已登录浏览器重新输入 Token。

```bash
npx wrangler secret put SESSION_SECRET
# 建议使用 openssl rand -hex 32
```

本地开发可复制 `.dev.vars.example` 为 `.dev.vars` 并填写 `TOKEN=...`。

### 4. 部署

```bash
npx wrangler deploy --config wrangler.local.jsonc
```

记下输出的地址，例如 `https://ios-location-picker.你的账号.workers.dev`。

## Loon 插件配置

Loon → 设置 → 插件 → iOS Location Spoofer → **远程配置 URL**：

```
https://ios-location-picker.你的账号.workers.dev/pub.json
```

保存后，在 iPhone 浏览器打开地图页：

```
https://ios-location-picker.你的账号.workers.dev/
```

输入 Token → 点地图 → **保存定位** → 关开 iPhone 定位服务生效（Loon 约 60 秒内刷新缓存）。

## Shadowrocket 配置

模块 `argument=` 末尾追加：

```
&configUrl=https://ios-location-picker.你的账号.workers.dev/pub.json
```

## 自定义域名（可选）

在 Cloudflare Dashboard → Workers → 你的 Worker → Settings → Domains 绑定子域即可，例如 `loc.example.com`。

## 与 Node 版差异

- 数据存在 **KV**（非本地文件），个人用量免费额度足够
- KV 有秒级最终一致性，保存后 Loon 最多等约 60 秒缓存刷新
- 无需自行管理 HTTPS 证书
