# Enlève les restes d'ombre grise (fond blanc) reliés au fond transparent, dans le bas de l'image
import sys
from collections import deque
import numpy as np
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
a = np.array(Image.open(src).convert('RGBA')).astype(int)
H, W, _ = a.shape
L = a[..., :3].mean(2); spread = a[..., :3].max(2) - a[..., :3].min(2)
ok = (spread <= 14) & (L >= 105) & (np.arange(H)[:, None] >= H * .72)
seen = a[..., 3] < 30; q = deque(zip(*np.where(seen)))
while q:
    y, x = q.popleft()
    for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
        if 0 <= yy < H and 0 <= xx < W and not seen[yy, xx] and ok[yy, xx]:
            seen[yy, xx] = True; q.append((yy, xx))
a[seen, 3] = 0
Image.fromarray(a.astype(np.uint8)).save(dst)
