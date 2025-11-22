export const ROWS = 8;
export const COLS = 32;

export type Grid = boolean[][];
export type Algorithm = 'GameOfLife' | 'HighLife';

export const createEmptyGrid = (): Grid => {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(false));
};

export const randomizeGrid = (): Grid => {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => Math.random() > 0.7)
  );
};

export const evolveGrid = (grid: Grid, algorithm: Algorithm = 'GameOfLife', frozenRows: boolean[] = []): Grid => {
  const newGrid = createEmptyGrid();

  for (let r = 0; r < ROWS; r++) {
    // If this row is frozen, preserve its state
    if (frozenRows[r]) {
      newGrid[r] = [...grid[r]];
      continue;
    }

    for (let c = 0; c < COLS; c++) {
      let neighbors = 0;

      // Check all 8 neighbors with wrap-around
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;

          const neighborRow = (r + i + ROWS) % ROWS;
          const neighborCol = (c + j + COLS) % COLS;

          if (grid[neighborRow][neighborCol]) {
            neighbors++;
          }
        }
      }

      const isAlive = grid[r][c];

      if (algorithm === 'GameOfLife') {
        // Standard Game of Life Rules (B3/S23)
        if (isAlive) {
          if (neighbors < 2 || neighbors > 3) {
            newGrid[r][c] = false;
          } else {
            newGrid[r][c] = true;
          }
        } else {
          if (neighbors === 3) {
            newGrid[r][c] = true;
          }
        }
      } else if (algorithm === 'HighLife') {
        // HighLife Rules (B36/S23)
        // Born if 3 or 6 neighbors
        // Survives if 2 or 3 neighbors
        if (isAlive) {
          if (neighbors === 2 || neighbors === 3) {
            newGrid[r][c] = true;
          } else {
            newGrid[r][c] = false;
          }
        } else {
          if (neighbors === 3 || neighbors === 6) {
            newGrid[r][c] = true;
          }
        }
      }
    }
  }

  return newGrid;
};
