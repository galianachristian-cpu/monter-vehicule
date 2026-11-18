# Redessine le pictogramme « 18 / 112 » à la place d'un pictogramme erroné
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
src, dst = sys.argv[1], sys.argv[2]
x0, y0, x1, y1 = map(int, sys.argv[3:7])
im = Image.open(src).convert('RGBA'); a = np.array(im).astype(float)
Lc, Rc = a[y0:y1, x0 - 8:x0 - 3, :3].mean(1), a[y0:y1, x1 + 3:x1 + 8, :3].mean(1)
t = np.linspace(0, 1, x1 - x0)[None, :, None]
a[y0:y1, x0:x1, :3] = Lc[:, None] * (1 - t) + Rc[:, None] * t
im = Image.fromarray(a.clip(0, 255).astype(np.uint8))
S = 4; w, h = (x1 - x0) * S, (y1 - y0) * S                      # dessin en grand puis réduit (bords lisses)
lay = Image.new('RGBA', (w, h)); d = ImageDraw.Draw(lay)
m = 6 * S; lw = 4 * S; W_ = (255, 255, 255, 255)
d.rounded_rectangle((m, m, w - m, h - m), radius=6 * S, outline=W_, width=lw)
F = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'
f1 = ImageFont.truetype(F, int(h * .25)); f2 = ImageFont.truetype(F, int(h * .21))
d.text((w / 2 + 6 * S, h - m - 2 * S), '18', font=ImageFont.truetype(F, int(h * .34)), fill=W_, anchor='md'); d.text((m + 4 * S, h - m - 4 * S), 'Le', font=ImageFont.truetype(F, int(h * .16)), fill=W_, anchor='ld')

import math
# combiné : arc épais en diagonale (bombé vers le haut à gauche), écouteurs aux deux bouts
cx, cy, r, tw = w * .70, h * .52, w * .36, int(w * .08)
d.arc((cx - r, cy - r, cx + r, cy + r), 188, 262, fill=W_, width=tw)
for ang, rot in ((188, 1), (262, -1)):
    px, py = cx + (r - tw / 2) * math.cos(math.radians(ang)), cy + (r - tw / 2) * math.sin(math.radians(ang))
    d.ellipse((px - w * .075, py - w * .075, px + w * .075, py + w * .075), fill=W_)
lay = lay.resize((x1 - x0, y1 - y0), Image.LANCZOS)
im.alpha_composite(lay, (x0, y0))
im.save(dst)
