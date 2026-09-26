# 保真度数据夹具

## 为什么需要它

`verify.py` 比对的是**渲染结果**与**设计稿 PNG**。如果渲染用的是真实数据，那么封面、时长、用户名每变一次，比对结果就变一次 —— 报出的差异分不清是「视觉实现走样」还是「数据本来就不同」。因此比对必须在固定数据下进行。

夹具的第二个用途是**承载占位素材**。设计稿里的封面是具体作品，重构时不可能拿到同一张图，只能用一个稳定的占位渐变代替。这些渐变是**数据**，不是设计令牌，所以它们的字面色值写在这里，而不是 `src/ui/tokens/palette.css`。

## 契约

1. **每个目标屏一份夹具**，文件名与 `cplus-spec-lock.json` 的 `screens[].no` 对应，例如 `01-library.json`。
2. 夹具只描述**展示内容**（标题、副标题、条数、行数据、封面占位），不描述布局。
3. 夹具里的色值只能是占位素材色（见 `placeholder-art.json`），不得出现 `palette.css` 里已有的设计令牌值 —— 一旦出现，说明有人把视觉决策混进了数据。
4. `verify.py` 在 `--target app` 下通过 `?fixture=<name>` 查询参数或 mock 层注入夹具；在 `--target prototype` 下夹具已内联在原型 HTML 里，无需注入。

## 当前状态（P3）

- `placeholder-art.json` —— 已就绪。从原型 12 屏中提取的 13 组封面占位渐变。
- `01-library.json` —— 已就绪（P3 屏 01 落地）。应用侧镜像在 `src/ui/fixtures/screen-01-library.ts`，
  由 `tests/fixture-screen-01.test.ts` 钉住逐字一致。注入方式：应用在 URL 携带
  `?fixture=01-library` 时改用夹具数据渲染（`src/features/library/fixture.ts`），
  真实数据路径（useFavoritesStore / useSettings / 下载 IPC）不经过夹具。
  夹具瓦片的 `artIndex` 指向 placeholder-art.json 的 gradients 下标 —— 设计稿每个
  瓦片的封面就是那个渐变，逐字对应，不做哈希挑选。
- 其余屏夹具（02…12）—— **随对应屏幕施工落地**（P3-P6），先于该屏的 verify 验收。
- `--target app` 的服务：构建产物（`dist/web`）+ `tools/design-fidelity/serve-app.mjs`
  静态伺服（SPA fallback），verify.py 用 `--base-url http://127.0.0.1:4173`。
