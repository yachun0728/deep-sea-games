ALTER TABLE ranked_boards ADD COLUMN checkpoint_score INTEGER
    CHECK (checkpoint_score BETWEEN 0 AND 9007199254740991);

CREATE TRIGGER ranked_board_best_after_checkpoint
AFTER UPDATE OF checkpoint_score ON ranked_boards
WHEN NEW.checkpoint_score IS NOT NULL
 AND (OLD.checkpoint_score IS NULL OR NEW.checkpoint_score > OLD.checkpoint_score)
BEGIN
    INSERT INTO game_leaderboard (game_id, player_id, score)
    VALUES (NEW.game_id, NEW.player_id, NEW.checkpoint_score)
    ON CONFLICT (game_id, player_id) DO UPDATE SET score = excluded.score
    WHERE excluded.score > game_leaderboard.score;
END;
