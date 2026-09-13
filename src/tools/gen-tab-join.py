"""Generate tab-join.png — Y-junction aligned with border.png top rail."""

from __future__ import annotations

import numpy as np
from PIL import Image

border = np.array(Image.open('public/assets/images/border.png').convert('RGBA'), dtype=np.float32)
# Match the top-rail profile exactly (full 15 rows; gold lives in the top ~9)
prof = border.mean(axis=1)
rows = len(prof)  # 15

# Display scale: corner 12px, border-w = 12*15/32 ≈ 5.625 → native scale 15px = border profile height
# Join width ~ 2 corners; keep native profile 1:1 with border.png height
scale = 2  # 2x supersample then downscale for smoother curves
bw = rows  # profile thickness along the normal
W = 28 * scale
H = 22 * scale
cx = (W - 1) / 2.0

# Arm centerline exits at left/right at the same vertical position as border.png midline (bright ~row 3.5)
rail_mid = 3.5 * scale / 1.0  # but we draw in native px where 1 profile row = 1 px after /scale...
# Work in profile-pixel space: 1 unit = 1 border row
W = 56
H = 40
cx = (W - 1) / 2.0
rail_y = 3.5  # centerline of horizontal rail (bright gold)
apex_y = 11.0  # valley where arms meet the stem
prof_n = rows


def bezier(p0, p1, p2, n=96):
  pts = []
  for i in range(n + 1):
    t = i / n
    u = 1 - t
    pts.append(
      (
        u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
        u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
      )
    )
  return pts


# Exits flush with top rail height; control points keep the approach nearly horizontal then dip
left = bezier((0, rail_y), (cx * 0.55, rail_y), (cx, apex_y))
right = bezier((W - 1, rail_y), (cx + (W - 1 - cx) * 0.45, rail_y), (cx, apex_y))
stem = [(cx, apex_y + i * (H - 1 - apex_y) / 64) for i in range(65)]

segs = []
for pts in (left, right, stem):
  for i in range(len(pts) - 1):
    segs.append((pts[i], pts[i + 1]))

ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
min_d = np.full((H, W), 1e9, dtype=np.float32)
best_ty = np.zeros((H, W), dtype=np.float32)
best_tx = np.zeros((H, W), dtype=np.float32)
best_dx = np.zeros((H, W), dtype=np.float32)
best_dy = np.zeros((H, W), dtype=np.float32)

for (x0, y0), (x1, y1) in segs:
  dx, dy = x1 - x0, y1 - y0
  len2 = dx * dx + dy * dy + 1e-8
  t = np.clip(((xs - x0) * dx + (ys - y0) * dy) / len2, 0.0, 1.0)
  qx = x0 + t * dx
  qy = y0 + t * dy
  d = np.hypot(xs - qx, ys - qy)
  closer = d < min_d
  inv = 1.0 / np.sqrt(len2)
  min_d = np.where(closer, d, min_d)
  best_tx = np.where(closer, qx, best_tx)
  best_ty = np.where(closer, qy, best_ty)
  best_dx = np.where(closer, dx * inv, best_dx)
  best_dy = np.where(closer, dy * inv, best_dy)

# Signed distance: positive toward geometric outside (above arms / away from stem center)
# Left-of-tangent cross product
cross = (xs - best_tx) * (-best_dy) + (ys - best_ty) * best_dx
# For arms, outside is above → prefer negative y direction as outside
# Use: outside positive when pixel is on the side opposite the tab fill (fill is below arms)
arm_out = best_ty - ys  # + above centerline
stem_region = ys >= apex_y - 0.5

half_thick = (prof_n - 1) / 2.0  # map full profile across the stroke

# Profile index u: 0 = outer (top of border.png), prof_n-1 = inner
# For arms: outer is above → u = 0 at s = + (outer half)... 
# border.png: row 0 outer top, increasing downward into fill.
# Along arm normal with +s = above (outside): u = mid - s  when mid is rail center in profile space
# Actually rail centerline is at profile row ~3.5 from outer. So:
# s_out = signed distance positive outside (above)
# u = 3.5 - s_out   → at centerline s=0, u=3.5; above s=+3.5 → u=0; below s=-11.5 → u=15

s_arm = np.sign(arm_out + 1e-6) * min_d
u_arm = np.clip(3.5 - s_arm, 0, prof_n - 1.001)

# Stem: treat like border rotated — outer edges on left AND right with bright center
# Mirror profile around center: distance from center maps from row 3.5 outward to row 0
d_stem = np.abs(xs - cx)
u_stem = np.clip(3.5 + d_stem * (3.5 / 3.5), 0, prof_n - 1.001)
# brighter center: at d=0 → u=3.5; at d=3.5 → u=7 (darker inner) — use
# actually for a divider rail facing both sides, outer is far from center:
u_stem = np.clip(3.5 - d_stem, 0, prof_n - 1.001)  # d=0 bright-ish center... wait row3.5 is bright, row0 is darker outer edge
# At center we want bright (row3), at outer edge of stem we want row0 dark outline
u_stem = np.clip(3.5 - d_stem * 1.0, 0, prof_n - 1.001)


def sample(u):
  i0 = np.floor(u).astype(np.int32)
  i1 = np.minimum(i0 + 1, prof_n - 1)
  f = (u - i0)[..., None]
  return prof[i0] * (1 - f) + prof[i1] * f


arm = sample(u_arm)
stem_c = sample(u_stem)

# Coverage: full profile thickness (~15px) but only paint where within stroke
arm_rad = 8.0  # from centerline to outer/inner extent
stem_rad = 5.0
arm_a = np.clip((arm_rad + 0.75 - min_d) / 0.75, 0, 1)
stem_a = np.clip((stem_rad + 0.75 - d_stem) / 0.75, 0, 1)

# Only keep arm pixels whose profile u is in range and not far below into fill mud
# Suppress the flat top-bar: require we're near the polyline, and for top rows near x far from cx
# allow only if close to arm path

out = np.zeros((H, W, 4), dtype=np.float32)

m = (~stem_region) & (arm_a > 0) & (min_d < arm_rad)
out[m] = arm[m]
out[m, 3] *= arm_a[m]

m = stem_region & (stem_a > 0)
src = stem_c.copy()
src[..., 3] *= stem_a
sa = src[..., 3] / 255.0
oa = out[..., 3] / 255.0
oa2 = sa + oa * (1 - sa)
rgb = (src[..., :3] * sa[..., None] + out[..., :3] * (oa * (1 - sa))[..., None]) / np.maximum(
  oa2[..., None], 1e-6
)
out[m, :3] = rgb[m]
out[m, 3] = oa2[m] * 255

img = np.clip(out, 0, 255).astype(np.uint8)
img[img[..., 3] < 16] = 0

# Crop empty top if any, but keep rail_y mapping: top of image should be profile row 0 of the exit
# Ensure row 0 of image corresponds to outer edge at the left/right exits
# Currently centerline at y=rail_y=3.5 with outer at y=0 — good if arm_rad covers it.

Image.fromarray(img, 'RGBA').save('public/assets/images/tab-join.png')

# Report alignment diagnostics
a = img
print('size', a.shape)
for y in range(8):
  msk = a[y, :, 3] > 16
  if msk.any():
    print(f'y={y} opaque={msk.sum()} left={msk.argmax()} bright={a[y, msk, :3].mean(axis=0).astype(int)}')
print('left-exit centerline check: col0 opaque rows', np.where(a[:, 0, 3] > 16)[0][:12])
print('right-exit', np.where(a[:, -1, 3] > 16)[0][:12])
