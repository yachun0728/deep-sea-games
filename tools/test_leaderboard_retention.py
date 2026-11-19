from pathlib import Path
import sqlite3
import unittest


MIGRATIONS = Path(__file__).resolve().parents[1] / 'backend' / 'migrations'


class LeaderboardRetentionTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        self.addCleanup(self.db.close)
        self.db.execute('PRAGMA foreign_keys = ON')
        for migration in sorted(MIGRATIONS.glob('000[1-5]_*.sql')):
            self.db.executescript(migration.read_text())
        self.score_table = 'best_scores'
        self.db.executemany(
            'INSERT INTO players (id, token_hash) VALUES (?, ?)',
            [(f'p{i:02}', f'hash-{i}') for i in range(70)],
        )

    def migrate(self):
        self.db.executescript((MIGRATIONS / '0006_leaderboard_top_50.sql').read_text())
        self.score_table = 'game_leaderboard'

    def scores(self, game='frog'):
        return self.db.execute(
            'SELECT player_id, score, recorded_at FROM game_leaderboard WHERE game_id = ? '
            'ORDER BY score DESC, recorded_at, player_id', (game,),
        ).fetchall()

    def add(self, player, score, game='frog'):
        self.db.execute(
            f'INSERT INTO {self.score_table} (game_id, player_id, score) VALUES (?, ?, ?)',
            (game, player, score),
        )

    def test_caps_legacy_and_new_scores_per_game(self):
        for i in range(55):
            self.add(f'p{i:02}', i)
        self.add('p01', 7, 'mines')
        self.migrate()
        self.assertEqual([row[1] for row in self.scores()], list(range(54, 4, -1)))
        self.assertTrue(all(row[2] is None for row in self.scores()))

        self.add('p55', 0)
        self.assertEqual(len(self.scores()), 50)
        self.assertEqual(self.scores()[-1], ('p05', 5, None))
        self.add('p56', 100)
        self.assertRegex(self.scores()[0][2], r'^\d{4}-\d\d-\d\dT.*Z$')
        self.assertEqual(len(self.scores()), 50)
        self.assertEqual(self.scores()[-1], ('p06', 6, None))
        self.assertEqual(self.scores('mines'), [('p01', 7, None)])
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM player_best_scores").fetchone(), (0,))
        self.assertEqual(self.db.execute(
            "SELECT COUNT(*) FROM best_scores WHERE game_id = 'frog'"
        ).fetchone(), (50,))

    def test_ranked_checkpoints_update_the_public_board_before_the_round_ends(self):
        self.migrate()
        self.db.executescript((MIGRATIONS / '0007_ranked_board_checkpoints.sql').read_text())
        self.db.execute(
            "INSERT INTO ranked_boards (id, player_id, game_id, started_at, state)"
            " VALUES ('o','p00','ocean-link',1,'{}')"
        )
        self.db.execute("UPDATE ranked_boards SET checkpoint_score = 1 WHERE id = 'o'")
        rank = self.scores('ocean-link')[0]
        self.assertEqual(rank[:2], ('p00', 1))
        self.assertIsNotNone(rank[2])
        self.assertEqual(self.db.execute(
            "SELECT score FROM ranked_boards WHERE id = 'o'"
        ).fetchone(), (None,))
        self.db.execute("UPDATE ranked_boards SET checkpoint_score = 1 WHERE id = 'o'")
        self.assertEqual(self.scores('ocean-link'), [rank])
        self.db.execute("UPDATE ranked_boards SET checkpoint_score = NULL, score = 10 WHERE id = 'o'")
        self.assertEqual(self.scores('ocean-link')[0][:2], ('p00', 10))
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM player_best_scores").fetchone(), (0,))

    def test_existing_round_triggers_timestamp_and_only_improvements_refresh(self):
        self.migrate()
        self.db.execute("INSERT INTO frog_rounds (id, player_id, seed, started_at) VALUES ('f','p00',1,1)")
        self.db.execute("UPDATE frog_rounds SET score = 15 WHERE id = 'f'")
        self.db.execute("INSERT INTO mines_rounds (id, player_id, started_at, board) VALUES ('m','p01',1,'{}')")
        self.db.execute("UPDATE mines_rounds SET score = 9 WHERE id = 'm'")
        self.db.execute("INSERT INTO ranked_boards (id, player_id, game_id, started_at, state) VALUES ('b','p02','merge',1,'{}')")
        self.db.execute("UPDATE ranked_boards SET score = 42 WHERE id = 'b'")
        for game in ('frog', 'mines', 'merge'):
            self.assertTrue(self.scores(game)[0][2].endswith('Z'))

        self.db.execute("UPDATE game_leaderboard SET recorded_at = '2026-01-01T00:00:00.000Z' WHERE game_id = 'frog'")
        self.db.execute("INSERT INTO frog_rounds (id, player_id, seed, started_at) VALUES ('equal','p00',1,2)")
        self.db.execute("UPDATE frog_rounds SET score = 15 WHERE id = 'equal'")
        self.add('p01', 15)
        self.assertEqual(self.scores()[0], ('p00', 15, '2026-01-01T00:00:00.000Z'))
        self.db.execute("INSERT INTO frog_rounds (id, player_id, seed, started_at) VALUES ('better','p00',1,3)")
        self.db.execute("UPDATE frog_rounds SET score = 20 WHERE id = 'better'")
        self.assertEqual(self.scores()[0][:2], ('p00', 20))
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM player_best_scores").fetchone(), (0,))
        self.assertNotEqual(self.scores()[0][2], '2026-01-01T00:00:00.000Z')

    def test_same_millisecond_keeps_first_to_reach_score(self):
        self.migrate()
        self.db.executescript((MIGRATIONS / '0007_ranked_board_checkpoints.sql').read_text())
        self.db.executescript((MIGRATIONS / '0008_leaderboard_tie_order.sql').read_text())
        self.add('p00', 5)
        self.add('p10', 10)
        self.db.execute("UPDATE game_leaderboard SET score = 10 WHERE player_id = 'p00'")
        self.db.execute("UPDATE game_leaderboard SET recorded_at = '2026-01-01T00:00:00.000Z'")
        order = self.db.execute(
            'SELECT player_id FROM game_leaderboard ORDER BY score DESC, recorded_at, score_order'
        ).fetchall()
        self.assertEqual(order, [('p10',), ('p00',)])


if __name__ == '__main__':
    unittest.main()
