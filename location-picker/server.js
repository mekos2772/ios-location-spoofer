// 定位选点服务 —— 单文件、零依赖（仅用 Node 内置模块）
// 支持：高德矢量 / 高德卫星 / 国外 OSM 多地图切换，自动 GCJ-02<->WGS-84 坐标转换
// 搜索显示多个候选（只移动视野）；点地图/拖图钉移动定位点；点“保存定位”才写入
// 点地图自动按地形获取海拔；海拔/水平精度/垂直精度可手动微调
// 可选自带 https（复用 3x-ui 的 acme.sh 证书）
//
// 启动示例（http）：
//   TOKEN=你的密码 PORT=8080 node server.js
//
// 启动示例（https，复用已有证书）：
//   TOKEN=你的密码 PORT=8443 \
//   CERT=/root/cert/你的域名/fullchain.pem \
//   KEY=/root/cert/你的域名/privkey.pem \
//   node server.js
//
// Shadowrocket 模块 argument 末尾加：
//   &configUrl=https://你的域名:8443/loc.json?token=你的密码
//
// 注意：URL 必须带 ?token=<TOKEN>。缺 token → 服务端返回 401 + "missing token"；
// token 错 → 返回 403 + "bad token"。网页端点同样适用。

const http = require("http");
const https = require("https");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8080;
// TOKEN 必设：不设直接退出，绝不用弱口令兜底（否则任何人都能读写你的定位）
const TOKEN = process.env.TOKEN || "";
if (!TOKEN) {
  console.error(
    "启动失败：未设置 TOKEN 环境变量。请用随机字符串启动，例如：\n" +
    "  TOKEN=$(openssl rand -hex 24) PORT=8080 node server.js"
  );
  process.exit(1);
}
const CERT = process.env.CERT || "";                   // https 证书 fullchain 路径（留空=http）
const KEY = process.env.KEY || "";                     // https 私钥路径
const DATA_FILE = path.join(__dirname, "loc.json");

// 常量时间比较，避免通过响应时延逐字节爆破 token
function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) {
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

// 字段名/默认值与 location-spoofer.js 的 DEFAULT_CONFIG 对齐
const DEFAULT = {
  enabled: true,          // false = 脚本放行原始响应（恢复真实定位）
  latitude: 37.3349,
  longitude: -122.00902,
  altitude: 530,
  horizontalAccuracy: 39,
  verticalAccuracy: 1000
};

function readLoc() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (e) {
    return Object.assign({}, DEFAULT);
  }
}

function writeLoc(obj) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2));
}

function send(res, code, type, body) {
  res.writeHead(code, {
    "Content-Type": type,
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store"
  });
  res.end(body);
}

// 区分「没传 token」和「token 传错」：前者 401 引导补 ?token=，后者 403
function checkToken(token, res) {
  if (token == null || token === "") {
    send(res, 401, "application/json", '{"error":"missing token","hint":"add ?token=<TOKEN> to the URL (must match the TOKEN env var)"}');
    return false;
  }
  if (!safeEqual(token, TOKEN)) {
    send(res, 403, "application/json", '{"error":"bad token"}');
    return false;
  }
  return true;
}

function handler(req, res) {
  const url = new URL(req.url, "http://" + (req.headers.host || "localhost"));
  const token = url.searchParams.get("token");

  // ---- Shadowrocket 读取坐标（存的就是 WGS-84，Apple 需要的格式） ----
  if (url.pathname === "/loc.json" && req.method === "GET") {
    if (!checkToken(token, res)) return;
    return send(res, 200, "application/json", JSON.stringify(readLoc()));
  }

  // ---- 网页保存（前端已转好 WGS-84 再发过来；海拔/精度可选） ----
  if (url.pathname === "/set" && req.method === "POST") {
    if (!checkToken(token, res)) return;
    let body = "";
    req.on("data", function (c) {
      body += c;
      if (body.length > 1e4) req.destroy();
    });
    req.on("end", function () {
      try {
        const j = JSON.parse(body);
        const la = Number(j.lat);
        const lo = Number(j.lng);
        if (
          !isFinite(la) || !isFinite(lo) ||
          la < -90 || la > 90 || lo < -180 || lo > 180
        ) {
          return send(res, 400, "application/json", '{"error":"bad coords"}');
        }
        const cur = readLoc();
        cur.enabled = true; // 保存一个新位置 = 开启伪造
        cur.latitude = la;
        cur.longitude = lo;
        // 海拔/精度：脚本里都会被 Math.trunc 成整数，这里取整存
        function setInt(key, v) {
          if (v !== undefined && v !== null && v !== "" && isFinite(Number(v))) {
            cur[key] = Math.round(Number(v));
          }
        }
        setInt("altitude", j.altitude);
        setInt("horizontalAccuracy", j.horizontalAccuracy);
        setInt("verticalAccuracy", j.verticalAccuracy);
        writeLoc(cur);
        return send(res, 200, "application/json", JSON.stringify(cur));
      } catch (e) {
        return send(res, 400, "application/json", '{"error":"bad json"}');
      }
    });
    return;
  }

  // ---- 一键切换：伪造 / 恢复真实定位 ----
  if (url.pathname === "/enable" && req.method === "POST") {
    if (!checkToken(token, res)) return;
    let body = "";
    req.on("data", function (c) {
      body += c;
      if (body.length > 1e4) req.destroy();
    });
    req.on("end", function () {
      try {
        const j = JSON.parse(body);
        const cur = readLoc();
        cur.enabled = j.enabled !== false; // false=恢复真实定位（脚本放行）
        writeLoc(cur);
        return send(res, 200, "application/json", JSON.stringify(cur));
      } catch (e) {
        return send(res, 400, "application/json", '{"error":"bad json"}');
      }
    });
    return;
  }

  // ---- 地图网页（与 Worker 版一致，必须带正确 token） ----
  if (url.pathname === "/" && req.method === "GET") {
    if (!checkToken(token, res)) return;
    return send(res, 200, "text/html; charset=utf-8", PAGE);
  }

  return send(res, 404, "text/plain", "not found");
}

// ---- 启动：有证书走 https，否则 http ----
function onListenError(err) {
  if (err.code === "EADDRINUSE") {
    console.error("启动失败：端口 " + PORT + " 已被占用，请改用其它空闲端口（修改 PORT 环境变量）。");
  } else if (err.code === "EACCES") {
    console.error("启动失败：没有权限监听端口 " + PORT + "（1024 以下端口需 root 权限）。");
  } else {
    console.error("启动失败：" + err.message);
  }
  process.exit(1);
}

function start() {
  if (CERT && KEY) {
    try {
      const opts = { cert: fs.readFileSync(CERT), key: fs.readFileSync(KEY) };
      const server = https.createServer(opts, handler);
      server.on("error", onListenError);
      // acme.sh 续期后无需重启：每 12 小时热加载一次证书
      setInterval(function () {
        try {
          server.setSecureContext({ cert: fs.readFileSync(CERT), key: fs.readFileSync(KEY) });
        } catch (e) {
          console.log("cert reload failed: " + e.message);
        }
      }, 12 * 3600 * 1000);
      server.listen(PORT, function () {
        console.log("location picker (https) listening on :" + PORT);
      });
      return;
    } catch (e) {
      console.log("https 启动失败（证书读取失败），回退到 http：" + e.message);
    }
  }
  const server = http.createServer(handler);
  server.on("error", onListenError);
  server.listen(PORT, function () {
    console.log("location picker (http) listening on :" + PORT);
  });
}

start();

const PAGE = `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>定位选点</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>
  html,body{margin:0;height:100%;font-family:-apple-system,BlinkMacSystemFont,sans-serif}
  .bar{padding:8px;display:flex;gap:6px;box-sizing:border-box}
  .bar input{flex:1;padding:10px;font-size:16px;border:1px solid #ccc;border-radius:8px}
  .bar button{padding:10px 14px;font-size:16px;border:0;border-radius:8px;background:#007aff;color:#fff}
  .results{margin:0 8px;border:1px solid #e2e2e2;border-radius:8px;max-height:34vh;overflow:auto;display:none}
  .results.show{display:block}
  .rrow{padding:10px 12px;font-size:14px;border-bottom:1px solid #eee;color:#222}
  .rrow:last-child{border-bottom:0}
  .rrow:active{background:#f0f6ff}
  #map{height:52vh}
  #info{padding:8px 10px;font-size:13px;line-height:1.4}
  .opts{padding:6px 10px 12px;display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end}
  .opts label{font-size:13px;color:#444;display:flex;flex-direction:column}
  .opts input{width:88px;padding:8px;font-size:15px;border:1px solid #ccc;border-radius:6px;margin-top:2px}
  #savebtn{padding:11px 20px;font-size:16px;border:0;border-radius:8px;background:#34c759;color:#fff;font-weight:600}
  #restorebtn{padding:11px 16px;font-size:15px;border:0;border-radius:8px;background:#8e8e93;color:#fff}
  .toast{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);
    background:rgba(0,0,0,.85);color:#fff;padding:10px 16px;border-radius:8px;
    font-size:14px;opacity:0;transition:opacity .3s;pointer-events:none;z-index:9999}
  .toast.show{opacity:1}
</style>
</head>
<body>
<div class="bar">
  <input id="q" placeholder="搜地名，回车列出候选（只预览，不改定位）">
  <button id="btn">搜</button>
</div>
<div class="results" id="results"></div>
<div id="map"></div>
<div id="info">加载中…</div>
<div class="opts">
  <label>海拔(米)<input id="alt" type="number" inputmode="numeric"></label>
  <label>水平精度<input id="hacc" type="number" inputmode="numeric"></label>
  <label>垂直精度<input id="vacc" type="number" inputmode="numeric"></label>
  <button id="savebtn">保存定位</button>
  <button id="restorebtn">恢复真实定位</button>
</div>
<div class="toast" id="toast"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var token = new URLSearchParams(location.search).get("token") || "";

// ---------- GCJ-02 <-> WGS-84 坐标转换（中国地图偏移修正） ----------
var GCJ = (function(){
  var PI = Math.PI, a = 6378245.0, ee = 0.00669342162296594323;
  function outOfChina(lat,lng){return (lng<72.004||lng>137.8347)||(lat<0.8293||lat>55.8271);}
  function tLat(x,y){
    var r=-100.0+2.0*x+3.0*y+0.2*y*y+0.1*x*y+0.2*Math.sqrt(Math.abs(x));
    r+=(20.0*Math.sin(6.0*x*PI)+20.0*Math.sin(2.0*x*PI))*2.0/3.0;
    r+=(20.0*Math.sin(y*PI)+40.0*Math.sin(y/3.0*PI))*2.0/3.0;
    r+=(160.0*Math.sin(y/12.0*PI)+320*Math.sin(y*PI/30.0))*2.0/3.0;return r;
  }
  function tLng(x,y){
    var r=300.0+x+2.0*y+0.1*x*x+0.1*x*y+0.1*Math.sqrt(Math.abs(x));
    r+=(20.0*Math.sin(6.0*x*PI)+20.0*Math.sin(2.0*x*PI))*2.0/3.0;
    r+=(20.0*Math.sin(x*PI)+40.0*Math.sin(x/3.0*PI))*2.0/3.0;
    r+=(150.0*Math.sin(x/12.0*PI)+300.0*Math.sin(x/30.0*PI))*2.0/3.0;return r;
  }
  function wgs2gcj(lat,lng){
    if(outOfChina(lat,lng))return [lat,lng];
    var dLat=tLat(lng-105.0,lat-35.0), dLng=tLng(lng-105.0,lat-35.0);
    var radLat=lat/180.0*PI, m=Math.sin(radLat); m=1-ee*m*m; var sm=Math.sqrt(m);
    dLat=(dLat*180.0)/((a*(1-ee))/(m*sm)*PI);
    dLng=(dLng*180.0)/(a/sm*Math.cos(radLat)*PI);
    return [lat+dLat,lng+dLng];
  }
  function gcj2wgs(lat,lng){ // 迭代反解，往返误差 <0.001 米
    if(outOfChina(lat,lng))return [lat,lng];
    var wlat=lat, wlng=lng;
    for(var i=0;i<3;i++){ var g=wgs2gcj(wlat,wlng); wlat+=lat-g[0]; wlng+=lng-g[1]; }
    return [wlat,wlng];
  }
  return {wgs2gcj:wgs2gcj, gcj2wgs:gcj2wgs};
})();

// ---------- 状态 ----------
var map, marker;
var WGS = {lat:0, lng:0};   // 当前“定位点(图钉)”的真值 WGS-84（预览用，未必已保存）
var datum = "gcj";          // 当前底图坐标系：'gcj'(高德) 或 'wgs'(OSM)
var saved = true;           // 图钉当前位置是否已保存到设备
var enabledState = true;    // true=伪造中；false=已恢复真实定位（脚本放行）

function $(id){return document.getElementById(id);}
function toast(t){var e=$("toast");e.textContent=t;e.classList.add("show");setTimeout(function(){e.classList.remove("show");},1800);}
function numOrNull(id){var v=$(id).value.trim();return v===""?null:Number(v);}

function info(){
  if(!enabledState){
    $("info").innerHTML = "<b style='color:#ff9500'>已恢复真实定位 · 脚本放行不修改</b>　（关开定位后生效）";
    return;
  }
  var tag = saved ? "已保存 ✓" : "未保存 · 点“保存定位”生效";
  $("info").innerHTML = "<b style='color:"+(saved?"#34c759":"#ff9500")+"'>"+tag+"</b>　WGS-84 "+
    WGS.lat.toFixed(5)+", "+WGS.lng.toFixed(5)+"　海拔 "+($("alt").value||"?")+"m";
}

// 切换按钮外观：伪造中(灰按钮“恢复真实定位”) / 已恢复(橙按钮“重新开启伪造”)
function updateEnabledUI(){
  var b=$("restorebtn");
  if(enabledState){ b.textContent="恢复真实定位"; b.style.background="#8e8e93"; }
  else { b.textContent="● 重新开启伪造"; b.style.background="#ff9500"; }
  info();
}

// 一键切换 伪造/恢复真实
function toggleEnabled(){
  var want = !enabledState;
  fetch("/enable?token="+encodeURIComponent(token),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({enabled:want})})
    .then(function(r){
      if(r.ok){ enabledState=want; updateEnabledUI();
        toast(want ? "已开启伪造，记得关开定位生效" : "已恢复真实定位，记得关开定位生效"); }
      else toast("切换失败 "+r.status);
    })
    .catch(function(){ toast("网络错误"); });
}

function dispPos(){return datum==="gcj"?GCJ.wgs2gcj(WGS.lat,WGS.lng):[WGS.lat,WGS.lng];}
function toWgs(lat,lng){return datum==="gcj"?GCJ.gcj2wgs(lat,lng):[lat,lng];}

// 按地形取海拔（open-meteo 免费高程接口，传 WGS-84）
function fetchElevation(lat,lng){
  return fetch("https://api.open-meteo.com/v1/elevation?latitude="+lat+"&longitude="+lng)
    .then(function(r){return r.json();})
    .then(function(d){return (d&&d.elevation&&d.elevation.length)?d.elevation[0]:null;})
    .catch(function(){return null;});
}

// 移动定位点(图钉)：只预览，不保存
function movePin(dispLat,dispLng){
  var w=toWgs(dispLat,dispLng);
  WGS={lat:w[0], lng:w[1]};
  saved=false;
  marker.setLatLng([dispLat,dispLng]);
  info();
  fetchElevation(WGS.lat,WGS.lng).then(function(el){ if(el!==null)$("alt").value=Math.round(el); info(); });
}

// 保存定位点到设备（写入 loc.json，Shadowrocket 才会用）
function commit(){
  var payload={lat:WGS.lat, lng:WGS.lng,
    altitude:numOrNull("alt"), horizontalAccuracy:numOrNull("hacc"), verticalAccuracy:numOrNull("vacc")};
  fetch("/set?token="+encodeURIComponent(token),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})
    .then(function(r){ if(r.ok){ saved=true; enabledState=true; updateEnabledUI(); toast("已保存 ✓ 记得关开定位生效"); } else { toast("保存失败 "+r.status); } })
    .catch(function(){ toast("网络错误"); });
}

// 搜索：列出多个候选，点选只移动地图视野（不动定位点、不保存）
function search(){
  var q=$("q").value.trim(); if(!q) return;
  fetch("https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=8&q="+encodeURIComponent(q))
    .then(function(r){return r.json();})
    .then(function(a){
      var box=$("results"); box.innerHTML="";
      if(!a||!a.length){ box.classList.remove("show"); toast("没找到"); return; }
      a.forEach(function(it){
        var row=document.createElement("div");
        row.className="rrow";
        row.textContent=it.display_name;
        row.addEventListener("click",function(){
          box.classList.remove("show"); box.innerHTML="";
          var la=+it.lat, lo=+it.lon;
          var p = datum==="gcj"?GCJ.wgs2gcj(la,lo):[la,lo];
          map.setView(p,15);            // 只移动视野；要设为定位，请在地图上点一下放图钉
          toast("已定位视野，在地图上点一下放置图钉");
        });
        box.appendChild(row);
      });
      box.classList.add("show");
    })
    .catch(function(){toast("搜索失败");});
}

function load(){
  fetch("/loc.json?token="+encodeURIComponent(token)).then(function(r){return r.json();}).then(function(d){
    WGS={lat:d.latitude, lng:d.longitude};
    saved=true;
    enabledState=(d.enabled!==false);
    $("alt").value=(d.altitude!==undefined?d.altitude:"");
    $("hacc").value=(d.horizontalAccuracy!==undefined?d.horizontalAccuracy:39);
    $("vacc").value=(d.verticalAccuracy!==undefined?d.verticalAccuracy:1000);

    var amapVec=L.tileLayer("https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7",{subdomains:"1234",maxZoom:18,attribution:"高德地图"});
    amapVec.datum="gcj";
    var amapSat=L.layerGroup([
      L.tileLayer("https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",{subdomains:"1234",maxZoom:18}),
      L.tileLayer("https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=8",{subdomains:"1234",maxZoom:18})
    ]);
    amapSat.datum="gcj";
    var osm=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"});
    osm.datum="wgs";

    map=L.map("map");
    amapVec.addTo(map); datum="gcj";
    map.setView(dispPos(),13);
    L.control.layers({"高德地图":amapVec,"高德卫星":amapSat,"国外 OSM":osm},null,{collapsed:false}).addTo(map);

    marker=L.marker(dispPos(),{draggable:true}).addTo(map);
    updateEnabledUI();

    map.on("baselayerchange",function(e){datum=e.layer.datum||"wgs"; var p=dispPos(); marker.setLatLng(p); map.setView(p,map.getZoom()); info();});
    map.on("click",function(e){movePin(e.latlng.lat,e.latlng.lng);});
    marker.on("dragend",function(){var p=marker.getLatLng(); movePin(p.lat,p.lng);});
  }).catch(function(){$("info").textContent="加载失败，检查 token 是否正确";});
}

$("btn").addEventListener("click",search);
$("q").addEventListener("keydown",function(e){if(e.key==="Enter")search();});
$("savebtn").addEventListener("click",commit);
$("restorebtn").addEventListener("click",toggleEnabled);
load();
</script>
</body>
</html>`;
