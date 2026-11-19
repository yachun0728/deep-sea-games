CREATE TABLE ranked_boards (
    id TEXT PRIMARY KEY NOT NULL,
    player_id TEXT NOT NULL REFERENCES players(id),
    game_id TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    revision INTEGER NOT NULL DEFAULT 0,
    last_action TEXT,
    state TEXT NOT NULL,
    score INTEGER CHECK (score BETWEEN 0 AND 9007199254740991)
) STRICT;

CREATE TRIGGER ranked_board_best_after_finish
AFTER UPDATE OF score ON ranked_boards
WHEN OLD.score IS NULL AND NEW.score IS NOT NULL
BEGIN
    INSERT INTO best_scores (game_id, player_id, score)
    VALUES (NEW.game_id, NEW.player_id, NEW.score)
    ON CONFLICT (game_id, player_id) DO UPDATE SET score = excluded.score
    WHERE excluded.score > best_scores.score;
END;
