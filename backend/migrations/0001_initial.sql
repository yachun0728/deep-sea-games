CREATE TABLE players (
    id TEXT PRIMARY KEY NOT NULL,
    token_hash TEXT NOT NULL UNIQUE
) STRICT;

CREATE TABLE point_entries (
    player_id TEXT NOT NULL REFERENCES players(id),
    event_id TEXT NOT NULL,
    delta INTEGER NOT NULL CHECK (delta <> 0),
    PRIMARY KEY (player_id, event_id)
) STRICT;

CREATE TABLE best_scores (
    game_id TEXT NOT NULL,
    player_id TEXT NOT NULL REFERENCES players(id),
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 9007199254740991),
    PRIMARY KEY (game_id, player_id)
) STRICT;

CREATE INDEX leaderboard_order ON best_scores (game_id, score DESC, player_id);
