# 執行 Agent 指引

本倉庫是瀏覽器遊戲引擎，不是遊戲本體。先讀 `PLAN.md`、`ACCEPTANCE.md`、`DESIGN.md`；需求基準是原《XYZ.js — Web 遊戲引擎開發企劃書》。套件版本是 `1.0.0`，P01–P08 已依序驗收；實際環境與未驗證限制以驗收紀錄為準。企劃書原 v0.0.1–v0.0.8 對應 P01–P08。

## 工作範圍

- 維護已完成的 Game／Scene／ECS、2D／3D、三級 fallback、Input 與 Audio 正式架構；不可把未驗證的新能力標為完成。
- 每個階段先確認該階段 `ACCEPTANCE.md` 硬指標，完成實作與實際驗證後**立即只為該階段**建立 `[Pxx]` 前綴 commit；不能跨階段合併、不能推送（push 由使用者自行操作）。
- 維持 core／graphics／ecs／math／assets／input／audio 模組邊界及 `src/index.ts` 統一公開入口。Game facade 不外洩 GPU handle 或要求一般使用者操作 ECS 裸資料；ECS 不另加公開套件入口。可調常數放在 `src/data/`。
- TypeScript strict、ES2022、ESM 相對 import 加 `.js`、公開型別明確、無新增 runtime 依賴。OPM.js v1.1.0 已依官方 release checksum 完整 vendor，保留 LICENSE／manifest，不改官方檔、不自製 DSP 或保留私人 patch。
- P06 起 `auto` 採 WebGPU→WebGL2→Canvas2D 初始化降級；強制 backend 失敗要報錯，不得靜默切換或以獨立範例假冒正式架構。
- 不實作 `PLAN.md` 列出的非目標功能，不宣稱未驗證的瀏覽器或三 backend 相容性。

## 驗證與文件

工具鏈要求 Node >=26、pnpm 12.6.0（`package.json`）；無本機 pnpm 可用 `npx pnpm@12.6.0`。依變更執行 install、build、typecheck、test、lint、format:check；功能階段整合後須完整執行，不可將未執行記成通過。`examples` script 開啟 `/examples/` 範例目錄頁；`dev` 下驗證各 `/examples/<name>/` 範例（新增範例須同步 `examples/index.ts` 目錄與 README／USAGE 表格）；圖形／音訊改動應涵蓋 showcase 及 backend／unlock／cleanup 分支。負載量測用 `/benchmarks/sprites/`，保持分頁可見並分別記錄 RAF／CPU submit。

同步 README 中／英／日說明、PLAN、DESIGN、技術文件及 ACCEPTANCE；AGENTS 是共用執行規範的單一來源，`CLAUDE.md` 以 `@AGENTS.md` 引用並補充弱點掃描與安全控制，不重複共用規範。歷史驗收保留原測試數與日期，清楚標示「當時」與「目前」。文件變更檢查相對連結與格式，不能冒稱重新驗證 runtime。根套件授權為 Apache-2.0（所有者已授權，見根目錄 `LICENSE`；v1.5 及更早 tag 的發佈附件仍標示 UNLICENSED）；build 複製 vendor，發佈／部署必須保留完整 `dist/` 目錄樹，包含 `dist/vendor/opm/`。

詳細 API 與資源管理契約見 `docs/TECHNICAL.md`（英文）及 `docs/TECHNICAL-zh.md`（繁體中文）；操作入門見 `docs/USAGE.md`／`docs/USAGE-zh.md`。P01 優化不得以 clamp 後的 delta 計算實際 fps；Canvas CSS layout 與 GPU backing pixels 必須分離；效能報告區分 JS 配置數、CPU 時間與 GPU／呈現 fps，不以配置減少冒充幀率提升。
