# Retire un fond BLANC uni : seul le blanc presque pur relié au bord part ; l'ombre grise du sol devient une ombre douce
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter
src, dst = sys.argv[1], sys.argv[2]
rgb = np.array(Image.open(src).convert('RGB')).astype(int)
H, W, _ = rgb.shape
L = rgb.mean(2); spread = rgb.max(2) - rgb.min(2)
white = (L >= float(sys.argv[3]) if len(sys.argv) > 3 else L >= 247) & (spread <= 6)
ground = np.zeros((H, W), bool); ground[int(H * .80):, :] = True
shadow = ground & (spread <= 10) & (L >= 120) & ~white
def flood(allow):
    seen = np.zeros((H, W), bool); q = deque()
    for x in range(W):
        for y in (0, H - 1):
            if allow[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
    for y in range(H):
        for x in (0, W - 1):
            if allow[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= yy < H and 0 <= xx < W and not seen[yy, xx] and allow[yy, xx]:
                seen[yy, xx] = True; q.append((yy, xx))
    return seen
bg = flood(white | shadow)
sh = bg & shadow
out = np.dstack([rgb, np.full((H, W), 255)]).astype(float)
out[bg, 3] = 0
# ombre douce : noir semi-transparent selon la teinte grise d'origine
out[sh, :3] = 0
out[sh, 3] = np.clip((250 - L[sh]) * 1.6, 0, 150)
a = Image.fromarray(out[..., 3].astype(np.uint8))
solid = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.7))
alpha = np.maximum(np.array(solid).astype(float), out[..., 3] * sh)
alpha[~bg] = np.array(solid)[~bg]
out[..., 3] = alpha
im = Image.fromarray(out.clip(0, 255).astype(np.uint8), 'RGBA')
im = im.crop(im.getbbox()); im.save(dst); print('taille', im.size)
