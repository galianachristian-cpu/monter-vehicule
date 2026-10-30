# Remplace le faux logo de portière par le vrai logo (comblement de la zone + collage avec liseré blanc)
import sys
import numpy as np
from PIL import Image, ImageFilter
img_p, logo_p, out_p = sys.argv[1:4]
x0, y0, x1, y1 = map(int, sys.argv[4:8])            # zone du faux logo
cx, cy, lw = map(int, sys.argv[8:11])               # centre et largeur du vrai logo
im = Image.open(img_p).convert('RGBA'); a = np.array(im).astype(float)
L, R = a[y0:y1, x0 - 6:x0 - 2, :3].mean(1), a[y0:y1, x1 + 2:x1 + 6, :3].mean(1)
t = np.linspace(0, 1, x1 - x0)[None, :, None]
a[y0:y1, x0:x1, :3] = L[:, None, :] * (1 - t) + R[:, None, :] * t     # portière refaite (bande jaune comprise)
im = Image.fromarray(a.clip(0, 255).astype(np.uint8))
patch = im.crop((x0 - 4, y0 - 4, x1 + 4, y1 + 4)).filter(ImageFilter.GaussianBlur(1.2)); im.paste(patch, (x0 - 4, y0 - 4))
lg = Image.open(logo_p).convert('RGB'); lg = lg.crop((8, 8, lg.width - 8, lg.height - 8))
g = np.array(lg).astype(int)
# fond = blanc relié au bord de l'image ; le blanc enfermé (intérieur du casque) fait partie du logo
from collections import deque
wh = g.min(2) > 225; Hh, Ww = wh.shape; seen = np.zeros_like(wh); q = deque()
for x in range(Ww):
    for y in (0, Hh - 1):
        if wh[y, x]: seen[y, x] = True; q.append((y, x))
for y in range(Hh):
    for x in (0, Ww - 1):
        if wh[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
        if 0 <= yy < Hh and 0 <= xx < Ww and wh[yy, xx] and not seen[yy, xx]: seen[yy, xx] = True; q.append((yy, xx))
ink = ~seen
ys, xs = np.where(ink); lg = lg.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)); ink = ink[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
m = Image.fromarray((ink * 255).astype(np.uint8))
# support blanc de l'autocollant : contour élargi puis creux bouchés (intérieur du casque, entre les lettres)
thr = lambda img, r, t: img.filter(ImageFilter.GaussianBlur(r)).point(lambda v: 255 if v > t else 0)
halo = thr(thr(m, 18, 12), 18, 225)                 # fermeture arrondie : bouche les creux sans faire de coins
from PIL import ImageChops
halo = ImageChops.lighter(halo, thr(m, 3, 20))
halo = thr(halo, 2.5, 40).filter(ImageFilter.GaussianBlur(1.2))
h = round(lg.height * lw / lg.width)
lg, m, halo = lg.resize((lw, h), Image.LANCZOS), m.resize((lw, h), Image.LANCZOS), halo.resize((lw, h), Image.LANCZOS)
white = Image.new('RGBA', (lw, h), (255, 255, 255, 255)); white.putalpha(halo)
sticker = Image.new('RGBA', (lw, h)); sticker.alpha_composite(white)
col = lg.convert('RGBA'); col.putalpha(m); sticker.alpha_composite(col)
im.alpha_composite(sticker, (cx - lw // 2, cy - h // 2))
im.save(out_p)
