ALTER TABLE best_scores ADD COLUMN recorded_at TEXT;

DROP INDEX leaderboard_order;
CREATE INDEX leaderboard_order ON best_scores (game_id, score DESC, recorded_at, player_id);

-- Keep the historical order for equally scored rows whose timestamps are unknown.
DELETE FROM best_scores
WHERE (game_id, player_id) IN (
    SELECT game_id, player_id FROM (
        SELECT game_id, player_id, ROW_NUMBER() OVER (
            PARTITION BY game_id ORDER BY score DESC, recorded_at, player_id
        ) AS position
        FROM best_scores
    ) WHERE position > 50
);

CREATE TRIGGER leaderboard_limit_after_insert
AFTER INSERT ON best_scores
BEGIN
    UPDATE best_scores SET recorded_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE game_id = NEW.game_id AND player_id = NEW.player_id;

    DELETE FROM best_scores
    WHERE game_id = NEW.game_id AND player_id IN (
        SELECT player_id FROM best_scores WHERE game_id = NEW.game_id
        ORDER BY score DESC, recorded_at, player_id LIMIT -1 OFFSET 50
    );
END;

CREATE TRIGGER leaderboard_time_after_improvement
AFTER UPDATE OF score ON best_scores
WHEN NEW.score > OLD.score
BEGIN
    UPDATE best_scores SET recorded_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE game_id = NEW.game_id AND player_id = NEW.player_id;
END;
