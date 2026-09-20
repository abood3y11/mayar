import { makeRandom } from "./random";

/**
 * Samples a word (rendered with the page's Arabic font) into `count` points on
 * a plane in front of the camera, ~4.8 world units wide. Used so that her own
 * strokes can end up writing her name.
 */
export async function sampleNamePoints(text: string, count: number): Promise<Float32Array> {
  const family = getComputedStyle(document.body).fontFamily;
  try {
    await document.fonts.load(`600 200px ${family}`, text);
  } catch {
    // fall through with whatever font is available
  }
  const W = 1024;
  const H = 440;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const out = new Float32Array(count * 3);
  const random = makeRandom(3);
  const pts: number[] = [];
  if (ctx) {
    ctx.clearRect(0, 0, W, H);
    ctx.direction = "rtl";
    ctx.font = `600 230px ${family}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.fillText(text, W / 2, H / 2);
    const data = ctx.getImageData(0, 0, W, H).data;
    for (let y = 0; y < H; y += 3) {
      for (let x = 0; x < W; x += 3) {
        if (data[(y * W + x) * 4 + 3] > 110) pts.push(x, y);
      }
    }
  }
  const worldWidth = 4.8;
  const s = worldWidth / W;
  const m = pts.length / 2;
  for (let k = 0; k < count; k++) {
    if (m === 0) {
      // no glyphs (font failed): a soft ring so the finale still reads as a shape
      const t = random() * Math.PI * 2;
      out[k * 3] = Math.cos(t) * 1.4;
      out[k * 3 + 1] = Math.sin(t) * 0.9;
      out[k * 3 + 2] = 0;
      continue;
    }
    const i = Math.floor(random() * m);
    const px = pts[i * 2];
    const py = pts[i * 2 + 1];
    out[k * 3] = (px - W / 2) * s + (random() - 0.5) * 0.02;
    out[k * 3 + 1] = (H / 2 - py) * s + (random() - 0.5) * 0.02;
    out[k * 3 + 2] = (random() - 0.5) * 0.12;
  }
  return out;
}
