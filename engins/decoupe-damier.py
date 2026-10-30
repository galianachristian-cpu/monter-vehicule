# Retire un faux fond « transparent » en damier (blanc / gris clair) dessiné par un générateur d'images.
# Le damier est gris PARFAITEMENT neutre et suit un motif régulier : on modélise le motif
# pour ne pas manger les tubes blancs du camion (légèrement bleutés, hors motif).
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter
src, dst = sys.argv[1], sys.argv[2]
rgb = np.array(Image.open(src).convert('RGB')).astype(np.int16)
H, W, _ = rgb.shape
L = rgb.mean(2); spread = rgb.max(2) - rgb.min(2)
hi, lo = np.percentile(L[:8, :], 90), np.percentile(L[:8, :], 10)     # blanc et gris du damier

def fit(v):
    # période et phase du motif (onde carrée) sur un profil de fond
    best = (-1e9, 0, 0)
    for p in np.arange(24.0, 28.0, .05):
        for ph in np.arange(0, p, .5):
            sq = np.where(((np.arange(len(v)) + ph) % p) < p / 2, 1, -1)
            sc = (v * sq).mean()
            if sc > best[0]: best = (sc, p, ph)
    return best[1:]
vx = L[3, :] - L[3, :].mean(); px, phx = fit(vx[:900])
vy = L[:, 3] - L[:, 3].mean(); py, phy = fit(vy[:400])
X, Y = np.meshgrid(np.arange(W), np.arange(H))
cx = ((X + phx) % px) < px / 2; cy = ((Y + phy) % py) < py / 2
# couleur attendue : la ligne 3 donne le blanc quand cx vrai, la colonne 3 quand cy vrai -> parité
white_ref = L[3, int(np.argmax(cx[3]))] > (hi + lo) / 2
E = np.where((cx == cy) == white_ref, hi, lo) if True else None
# près des bords de carreaux, l'anti-crénelage mélange les deux couleurs
dxb = np.minimum(((X + phx) % (px / 2)), px / 2 - ((X + phx) % (px / 2)))
dyb = np.minimum(((Y + phy) % (py / 2)), py / 2 - ((Y + phy) % (py / 2)))
edge = (dxb < 1.6) | (dyb < 1.6)
neutral = spread <= 3
cand = neutral & (L >= lo - 8)            # tout gris clair parfaitement neutre = damier
low = np.zeros((H, W), bool); low[int(H * .80):, :] = True
shadow = neutral & low & (L >= 120)                                       # ombre grise sous les roues

def flood(seeds, allow):
    seen = np.zeros((H, W), bool); q = deque()
    for y, x in seeds:
        if allow[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= yy < H and 0 <= xx < W and not seen[yy, xx] and allow[yy, xx]:
                seen[yy, xx] = True; q.append((yy, xx))
    return seen
border = [(0, x) for x in range(W)] + [(H - 1, x) for x in range(W)] + [(y, 0) for y in range(H)] + [(y, W - 1) for y in range(H)]
bg = flood(border, cand | shadow)
# zones de damier enfermées (dans l'arceau, entre les barreaux) : grands îlots du motif
rest = cand & ~bg
lab = np.zeros((H, W), np.int32); n = 0
for y in range(H):
    for x in range(W):
        if rest[y, x] and not lab[y, x]:
            n += 1; comp = [(y, x)]; lab[y, x] = n; q = deque(comp)
            while q:
                a, b = q.popleft()
                for yy, xx in ((a + 1, b), (a - 1, b), (a, b + 1), (a, b - 1)):
                    if 0 <= yy < H and 0 <= xx < W and rest[yy, xx] and not lab[yy, xx]:
                        lab[yy, xx] = n; q.append((yy, xx)); comp.append((yy, xx))
            if len(comp) >= 120:
                ys, xs = zip(*comp); bg[list(ys), list(xs)] = True
# petites poussières restantes du damier : îlots clairs isolés dans le fond
fg = ~bg
lab2 = np.zeros((H, W), np.int32); m = 0
for y in range(H):
    for x in range(W):
        if fg[y, x] and not lab2[y, x]:
            m += 1; comp = [(y, x)]; lab2[y, x] = m; q = deque(comp)
            while q:
                a, b = q.popleft()
                for yy, xx in ((a + 1, b), (a - 1, b), (a, b + 1), (a, b - 1)):
                    if 0 <= yy < H and 0 <= xx < W and fg[yy, xx] and not lab2[yy, xx]:
                        lab2[yy, xx] = m; q.append((yy, xx)); comp.append((yy, xx))
            if len(comp) < 400:
                ys, xs = zip(*comp); bg[list(ys), list(xs)] = True
alpha = np.where(bg, 0, 255).astype(np.uint8)
# trous dans les tubes blancs (blanc identique au damier) : fermeture morphologique, sur le clair seulement
k = 13
closed = np.array(Image.fromarray(alpha).filter(ImageFilter.MaxFilter(k)).filter(ImageFilter.MinFilter(k)))
refill = (closed > 0) & bg & (L >= 200)
alpha[refill] = 255
a = Image.fromarray(alpha).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.7))
out = Image.open(src).convert('RGBA'); out.putalpha(a)
out = out.crop(out.getbbox())
out.save(dst)
print('motif %.2f x %.2f px, fond retiré %.1f%%, taille %s' % (px, py, bg.mean() * 100, out.size))
