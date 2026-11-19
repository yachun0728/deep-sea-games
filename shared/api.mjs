export const API = Object.freeze({
  health: '/api/v1/health',
  players: '/api/v1/players',
  me: '/api/v1/me',
  frogStart: '/api/v1/frog/rounds',
  frogFinish: '/api/v1/frog/rounds/finish',
  minesStart: '/api/v1/mines/rounds',
  minesMove: '/api/v1/mines/rounds/move',
  boardStart: '/api/v1/boards/rounds',
  boardMove: '/api/v1/boards/rounds/move',
  leaderboard: '/api/v1/leaderboard',
});

export const GAME_ID = /^[a-z][a-z0-9-]{0,63}$/;
export const LEADERBOARD_LIMIT = 50;
