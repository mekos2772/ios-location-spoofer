import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sourcePath = new URL("../src/page.js", import.meta.url);
const webuiPath = new URL("../../cloudflare-webui/worker.js", import.meta.url);

const pages = [
  ["source page", await readFile(sourcePath, "utf8")],
  ["webui artifact", await readFile(webuiPath, "utf8")],
];

for (const [label, content] of pages) {
  test(`${label} exposes a guarded current-location control`, () => {
    assert.match(content, /<button id="locatebtn"[^>]*>当前位置<\/button>/);
    assert.match(content, /function locateCurrent\(\)/);
    assert.match(
      content,
      /if\s*\(enabledState\)\s*\{\s*toast\("请先恢复真实定位并刷新定位服务"\);\s*return;\s*\}/s,
    );
    assert.match(content, /navigator\.geolocation\.getCurrentPosition\(/);
  });

  test(`${label} requests fresh high-accuracy coordinates`, () => {
    assert.match(content, /enableHighAccuracy:\s*true/);
    assert.match(content, /maximumAge:\s*0/);
    assert.match(content, /timeout:\s*12000/);
  });

  test(`${label} moves the pin without saving automatically`, () => {
    assert.match(content, /WGS\s*=\s*\{\s*lat:\s*lat,\s*lng:\s*lng\s*\}/);
    assert.match(content, /saved\s*=\s*false/);
    assert.match(content, /marker\.setLatLng\(p\)/);
    assert.match(content, /map\.setView\(p,\s*16\)/);
    assert.doesNotMatch(content, /commit\(\);/);
  });

  test(`${label} maps Geolocation failures to user-facing messages`, () => {
    assert.match(content, /定位权限被拒绝，请在 Safari 设置中允许定位/);
    assert.match(content, /暂时无法获取当前位置/);
    assert.match(content, /获取当前位置超时，请到开阔处重试/);
    assert.match(content, /当前浏览器不支持定位/);
  });
}
