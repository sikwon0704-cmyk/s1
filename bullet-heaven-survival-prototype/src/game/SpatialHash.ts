import { Enemy } from './Enemy';

export class SpatialHash {
  private cellSize: number;
  private grid: Map<string, Enemy[]>;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  // Generate a key for the grid cell
  private getKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  // Clear the grid for the new frame
  public clear() {
    this.grid.clear();
  }

  // Add an enemy to the grid
  public insert(enemy: Enemy) {
    const key = this.getKey(enemy.position.x, enemy.position.y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(enemy);
  }

  // Get enemies from the same cell and 8 surrounding cells
  public getNearby(enemy: Enemy): Enemy[] {
    const nearby: Enemy[] = [];
    const cellX = Math.floor(enemy.position.x / this.cellSize);
    const cellY = Math.floor(enemy.position.y / this.cellSize);

    // Check 3x3 grid centered on the entity
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        const key = `${cellX + x},${cellY + y}`;
        const enemiesInCell = this.grid.get(key);
        if (enemiesInCell) {
          nearby.push(...enemiesInCell);
        }
      }
    }

    return nearby;
  }
}
