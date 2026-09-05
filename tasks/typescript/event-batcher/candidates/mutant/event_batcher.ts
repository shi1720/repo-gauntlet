export type Sink<T> = (batch: readonly T[]) => Promise<void>;
export class EventBatcher<T> {
  private queue:T[]=[]; private active:Promise<void>|null=null; private readonly sink:Sink<T>;
  constructor(sink:Sink<T>){this.sink=sink;}
  add(event:T):void{this.queue.push(event);}
  async flush():Promise<void>{if(this.active)return this.active;const batch=this.queue;this.queue=[];this.active=this.sink(batch).catch(error=>{this.queue=[...batch,...this.queue];throw error;}).finally(()=>{this.active=null;});return this.active;}
  get pending():number{return this.queue.length;}
}
