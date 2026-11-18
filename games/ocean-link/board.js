  // Included inside Ocean Link's runtime closure.
  const levels = [
    ['經典消除', null, 0], ['經典消除', null, 0],
    ['向左移動', 'left', 0], ['向下移動', 'down', 0],
    ['礁石障礙', null, 3], ['礁石障礙', null, 5],
    ['向右移動', 'right', 0], ['向上移動', 'up', 0],
    ['礁石與左移', 'left', 5], ['礁石與下移', 'down', 7]
  ];

  function linkPath(board, start, end) {
    if (start === end || board[start] <= 0 || board[end] <= 0) return null;
    const x = start % stride, y = Math.floor(start / stride);
    const u = end % stride, v = Math.floor(end / stride);
    function clear(ax, ay, bx, by) {
      const dx = Math.sign(bx - ax), dy = Math.sign(by - ay);
      while (ax !== bx || ay !== by) {
        ax += dx;
        ay += dy;
        const cell = ay * stride + ax;
        if (cell !== end && cell !== start && board[cell] !== 0) return false;
      }
      return true;
    }

    if ((x === u || y === v) && clear(x, y, u, v)) return [[x, y], [u, v]];
    function offsets(a, b, size) {
      const range = Array.from({length: size}, (_, index) => index);
      const distance = index => Math.abs(index - a) + Math.abs(index - b);
      return range.sort((first, second) => distance(first) - distance(second));
    }

    // Try two bends, including degenerate paths with zero or one bend.
    for (const col of offsets(x, u, stride)) {
      if (clear(x, y, col, y) && clear(col, y, col, v) && clear(col, v, u, v)) {
        return [[x, y], [col, y], [col, v], [u, v]];
      }
    }
    for (const row of offsets(y, v, rows + 2)) {
      if (clear(x, y, x, row) && clear(x, row, u, row) && clear(u, row, u, v)) {
        return [[x, y], [x, row], [u, row], [u, v]];
      }
    }
    return null;
  }

  function lines(vertical) {
    return Array.from({length: vertical ? cols : rows}, (_, line) =>
      Array.from({length: vertical ? rows : cols}, (_, offset) =>
        vertical ? (offset + 1) * stride + line + 1 : (line + 1) * stride + offset + 1));
  }

  function slide(board, direction) {
    if (!direction) return;
    for (const cells of lines(direction === 'up' || direction === 'down')) {
      if (direction === 'right' || direction === 'down') cells.reverse();
      let write = 0;
      cells.forEach((cell, read) => {
        if (board[cell] === -1) write = read + 1;
        else if (board[cell] > 0) {
          const tile = board[cell];
          board[cell] = 0;
          board[cells[write++]] = tile;
        }
      });
    }
  }

  function shuffle(items) {
    for (let index = items.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [items[index], items[other]] = [items[other], items[index]];
    }
    return items;
  }

  function reefBoard(count) {
    const board = Array(stride * (rows + 2)).fill(0);
    const blocks = [];
    for (let y = 3; y < rows; y += 2) {
      for (let x = 3; x < cols; x += 2) blocks.push(y * stride + x);
    }
    for (const cell of shuffle(blocks).slice(0, count)) {
      for (const offset of [0, 1, stride, stride + 1]) board[cell + offset] = -1;
    }
    return board;
  }

  function deal(layout, symbols, direction) {
    const board = layout.map(value => value === -1 ? -1 : 0);
    const strips = lines(direction === 'up' || direction === 'down');
    const slots = strips.flatMap(cells => cells.filter((cell, index) =>
      index % 2 === 0 && board[cell] === 0).map(cell =>
        [cell, cell + (cells[1] - cells[0])]));
    // IDs follow the pieces through each simulated slide. Translate IDs back
    // to starting positions only after a complete legal removal sequence.
    for (const [a, b] of shuffle(slots).slice(0, symbols.length)) {
      board[a] = a;
      board[b] = b;
    }
    const work = board.slice(), solution = [], moves = [];
    for (const cells of strips) {
      while (cells.some(cell => work[cell] > 0)) {
        const a = cells.find(cell => work[cell] > 0);
        const run = cells.slice(cells.indexOf(a));
        const wall = run.findIndex(cell => work[cell] === -1);
        const candidates = (wall < 0 ? run : run.slice(0, wall)).filter(cell => work[cell] > 0);
        // Nest links along exposed edges. Every segment retains an even tile
        // count. The first two always connect straight if a longer link fails.
        const options = candidates.slice(0, 12).filter((_, index) => index % 2 === 1);
        const b = shuffle(options).find(cell => linkPath(work, a, cell));
        solution.push([work[a], work[b]]);
        moves.push([a, b]);
        work[a] = work[b] = 0;
        slide(work, direction);
      }
    }
    shuffle(symbols.slice()).forEach((symbol, index) => {
      const [a, b] = solution[index];
      board[a] = board[b] = symbol;
    });
    return {board, moves};
  }

  function findPair(board) {
    const seen = new Map();
    for (let cell = 0; cell < board.length; cell++) {
      const symbol = board[cell];
      if (symbol <= 0) continue;
      const matches = seen.get(symbol) || [];
      for (const other of matches) {
        if (linkPath(board, other, cell)) return [other, cell];
      }
      matches.push(cell);
      seen.set(symbol, matches);
    }
    return null;
  }
