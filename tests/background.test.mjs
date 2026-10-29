import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");
const video = readFileSync(new URL("../ch-code-helper-holographic-globe.mp4", import.meta.url));
test("background video is lazy-loaded and retains an SVG poster fallback", () => {
  assert.match(html, /class="ambient-video"/);
  assert.match(html, /data-background-video="ch-code-helper-holographic-globe\.mp4"/);
  assert.match(html, /poster="holographic-scene\.svg"/);
  assert.doesNotMatch(html, /<source\s+src="ch-code-helper-holographic-globe\.mp4"/);
  assert.match(html, /prefers-reduced-motion: reduce/);
  assert.match(html, /pointer: coarse/);
});
test("background CSS provides a dark overlay and mobile/reduced-motion fallbacks", () => {
  assert.match(css, /\.ambient-video\s*\{[\s\S]*object-fit:\s*cover/);
  assert.match(css, /\.ambient-background::after\s*\{[\s\S]*linear-gradient\(180deg/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(max-width: 760px\), \(pointer: coarse\)/);
  assert.match(css, /\.ambient-video\s*\{\s*display:\s*none;/);
});
test("MP4 is a real H.264 video with multiple frames", () => {
  assert.ok(video.length > 10000, "video should not be a tiny placeholder");
  assert.equal(video.toString("ascii", 4, 8), "ftyp");
  for (const box of ["moov", "mdat", "avc1", "stsz"]) assert.ok(video.indexOf(Buffer.from(box)) >= 0, `MP4 box/signature missing: ${box}`);
  const stsz = video.indexOf(Buffer.from("stsz"));
  const sampleCount = video.readUInt32BE(stsz + 12);
  assert.ok(sampleCount >= 24, `expected multiple frames, got ${sampleCount}`);
});
