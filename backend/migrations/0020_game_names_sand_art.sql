-- Display names only: Sand & Chill is a sandbox without leaderboard submissions.
INSERT INTO game_names (game_id,game_name,game_name_en,game_name_zh_cn)
VALUES ('sand-art','沙沙時光','Sand & Chill','沙沙时光')
ON CONFLICT(game_id) DO UPDATE SET game_name=excluded.game_name,game_name_en=excluded.game_name_en,game_name_zh_cn=excluded.game_name_zh_cn;
