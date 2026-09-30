# 執行 Agent 指引

本倉庫是瀏覽器遊戲引擎，不是遊戲本體。先讀 `PLAN.md`、`ACCEPTANCE.md`、`DESIGN.md`；需求基準是原《XYZ.js — Web 遊戲引擎開發企劃書》。套件版本是 `1.0.0`，P01–P08 已依序驗收；實際環境與未驗證限制以驗收紀錄為準。企劃書原 v0.0.1–v0.0.8 對應 P01–P08。

## 工作範圍

- 維護已完成的 Game／Scene／ECS、2D／3D、三級 fallback、Input 與 Audio 正式架構；不可把未驗證的新能力標為完成。
- 每個階段先確認該階段 `ACCEPTANCE.md` 硬指標，完成實作與實際驗證後**立即只為該階段**建立 `[Pxx]` 前綴 commit；不能跨階段合併、不能推送（push 由使用者自行操作）。
- 依既有 `packages/core`／`packages/graphics` 邊界；按需增設 packages，拒絕空殼。Game facade 不外洩 GPU handle 或要求一般使用者操作 ECS 裸資料。將可調常數放在 `src/data/`。
- TypeScript strict、ESM 相對 import 加 `.js`、公開型別明確、無新增 runtime 依賴。OPM.js 僅 P07 依官方 release checksum 驗證整包 vendor，不自製 DSP 或保留私人 patch。
- P06 起 `auto` 採 WebGPU→WebGL2→Canvas2D 初始化降級；強制 backend 失敗要報錯，不得靜默切換或以獨立範例假冒正式架構。
- 不實作 `PLAN.md` 列出的非目標功能，不宣稱未驗證的瀏覽器或三 backend 相容性。

## 驗證與文件

依專案實際環境使用 `npx pnpm install`、`npx pnpm build`、`npx pnpm typecheck`、`npx pnpm test`、`npx pnpm lint`、`npx pnpm format:check`，再以 `npx pnpm dev` 在 WebGPU 可用的瀏覽器打開 `/examples/triangle/`。全套檢查須在合併當階段實作後執行，未執行不可記成通過。更新 `ACCEPTANCE.md` 的日期、環境與結果，且同步 README 與設計文件中「現在／未來」的界線。根目錄 `package.json` 已標示發佈僅 `dist/`；vendor 複製必須保留 `dist/` 目錄樹。

詳細 API 與資源管理契約見 `docs/TECHNICAL.md`。P01 優化不得以 clamp 後的 delta 計算實際 fps；Canvas CSS layout 與 GPU backing pixels 必須分離；效能報告區分 JS 配置數、CPU 時間與 GPU／呈現 fps，不以配置減少冒充幀率提升。
