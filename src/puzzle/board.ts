import type { Types } from "@sabaki/sgf";

export const DEFAULT_BOARD_SIZE = 19;

const MIN_BOARD_SIZE = 5;
const MAX_BOARD_SIZE = 26;

export function checkBoardSize(size: number): number {
  if (
    !Number.isInteger(size) ||
    size < MIN_BOARD_SIZE ||
    size > MAX_BOARD_SIZE
  ) {
    throw new Error(`unsupported board size: ${size}`);
  }
  return size;
}

export function boardSize(root: Types.NodeObject): number {
  const value = root.data["SZ"]?.[0];
  return value === undefined
    ? DEFAULT_BOARD_SIZE
    : checkBoardSize(parseInt(value, 10));
}
