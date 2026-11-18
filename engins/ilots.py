# Retire les petits îlots isolés (poussières) et recadre
import sys
from collections import deque
import numpy as np
from PIL import Image
src, dst, mini = sys.argv[1], sys.argv[2], int(sys.argv[3])
a = np.array(Image.open(src).convert('RGBA')); H, W, _ = a.shape
on = a[..., 3] > 40; lab = np.zeros((H, W), bool)
for y in range(H):
    for x in range(W):
        if on[y, x] and not lab[y, x]:
            comp = [(y, x)]; lab[y, x] = True; q = deque(comp)
            while q:
                b, c = q.popleft()
                for yy, xx in ((b + 1, c), (b - 1, c), (b, c + 1), (b, c - 1)):
                    if 0 <= yy < H and 0 <= xx < W and on[yy, xx] and not lab[yy, xx]:
                        lab[yy, xx] = True; q.append((yy, xx)); comp.append((yy, xx))
            if len(comp) < mini:
                ys, xs = zip(*comp); a[list(ys), list(xs), 3] = 0
a[a[..., 3] <= 40, 3] = np.where(a[a[..., 3] <= 40, 0] == 0, a[a[..., 3] <= 40, 3], 0)
im = Image.fromarray(a); im = im.crop(im.getbbox()); im.save(dst); print('taille', im.size)
