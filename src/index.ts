export type Message = any;
export type ActorBehavior = (msg: Message, state: any) => Promise<any>;

export interface ActorConfig {
  maxQueueSize?: number;
  timeout?: number;
  supervised?: boolean;
}

export class ActorRef {
  private queue: Message[] = [];
  private processing = false;
  private config: ActorConfig;
  private behavior: ActorBehavior;
  private state: any;
  private backpressure = false;

  constructor(behavior: ActorBehavior, config: ActorConfig = {}) {
    this.behavior = behavior;
    this.config = { maxQueueSize: 1000, timeout: 5000, ...config };
    this.state = {};
  }

  async send(msg: Message): Promise<void> {
    if (this.queue.length >= (this.config.maxQueueSize || 1000)) {
      this.backpressure = true;
      throw new Error('Actor queue full: backpressure engaged');
    }

    this.queue.push(msg);
    this.backpressure = false;

    if (!this.processing) {
      await this.process();
    }
  }

  private async process(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0) {
      const msg = this.queue.shift();
      if (!msg) break;

      try {
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Actor timeout')), this.config.timeout)
        );
        
        const result = Promise.race([this.behavior(msg, this.state), timeout]);
        this.state = await result;
      } catch (err) {
        console.error('Actor error:', err);
        if (this.config.supervised) {
          this.state = { error: err };
        }
      }
    }

    this.processing = false;
  }

  isBackpressured(): boolean {
    return this.backpressure;
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

export class ActorSystem {
  private actors: Map<string, ActorRef> = new Map();
  private supervisors: Map<string, ActorRef> = new Map();

  createActor(name: string, behavior: ActorBehavior, config?: ActorConfig): ActorRef {
    const actor = new ActorRef(behavior, config);
    this.actors.set(name, actor);
    return actor;
  }

  getActor(name: string): ActorRef | undefined {
    return this.actors.get(name);
  }

  async broadcast(msg: Message): Promise<void> {
    const promises = Array.from(this.actors.values()).map(actor => actor.send(msg));
    await Promise.all(promises);
  }

  shutdown(): void {
    this.actors.clear();
    this.supervisors.clear();
  }
}

export const createActorSystem = (): ActorSystem => new ActorSystem();
export default ActorSystem;
