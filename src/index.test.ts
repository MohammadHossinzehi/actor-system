import { ActorRef, ActorSystem, createActorSystem } from './index';

describe('ActorSystem', () => {
  let system: ActorSystem;

  beforeEach(() => {
    system = createActorSystem();
  });

  afterEach(() => {
    system.shutdown();
  });

  test('should create actor and send message', async () => {
    const behavior = jest.fn(async (msg, state) => {
      return { ...state, received: msg };
    });

    const actor = system.createActor('test-actor', behavior);
    await actor.send({ type: 'HELLO' });

    expect(behavior).toHaveBeenCalledWith({ type: 'HELLO' }, {});
  });

  test('should handle message queue', async () => {
    const messages: any[] = [];
    const behavior = async (msg: any, state: any) => {
      messages.push(msg);
      return state;
    };

    const actor = system.createActor('queue-test', behavior);
    await actor.send({ id: 1 });
    await actor.send({ id: 2 });
    await actor.send({ id: 3 });

    expect(messages).toHaveLength(3);
    expect(messages[0].id).toBe(1);
  });

  test('should implement backpressure', async () => {
    const behavior = async () => new Promise(r => setTimeout(r, 100));
    const actor = system.createActor('backpressure-test', behavior, {
      maxQueueSize: 2
    });

    await actor.send({ id: 1 });
    await actor.send({ id: 2 });

    expect(() => actor.send({ id: 3 })).rejects.toThrow('backpressure');
  });

  test('should track queue length', async () => {
    const behavior = async () => {};
    const actor = system.createActor('queue-length-test', behavior);

    expect(actor.getQueueLength()).toBe(0);
    await actor.send({ id: 1 });
    expect(actor.getQueueLength()).toBeLessThanOrEqual(1);
  });

  test('should broadcast to all actors', async () => {
    const behavior = jest.fn(async (msg, state) => state);

    system.createActor('broadcast-1', behavior);
    system.createActor('broadcast-2', behavior);
    system.createActor('broadcast-3', behavior);

    await system.broadcast({ type: 'BROADCAST' });
    expect(behavior).toHaveBeenCalledTimes(3);
  });

  test('should handle errors with supervision', async () => {
    const behavior = async () => {
      throw new Error('Actor error');
    };

    const actor = system.createActor('supervised-actor', behavior, {
      supervised: true
    });

    await actor.send({ type: 'FAIL' });
  });

  test('should timeout on slow actors', async () => {
    const behavior = jest.fn(async () => {
      return new Promise(r => setTimeout(r, 10000));
    });

    const actor = system.createActor('timeout-test', behavior, {
      timeout: 100
    });

    await expect(actor.send({ type: 'SLOW' })).rejects.toThrow('timeout');
  });
});
