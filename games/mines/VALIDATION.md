# Minesweeper input update — 2026-11-19

Scope: difficulty settings before the board, idle preview follows presets and valid custom values, touch/pen hold 500ms flags/unflags, mouse context menu flags/unflags, keyboard F. No flag-mode toggle. Moves over 10px, pointer cancellation, leaving the tile, blur, hidden document and rebuilding cancel the timer. Long-press consumes its following click. Round/ranking API, mine placement, wallet and storage formats unchanged.

Passed: node tools/test_mines_gold.mjs (existing rules, custom bounds, win/loss/chord and single settlement; added preview/no-start, short tap, hold without reveal, context duplicate guard, movement/cancel, right-click and F); 21 Python tests; generated documentation; build and --check; git diff --check. English source text coverage passes.

Updated tools/i18n_browser_games.js for new controls. Attempted python3 tools/check_i18n_browser.py; Chrome closed its test pipe before assertions, so browser layout and language-switch checks are NOT reported as passed. Real iPhone Safari long-press, scrolling, and multi-touch remain unverified.

2048 cover is a separate design deliverable, not part of this gameplay release.
