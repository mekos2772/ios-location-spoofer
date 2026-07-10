# iOS Location Modification: A Beginner's Guide (Shadowrocket)

This tutorial teaches you how to use **Shadowrocket** to change your iPhone's location to anywhere in the world, **without jailbreaking, a computer, or a developer account**. Just follow the steps.

> **The principle is simple:** The iPhone uses nearby Wi-Fi and cell towers to ask Apple's server "Where am I?" This module changes the coordinates to your specified location halfway through Apple's return journey, making the iPhone believe it's there.

---

## Before you begin, you need

- An iPhone
- **Shadowrocket App** (A paid app on the App Store; you need to purchase and install it first)
- Able to connect to the internet normally

> This method applies to all system versions, including **iOS 27 beta**. After changing the coordinates, follow step six, "Turn location services on and off, and try a few more times," and the changes will take effect.

---

## Step 1: Import Module

1. Open **Shadowrocket**
2. Click on **"Configuration"** at the bottom
3. Find the **"Module"**, and click the **"+" in the upper right corner**.
4. Select **"From URL"** and paste the following address:
   ```
   https://raw.githubusercontent.com/mekos2772/ios-location-spoofer/main/ios-location-spoofer.sgmodule
   ```
5. Save. Return to the module list and confirm that **"iOS Location Spoofer"** is checked/enabled (there is a ✓ on the right).

✅ Module import complete.

---

## Step 2: Enable HTTPS and decrypt

1. Access the **"HTTPS Decryption"** page. The access point may differ depending on your Shadowrocket version.

   - Shadowrocket iOS 2.2.88 (3308) Tested Path: At the bottom, tap **"Configuration"** → Locate the currently used configuration file → Tap the **"ⓘ"** on the right → Enter **"HTTPS Decryption"**.
   - In the old version/partial interface: tap **"Settings"** at the bottom → go to **"HTTPS Decryption"**.

   If you can't find "HTTPS decryption" in "Settings", it doesn't mean the feature is unavailable. Please click the first option to access it from the right side of the configuration file using the "ⓘ" icon.

2. Turn on the **"HTTPS Decryption"** switch (it will turn blue).

   Note: Some versions only have one switch here, which is normal, as it's essentially a man-in-the-middle decryption mechanism. The "HTTP/2 MitM" switch that appeared in the old tutorial screenshot is optional and its absence doesn't affect anything.

3. Look at the **"domains"** list in the middle and confirm that it includes these four (they usually appear automatically after importing the module):
   ```
   gs-loc.apple.com
   gs-loc-cn.apple.com
   bluedot.is.autonavi.com
   bluedot.is.autonavi.com.gds.alibabadns.com
   ```
   If not, click the green **"+"**, paste the above string separated by commas, and **then click the ✓ in the upper right corner to save**.

✅ Decryption switch and domain name are ready.

---

## Step 3: Install and trust the certificate (most crucial, don't skip this step).

This step is divided into **three smaller steps**, and if you miss one step, you can't make the changes.

### 3.1 Generate and install the certificate
1. Still on the HTTPS decryption page, click **"Certificate"**.
2. Click **"Generate New CA Certificate"** → then click **"Install Certificate****
3. A pop-up message "Downloaded profile" appears; click OK.

### 3.2 Install the configuration profile from the system.
4. Open the iPhone **Settings** app
5. Go to **Settings → General → VPN & Device Management**
6. Locate the Shadowrocket profile → Open it → Click **"Install"** (enter your lock screen password)

### 3.3 Trust Certificate ⚠️ (90% of people skip this step)
7. Go to **Settings → General → About → Certificate Trust Settings**
8. Turn on the switch for the Shadowrocket certificate (enable full trust).

✅ Only after completing all three steps can the decryption process truly begin.

---

## Step 4: Enable Agent

1. Return to Shadowrocket Homepage
2. Turn on the **main switch** at the top (it will turn green/show "Connected").
3. The first time you enter, a prompt will appear asking "Allow adding VPN configuration?". Click **Allow**.

✅ The proxy is now enabled; a VPN icon will appear in the status bar at the top.

---

## Step 5: Set the coordinates of your desired destination

The default location is **Apple Headquarters (Cupitino, USA)**. Change it to your desired location:

1. Shadowrocket → Settings → Modules → Open **"iOS Location Spoofer"**
2. turn up**`argument=`** In that line, change these two numbers:**
   - `latitude=` → Your **latitude**
   - `longitude=` → Your **longitude**
3. **keep**

Several commonly used coordinates can be copied directly:

Location | latitude | longitude |
|------|------------------|-------------------|
| Beijing Tiananmen Square | 39.9087 | 116.3975 |
| The Bund, Shanghai | 31.2397 | 121.4900 |
| Canton Tower | 23.1066 | 113.3245 |
Tokyo Tower | 35.6586 | 139.7454 |

> **How ​​to find the coordinates of any location:** Open Google Maps/Amap on your computer or mobile phone, find the target location, right-click or long-press → Copy Coordinates. You will get two numbers. The order is **latitude first, longitude second**.

### While you're at it, also adjust parameters such as altitude (this is recommended; don't just change the latitude and longitude).

`argument=` Besides latitude and longitude, several other parameters work together to form a "complete positioning." If you only change the latitude and longitude but leave the altitude at the default 530 meters, it will be noticeably inaccurate and easily reveal the error when you travel to Shanghai (near sea level) or Lhasa (3600 meters). It's recommended to adjust these parameters according to your target location.

| Parameter | Default Value | Meaning | Suggestion |
|------|--------|------|------|
| `altitude` | 530 | Altitude (meters), negative numbers supported | **Replace with the actual altitude of the target location** (see below for how to check). Shanghai ≈ 4, Beijing ≈ 44, Lhasa ≈ 3650, Turpan can be negative |
| `horizontalAccuracy` | 39 | Horizontal accuracy (meters), the smaller the value, the more "precise" | For a more GPS-like experience, set it to **5~15**; keeping it at 39 is also normal. |
| `verticalAccuracy` | 1000 | Vertical accuracy (meters) | Adjustable to **10~30** after setting the actual altitude, making the altitude appear more reliable |

> **How ​​to check the altitude of a target location:** Search for "place name altitude" in your browser, or use Gaode/Google Maps; you can also open this free API to view it directly (replace the latitude and longitude with your own):
> ```
> https://api.open-meteo.com/v1/elevation?latitude=31.2397&longitude=121.4900
> ```
> Return `elevation` It refers to altitude (in meters).

The modification method is the same as for latitude and longitude: in `argument=` Find the corresponding parameter in that line, change the number, and save. Other parameters (`motionActivityType` (In motion state) generally no movement is required.

---

## Step 6: Enable location services

Changing the coordinates won't take effect immediately; you need to "force" the iPhone to request location data from Apple again. The method is simple:

1. Open **Settings → Privacy & Security → Location Services**
2. Turn the whole thing off, wait at least 10 seconds, and then turn it back on.
3. Open the **Map** or **Weather** app to check your location.
4. If nothing changes, try turning location services on and off several times. It should work after a few tries.

> Apple caches location data, so a new request needs to be sent before it's intercepted and modified. Therefore, sometimes you need to turn it on and off several times, or try multiple times, to get a successful hit. Once it takes effect, it usually stays stable and doesn't need to be constantly turned on and off.
>
> Additional triggering tips: You can also completely kill the Maps/Weather app and then reopen it, or use Apple's built-in "Maps" app and tap the location arrow in the lower right corner to force a relocation.

---

## Advanced (optional): Select points using a web map, say goodbye to manually changing parameters.

The fifth step above involves manually modifying the module. `latitude` / `longitude` / `altitude` The numbers—**changing them occasionally is fine, but changing them frequently and having to check the altitude every time is annoying**.

The project comes with a **web map point selection tool**.`location-picker/server.js`), and automated all of this:

- **Tap your finger anywhere on the map to get there; no need to manually check latitude and longitude.**
- **Altitude is automatically obtained based on terrain** (click on any point and it will automatically fill in the actual altitude), no need to check it yourself.
- **Horizontal accuracy/Vertical accuracy** can be adjusted directly on the webpage; simply click "Save".
- Supports switching between **Gaode/Satellite/International Maps**, and automatically handles domestic map offsets.
- Searching for a place name can list **multiple candidates**, allowing you to select just like on a real map.
- **One-click "Restore Real Location"**: No need to close the module; a single click on the webpage allows the script to resume and returns you to your real location (click again to restore the fake location).

### What is needed to use it?

- A server/VPS/NAS that can run for **long periods of time** (to run this small tool).
- I have some hands-on skills (I know how to use SSH and systemd).

> If you don't have a server and only change your location occasionally → **you don't need to install this**, just manually change the numbers as described in step five.
> If you frequently change locations and want to "get everything sorted with a click of a map" → it's worth installing.

### How to install

1. In the project `location-picker/server.js` Upload it to your server and run it (the startup command is written in the comments at the beginning of the file, which supports built-in HTTPS and reuse of existing certificates).
2. In the Shadowrocket module `argument=` **Append to the end** (preceding parameters are retained):
   ```
   &configUrl=https://your-domain:port/loc.json?token=your-password
   ```
3. To change your location later: **Open a webpage → Click on the map → Click step six to turn location services on and off for the changes to take effect.**

> Detailed deployment steps (systemd persistence, certificates, ports, Cloudflare, etc.) are all written in `location-picker/server.js` Just follow the instructions in the comments at the top of the document.

### Configure environment variables (required)

`server.js` Controlled by environment variables,`TOKEN` If no process is set, it will exit directly and will not use a weak password as a fallback—this is a foolproof design to prevent you from forgetting to change the default password after deployment and having your computer scanned.

| Variable | Required | Default Value | Description |
|------|---------|--------|------|
| `TOKEN` | **Required** | None | Web version and modules `configUrl` Inside `token=` Consistency is essential. Recommendation. `openssl rand -hex 24` Generate |
| `PORT` No | `8080` Listening port; ports below 1024 require root access.
| `CERT` | No | Empty | HTTPS certificate fullchain path; `KEY` HTTPS must be configured at the same time.
| `KEY` | No | Empty | HTTPS private key path; `CERT` HTTPS must be configured at the same time.

Startup example:

```bash
# http（first make sure the workflow is working, then enable https）
TOKEN=$(openssl rand -hex 24) PORT=8080 node server.js

# https (reuses acme.sh certificates; certificate renewals require no restart, and the service automatically hot-reloads them every 12 hours）
TOKEN=$(openssl rand -hex 24) PORT=8443 \
CERT=/root/cert/example.com/fullchain.pem \
KEY=/root/cert/example.com/privkey.pem \
node server.js
```

Then the module `argument=` The end `configUrl` Written as:

```
&configUrl=https://example.com:8443/loc.json?token=(token_goes_here)
```

> ⚠️ **The URL must include the following at the end. `?token=<TOKEN>`**And this token must be consistent with the environment variables set when the server starts. `TOKEN` The values ​​must be exactly the same. Otherwise:
> - Didn't bring it `?token=` → The server returned a **401**. `missing token`
> - `?token=` Typo → Server returns **403** `bad token`
>
> The same rules apply to browser access. `/`、`/set`、`/enable` Endpoint.

Data file `loc.json` Automatically fall `server.js` Same directory, records current coordinates/altitude/precision; already written. `.gitignore`It will not contaminate the warehouse.

> ⚠️ **Do not put `TOKEN` Write it directly in the command line**—systemd is recommended. `Environment=` or `.env` + `direnv`,avoid `history` and `ps aux` It was leaked.
>
> ⚠️ First-time visit to Shadowrocket on iPhone `configUrl` A prompt will appear asking "Do you trust the certificate?"; click "Trust".

---

## Troubleshooting

**Q: Has the positioning remained unchanged?**
Search in this order:
1. **Is the switch in the certificate trust settings actually turned on?** (Step 3.3, most common reason)
2. Is the module listed in "Modules" and **enabled**? (Check the right side for confirmation)
3. Is the HTTPS decryption switch turned on? Are all four Apple domains present?
4. **Have you tried turning location services on/off several times?** (Apple has a cache, so it often takes several attempts for it to take effect.)
5. Put the module `argument=` Inside `debug=false` Change to `debug=true`Check Shadowrocket's "Data/Logs" to see if it has been intercepted. `wloc` The request—if you can see the message, it means the interception was successful.

**Q:** Why didn't the domain name appear automatically after importing the module?
Manually add those four domains to the HTTPS decryption page, and remember to click the ✓ in the upper right corner to save.

**Q: Can't find the "HTTPS Decryption" entry?**
If you are using Shadowrocket iOS 2.2.88 (3308), the actual entry point is in the "Settings" page: find the currently used configuration file, click the "ⓘ" on the right, and then enter "HTTPS Decryption". In older versions or some interfaces, it may still be in the "Settings" at the bottom.

**Q: Is it possible to restore the actual location?**
Yes. Turn off the module (cancel ✓) or turn off the Shadowrocket master switch, then refresh the location once in step 6 to restore it.

**Q: Apple News / Regional services or are you still in your current location?**
Some apps, such as Apple News, rely not only on location services but also on various iOS system service switches. Please go to **Settings → Privacy & Security → Location Services → System Services** and turn on all the switches (especially "Location-based Apple Ads," "Important Locations," "iPhone Analytics," "Route & Traffic," and "Improve Map Accuracy"). After turning them all on, turn location services off and on again; Apple News should then be able to recognize the new area.

---

## Quick Reference for Operation Sequence

```
Import the module → Enable HTTPS decryption + add the domain → Install the certificate and trust it → Enable the proxy → Change the coordinates and save
→ Turn Location Services off, wait 10 seconds, then turn them back on (if the location doesn't change, try a few more times) → Open the map app to verify
```

I wish you a smooth configuration process. If you get stuck at any step, simply check each item in the "Common Problems Troubleshooting" section above.
