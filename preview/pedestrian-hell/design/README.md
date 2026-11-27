# 行人地獄：美術設計紀錄

2026-11-27 使用者確認以 `taiwan-v6.png` 為基準套版（細線淡彩手繪、寫實比例、不走可愛路線）。
圖片以本機 sprite-gen（codex／GPT 繪圖）生成。使用者提供的實景照片只用來觀察元素並以文字描述，沒有收進版本庫，也沒有上傳給繪圖工具。

| 檔案 | 用途 |
| --- | --- |
| `taiwan-v6.png` | 核准基準畫面 |
| `signs-compare-v1.png` | 招牌三款（熱鬧大字、直立側招、手寫鐵皮），使用者指定混搭 |
| `sign-angle-guide.png` | 招牌立體角度底稿：伸出式招牌看得到正面與頂面 |
| `sheet-small-v1.png` | 一格路障與黑狗（`art/` 單件素材原檔，以下同） |
| `sheet-wide-v1.png` | 橫向兩格路障 |
| `sheet-tall-v1.png` | 直向兩格路障（違停車、斜停機車、路邊攤） |
| `sheet-vehicles-v1.png` | 車輛、垃圾車、倒車機車 |
| `sheet-people-v1.png` | 主角姿勢、倒垃圾鄰居、珍奶攤 |
| `sheet-signs-tall-v1.png`、`sheet-signs-wide-v1.png` | 單件招牌；遊戲每局隨機組合招牌牆（原本重複貼一張長圖，使用者回報太規律） |
| `sheet-awnings-v1.png` | 雨棚、鐵窗、冷氣、燈籠等牆面零件 |
| `sheet-wall-v1.png` | 招牌後方的牆面底圖 |
| `sheet-cars-side-v1.png` | 橫停汽車；使用者指定汽車停在騎樓要橫停，停車規則：騎樓、人行道上橫停；路邊沿馬路直停（用 `sheet-tall-v1.png` 的紅車與灰車） |
| `sheet-street-v1.png` | 消防栓、台電變電箱、郵筒、電信箱、行道樹、禁停標誌，放在路緣欄 |

擺放規則（使用者指定）：機車一律橫停；靠店面那一欄車頭朝店面，騎樓其他位置朝馬路，馬路上朝人行道（`scooterside_blue`、`scooterside_grey` 由原素材改色）；路邊停汽車或機車（機車畫白線停車格）；曬被子、曬菜脯只放靠店家的最左欄。倒車機車車頭朝馬路，往店面方向退一格；`sheet-vehicles-v1.png` 的直向停放機車已停用。
| `sheet-roadside-v1.png` | 路邊停放的白色休旅車、白色小車、帆布貨車與三角錐；路邊車輛成排停放，部分壓紅線跨上路緣 |
| `sheet-boxes-v1.png` | 台灣變電箱三款（深綠黃黑斜紋底座、灰色雙箱、彩繪加護欄），取代 `sheet-street-v1.png` 的單一變電箱 |
| `sheet-stall-wide-v1.png`、`sheet-stall-road-v1.png` | 騎樓與路邊小吃攤 |
| `sheet-cats-v1.png`、`anim-cat-*` | 貓貓靜態姿勢與走路分格（坐墊上睡覺、趴坐騎樓、路過不擋路） |
| `anim-*-raw-v1.png`、`anim-*-request.json` | 主角、鄰居、黑狗、橘貓的 sprite-gen 走路分格原圖與設定；打包成 `art/anim_*.webp` |

招牌店名為遊戲虛構，正式上架前需再確認是否撞到真實店家。
