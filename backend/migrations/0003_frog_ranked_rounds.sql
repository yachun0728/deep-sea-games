CREATE TABLE frog_rounds (
    id TEXT PRIMARY KEY NOT NULL,
    player_id TEXT NOT NULL REFERENCES players(id),
    seed INTEGER NOT NULL,
    started_at INTEGER NOT NULL,
    proof_hash TEXT,
    score INTEGER CHECK (score >= 0)
) STRICT;

CREATE TRIGGER frog_round_best_after_finish
AFTER UPDATE OF score ON frog_rounds
WHEN OLD.score IS NULL AND NEW.score IS NOT NULL
BEGIN
    INSERT INTO best_scores (game_id, player_id, score)
    VALUES ('frog', NEW.player_id, NEW.score)
    ON CONFLICT (game_id, player_id) DO UPDATE SET score = excluded.score
    WHERE excluded.score > best_scores.score;
END;
