#!/usr/bin/env bash
# 从设计稿 PDF 重新生成 1440 × 900 参考图（tools/design-fidelity/reference/）。
#
# 逐页「保宽等比 → 壳层两端对齐 → 内容取 900 视口」由 correct_reference.py 的 fit_canvas() 负责。
# **不要再退回逐页 resize((1440,900))**：那会把高度不是 900 的画板非等比拉伸
# （第 8 页就是这样被压掉 0.9204 的，见 docs/design/evidence/reference-page-08-distortion.md）。
#
# 用法：
#   tools/design-fidelity/prepare_reference.sh "/path/to/Biu 2.0 · C+ 视觉稿.pdf"
#
# 依赖：poppler（pdftoppm）与 Python 侧的 pillow + numpy。macOS: brew install poppler
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PDF="${1:-}"
OUT="$HERE/reference"

if [ -z "$PDF" ]; then
  echo "用法：$0 \"/path/to/C+ 视觉稿.pdf\"" >&2
  exit 2
fi
if [ ! -f "$PDF" ]; then
  echo "找不到 PDF：$PDF" >&2
  exit 2
fi
if ! command -v pdftoppm >/dev/null 2>&1; then
  echo "找不到 pdftoppm。macOS 可执行：brew install poppler" >&2
  exit 127
fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "▸ 以 110 dpi 渲染 PDF（2200 × 1375）…"
pdftoppm -png -r 110 "$PDF" "$WORK/page"

mkdir -p "$OUT"
echo "▸ 保宽等比缩放到 1440 × 900 并写入 $OUT …（画板高度不为 900 的页按壳层对齐裁切，见 correct_reference.py）"

PY="${BIU_FIDELITY_PYTHON:-python3}"
if ! "$PY" -c "import numpy, PIL" >/dev/null 2>&1; then
  if [ -x "$HERE/.venv/bin/python" ]; then
    PY="$HERE/.venv/bin/python"
  else
    echo "需要 Pillow 与 numpy。请先运行一次 run.sh 以准备虚拟环境，或 pip install pillow numpy。" >&2
    exit 127
  fi
fi

"$PY" - "$HERE" "$WORK" "$OUT" <<'PY'
import pathlib, sys

here, work, out = (pathlib.Path(p) for p in sys.argv[1:4])
sys.path.insert(0, str(here))
from correct_reference import prepare_all  # 与页面纠正共用同一把尺子

for line in prepare_all(work, out, raw_dir=out / "_source"):
    print(f"  {line}")
PY

echo "▸ 参考图就绪。"
