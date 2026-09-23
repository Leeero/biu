**Design QA — Biu 首页 HTML 视觉稿**

- Source visual truth: `/Users/lero/Documents/MyData/Code/biu/prototypes/home-redesign/assets/reference-option-2.png`
- Implementation: `/Users/lero/Documents/MyData/Code/biu/prototypes/home-redesign/index.html`
- Browser-rendered evidence: Codex in-app Browser tab `1`, captured inline after final reload; comparison surface: `/Users/lero/Documents/MyData/Code/biu/prototypes/home-redesign/comparison.html`
- Viewport: `1440 × 1024` CSS px, device scale factor `1`
- Source pixels: `1487 × 1058`
- Implementation pixels: `1440 × 1024`
- Normalization: both sides were fit into equal-width comparison frames in `comparison.html`; proportions differ by less than 0.1%.
- State: dark theme, default home state, track playing.

**Full-view comparison evidence**

- The comparison surface displayed the selected visual target and the live HTML implementation side by side in the same browser capture.
- The implementation preserves the target's major proportions: compact left sidebar, 56–62px toolbar, four recommendation tiles, dense song table, narrow right rail, and fixed bottom player.
- The target's extra personalized recommendation panel was intentionally replaced by existing-product surfaces (`最近播放` and `我的收藏`) to avoid implying unavailable APIs.

**Focused region comparison evidence**

- Header/sidebar: hierarchy, compact selected navigation treatment, search placement, profile and window controls match the intended direction.
- Main content: type scale, card density, row rhythm, cover crops and accent usage are consistent with the reference.
- Player: three-part composition and integrated progress bar match the target while retaining Biu's current controls.

**Required fidelity surfaces**

- Fonts and typography: system/SF/PingFang stack, weights, sizes, line heights and truncation are coherent and close to the target.
- Spacing and layout rhythm: 220px sidebar, 24px content gutters, 14px card gaps, 56px rows and 82px player create a stable desktop rhythm.
- Colors and visual tokens: near-black base, raised charcoal surfaces, muted metadata and restrained coral-red states are consistent.
- Image quality and asset fidelity: all visible covers and avatar use raster assets derived from the existing Biu screenshots; the existing Biu SVG logo is reused. No image placeholder remains.
- Copy and content: labels are restricted to capabilities already present in the application. No statistics, radio, personalized algorithm entry, ranking or new API-dependent feature is shown.

**Findings**

- No actionable P0/P1/P2 mismatch remains.
- [P3] The HTML implementation is intentionally quieter than the concept image in the right rail because speculative recommendation features were removed.
- [P3] Remix Icon is loaded from a CDN in this standalone mock; production implementation should use the project's installed `@remixicon/react` package.

**Primary interactions tested**

- Page loads at the intended local URL.
- Search field receives focus.
- Hover states are present for navigation-adjacent controls, feature cards, song rows and right-rail rows.
- Browser console errors/warnings checked: none.

**Comparison history**

- Initial review found three product-scope mismatches: personalized “为你推荐”, “换一批”, and “收藏夹更新”.
- Fixes: renamed the page to “热歌精选”, removed “换一批”, renamed the table to “推荐音乐”, and replaced “收藏夹更新” with “我的收藏”.
- Post-fix evidence: final browser capture shows only existing Biu capabilities and no console errors.

**Implementation Checklist**

- Keep the current visual-only mock isolated from production code.
- Reuse semantic tokens and installed React icon components when implementation begins.
- Preserve existing stores, routes, service calls and interaction contracts during migration.

**Follow-up Polish**

- Validate the same composition at Biu's actual minimum window width before production migration.

final result: passed
