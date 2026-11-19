CREATE TABLE mines_rounds (
    id TEXT PRIMARY KEY NOT NULL,
    player_id TEXT NOT NULL REFERENCES players(id),
    started_at INTEGER NOT NULL,
    revision INTEGER NOT NULL DEFAULT 0,
    last_move TEXT,
    board TEXT NOT NULL,
    score INTEGER CHECK (score BETWEEN 0 AND 22)
) STRICT;

CREATE TRIGGER mines_round_best_after_finish
AFTER UPDATE OF score ON mines_rounds
WHEN OLD.score IS NULL AND NEW.score IS NOT NULL
BEGIN
    INSERT INTO best_scores (game_id, player_id, score)
    VALUES ('mines', NEW.player_id, NEW.score)
    ON CONFLICT (game_id, player_id) DO UPDATE SET score = excluded.score
    WHERE excluded.score > best_scores.score;
END;
