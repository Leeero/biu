#!/usr/bin/env python3
"""C+ 视觉保真度校验器。

把「照着视觉稿做」变成可执行的判定：
  1. 以固定 1440 × 900 / deviceScaleFactor 1 捕获目标（原型或应用路由）；
  2. 用同一套探针测量渲染图与设计稿参考图；
  3. 按 cplus-spec-lock.json 的三层容差判 PASS / FAIL。

判定模型
  L1 硬锚点     渲染侧实测 vs 设计侧实测，零偏差（顶栏/播放栏厚度、H1 左缘、行距、缩略图宽）
  L2 结构带     H1 / 导语 / 筛选条 / 播放栏：起点偏差 ≤ 2px 且带数一致
  L2 内容带     列表 / 右列 / 注解带：设计带起点被渲染带覆盖的比例 ≥ 0.75（±4px 内）
                —— 内容带随文案与封面变化，逐条严格相等不合理；用覆盖率保证结构不被破坏
  L3 整屏观感   平均亮度差 ≤ 12

依赖：numpy、Pillow（见 tools/design-fidelity/run.sh 的自动准备）。
"""
from __future__ import annotations

import argparse
import json
import pathlib
import subprocess
import sys
import tempfile

try:
    import numpy as np
    from PIL import Image
except ModuleNotFoundError as exc:  # pragma: no cover
    sys.exit(
        f"缺少依赖：{exc.name}\n"
        "请执行 tools/design-fidelity/run.sh（会自动准备虚拟环境），"
        "或手动 pip install pillow numpy。"
    )

ROOT = pathlib.Path(__file__).resolve().parents[2]
SPEC_LOCK = ROOT / "docs/design/cplus-spec-lock.json"
REFERENCE_DIR = ROOT / "tools/design-fidelity/reference"
PROTOTYPE_DIR = ROOT / "prototypes/c-plus-2026/screens"
FIXTURES_DIR = ROOT / "tools/design-fidelity/fixtures"
FALLBACK_REFERENCE_DIR = pathlib.Path("/tmp/biu-design")

CANVAS = (1440, 900)
CHROME_CANDIDATES = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
]

# (x0, x1, y0, y1, 亮度阈值)
DEFAULT_PROBES = {
    "H1": (64, 900, 100, 190, 190),
    "lead": (64, 1000, 186, 232, 100),
    "filter": (64, 1000, 226, 300, 26),
    "list": (64, 900, 300, 740, 60),
    "right": (960, 1380, 300, 740, 60),
    "note": (64, 1400, 580, 812, 60),
    "playbar": (64, 200, 795, 900, 12),
    "artRows": (64, 172, 290, 790, 16),
}

# 沉浸态没有顶栏与播放栏，也没有曲目列表，探针组完全不同
IMMERSIVE_PROBES = {
    "art": (64, 740, 60, 700, 30),
    "infoTitle": (740, 1370, 100, 260, 150),
    "lyrics": (740, 1370, 280, 640, 22),
    "bottom": (64, 1400, 620, 830, 30),
}

# 顶栏厚度探针：取 x 300–1200 内部区，避开画板 33px 圆角与右侧内容。
# 阈值 18 高于底板（8.7）与内容区微光（≤16），低于顶栏最低档 #131315（19.0）。
TOPBAR_WINDOW = (300, 1200, 0, 160, 18)

# 结构带：起点必须精确对齐，带数必须一致
STRUCTURAL_BANDS = ("H1", "lead", "filter", "playbar")
IMMERSIVE_STRUCTURAL = ("art", "infoTitle")
# 内容带：用覆盖率判定（随文案与封面变化）
CONTENT_BANDS = ("list", "right", "note")
IMMERSIVE_CONTENT = ("lyrics", "bottom")

CONTENT_COVERAGE_MIN = 0.75   # 设计带被渲染带覆盖的最低比例
CONTENT_MATCH_PX = 4          # 内容带配对窗口

# 常驻层与底板的亮度分界。底板 #08080A ≈ 8.7，播放栏 #0E0E11 ≈ 14.3，顶栏 #161618 ≈ 22.7
CHROME_BG_THRESHOLD = 11.5


def find_chrome() -> str:
    for candidate in CHROME_CANDIDATES:
        if pathlib.Path(candidate).exists():
            return candidate
    sys.exit("未找到 Chrome / Chromium，无法捕获渲染图。")


def load_spec() -> dict:
    if not SPEC_LOCK.exists():
        sys.exit(f"缺少真值文件：{SPEC_LOCK}")
    return json.loads(SPEC_LOCK.read_text(encoding="utf-8"))


def reference_path(design_page: int) -> pathlib.Path:
    primary = REFERENCE_DIR / f"page-{design_page:02d}.png"
    if primary.exists():
        return primary
    fallback = FALLBACK_REFERENCE_DIR / f"page-{design_page:02d}.png"
    if fallback.exists():
        return fallback
    sys.exit(
        f"缺少设计稿参考图：{primary}\n"
        "请执行 tools/design-fidelity/prepare_reference.sh 从设计稿 PDF 重新生成。"
    )


def capture(target: str, out_png: pathlib.Path, chrome: str, wait_ms: int = 2500) -> bool:
    """截一张 1440×900 的整屏图。失败时把 Chrome 的 stderr 一并打出来。

    `--no-sandbox` 是本机必需的：受限环境下 Chrome 初始化不了自己的进程沙箱
    （`Failed to initialize sandbox: Operation not permitted`），连带 GPU 进程
    FATAL 退出，结果**一张图都不写**，而调用方只看得到「截图失败」四个字 ——
    这个盲区上一次白白拖掉了一轮排查。沙箱是进程隔离，与页面渲染无关，
    关掉它不改变任何像素。
    """
    cmd = [
        chrome,
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        "--window-size=1440,900",
        f"--virtual-time-budget={wait_ms}",
        f"--screenshot={out_png}",
        target,
    ]
    result = subprocess.run(cmd, capture_output=True)
    ok = out_png.exists() and result.returncode == 0
    if not ok:
        print(f"    截图失败：exit={result.returncode}，图存在={out_png.exists()}")
        for line in result.stderr.decode("utf-8", "replace").strip().splitlines()[-6:]:
            print(f"      | {line}")
    return ok


def luminance(im: Image.Image) -> np.ndarray:
    return np.asarray(im.convert("RGB")).astype(int).mean(axis=2)


def bands(L: np.ndarray, x0: int, x1: int, y0: int, y1: int, thr: float, gap: int = 3, minh: int = 4):
    sub = L[y0:y1, x0:x1]
    on = (sub > thr).sum(axis=1) > 0
    out, i = [], 0
    while i < len(on):
        if on[i]:
            j, b, k = i, 0, i
            while k < len(on) and b <= gap:
                if on[k]:
                    j, b = k, 0
                else:
                    b += 1
                k += 1
            if j - i >= minh:
                out.append([int(y0 + i), int(y0 + j)])
            i = k
        else:
            i += 1
    return out


def xruns(L: np.ndarray, y: int, x0: int, x1: int, thr: float, minlen: int = 20):
    m = L[y, x0:x1] > thr
    out, i = [], 0
    while i < len(m):
        if m[i]:
            j = i
            while j < len(m) and m[j]:
                j += 1
            if j - i >= minlen:
                out.append((x0 + i, x0 + j))
            i = j
        else:
            i += 1
    return out


def vertical_extent(L: np.ndarray, x: int, y_start: int, y_end: int, step: int) -> int | None:
    """从 y_start 沿 step 方向连续统计亮度高于常驻层阈值的像素数。"""
    col = L[:, x] > CHROME_BG_THRESHOLD
    span = range(y_start, y_end, step)
    thickness = 0
    for y in span:
        if col[y]:
            thickness += 1
        elif thickness:
            break
    return thickness or None


def mask_bbox(L: np.ndarray, x0: int, x1: int, y0: int, y1: int, thr: float, fill: float = 0.9):
    """在窗口内找「大面积连续亮区」的包围盒 —— 用于封面块等实心矩形。"""
    sub = L[y0:y1, x0:x1] > thr
    rows = np.where(sub.mean(axis=1) >= fill)[0]
    if not len(rows):
        return None
    top, bottom = int(y0 + rows.min()), int(y0 + rows.max())
    cols = np.where((L[top : bottom + 1, x0:x1] > thr).mean(axis=0) >= fill)[0]
    if not len(cols):
        return None
    return int(x0 + cols.min()), top, int(x0 + cols.max()), bottom


def measure_anchors(L: np.ndarray, bands_map: dict, immersive: bool, has_row_pitch: bool) -> dict:
    anchors: dict[str, object] = {}

    if immersive:
        # 沉浸态：背景辉光与封面亮度区间重叠，自动测量只能可靠取得左缘与上缘。
        # 封面尺寸单独作为参考值列出，不参与 PASS/FAIL（见 spec-lock 的 knownResidual）。
        art = mask_bbox(L, 64, 760, 60, 700, 30)
        if art:
            anchors["artLeft"], anchors["artTop"] = art[0], art[1]
            anchors["_artWidth"], anchors["_artHeight"] = art[2] - art[0] + 1, art[3] - art[1] + 1
        bottom = bands_map.get("bottom") or []
        if bottom:
            anchors["bottomTop"] = bottom[-1][0]
        return anchors

    # 常驻层厚度：用内部区的高阈值带（顶栏）与左留白区的低阈值带（播放栏）
    topbar = bands(L, *TOPBAR_WINDOW)
    if topbar:
        anchors["topbarHeight"] = topbar[0][1] - topbar[0][0]
    playbar = bands_map.get("playbar") or []
    if playbar:
        anchors["playbarHeight"] = CANVAS[1] - playbar[-1][0]

    # 内容左留白：筛选条药丸容器的左缘最稳（标题字形有左边距）
    filt = bands_map.get("filter") or []
    if filt:
        y0, y1 = filt[0]
        cols = np.where((L[y0:y1, 0:700] > 26).any(axis=0))[0]
        if len(cols):
            anchors["gutterLeft"] = int(cols.min())

    # 行距：仅对有真实曲目表的屏有意义，且需缩略图高度 ≥ 8px 的实心带
    if has_row_pitch:
        art_rows = [b for b in (bands_map.get("artRows") or []) if b[1] - b[0] >= 8]
        if len(art_rows) >= 2:
            pitches = [art_rows[i + 1][0] - art_rows[i][0] for i in range(len(art_rows) - 1)]
            anchors["rowPitch"] = round(sum(pitches) / len(pitches), 1)
    return anchors


def probe(im: Image.Image, screen: dict) -> dict:
    immersive = bool(screen.get("immersive"))
    L = luminance(im)
    windows = IMMERSIVE_PROBES if immersive else DEFAULT_PROBES
    res = {name: bands(L, *window) for name, window in windows.items()}
    res["_anchors"] = measure_anchors(L, res, immersive, bool(screen.get("hasRowPitch")))
    return res


def coverage(design: list, rendered: list, tolerance: int):
    """设计带被渲染带覆盖的比例，以及未覆盖的设计带。"""
    if not design:
        return 1.0, []
    unmatched = []
    for d in design:
        if not any(abs(r[0] - d[0]) <= tolerance for r in rendered):
            unmatched.append(d)
    return 1 - len(unmatched) / len(design), unmatched


def evaluate(screen: dict, spec: dict, rendered_png: pathlib.Path, verbose: bool, strict: bool):
    immersive = bool(screen.get("immersive"))
    design_img = Image.open(reference_path(screen["designPage"])).convert("RGB").resize(CANVAS, Image.LANCZOS)
    render_img = Image.open(rendered_png).convert("RGB").resize(CANVAS, Image.LANCZOS)
    pd, pr = probe(design_img, screen), probe(render_img, screen)

    structural = IMMERSIVE_STRUCTURAL if immersive else STRUCTURAL_BANDS
    content = IMMERSIVE_CONTENT if immersive else CONTENT_BANDS

    tol = spec["tolerances"]
    band_tol = tol["bandOffsetPx"]
    anchor_tol = tol["hardAnchorsPx"]
    lum_max = tol["meanLuminanceDiffMax"]

    kind = "沉浸态" if immersive else "标准壳层"
    print(f"\n===== {screen['no']} {screen['name']}   vs   设计稿第 {screen['designPage']} 页　[{kind}] =====")
    failures: list[str] = []

    # ---------------- L1 硬锚点：渲染实测 vs 设计实测 ----------------
    print("  [L1 硬锚点 · 渲染实测 vs 设计实测]")
    for key, design_value in pd["_anchors"].items():
        render_value = pr["_anchors"].get(key)
        informational = key.startswith("_")
        shown = key.lstrip("_")
        if design_value is None or render_value is None:
            print(f"    n/a  {shown:16s} 设计 {str(design_value):>6}  渲染 {str(render_value):>6}")
            continue
        delta = abs(render_value - design_value)
        if informational:
            print(f"    参考  {shown:16s} 设计 {design_value:>6}  渲染 {render_value:>6}  Δ{delta}（不计入判定）")
            continue
        ok = delta <= anchor_tol
        print(f"    {'OK  ' if ok else 'FAIL'} {shown:16s} 设计 {design_value:>6}  渲染 {render_value:>6}  Δ{delta}")
        if not ok:
            failures.append(f"L1 {shown}: 设计 {design_value} / 渲染 {render_value}（Δ{delta}）")

    # ---------------- L2 结构带 ----------------
    print(f"  [L2 结构带 · 起点 ±{band_tol}px 且带数一致]")
    for name in structural:
        d, r = pd[name], pr[name]
        if not d and not r:
            print(f"    n/a  {name}")
            continue
        ok = len(d) == len(r) and all(abs(a[0] - b[0]) <= band_tol for a, b in zip(d, r))
        print(f"    {'OK  ' if ok else 'FAIL'} {name:10s} 设计 {d}")
        if not ok:
            print(f"    {'':4s} {'':10s} 渲染 {r}")
            failures.append(f"L2 {name} 结构带不一致")

    # ---------------- L2 内容带 ----------------
    label = "严格逐条" if strict else f"覆盖率 ≥ {CONTENT_COVERAGE_MIN:.0%}（±{CONTENT_MATCH_PX}px）"
    print(f"  [L2 内容带 · {label}]")
    for name in content:
        d, r = pd[name], pr[name]
        if not d and not r:
            print(f"    n/a  {name}")
            continue
        cov, unmatched = coverage(d, r, CONTENT_MATCH_PX)
        ok = (not unmatched) if strict else (cov >= CONTENT_COVERAGE_MIN)
        print(f"    {'OK  ' if ok else 'FAIL'} {name:10s} 覆盖 {cov:5.0%}  ({len(d) - len(unmatched)}/{len(d)})")
        if not ok or verbose:
            for band in unmatched:
                print(f"         未覆盖 设计带 {band}")
            if verbose:
                print(f"         渲染带 {r}")
        if not ok:
            failures.append(f"L2 {name} 内容带覆盖率 {cov:.0%}")

    # ---------------- L3 整屏观感 ----------------
    diff = float(np.abs(luminance(design_img) - luminance(render_img)).mean())
    ok_l3 = diff <= lum_max
    print(f"  [L3 整屏] 平均亮度差 {diff:.2f}  上限 {lum_max}  {'OK' if ok_l3 else 'FAIL'}")
    if not ok_l3:
        failures.append(f"L3 平均亮度差 {diff:.2f} > {lum_max}")

    stem = screen["prototype"].split("/")[-1].replace(".html", "")
    canvas = Image.new("RGB", (1440, 1816), (255, 0, 0))
    canvas.paste(design_img, (0, 0))
    canvas.paste(render_img, (0, 916))
    canvas.resize((1000, 1261), Image.LANCZOS).save(rendered_png.parent / f"cmp-{stem}.png")

    return {"diff": diff, "failures": failures}


def resolve_target(screen: dict, args) -> str | None:
    if args.target == "prototype":
        path = PROTOTYPE_DIR / screen["prototype"].split("/")[-1]
        return path.as_uri() if path.exists() else None
    # 应用是 HashRouter：路由（含查询参数）必须放进 # 号后面，
    # 否则 useSearchParams / useParams 读不到，路由也匹配不上。
    route = screen["route"].replace(":id", args.sample_id)
    base = f"{args.base_url.rstrip('/')}/#{route}"
    # 夹具注入（见 fixtures/README.md 契约 4）：目标屏有夹具时通过 ?fixture=
    # 让应用渲染固定内容，否则真实数据的波动会让内容带无法判定。
    # 应用侧由 src/features/library/fixture.ts 读取该参数（随屏扩展）。
    fixture = FIXTURES_DIR / (screen["prototype"].split("/")[-1].replace(".html", "") + ".json")
    if fixture.exists():
        return f"{base}?fixture={fixture.stem}"
    return base


def screen_keys(screen: dict) -> set[str]:
    stem = screen["prototype"].split("/")[-1].replace(".html", "")
    return {stem, f"{stem}.html", screen["no"], screen["name"]}


def main() -> int:
    parser = argparse.ArgumentParser(description="C+ 视觉保真度校验")
    parser.add_argument("--screen", action="append", help="屏名（如 01-library），可重复")
    parser.add_argument("--all", action="store_true", help="校验全部 12 屏")
    parser.add_argument("--list", action="store_true", help="列出可校验的屏")
    parser.add_argument("--target", choices=["prototype", "app"], default="prototype")
    parser.add_argument("--base-url", default="http://localhost:5678", help="--target=app 时的开发服务器地址")
    parser.add_argument("--sample-id", default="1", help="动态路由的示例 id")
    parser.add_argument("--strict", action="store_true", help="内容带也逐条严格比对")
    parser.add_argument("--verbose", action="store_true", help="打印未覆盖带与渲染带明细")
    parser.add_argument("--out", default=None, help="输出目录（默认临时目录）")
    args = parser.parse_args()

    spec = load_spec()
    screens = spec["screens"]

    if args.list:
        for s in screens:
            print(
                f"{s['no']}  {s['prototype'].split('/')[-1]:26s} {s['route']:18s} 设计稿 p{s['designPage']}"
            )
        return 0

    selected = screens
    if args.screen:
        wanted = set(args.screen)
        matched = [s for s in screens if screen_keys(s) & wanted]
        missing = wanted - {key for s in matched for key in screen_keys(s)}
        if missing:
            print(f"未识别的屏：{sorted(missing)}（用 --list 查看可用值）")
            return 2
        selected = matched
    elif not args.all:
        parser.print_help()
        return 2

    chrome = find_chrome()
    out_dir = pathlib.Path(args.out) if args.out else pathlib.Path(tempfile.mkdtemp(prefix="biu-fidelity-"))
    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"目标：{args.target}　输出：{out_dir}")

    results, failed = [], 0
    for screen in selected:
        target = resolve_target(screen, args)
        if target is None:
            print(f"\n----- {screen['no']} {screen['name']}：目标不存在，跳过 -----")
            continue
        png = out_dir / f"{screen['prototype'].split('/')[-1].replace('.html', '')}.png"
        if not capture(target, png, chrome):
            print(f"\n----- {screen['no']} {screen['name']}：截图失败（{target}），跳过 -----")
            continue
        outcome = evaluate(screen, spec, png, args.verbose, args.strict)
        results.append((screen, outcome))
        if outcome["failures"]:
            failed += 1

    print("\n================ 汇总 ================")
    for screen, outcome in results:
        mark = "PASS" if not outcome["failures"] else "FAIL"
        print(f"  {mark}  {screen['no']} {screen['name']:20s} 平均亮度差 {outcome['diff']:6.2f}")
    print(f"\n{len(results) - failed} / {len(results)} 通过　并排对照图：{out_dir}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
