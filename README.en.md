# iOS Location Spoofer

**English** · [中文](README.md)

Use the HTTPS-decryption (MITM) feature of a proxy app to trick Apple's location service — and therefore Apple Maps — into placing your iPhone anywhere in the world.

> 📖 **New here?** The step-by-step walkthrough is Chinese-only for now → [使用教程.md](使用教程.md) (install, configure, verify, and troubleshooting).

## Credits

This project builds on the core research of [acheong08/ios-location-spoofer](https://github.com/acheong08/ios-location-spoofer). The original is a standalone iOS app written in Go that spoofs location with a self-hosted VPN + MITM proxy.

This repo re-implements that core logic in JavaScript and adapts it to five proxy platforms — Shadowrocket, Surge, Loon, Quantumult X, and Stash — so there's nothing to compile and no developer account required. Import and go.

### What this port adds over the original

- **Multi-platform support** — from a single iOS app to five proxy apps.
- **Cell-tower coordinate rewriting** — the Go original only rewrote Wi-Fi hotspot coordinates; the JS version also rewrites CellTower coordinates (fields 22/24).
- **Multiple response-format compatibility** — auto-detects Apple's response envelope (ARPC / synthetic / marker / bare) so the rewritten payload is still accepted by iOS.
- **Motion-state spoofing** — also rewrites `motionActivityType` and `motionActivityConfidence` to reduce the chance of detection.

## How it works

Your iPhone reads nearby Wi-Fi and cell signals, then asks Apple where those BSSIDs/towers are. Apple replies with a list of coordinates, and iOS computes its own position from them.

This project intercepts Apple's reply on the way back and rewrites every coordinate to the numbers you chose. iOS receives the altered coordinates and concludes it is exactly where you told it to be.

## Supported apps

| App | File | How to import | Status |
|-----|------|---------------|--------|
| Shadowrocket | `ios-location-spoofer.sgmodule` | Config → top-right `+` | ✅ Verified |
| Surge | `ios-location-spoofer-surge.sgmodule` | Home → Modules → Install New Module | ✅ Verified |
| Loon | `ios-location-spoofer.lnplugin` | Settings → Plugins → Add Plugin | ✅ Verified |
| Quantumult X | `ios-location-spoofer.snippet` | Settings → Rewrite → Add | 🟡 Untested |
| Stash | `ios-location-spoofer.stoverride` | Override → Install Override | ✅ Verified |

> Tested it? Please report results in Issues. If something doesn't work, PRs are welcome — at minimum include **which app, which version, which iOS, and the raw error log**.

## Usage

1. Turn on HTTPS decryption / MITM in your proxy app.
2. Install and trust the CA certificate (Settings → General → VPN & Device Management → install, then Certificate Trust Settings → enable).
3. Import the module file and enable it.
4. Reconnect the VPN and toggle Location Services off/on.
5. Open Maps to verify.

### Loon notes

1. After importing `ios-location-spoofer.lnplugin`, open the plugin config page under **Settings → Plugins**.
2. You can enter **latitude / longitude** directly. **Address search** is resolved and cached by a cron task that runs every 15 minutes (for the first run, enter coordinates directly or save an address and wait one cron cycle).
3. You must enable Loon's **MITM** and trust the certificate, and the four domains in the plugin's `[mitm]` block must be active.
4. The plugin includes a **Prepare** request script (sets `Accept-Encoding: identity` to avoid gzip-induced `zip decompress error` / script timeouts).
5. After changing coordinates, toggle Location Services off/on. For debugging, enable **debug logging** and search Loon's log for `Location spoofer`.

> If the log shows `Evaluate script timeout` or `zip decompress error:-3`: update the plugin and reload Loon, and confirm all three scripts (Prepare / Response / Geocode cron) are enabled.

## Changing coordinates

Default is Apple Park (37.3349, -122.00902). Change it in the module arguments:

```
latitude=39.9042&longitude=116.4074
```

| Name | Default | Description |
|------|---------|-------------|
| `latitude` | 37.3349 | Target latitude |
| `longitude` | -122.00902 | Target longitude |
| `address` | (empty) | Address search (entered in the Loon plugin UI; resolved to coordinates online; takes precedence over manual lat/lng) |
| `horizontalAccuracy` | 39 | Horizontal accuracy |
| `verticalAccuracy` | 1000 | Vertical accuracy |
| `altitude` | 530 | Altitude |
| `failOpen` | true | Pass the original data through on error |
| `debug` | false | Debug logging |

## File map

```
ios-location-spoofer.sgmodule       # Shadowrocket
ios-location-spoofer-surge.sgmodule # Surge
ios-location-spoofer.lnplugin       # Loon
ios-location-spoofer.snippet        # Quantumult X
ios-location-spoofer.stoverride     # Stash
location-spoofer.js                 # Core script (shared by four platforms)
location-spoofer-qx.js              # Quantumult X-specific
location-spoofer-config.json        # Config sample
使用教程.md                         # Step-by-step tutorial (Chinese)
location-picker/                    # Optional: web map picker (Node or Cloudflare Worker)
location-picker/worker/             # Cloudflare Worker version (no VPS; supports Loon configUrl)
```

## Optional: web map location picker

Change location often and tired of looking up coordinates by hand? The bundled [`location-picker/`](location-picker/) tool lets you tap a map to set your location: altitude is filled in automatically and accuracy is adjustable. Loon / Shadowrocket read it via `configUrl`.

**Three deployment options:**

| Option | Directory | Best for |
|--------|-----------|----------|
| **Cloudflare Worker — Wrangler CLI** (recommended) | [`location-picker/worker/`](location-picker/worker/) | No VPS, HTTPS included; comfortable with the CLI |
| **Cloudflare Worker — dashboard** | [`location-picker/cloudflare-webui/`](location-picker/cloudflare-webui/) | No VPS, HTTPS included; no npm/Wrangler — paste a single file |
| Self-hosted Node | [`location-picker/server.js`](location-picker/server.js) | You have your own VPS / NAS |

Loon plugin **remote config URL** example:

```
https://your-worker.workers.dev/loc.json?token=YOUR_TOKEN
```

## Community

This project welcomes review and feedback from the LINUX DO community: [LINUX DO](https://linux.do)

## location-picker server configuration

`location-picker/server.js` is controlled by environment variables. **If `TOKEN` is not set, the process exits immediately — it will never fall back to a weak default.**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TOKEN` | **Yes** | none | Access token. Must match the `token=` in the `configUrl` at the end of the proxy module's `argument=`. Generate one with `openssl rand -hex 24`. |
| `PORT` | No | `8080` | Listen port; ports below 1024 require root. |
| `CERT` | No | empty | HTTPS fullchain certificate path; HTTPS is used only when both `CERT` and `KEY` are set. |
| `KEY` | No | empty | HTTPS private key path; used only when both `CERT` and `KEY` are set. |

Startup examples:

```bash
# http (simplest — get the flow working before switching to https)
TOKEN=$(openssl rand -hex 24) PORT=8080 node server.js

# https (reuse acme.sh certs; no restart needed on renewal — the process hot-reloads every 12 hours)
TOKEN=$(openssl rand -hex 24) PORT=8443 \
CERT=/root/cert/example.com/fullchain.pem \
KEY=/root/cert/example.com/privkey.pem \
node server.js
```

The data file `loc.json` is written next to `server.js` and records the current coordinates / altitude / accuracy. It is listed in `.gitignore`, so it won't be committed to the repo by accident.

> ⚠️ **Don't put `TOKEN` in your shell history.** Prefer systemd's `Environment=` or `.env` + `direnv` to avoid leaking it via `history` / `ps aux`.

## Security note

The Cloudflare Worker versions and `server.js` all require a token on every endpoint (including the map page). Token comparison is constant-time, and `server.js` refuses to start without a `TOKEN`. Because MITM decryption sees all traffic to the intercepted Apple endpoints, only enable the module while you actively need it, and keep your CA private key on-device only.

## License

See [LICENSE](LICENSE).
