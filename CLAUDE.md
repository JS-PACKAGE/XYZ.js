# 執行 Agent 工作約定

`PLAN.md` 是階段與不可變更範圍的依據；`ACCEPTANCE.md` 是驗收證據紀錄；`DESIGN.md` 紀錄目前架構與未來階段邊界；`AGENTS.md` 提供實作與驗證規範。請先讀四份文件及原企劃書，再處理程式碼。

目前套件版本 **1.0.0**，P01–P08 已依序完成，驗證環境與限制以 `ACCEPTANCE.md` 為準，不代表已發佈 npm。企劃書原 v0.0.1–v0.0.8 依序對應 P01–P08。每個 Pxx 驗收完整後**立即獨立提交** `[Pxx] ...`，不得合併多個階段成同一 commit，**不得 push**。

遵守 TypeScript strict、可直接由瀏覽器載入的 `.js` ESM 相對匯入、`src/data/` 的集中預設值、Game→Renderer 的正式路徑。功能按階段實作，文件與範例只描述已完成的 API。跨階段功能先遵守 `PLAN.md` 的驗收條件與排除清單；測試必須驗證實際行為，未跑檢查不能聲稱通過。

本機 pnpm 可透過 `npx pnpm` 執行；命令、真實瀏覽器檢查與驗收紀錄請參考 `AGENTS.md`、`ACCEPTANCE.md`。

技術契約與 API 語義集中於 `docs/TECHNICAL.md`；修改時同步對應章節，不將測試模擬寫成真實跨瀏覽器驗收。
