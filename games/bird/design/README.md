# 便便鳥大戰狼群：美術設計原圖

使用者提供並指定「場景與角色要與設定圖一致，不可更動」的設計板。第一版正式素材由這些原圖直接裁切、去背後放入 [art/](../art/)。

| 原圖 | 內容 | 用於 |
| --- | --- | --- |
| [01-character-ip-master-board-v1.webp](01-character-ip-master-board-v1.webp) | 角色 IP 總設定：便便鳥、狼群（Runner／Bruiser／Leaper）、狼王三種受傷狀態 | 主角待機、小狼、大狼、狼王「正常／激怒／疲憊」 |
| [02-environment-biome-master-board-v1.webp](02-environment-biome-master-board-v1.webp) | 三種場景：橘色沙漠、粉紅岩山、日落峽谷，含視差層與道具 | `bg-a/b/c`、`ground-a/b/c`、仙人掌、圓仙人掌 |
| [03-obstacle-gameplay-board-v1.webp](03-obstacle-gameplay-board-v1.webp) | 障礙、玩法元素（Run／Jump／Hit）、道具與特效 | 主角跑步、跳躍、撞擊姿勢 |
| [04-05-boss-vfx-board-v2.webp](04-05-boss-vfx-board-v2.webp) | 狼王動畫組（Hit／Fall…）、特效與畫面呈現 | 狼王受擊、倒地 |
| [04-05-boss-vfx-board-v1.webp](04-05-boss-vfx-board-v1.webp) | 狼王與特效板的第一版 | 參考保存 |

## 便便鳥第二版

[第二版透明角色圖](06-bird-poses-v2.png) 依角色設定重畫跑步、跳躍、受傷與待機姿勢。遊戲使用拆出的透明圖，跑步雙腳由 Canvas 逐幀繪製。2026-11-20 使用者試玩並確認發布。

## 場景對應

- 狼王擊退數 0／3／6… → 橘色沙漠（A，Levels 1·4·7）
- 擊退數 1／4／7… → 粉紅岩山（B，Levels 2·5·8）
- 擊退數 2／5／8… → 日落峽谷（C，Levels 3·6·9）
- 切換時 1.2 秒交叉淡入。

## 尚未做

- 大廳圖示與排行榜縮圖尚未依新設定重製（見 [GAME_ICON_SPEC.md](../../../GAME_ICON_SPEC.md)）。
- 設定板上的 UI（愛心、星星、經驗條）、特效組與障礙組（TNT、滾石、礦車等）未接入，因為玩法與障礙判定不變。
