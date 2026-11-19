ALTER TABLE best_scores RENAME TO game_leaderboard;
ALTER TABLE game_leaderboard ADD COLUMN recorded_at TEXT;

-- Keep the previous Worker readable while the new frontend is pending.
CREATE VIEW best_scores AS
SELECT game_id, player_id, score FROM game_leaderboard;

DROP INDEX leaderboard_order;
CREATE INDEX game_leaderboard_order ON game_leaderboard (game_id, score DESC, recorded_at, player_id);

-- Reserved for authenticated accounts. Guest-round settlement does not write here.
CREATE TABLE player_best_scores (
    player_id TEXT NOT NULL REFERENCES players(id),
    game_id TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 9007199254740991),
    recorded_at TEXT NOT NULL,
    PRIMARY KEY (player_id, game_id)
) STRICT;

DELETE FROM game_leaderboard
WHERE (game_id, player_id) IN (
    SELECT game_id, player_id FROM (
        SELECT game_id, player_id, ROW_NUMBER() OVER (
            PARTITION BY game_id ORDER BY score DESC, recorded_at, player_id
        ) AS position
        FROM game_leaderboard
    ) WHERE position > 50
);

CREATE TRIGGER leaderboard_limit_after_insert
AFTER INSERT ON game_leaderboard
BEGIN
    UPDATE game_leaderboard SET recorded_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE game_id = NEW.game_id AND player_id = NEW.player_id;

    DELETE FROM game_leaderboard
    WHERE game_id = NEW.game_id AND player_id IN (
        SELECT player_id FROM game_leaderboard WHERE game_id = NEW.game_id
        ORDER BY score DESC, recorded_at, player_id LIMIT -1 OFFSET 50
    );
END;

CREATE TRIGGER leaderboard_time_after_improvement
AFTER UPDATE OF score ON game_leaderboard
WHEN NEW.score > OLD.score
BEGIN
    UPDATE game_leaderboard SET recorded_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE game_id = NEW.game_id AND player_id = NEW.player_id;
END;

-- Rebind existing guest-round settlements explicitly for SQLite/D1 compatibility.
DROP TRIGGER frog_round_best_after_finish;
CREATE TRIGGER frog_round_best_after_finish
AFTER UPDATE OF score ON frog_rounds
WHEN OLD.score IS NULL AND NEW.score IS NOT NULL
BEGIN
    INSERT INTO game_leaderboard (game_id, player_id, score)
    VALUES ('frog', NEW.player_id, NEW.score)
    ON CONFLICT (game_id, player_id) DO UPDATE SET score = excluded.score
    WHERE excluded.score > game_leaderboard.score;
END;

DROP TRIGGER mines_round_best_after_finish;
CREATE TRIGGER mines_round_best_after_finish
AFTER UPDATE OF score ON mines_rounds
WHEN OLD.score IS NULL AND NEW.score IS NOT NULL
BEGIN
    INSERT INTO game_leaderboard (game_id, player_id, score)
    VALUES ('mines', NEW.player_id, NEW.score)
    ON CONFLICT (game_id, player_id) DO UPDATE SET score = excluded.score
    WHERE excluded.score > game_leaderboard.score;
END;

DROP TRIGGER ranked_board_best_after_finish;
CREATE TRIGGER ranked_board_best_after_finish
AFTER UPDATE OF score ON ranked_boards
WHEN OLD.score IS NULL AND NEW.score IS NOT NULL
BEGIN
    INSERT INTO game_leaderboard (game_id, player_id, score)
    VALUES (NEW.game_id, NEW.player_id, NEW.score)
    ON CONFLICT (game_id, player_id) DO UPDATE SET score = excluded.score
    WHERE excluded.score > game_leaderboard.score;
END;
