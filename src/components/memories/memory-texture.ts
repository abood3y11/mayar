import * as THREE from "three";
import { palette } from "@/config/palette";
import type { Photo } from "@/data/memories";

function baseCard(W: number, H: number) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, palette.bg1);
    g.addColorStop(1, palette.bg2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const r = ctx.createRadialGradient(W * 0.5, H * 0.42, 10, W * 0.5, H * 0.42, W * 0.6);
    r.addColorStop(0, "rgba(255, 90, 118, 0.45)");
    r.addColorStop(1, "rgba(255, 90, 118, 0)");
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255, 214, 217, 0.28)";
    ctx.lineWidth = 3;
    ctx.strokeRect(22, 22, W - 44, H - 44);
  }
  return { canvas, ctx };
}

/** A warm card with the word on it — the three things he loves. */
export function makeWordTexture(word: string): THREE.CanvasTexture {
  const W = 768;
  const H = 512;
  const { canvas, ctx } = baseCard(W, H);
  if (ctx) {
    const family = getComputedStyle(document.body).fontFamily;
    ctx.direction = "rtl";
    ctx.font = `600 150px ${family}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = palette.text;
    ctx.fillText(word, W / 2, H / 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** A soft card used until a photo file exists at that path. */
export function makePhotoPlaceholder(): THREE.CanvasTexture {
  const W = 600;
  const H = 450;
  const { canvas, ctx } = baseCard(W, H);
  if (ctx) {
    ctx.font = "120px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255, 214, 217, 0.35)";
    ctx.fillText("♥", W / 2, H / 2 + 6);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Loads a photo; falls back to the soft card when the file is missing. */
export function loadPhotoTexture(photo: Photo): Promise<THREE.Texture> {
  return new Promise((resolve) => {
    new THREE.TextureLoader().load(
      photo.image,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        resolve(t);
      },
      undefined,
      () => resolve(makePhotoPlaceholder()),
    );
  });
}

export function textureAspect(texture: THREE.Texture): number {
  const img = texture.image as { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number } | undefined;
  const w = img?.naturalWidth || img?.width || 3;
  const h = img?.naturalHeight || img?.height || 2;
  return w / h;
}
