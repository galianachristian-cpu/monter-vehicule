# Image déjà transparente : retire le voile blanc semi-transparent et change l'ombre blanche du sol en ombre sombre
import sys
import numpy as np
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
a = np.array(Image.open(src).convert('RGBA')).astype(float); H, W, _ = a.shape
L = a[..., :3].mean(2); spread = a[..., :3].max(2) - a[..., :3].min(2); al = a[..., 3]
whit = (L > 200) & (spread < 25) & (al < 250)
low = np.arange(H)[:, None] >= H * .84
sh = whit & low
a[sh, :3] = 0; a[sh, 3] = al[sh] * .5
a[whit & ~low, 3] = 0
a[(al < 30) & ~sh, 3] = 0
im = Image.fromarray(a.clip(0, 255).astype(np.uint8))
bb = Image.fromarray((a[..., 3] > 12).astype(np.uint8) * 255).getbbox()
im = im.crop(bb); im.save(dst); print('taille', im.size)
