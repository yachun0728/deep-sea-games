import rules from '../../../shared/book-sort-rules.cjs';

const { campaignLevel, canMove, applyMove, solved } = rules;
const MAX_ACTIONS = 4096;

export function verifiesBookSortScore(stage, moves) {
  if (!Number.isSafeInteger(stage) || stage < 1 || !Array.isArray(moves)
    || !moves.length || moves.length > MAX_ACTIONS) return false;

  let { boxes } = campaignLevel(stage);
  let spareUsed = false;
  for (const move of moves) {
    if (!Array.isArray(move) || solved(boxes)) return false;
    if (move.length === 0) {
      if (spareUsed) return false;
      spareUsed = true;
      boxes.push([]);
      continue;
    }
    if (move.length !== 2 || !move.every(index => Number.isInteger(index) && index >= 0 && index < boxes.length)) {
      return false;
    }
    const [from, to] = move;
    if (!canMove(boxes, from, to)) return false;
    boxes = applyMove(boxes, from, to);
  }
  return solved(boxes);
}
