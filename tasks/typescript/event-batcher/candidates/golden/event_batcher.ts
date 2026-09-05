export type Sink<T> = (batch: readonly T[]) => Promise<void>;

export class EventBatcher<T> {
  private queue: T[] = [];
  private active: Promise<void> | null = null;
  private readonly sink: Sink<T>;
  constructor(sink: Sink<T>) { this.sink = sink; }
  add(event: T): void { this.queue.push(event); }
  flush(): Promise<void> {
    if (this.active) return this.active;
    this.active = this.drain().finally(() => { this.active = null; });
    return this.active;
  }
  private async drain(): Promise<void> {
    while (this.queue.length > 0) {
      const batch = this.queue;
      this.queue = [];
      try { await this.sink(batch); }
      catch (error) { this.queue = [...batch, ...this.queue]; throw error; }
    }
  }
  get pending(): number { return this.queue.length; }
}
