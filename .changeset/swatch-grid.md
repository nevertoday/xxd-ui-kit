---
"@xxd/css": patch
---

外观设置组的主色排成格子铺满整行（docs/maintainers/TOUCH-REVIEW-PLAN.md D161）：`mountAppearance` 的色块组改用 `data-grid`，36px 色块每行最多 7 个、各行一样多、两端对齐；浮层 320 宽时右边不再空出一大块。`data-balance` 照旧可用。
