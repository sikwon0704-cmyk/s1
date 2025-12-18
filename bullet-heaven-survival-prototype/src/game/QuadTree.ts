import { Vector2 } from './types';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface QuadTreeItem {
  x: number;
  y: number;
  width: number;
  height: number;
  data: any; // The actual object (Enemy, Projectile, etc.)
}

export class QuadTree {
  private bounds: Rect;
  private capacity: number;
  private items: QuadTreeItem[] = [];
  private divided: boolean = false;
  private nodes: QuadTree[] = [];

  constructor(bounds: Rect, capacity: number = 4) {
    this.bounds = bounds;
    this.capacity = capacity;
  }

  public clear() {
    this.items = [];
    this.nodes = [];
    this.divided = false;
  }

  public insert(item: QuadTreeItem): boolean {
    if (!this.contains(this.bounds, item)) {
      return false;
    }

    if (this.items.length < this.capacity) {
      this.items.push(item);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    // Try inserting into children
    if (this.nodes[0].insert(item)) return true;
    if (this.nodes[1].insert(item)) return true;
    if (this.nodes[2].insert(item)) return true;
    if (this.nodes[3].insert(item)) return true;

    // If it doesn't fit perfectly into a child (overlaps), keep it in parent
    // Note: Simple QuadTrees might force down or store in parent. 
    // For this game, storing in parent if overlapping is acceptable, 
    // but usually we want to push down. 
    // Let's stick to: if it fits in a child, put it there. 
    // If it fails all children (due to boundary overlap), we add to this node's items 
    // BUT we already checked capacity.
    // Solution: Increase capacity for this specific node or just push to items list anyway 
    // if it overlaps boundaries.
    this.items.push(item);
    return true;
  }

  private subdivide() {
    const x = this.bounds.x;
    const y = this.bounds.y;
    const w = this.bounds.width / 2;
    const h = this.bounds.height / 2;

    this.nodes[0] = new QuadTree({ x: x + w, y: y, width: w, height: h }, this.capacity);     // NE
    this.nodes[1] = new QuadTree({ x: x, y: y, width: w, height: h }, this.capacity);         // NW
    this.nodes[2] = new QuadTree({ x: x, y: y + h, width: w, height: h }, this.capacity);     // SW
    this.nodes[3] = new QuadTree({ x: x + w, y: y + h, width: w, height: h }, this.capacity); // SE
    
    this.divided = true;
  }

  public query(range: Rect, found: any[] = []): any[] {
    if (!this.intersects(this.bounds, range)) {
      return found;
    }

    for (const item of this.items) {
      if (this.intersects({ x: item.x, y: item.y, width: item.width, height: item.height }, range)) {
        found.push(item.data);
      }
    }

    if (this.divided) {
      this.nodes[0].query(range, found);
      this.nodes[1].query(range, found);
      this.nodes[2].query(range, found);
      this.nodes[3].query(range, found);
    }

    return found;
  }

  private contains(rect: Rect, item: QuadTreeItem): boolean {
    return (
      item.x >= rect.x &&
      item.x + item.width <= rect.x + rect.width &&
      item.y >= rect.y &&
      item.y + item.height <= rect.y + rect.height
    );
  }

  private intersects(a: Rect, b: Rect): boolean {
    return !(
      b.x > a.x + a.width ||
      b.x + b.width < a.x ||
      b.y > a.y + a.height ||
      b.y + b.height < a.y
    );
  }
}
