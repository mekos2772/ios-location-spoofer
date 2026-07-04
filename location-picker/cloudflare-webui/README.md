# Cloudflare 网页后台部署教程

这是一份给新手看的 Cloudflare Worker 网页后台部署教程。它不要求本地安装 Node.js、npm 或 Wrangler，也不要求理解多文件 Worker 项目结构。

如果你会命令行，推荐使用 [`../worker/`](../worker/) 里的 Wrangler 部署方式。  
如果你只想在 Cloudflare 网页后台复制粘贴，请使用本目录的单文件 Worker：

```text
location-picker/cloudflare-webui/worker.js
```

## 这份教程解决什么问题

`location-picker/server.js` 是 Node/VPS/NAS 版，不适合直接部署到 Cloudflare Worker。Cloudflare Worker 也不能使用 Node 的 `http`、`https`、`fs` 和本地 `loc.json`。

Cloudflare 正确结构是：

```text
Cloudflare Worker：提供地图页面和 API
Cloudflare KV：保存当前坐标
Worker Secret：保存访问口令 TOKEN
```

为了避免 Cloudflare 在线编辑器的多文件入口问题，本目录提供了一个已经合并好的 `worker.js`。把它复制到 Cloudflare Worker 默认代码文件即可。

## 一、创建 Worker

1. 打开 Cloudflare Dashboard。
2. 进入：

```text
Workers & Pages
```

3. 点击：

```text
Create application
```

4. 选择：

```text
Worker
```

不要选择 Pages。这个工具需要 API 和 KV，不是静态网站。

5. Worker 名字可以填：

```text
ios-location-picker
```

6. 创建后进入 Worker，点击：

```text
Edit code
```

## 二、复制单文件 worker.js

1. 打开本目录的：

```text
location-picker/cloudflare-webui/worker.js
```

2. 复制全部内容。
3. 回到 Cloudflare 的代码编辑器。
4. 找到默认文件，通常叫：

```text
worker.js
```

或者 Cloudflare 默认显示的 Hello World 文件。

5. 删除原来的 Hello World 代码。
6. 粘贴本目录 `worker.js` 的全部内容。
7. 点击：

```text
Deploy
```

部署后访问带 TOKEN 的 Worker 主页，如果能看到地图页面，说明代码部分已经成功。例如：

```text
https://你的Worker地址/?token=你的TOKEN
```

不带 TOKEN 访问主页应该返回 403。

## 三、创建 KV

1. 回到 Cloudflare Dashboard。
2. 进入：

```text
Workers & Pages
```

3. 找到：

```text
KV
```

或：

```text
Workers KV
```

4. 创建一个 namespace。
5. 名字建议填：

```text
LOC_KV
```

## 四、绑定 KV 到 Worker

1. 进入你的 Worker。
2. 进入：

```text
Settings
```

3. 找到：

```text
Bindings
```

4. 点击：

```text
Add binding
```

5. 类型选择：

```text
KV Namespace
```

6. 变量名必须填：

```text
LOC_KV
```

7. 选择刚才创建的 KV namespace。
8. 保存。

注意：变量名必须一模一样。不能写成 `loc_kv`、`KV` 或 `LOCATION_KV`。

## 五、添加 TOKEN

TOKEN 是地图保存和配置读取的访问口令。

1. 进入 Worker 的：

```text
Settings
```

2. 找到：

```text
Variables and Secrets
```

3. 点击添加变量。
4. 类型选择：

```text
Secret
```

5. 名字填：

```text
TOKEN
```

6. 值填一串足够长的随机字符，例如：

```text
把这里换成你自己的随机字符串
```

可以用密码管理器生成，也可以用其他随机字符串生成器。不要使用 `123456`、生日、手机号等弱口令。

保存后，如果 Cloudflare 提示重新部署，请再点一次 Deploy。

## 六、检查是否成功

假设 Worker 地址是：

```text
https://ios-location-picker.你的账号.workers.dev
```

打开：

```text
https://ios-location-picker.你的账号.workers.dev/health
```

必须看到：

```json
{"ok":true,"kv":true,"tokenConfigured":true}
```

字段含义：

| 字段 | 正常值 | 说明 |
|------|--------|------|
| `ok` | `true` | Worker 正常 |
| `kv` | `true` | KV 绑定成功 |
| `tokenConfigured` | `true` | TOKEN 已配置 |

如果看到：

```json
{"ok":true,"kv":false,"tokenConfigured":true}
```

说明 KV 没绑定好。回到 Bindings，检查变量名是否是：

```text
LOC_KV
```

如果看到：

```json
{"ok":true,"kv":true,"tokenConfigured":false}
```

说明 TOKEN 没加好。回到 Variables and Secrets，添加 Secret：

```text
TOKEN
```

## 七、绑定自己的域名

如果不想用很长的 `workers.dev` 地址，可以绑定自己的域名。

例如：

```text
myloc.example.com
```

操作：

1. 进入你的 Worker。
2. 进入：

```text
Settings
```

3. 找到：

```text
Domains & Routes
```

或：

```text
Triggers
```

4. 点击：

```text
Add Custom Domain
```

5. 填你的域名：

```text
myloc.example.com
```

6. 保存。

如果域名 DNS 已经托管在 Cloudflare，Cloudflare 会自动处理 DNS 和 HTTPS 证书。

绑定成功后检查：

```text
https://myloc.example.com/health
```

正常应该返回：

```json
{"ok":true,"kv":true,"tokenConfigured":true}
```

## 八、Shadowrocket 小火箭配置

在小火箭模块的 `argument=` 最后追加：

```text
&configUrl=https://你的域名/loc.json?token=你的TOKEN
```

如果没有自定义域名，就使用 Worker 地址：

```text
&configUrl=https://ios-location-picker.你的账号.workers.dev/loc.json?token=你的TOKEN
```

完整示例：

```ini
[Script]
iOS Location Spoofer = type=http-response,pattern=^https?:\/\/(?:gs-loc(?:-cn)?\.apple\.com|bluedot\.is\.autonavi\.com(?:\.gds\.alibabadns\.com)?)\/clls\/wloc(?:\?.*)?$,requires-body=1,binary-body-mode=1,max-size=1048576,timeout=10,script-path=https://raw.githubusercontent.com/mekos2772/ios-location-spoofer/main/location-spoofer.js,argument=mode=response&latitude=37.3349&longitude=-122.00902&horizontalAccuracy=39&verticalAccuracy=1000&altitude=530&debug=false&configUrl=https://你的域名/loc.json?token=你的TOKEN

[MITM]
hostname = %APPEND% gs-loc.apple.com, gs-loc-cn.apple.com, bluedot.is.autonavi.com, bluedot.is.autonavi.com.gds.alibabadns.com
```

`[MITM]` 部分保持不变。

## 九、地图怎么用

最容易漏的一点：

```text
搜索地点不等于保存定位。
```

正确流程：

1. 打开地图页面：

```text
https://你的域名/?token=你的TOKEN
```

2. 搜索地点。
3. 地图会移动到搜索结果附近。
4. 一定要在地图上点一下，放置图钉。
5. 点击：

```text
保存定位
```

6. 看到已保存提示。

然后检查：

```text
https://你的域名/loc.json?token=你的TOKEN
```

如果里面的经纬度已经变化，说明 Cloudflare 保存成功。

## 十、iPhone 上生效步骤

保存地图定位后：

1. 小火箭断开重连。
2. iPhone 关开定位服务。
3. 打开 Apple 地图测试。

如果还是没变，检查：

- 小火箭模块是否真的启用
- HTTPS 解密 / MITM 是否开启
- CA 证书是否已安装并信任
- 模块参数里是否真的加了 `configUrl`
- `loc.json?token=...` 返回的经纬度是否已经变化

## 十一、常见问题

### 访问主页不带 token 也能看到地图，安全吗？

新版单文件 Worker 已经收紧为：地图主页也必须带正确 TOKEN 才能打开。

不带 TOKEN 访问：

```text
https://你的域名/
```

应该返回：

```json
{"error":"bad token"}
```

不带 TOKEN 访问：

```text
https://你的域名/loc.json
```

应该返回：

```json
{"error":"bad token"}
```

这说明坐标接口没有裸露。

### `/health` 正常，但小火箭没变化

先检查：

```text
https://你的域名/loc.json?token=你的TOKEN
```

如果经纬度还是默认：

```text
37.3349, -122.00902
```

说明你还没有在地图上点图钉并保存。

### 搜索后没变化

搜索只是移动地图视野。必须在地图上点一下放图钉，再点保存。

### Cloudflare 显示 Hello World

说明你没有替换默认 `worker.js`，或者部署的不是当前 Worker。

请重新打开 Worker 的 Edit code，把本目录里的 `worker.js` 全部复制进去，然后 Deploy。

### 报 `Unexpected token '<'`

说明你复制了 GitHub 网页 HTML，不是真正的 JS 文件。

请使用本目录里的：

```text
worker.js
```

不要复制 GitHub 网页源码。

## 十二、最终使用模板

地图页面：

```text
https://你的域名/?token=你的TOKEN
```

小火箭 configUrl：

```text
https://你的域名/loc.json?token=你的TOKEN
```

小火箭追加参数：

```text
&configUrl=https://你的域名/loc.json?token=你的TOKEN
```
