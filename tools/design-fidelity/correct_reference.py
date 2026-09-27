#!/usr/bin/env python3
"""纠正参考图的几何失真，并堵住它的复发路径。

背景（完整推导见 docs/design/evidence/reference-page-08-distortion.md）
    prepare_reference.sh 的流程是 `pdftoppm -r 110` 渲染 → **逐页** `resize((1440, 900))`。
    这一步对高度不是 900 的画板做的是**非等比拉伸**：第 8 页画板高 978，于是被纵向压到
    0.9204 —— 圆形变椭圆、71/88 的壳层变成 65/81。这个伪影存活了两个阶段，一度还被登记成
    「该屏设计壳层与其余页不同」—— 一个把伪影当设计意图的错误结论。

纠正：**源 PDF 不在仓库内**（meta.sourceRender 指向 /tmp，已失效），所以纠正只能对现有 PNG
做**可逆变换**：纵向重采样回画板高 → 按标准壳层裁回 1440×900。

    reference/_source/page-NN-raw.png   未经处理的原始图（唯一可追溯来源，**勿删**）
    reference/page-NN.png               纠正后、**参与比对**的图

同一条 fit_canvas() 也被 prepare_reference.sh 复用 —— 将来若能拿到 PDF 重新生成，走的仍是
这条路径，失真不会再来一次。

用法
    python tools/design-fidelity/correct_reference.py            # 纠正（幂等）
    python tools/design-fidelity/correct_reference.py --check    # 只体检，不写盘

依赖：numpy、Pillow（见 tools/design-fidelity/run.sh 的自动准备）。
"""
from __future__ import annotations

import argparse
import json
import pathlib
import shutil
import sys

try:
    import numpy as np
    from PIL import Image
except ModuleNotFoundError as exc:  # pragma: no cover
    sys.exit(
        f"缺少依赖：{exc.name}\n"
        "请执行 tools/design-fidelity/run.sh（会自动准备虚拟环境），"
        "或手动 pip install pillow numpy。"
    )

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))  # 复用 verify.py 的测量口径，避免两份「同一把尺子」

ROOT = HERE.parents[1]
SPEC_LOCK = ROOT / "docs/design/cplus-spec-lock.json"
REFERENCE_DIR = HERE / "reference"
SOURCE_DIR = REFERENCE_DIR / "_source"
CANVAS = (1440, 900)

# 已勘定的失真页面：PDF 画板的**真实高度**（≠ 900）。
#
# 为什么还需要这张表：已压扁的 PNG 自身无法反推画板高（等比信息在 resize 时就丢了），
# 必须由地形测量给出。第 8 页的 978 由三个未贴底的地标反推，收敛在 ±4，
# 正向预测四个地标残差 ≤1px（见 evidence 文档第 4 节）。新增条目时必须附上同样的证据。
KNOWN_ARTBOARD_HEIGHTS = {8: 978}

# 头像窗口：12 页共有的圆形元素，x 稳定在 1376–1415（窗口略放宽以容测量漂移）。
# 它是**最容易读的压缩指纹** —— 一个圆不会自己变扁。
AVATAR_WINDOW = (1360, 1420, 0, 75, 30)


def chrome_bands(spec: dict) -> tuple[int, int]:
    """从真值取壳层行数：顶栏（含第 0 行）与播放栏。

    `referenceIntegrity.standard` 记的是**第一条低于阈值的行号**（72 / 812），
    换算成行数就是「顶栏 72 行（0–71）+ 播放栏 88 行（812–899）」。
    """
    std = (spec.get("referenceIntegrity") or {}).get("standard") or {}
    topbar_bottom = int(std.get("topbarBottomEdge", 72))
    playbar_top = int(std.get("playbarTopEdge", 812))
    return topbar_bottom, CANVAS[1] - playbar_top


def avatar_box(L: np.ndarray) -> tuple[int, int, float] | None:
    """头像包围盒（宽、高、纵向中心）—— 纵向压缩会让「圆」变成「椭圆」。"""
    x0, x1, y0, y1, thr = AVATAR_WINDOW
    sub = L[y0:y1, x0:x1] > thr
    rows = np.where(sub.any(axis=1))[0]
    cols = np.where(sub.any(axis=0))[0]
    if not len(rows) or not len(cols):
        return None
    return int(cols.max() - cols.min() + 1), int(rows.max() - rows.min() + 1), (rows.min() + rows.max()) / 2


def health(im: Image.Image) -> dict:
    """一次体检：壳层两条边缘 + 头像纵横比。"""
    import verify  # 延迟导入：verify.py 依赖 numpy，与本脚本同源

    L = verify.luminance(im)
    playbar_top = verify._playbar_top_edge(L)
    return {
        "topbarBottomEdge": verify._topbar_bottom_edge(L),
        "playbarTopEdge": playbar_top,
        "playbarHeight": (CANVAS[1] - playbar_top) if playbar_top is not None else None,
        "avatar": avatar_box(L),
    }


def fmt(h: dict) -> str:
    avatar = h["avatar"]
    avatar_txt = f"头像 {avatar[0]}×{avatar[1]}" if avatar else "头像 未检出"
    return (
        f"顶栏下缘 {h['topbarBottomEdge']}　"
        f"播放栏上缘 {h['playbarTopEdge']}（高 {h['playbarHeight']}）　{avatar_txt}"
    )


def healthy(h: dict, std: dict, tol: int) -> bool:
    ok = True
    for key in ("topbarBottomEdge", "playbarTopEdge"):
        if h[key] is None or std.get(key) is None or abs(h[key] - std[key]) > tol:
            ok = False
    return ok


def fit_canvas(
    img: Image.Image,
    artboard_height: int,
    topbar_rows: int,
    playbar_rows: int,
) -> tuple[Image.Image, dict]:
    """把一个「比 900 高」的画板按壳层对齐裁回 1440×900。

    两步都不可省：
      1. **按宽度等比**重采样到画板真实高度 —— 修好纵横比（椭圆回到圆）；
      2. 顶栏取顶、**播放栏贴底**（它是贴画板底的，若从顶往下切会切错），
         中间的内容只取 900 视口看得到的部分 —— 多出来的部分对本工程的比对没有意义。

    入口先按宽度归一到 1440，于是 1440 宽的归档图与 2200 宽的渲染原图都能直接吃进来
    （少了这一步，2200 宽的输入会被横向压扁）。
    """
    width, canvas_h = CANVAS
    if img.size[0] != width:
        img = img.resize((width, round(img.size[1] * width / img.size[0])), Image.LANCZOS)
    img = img.resize((width, artboard_height), Image.LANCZOS)
    content_end = canvas_h - playbar_rows  # 812：内容区在标准视口里的下边界
    top = img.crop((0, 0, width, topbar_rows))
    middle = img.crop((0, topbar_rows, width, content_end))
    bottom = img.crop((0, artboard_height - playbar_rows, width, artboard_height))
    out = Image.new("RGB", CANVAS)
    out.paste(top, (0, 0))
    out.paste(middle, (0, topbar_rows))
    out.paste(bottom, (0, content_end))
    info = {
        "artboardHeight": artboard_height,
        "squash": round(canvas_h / artboard_height, 4),
        "droppedContentRows": artboard_height - playbar_rows - content_end,
    }
    return out, info


def fit_any(
    img: Image.Image,
    artboard_height: int | None,
    topbar_rows: int,
    playbar_rows: int,
) -> tuple[Image.Image, dict | None]:
    """prepare_reference.sh 用的入口：按**宽度等比**缩放后，高于 900 就走壳层对齐裁切。

    110 dpi 渲染出的标准页是 2200×1375，等比缩到宽 1440 恰好是 900；
    第 8 页渲染出来更瘦高，等比缩到宽 1440 恰好回到 978 —— 画板高不需要外部告知，
    只有「已经压扁过的 PNG」才需要 KNOWN_ARTBOARD_HEIGHTS。
    """
    width, canvas_h = CANVAS
    natural_h = round(img.size[1] * width / img.size[0])
    if natural_h == canvas_h:
        if img.size == CANVAS:
            return img.convert("RGB"), None
        return img.resize(CANVAS, Image.LANCZOS), None
    return fit_canvas(img, artboard_height or natural_h, topbar_rows, playbar_rows)


def prepare_all(work_dir: pathlib.Path, out_dir: pathlib.Path, *, raw_dir: pathlib.Path | None = None) -> list[str]:
    """prepare_reference.sh 的收尾：把 <work>/page-N.png 落到 <out>/page-NN.png。

    只有**被本级改写过**（高度异常）的页才留一份 raw 到 `reference/_source/`，其余页面 raw 与之
    完全一致，留着只会让人分不清哪个是来源。归档的 raw 统一写成 **1440×900 的「未纠正」形态**
    —— 即旧脚本 `resize((1440, 900))` 会产出的那张（画板 978 的页就是被压扁的那张），
    这样 `_source/*-raw.png` 的含义在「历史归档」与「从 PDF 重生成」两条路径下完全一致。
    """
    topbar_rows, playbar_rows = chrome_bands(json.loads(SPEC_LOCK.read_text(encoding="utf-8")))
    out_dir.mkdir(parents=True, exist_ok=True)
    written: list[str] = []
    for page in sorted(work_dir.glob("page-*.png")):
        number = int(page.stem.split("-")[-1])
        if number < 2 or number > 13:
            continue
        img = Image.open(page).convert("RGB")
        out, info = fit_any(img, KNOWN_ARTBOARD_HEIGHTS.get(number), topbar_rows, playbar_rows)
        target = out_dir / f"page-{number:02d}.png"
        out.save(target, optimize=True)
        written.append(f"page-{number:02d}.png" + (f"（画板 {info['artboardHeight']}，丢弃内容 {info['droppedContentRows']} 行）" if info else ""))
        if info and raw_dir:
            raw_dir.mkdir(parents=True, exist_ok=True)
            img.convert("RGB").resize(CANVAS, Image.LANCZOS).save(raw_dir / f"page-{number:02d}-raw.png", optimize=True)
    return written


def selftest() -> int:
    """回归：模拟 prepare_reference.sh 的「从 PDF 渲染」路径，确认它不再压扁画板。

    做法是把现有的 1440×900 参考图**放大回 110 dpi 渲染尺寸**当作输入（标准页 2200×1375，
    第 8 页 2200×1494），再走一遍 prepare_all()，然后比对：
      1. 产物一律 1440×900 且壳层读数为标准值；
      2. 第 8 页的产物与已落地的纠正图**逐像素接近**（差值应远小于一次普通缩放的往返误差）。
    没有这层回归，「生成器又被改回逐页 resize」要等到下一次屏比对才发现。
    """
    import shutil
    import tempfile

    spec = json.loads(SPEC_LOCK.read_text(encoding="utf-8"))
    std = (spec.get("referenceIntegrity") or {}).get("standard") or {}
    raw_path = SOURCE_DIR / "page-08-raw.png"
    if not raw_path.exists():
        print(f"跳过：缺少 {raw_path}（原始失真图），无法模拟 PDF 渲染。")
        return 0

    tmp = pathlib.Path(tempfile.mkdtemp(prefix="biu-correct-selftest-"))
    try:
        work, out = tmp / "work", tmp / "out"
        work.mkdir()
        # 放大回渲染尺寸：pdftoppm 在 110 dpi 下对 1440×900 页给 2200×1375，对 978 高页给 2200×1494
        Image.open(REFERENCE_DIR / "page-03.png").convert("RGB").resize((2200, 1375), Image.LANCZOS).save(work / "page-3.png")
        Image.open(raw_path).convert("RGB").resize((2200, round(978 * 2200 / 1440)), Image.LANCZOS).save(work / "page-8.png")

        lines = prepare_all(work, out, raw_dir=out / "_source")
        failures = 0
        print("模拟 prepare_reference.sh（2200 宽渲染 → 1440×900）：")
        for line in lines:
            print(f"  {line}")

        for name in ("page-03.png", "page-08.png"):
            produced = Image.open(out / name).convert("RGB")
            h = health(produced)
            ok = produced.size == CANVAS and healthy(h, std, tol=1)
            failures += 0 if ok else 1
            print(f"  {'OK  ' if ok else 'FAIL'} {name} {produced.size}　{fmt(h)}")

        landed = REFERENCE_DIR / "page-08.png"
        if landed.exists():
            a = np.asarray(Image.open(landed).convert("RGB"), dtype=int)
            b = np.asarray(Image.open(out / "page-08.png").convert("RGB"), dtype=int)
            diff = float(np.abs(a - b).mean())
            ok = diff < 1.0
            failures += 0 if ok else 1
            print(f"  {'OK  ' if ok else 'FAIL'} 与已落地纠正图逐像素比对：平均差 {diff:.3f}（阈值 < 1.0）")

        kept = sorted(p.name for p in (out / "_source").glob("*"))
        print(f"  _source 留档：{kept}（只应为被改写过的页）")
        print("\nOK    生成路径不再压扁画板" if not failures else f"\nFAIL  {failures} 项")
        return 0 if not failures else 1
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="纠正参考图的几何失真")
    parser.add_argument("--check", action="store_true", help="只体检与预览，不写盘")
    parser.add_argument("--selftest", action="store_true", help="回归：验证 PDF 生成路径不再压扁画板")
    args = parser.parse_args()

    if args.selftest:
        return selftest()

    spec = json.loads(SPEC_LOCK.read_text(encoding="utf-8"))
    ri = spec.get("referenceIntegrity") or {}
    std = ri.get("standard") or {}
    tol = int(ri.get("tolerance", 1))
    topbar_rows, playbar_rows = chrome_bands(spec)
    page_to_screen = {int(s["designPage"]): s["no"] for s in spec["screens"]}

    print(f"标准壳层：顶栏下缘 {std.get('topbarBottomEdge')} / 播放栏上缘 {std.get('playbarTopEdge')}（容差 {tol}）")
    print(f"裁切口径：顶栏 {topbar_rows} 行 + 内容 {900 - topbar_rows - playbar_rows} 行 + 播放栏 {playbar_rows} 行")

    failures = 0
    if not KNOWN_ARTBOARD_HEIGHTS:
        print("\n没有已登记的失真页面，无需纠正。")
    for number, artboard_height in sorted(KNOWN_ARTBOARD_HEIGHTS.items()):
        screen_no = page_to_screen.get(number, "?")
        print(f"\n----- 设计页 {number}（屏 {screen_no}） -----")
        raw_path = SOURCE_DIR / f"page-{number:02d}-raw.png"
        out_path = REFERENCE_DIR / f"page-{number:02d}.png"

        if raw_path.exists():
            raw = Image.open(raw_path).convert("RGB")
            origin = f"_source/{raw_path.name}"
        elif out_path.exists():
            current = Image.open(out_path).convert("RGB")
            if healthy(health(current), std, tol):
                print(f"  已纠正：{fmt(health(current))} —— 与标准一致，跳过")
                continue
            if args.check:
                print(f"  （--check）当前图待纠正：{fmt(health(current))}")
                raw = current
                origin = f"{out_path.name}（尚未留档）"
            else:
                SOURCE_DIR.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(out_path, raw_path)
                raw = current
                origin = f"{out_path.name}（首次运行，已留档为 _source/{raw_path.name}）"
        else:
            print(f"  缺少参考图：既没有 {out_path} 也没有 {raw_path}")
            failures += 1
            continue

        before = health(raw)
        corrected, info = fit_canvas(raw, artboard_height, topbar_rows, playbar_rows)
        after = health(corrected)
        print(f"  原图   {origin}")
        print(f"        {fmt(before)}")
        print(f"  画板   真实高 {artboard_height} → 被 resize 压到 900（纵向 ×{info['squash']}）")
        print(f"  纠正后 reference/{out_path.name}")
        print(f"        {fmt(after)}")
        print(f"  内容   匣外 {info['droppedContentRows']} 行不在 900 视口内，已丢弃")

        if healthy(after, std, tol):
            print("  ✓ 与标准一致")
        else:
            print("  ✗ 仍未对齐标准 —— 不要写盘，先回到 evidence 复核画板高")
            failures += 1
            continue

        if not args.check:
            out_path.parent.mkdir(parents=True, exist_ok=True)
            corrected.save(out_path, optimize=True)
            print(f"  已写入 {out_path.relative_to(ROOT)}")

    print()
    if failures:
        print(f"FAIL  {failures} 页未通过")
        return 1
    print("OK    全部已登记页面恢复到标准壳层" + ("（--check：未写盘）" if args.check else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
