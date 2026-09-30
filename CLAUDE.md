@AGENTS.md

# 弱點掃描與安全控制

以下為執行 Agent 的安全規範，補充 AGENTS.md；不是工具權限、sandbox 或 CI 掃描器的自動設定，不能據此宣稱已啟用防護或通過掃描。

## 弱點掃描

- 修改前辨識信任邊界與攻擊面：資產 URL／JSON、shader／GPU 資源、AudioWorklet、DOM 輸入、套件與建置腳本；優先檢查本次變更及其呼叫路徑。
- 依賴變更或發佈前，使用已確認版本及參數的依賴稽核工具，同時涵蓋 runtime 與 dev dependencies。記錄日期、工具版本、範圍與結果；無法連線或缺少工具不等於「零弱點」。不得未經同意把私有原始碼、資產或 lockfile 上傳第三方掃描服務。
- OPM vendor 不一定受套件稽核涵蓋：另核對 manifest 的官方 release／SHA256SUMS、完整 dist 與 LICENSE，不改官方內容或留下私人 patch。保留 lockfile、既有 release-age 與安裝安全政策，不為通過檢查新增豁免。
- 檢查 token、API key、私鑰、密碼與憑證洩漏；回報只列位置與遮罩摘要，不輸出或複製 secret。疑似外洩時通知所有者處理撤銷／輪替，不自行使用該憑證。
- 發現弱點時列出檔案／位置、可達輸入、影響、必要前提與修復建議；區分已確認、待驗與誤報。不憑猜測填 CVE、嚴重度或掃描結果。可安全重現時使用本機隔離資料並加入有行為價值的回歸測試。

## 安全控制

- 外部資產與事件視為不可信；維持型別、數值範圍、尺寸／資源上限及生命週期驗證，不用 eval、動態程式碼執行或不安全 HTML 注入處理資產內容。
- 不為 demo／測試放寬 CSP、CORS、TLS、安全來源、瀏覽器 sandbox 或 autoplay 限制。WebGPU／AudioWorklet 使用安全來源；音訊維持使用者手勢 unlock。錯誤訊息與 logger 不包含敏感資料。
- 維持 Canvas／Scene／資產 ownership、AbortSignal 取消與失敗清理，避免未受限排程、資源洩漏及 late async 結果重新啟用已銷毀資源。
- 套件更新不盲目升版或自動套用 audit fix；先確認 advisory 是否影響本專案、修復版本與相容性，再做最小變更與驗證。不得以關閉檢查或吞掉錯誤代替修復。
- 只執行任務所需的最小權限操作；刪除重要資料、Production 變更、外部發布、secret 操作、Git 歷史重寫須取得明確授權。未經要求不 commit／push／publish，不以掃描為由攻擊外部系統。
- 安全交付回報列出實際執行的檢查、未解決風險及未驗證範圍；lint／typecheck／單元測試通過不代表完成安全稽核。
