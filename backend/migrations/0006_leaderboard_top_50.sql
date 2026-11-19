ALTER TABLE best_scores RENAME TO player_best_scores;
ALTER TABLE player_best_scores ADD COLUMN recorded_at TEXT;

-- The previously deployed Worker can keep reading during the rollout.
CREATE VIEW best_scores AS
SELECT game_id, player_id, score FROM player_best_scores;

DROP INDEX leaderboard_order;
CREATE TABLE game_leaderboard (
    game_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 9007199254740991),
    recorded_at TEXT,
    PRIMARY KEY (game_id, player_id),
    FOREIGN KEY (game_id, player_id) REFERENCES player_best_scores(game_id, player_id) ON DELETE CASCADE
) STRICT;

CREATE INDEX game_leaderboard_order ON game_leaderboard (game_id, score DESC, recorded_at, player_id);

INSERT INTO game_leaderboard (game_id, player_id, score, recorded_at)
SELECT game_id, player_id, score, recorded_at
FROM (
    SELECT *, ROW_NUMBER() OVER (
        PARTITION BY game_id ORDER BY score DESC, recorded_at, player_id
    ) AS position
    FROM player_best_scores
)
WHERE position <= 50;

CREATE TRIGGER player_best_time_after_insert
AFTER INSERT ON player_best_scores
BEGIN
    UPDATE player_best_scores SET recorded_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE game_id = NEW.game_id AND player_id = NEW.player_id;
END;

CREATE TRIGGER player_best_time_after_improvement
AFTER UPDATE OF score ON player_best_scores
WHEN NEW.score > OLD.score
BEGIN
    UPDATE player_best_scores SET recorded_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE game_id = NEW.game_id AND player_id = NEW.player_id;
END;

CREATE TRIGGER game_leaderboard_sync_player_best
AFTER UPDATE OF recorded_at ON player_best_scores
BEGIN
    INSERT INTO game_leaderboard (game_id, player_id, score, recorded_at)
    VALUES (NEW.game_id, NEW.player_id, NEW.score, NEW.recorded_at)
    ON CONFLICT (game_id, player_id) DO UPDATE SET
        score = excluded.score, recorded_at = excluded.recorded_at;

    DELETE FROM game_leaderboard
    WHERE game_id = NEW.game_id AND player_id IN (
        SELECT player_id FROM game_leaderboard WHERE game_id = NEW.game_id
        ORDER BY score DESC, recorded_at, player_id LIMIT -1 OFFSET 50
    );
END;

-- Rebind existing round settlements explicitly for SQLite/D1 compatibility.
DROP TRIGGER frog_round_best_after_finish;
CREATE TRIGGER frog_round_best_after_finish
AFTER UPDATE OF score ON frog_rounds
WHEN OLD.score IS NULL AND NEW.score IS NOT NULL
BEGIN
    INSERT INTO player_best_scores (game_id, player_id, score)
    VALUES ('frog', NEW.player_id, NEW.score)
    ON CONFLICT (game_id, player_id) DO UPDATE SET score = excluded.score
    WHERE excluded.score > player_best_scores.score;
END;

DROP TRIGGER mines_round_best_after_finish;
CREATE TRIGGER mines_round_best_after_finish
AFTER UPDATE OF score ON mines_rounds
WHEN OLD.score IS NULL AND NEW.score IS NOT NULL
BEGIN
    INSERT INTO player_best_scores (game_id, player_id, score)
    VALUES ('mines', NEW.player_id, NEW.score)
    ON CONFLICT (game_id, player_id) DO UPDATE SET score = excluded.score
    WHERE excluded.score > player_best_scores.score;
END;

DROP TRIGGER ranked_board_best_after_finish;
CREATE TRIGGER ranked_board_best_after_finish
AFTER UPDATE OF score ON ranked_boards
WHEN OLD.score IS NULL AND NEW.score IS NOT NULL
BEGIN
    INSERT INTO player_best_scores (game_id, player_id, score)
    VALUES (NEW.game_id, NEW.player_id, NEW.score)
    ON CONFLICT (game_id, player_id) DO UPDATE SET score = excluded.score
    WHERE excluded.score > player_best_scores.score;
END;
