-- Keep the order of accepted records even when D1 records the same millisecond.
ALTER TABLE game_leaderboard ADD COLUMN score_order INTEGER;
UPDATE game_leaderboard SET score_order = rowid;

DROP INDEX game_leaderboard_order;
CREATE INDEX game_leaderboard_order ON game_leaderboard
    (game_id, score DESC, recorded_at, score_order, player_id);

DROP TRIGGER leaderboard_limit_after_insert;
CREATE TRIGGER leaderboard_limit_after_insert
AFTER INSERT ON game_leaderboard
BEGIN
    UPDATE game_leaderboard
    SET recorded_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
        score_order = (SELECT COALESCE(MAX(score_order), 0) + 1 FROM game_leaderboard WHERE game_id = NEW.game_id)
    WHERE game_id = NEW.game_id AND player_id = NEW.player_id;

    DELETE FROM game_leaderboard
    WHERE game_id = NEW.game_id AND player_id IN (
        SELECT player_id FROM game_leaderboard WHERE game_id = NEW.game_id
        ORDER BY score DESC, recorded_at, score_order, player_id LIMIT -1 OFFSET 50
    );
END;

DROP TRIGGER leaderboard_time_after_improvement;
CREATE TRIGGER leaderboard_time_after_improvement
AFTER UPDATE OF score ON game_leaderboard
WHEN NEW.score > OLD.score
BEGIN
    UPDATE game_leaderboard
    SET recorded_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
        score_order = (SELECT MAX(score_order) + 1 FROM game_leaderboard WHERE game_id = NEW.game_id)
    WHERE game_id = NEW.game_id AND player_id = NEW.player_id;
END;
