# 胖老闆追人美術設定

- [辦公室追逐 v1](office-chase-v1.png) 是已採用的角色、場景與配色提案。遊戲以既有的手機舞台呈現側向追逐，老闆從左側追趕員工。
- 正式角色依 v1 的五官、服裝和體型製作。遊戲中的上身圖在 `../art/boss-run.webp`、`../art/employee-run.webp`，員工的三款解鎖配色各有對應圖檔。跑動雙腳、起跳和滑行由 Canvas 合成。
- [全身跑步 v1](../../../preview/boss-run-cycle/index.html) 是已採用的八格跑步循環。員工每格 75 ms，胖老闆每格 90 ms。兩套原始表保存在 `run-cycle-v1/`，正式遊戲與預覽共用 `../art/` 的 WebP 動畫圖集。
