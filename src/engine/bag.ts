import type { PieceKey } from './types';
import { PIECE_KEYS } from './pieces';

function shuffle(arr: PieceKey[]): PieceKey[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class Bag {
  private bag: PieceKey[] = [];

  /** Draw up to `maxQueue` pieces into the queue, refilling the bag as needed. */
  fill(queue: PieceKey[], maxQueue: number): void {
    while (queue.length < maxQueue) {
      if (this.bag.length === 0) this.bag = shuffle(PIECE_KEYS);
      queue.push(this.bag.shift()!);
    }
  }
}
