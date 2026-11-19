CREATE TABLE leaderboard_activity (
    game_id TEXT PRIMARY KEY,
    last_played_at TEXT NOT NULL
);

-- Historical rounds have no finish timestamps. Seed only from dated records.
INSERT INTO leaderboard_activity (game_id, last_played_at)
SELECT game_id, MAX(recorded_at)
FROM game_leaderboard
WHERE recorded_at IS NOT NULL
GROUP BY game_id;

CREATE TRIGGER frog_round_activity_after_finish
AFTER UPDATE OF score ON frog_rounds
WHEN OLD.score IS NULL AND NEW.score IS NOT NULL
BEGIN
    INSERT INTO leaderboard_activity (game_id, last_played_at)
    VALUES ('frog', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    ON CONFLICT (game_id) DO UPDATE SET last_played_at = excluded.last_played_at;
END;

CREATE TRIGGER mines_round_activity_after_finish
AFTER UPDATE OF score ON mines_rounds
WHEN OLD.score IS NULL AND NEW.score IS NOT NULL
BEGIN
    INSERT INTO leaderboard_activity (game_id, last_played_at)
    VALUES ('mines', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    ON CONFLICT (game_id) DO UPDATE SET last_played_at = excluded.last_played_at;
END;

CREATE TRIGGER ranked_board_activity_after_finish
AFTER UPDATE OF score ON ranked_boards
WHEN OLD.score IS NULL AND NEW.score IS NOT NULL
BEGIN
    INSERT INTO leaderboard_activity (game_id, last_played_at)
    VALUES (NEW.game_id, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    ON CONFLICT (game_id) DO UPDATE SET last_played_at = excluded.last_played_at;
END;

CREATE TRIGGER ranked_board_activity_after_checkpoint
AFTER UPDATE OF checkpoint_score ON ranked_boards
WHEN NEW.checkpoint_score IS NOT NULL
 AND (OLD.checkpoint_score IS NULL OR NEW.checkpoint_score > OLD.checkpoint_score)
BEGIN
    INSERT INTO leaderboard_activity (game_id, last_played_at)
    VALUES (NEW.game_id, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    ON CONFLICT (game_id) DO UPDATE SET last_played_at = excluded.last_played_at;
END;
