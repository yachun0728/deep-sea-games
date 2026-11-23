-- Critter Crashers (siege-architect) joins the verified puzzle stages: the score is the number
-- of different levels whose plan the Worker replayed to a breached gate.
DROP TRIGGER verified_puzzle_stage_after_move;
CREATE TRIGGER verified_puzzle_stage_after_move
AFTER UPDATE OF state ON ranked_boards
WHEN NEW.game_id IN ('quack-pond', 'mirror-twins', 'siege-architect')
 AND json_extract(NEW.state, '$.lastCleared') IS NOT NULL
BEGIN
    INSERT OR IGNORE INTO verified_puzzle_stages (game_id, player_id, stage)
    VALUES (NEW.game_id, NEW.player_id, json_extract(NEW.state, '$.lastCleared'));
END;
