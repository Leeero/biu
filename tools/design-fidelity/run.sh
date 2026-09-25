#!/usr/bin/env bash
# C+ 保真度校验的 Python 环境包装。
#
# 依赖解析顺序：$BIU_FIDELITY_PYTHON → tools/design-fidelity/.venv → python3（需已装 pillow+numpy）
# 若都不可用，则在 tools/design-fidelity/.venv 内自动创建虚拟环境并安装依赖。
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$HERE/.venv"

usable() {
  "$1" - <<'PY' >/dev/null 2>&1
import numpy, PIL  # noqa: F401
PY
}

if [ -n "${BIU_FIDELITY_PYTHON:-}" ] && usable "$BIU_FIDELITY_PYTHON"; then
  exec "$BIU_FIDELITY_PYTHON" "$HERE/verify.py" "$@"
fi

if [ -x "$VENV/bin/python" ] && usable "$VENV/bin/python"; then
  exec "$VENV/bin/python" "$HERE/verify.py" "$@"
fi

BASE_PYTHON="${BIU_FIDELITY_BASE_PYTHON:-python3}"
if ! command -v "$BASE_PYTHON" >/dev/null 2>&1; then
  echo "未找到 python3。请设置 BIU_FIDELITY_BASE_PYTHON 或 BIU_FIDELITY_PYTHON。" >&2
  exit 127
fi

echo "▸ 首次运行：在 tools/design-fidelity/.venv 准备 pillow + numpy …" >&2
"$BASE_PYTHON" -m venv "$VENV"
"$VENV/bin/python" -m pip install --quiet --upgrade pip
"$VENV/bin/python" -m pip install --quiet pillow numpy

exec "$VENV/bin/python" "$HERE/verify.py" "$@"
