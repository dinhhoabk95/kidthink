export class ObjectPool<T> {
  private readonly pool: T[] = [];
  private readonly factory: () => T;
  private readonly resetFn?: (item: T) => void;
  private allocationsThisFrame = 0;

  constructor(factory: () => T, initialSize = 20, resetFn?: (item: T) => void) {
    this.factory = factory;
    this.resetFn = resetFn;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  acquire(): T {
    const item = this.pool.pop();
    if (item) {
      return item;
    }
    this.allocationsThisFrame++;
    return this.factory();
  }

  release(item: T): void {
    if (this.resetFn) {
      this.resetFn(item);
    }
    this.pool.push(item);
  }

  resetFrameAllocationCount(): void {
    this.allocationsThisFrame = 0;
  }

  getAllocationsThisFrame(): number {
    return this.allocationsThisFrame;
  }
}
