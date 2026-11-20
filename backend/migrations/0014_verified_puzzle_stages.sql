CREATE TABLE verified_puzzle_stages (
    game_id TEXT NOT NULL,
    player_id TEXT NOT NULL REFERENCES players(id),
    stage INTEGER NOT NULL CHECK (stage > 0),
    PRIMARY KEY (game_id, player_id, stage)
) STRICT;

CREATE TRIGGER verified_puzzle_stage_after_move
AFTER UPDATE OF state ON ranked_boards
WHEN NEW.game_id IN ('quack-pond', 'mirror-twins')
 AND json_extract(NEW.state, '$.lastCleared') IS NOT NULL
BEGIN
    INSERT OR IGNORE INTO verified_puzzle_stages (game_id, player_id, stage)
    VALUES (NEW.game_id, NEW.player_id, json_extract(NEW.state, '$.lastCleared'));
END;

CREATE TRIGGER verified_puzzle_score_after_clear
AFTER INSERT ON verified_puzzle_stages
BEGIN
    INSERT INTO game_leaderboard (game_id, player_id, score)
    VALUES (NEW.game_id, NEW.player_id,
      (SELECT COUNT(*) FROM verified_puzzle_stages WHERE game_id=NEW.game_id AND player_id=NEW.player_id))
    ON CONFLICT (game_id, player_id) DO UPDATE SET score=excluded.score
    WHERE excluded.score > game_leaderboard.score;
    INSERT INTO leaderboard_activity (game_id, last_played_at)
    VALUES (NEW.game_id, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    ON CONFLICT (game_id) DO UPDATE SET last_played_at=excluded.last_played_at;
END;
