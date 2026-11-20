-- Public share links for verified ranked rounds. Each finished round has at most
-- one link; the score is copied when the link is made so the page never changes.
CREATE TABLE IF NOT EXISTS result_shares (
    id TEXT PRIMARY KEY NOT NULL CHECK (length(id) = 10),
    round_id TEXT NOT NULL UNIQUE REFERENCES ranked_boards(id),
    player_id TEXT NOT NULL REFERENCES players(id),
    game_id TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 9007199254740991),
    lang TEXT NOT NULL CHECK (lang IN ('zh', 'en')),
    created_at INTEGER NOT NULL
) STRICT;
