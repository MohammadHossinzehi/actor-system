# Actor System

A production-grade event-driven actor model implementation in TypeScript with backpressure handling, supervision strategies, and async message passing for building concurrent, fault-tolerant systems.

## Overview

This library implements the Actor Model, a powerful concurrency abstraction that treats computation entities as actors that communicate exclusively through asynchronous message passing. Each actor maintains isolated state and processes messages sequentially from a queue, providing a clean and scalable approach to concurrent programming.

## Features

- **Message-Driven**: Actors process messages asynchronously from a queue
- **Backpressure Handling**: Automatic queue overflow detection and backpressure signaling to prevent unbounded growth
- **Supervision**: Built-in error handling and supervision for fault tolerance
- **Timeouts**: Configurable message processing timeouts to prevent hung actors
- **Async/Await**: Full TypeScript async/await support for message handlers
- **Type-Safe**: Fully typed with TypeScript for compile-time safety
- **Broadcasting**: Send messages to multiple actors simultaneously
- **Zero External Dependencies**: Lightweight implementation without external dependencies

## Installation

```bash
npm install actor-system
```

## Quick Start

```typescript
import { ActorSystem } from 'actor-system';

// Create an actor system
const system = new ActorSystem();

// Define actor behavior
const counterBehavior = async (msg: any, state: any) => {
  switch (msg.type) {
    case 'INCREMENT':
      return { count: (state.count || 0) + 1 };
    case 'GET':
      return state;
    default:
      return state;
  }
};

// Create an actor
const counter = system.createActor('counter', counterBehavior);

// Send messages
await counter.send({ type: 'INCREMENT' });
await counter.send({ type: 'INCREMENT' });
await counter.send({ type: 'GET' });
```

## API Documentation

### ActorSystem

```typescript
class ActorSystem {
  createActor(name: string, behavior: ActorBehavior, config?: ActorConfig): ActorRef
  getActor(name: string): ActorRef | undefined
  broadcast(msg: Message): Promise<void>
  shutdown(): void
}
```

### ActorRef

```typescript
class ActorRef {
  send(msg: Message): Promise<void>
  isBackpressured(): boolean
  getQueueLength(): number
}
```

### ActorConfig

```typescript
interface ActorConfig {
  maxQueueSize?: number      // Default: 1000
  timeout?: number            // Default: 5000ms
  supervised?: boolean        // Default: false
}
```

## Design Decisions

### Sequential Message Processing

Each actor processes one message at a time from its queue, ensuring state consistency without requiring locks or synchronization primitives. This simplifies reasoning about actor behavior and eliminates data races.

### Backpressure Mechanism

When an actor's queue reaches its maximum size (default 1000 messages), the system raises a backpressure error to signal that the actor cannot keep up. This prevents memory exhaustion in high-load scenarios and forces upstream callers to slow down.

### Supervision Strategy

Actors with supervision enabled automatically catch and log errors without terminating. The actor continues processing subsequent messages, implementing a "fail and recover" strategy suitable for production systems.

### Timeout Protection

Configurable timeouts (default 5 seconds) prevent hung message handlers from blocking other actors. Exceeded timeouts throw an error and are logged, allowing the actor to continue.

## Testing

```bash
npm test
```

The test suite includes:
- Message queueing and ordering
- Backpressure scenarios
- Timeout handling
- Broadcasting
- Error supervision
- Queue length tracking

## Performance Considerations

- **O(1) Message Send**: Adding to queue is constant time
- **Sequential Processing**: No parallelism within an actor, but full parallelism across actors
- **Memory Efficient**: Queue size is bounded, preventing unbounded memory growth
- **Low Latency**: No external I/O or blocking operations in the core loop

## Real-World Use Cases

1. **Event Processing**: Process high-volume event streams with backpressure
2. **State Machines**: Model complex workflows as supervised actors
3. **Request Routing**: Route requests to specialized handler actors
4. **Rate Limiting**: Implement rate limiting through actor queue sizing
5. **Distributed Tracing**: Coordinate spans across asynchronous boundaries

## Architecture

The actor system is built on three core abstractions:

1. **ActorRef**: The public interface for sending messages to an actor
2. **ActorSystem**: The container managing actor lifecycle
3. **Message Queue**: Internal FIFO queue with backpressure detection

Each actor maintains:
- Isolated state object
- Exclusive message queue
- Behavior function (message + state => new state)
- Processing status and configuration

## Contributing

Contributions are welcome! The codebase follows strict TypeScript compilation settings and includes comprehensive test coverage.

## License

MIT

---

Built for hiring managers who appreciate clean concurrent architecture and production-grade software design.
