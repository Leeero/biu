#!/usr/bin/env bash
# 从设计稿 PDF 重新生成 1440 × 900 参考图（tools/design-fidelity/reference/）。
#
# 用法：
#   tools/design-fidelity/prepare_reference.sh "/path/to/Biu 2.0 · C+ 视觉稿.pdf"
#
# 依赖：poppler（pdftoppm）。macOS: brew install poppler
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
echo "▸ 缩放到 1440 × 900 并写入 $OUT …"

PY="${BIU_FIDELITY_PYTHON:-python3}"
if ! "$PY" -c "import PIL" >/dev/null 2>&1; then
  if [ -x "$HERE/.venv/bin/python" ]; then
    PY="$HERE/.venv/bin/python"
  else
    echo "需要 Pillow。请先运行一次 run.sh 以准备虚拟环境，或 pip install pillow。" >&2
    exit 127
  fi
fi

"$PY" - "$WORK" "$OUT" <<'PY'
import pathlib, sys
from PIL import Image

work, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
pages = sorted(work.glob("page-*.png"))
if not pages:
    sys.exit("未渲染出任何页面")
for page in pages:
    suffix = page.stem.split("-")[-1]
    number = int(suffix)
    if number < 2 or number > 13:
        continue
    Image.open(page).convert("RGB").resize((1440, 900), Image.LANCZOS).save(
        out / f"page-{number:02d}.png", optimize=True
    )
print(f"完成：{len([p for p in pages if 2 <= int(p.stem.split('-')[-1]) <= 13])} 页")
PY

echo "▸ 参考图就绪。"
