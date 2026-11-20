-- Keep cumulative scores in verified rounds. Only the public Merge ranking changes units.
DROP TRIGGER ranked_board_best_after_finish;
CREATE TRIGGER ranked_board_best_after_finish
AFTER UPDATE OF score ON ranked_boards
WHEN OLD.score IS NULL AND NEW.score IS NOT NULL
BEGIN
    INSERT INTO game_leaderboard (game_id, player_id, score)
    SELECT NEW.game_id, NEW.player_id,
           CASE WHEN NEW.game_id = 'merge'
                THEN (SELECT MAX(value) FROM json_each(NEW.state, '$.grid') WHERE type = 'integer')
                ELSE NEW.score END
    WHERE NEW.game_id <> 'merge' OR json_type(NEW.state, '$.grid') = 'array'
    ON CONFLICT (game_id, player_id) DO UPDATE SET score = excluded.score
    WHERE excluded.score > game_leaderboard.score;
END;

-- Finished rounds have no finish timestamp. Use insertion order for historical ties.
DELETE FROM game_leaderboard WHERE game_id = 'merge';
WITH round_peaks AS (
    SELECT r.rowid AS round_order, r.player_id, MAX(tile.value) AS peak
    FROM ranked_boards AS r, json_each(r.state, '$.grid') AS tile
    WHERE r.game_id = 'merge' AND r.score IS NOT NULL AND tile.type = 'integer'
    GROUP BY r.rowid, r.player_id
), player_peaks AS (
    SELECT *, ROW_NUMBER() OVER (
        PARTITION BY player_id ORDER BY peak DESC, round_order
    ) AS position
    FROM round_peaks
)
INSERT INTO game_leaderboard (game_id, player_id, score)
SELECT 'merge', player_id, peak
FROM player_peaks
WHERE position = 1
ORDER BY peak DESC, round_order
LIMIT 50;

UPDATE game_leaderboard SET recorded_at = NULL WHERE game_id = 'merge';
