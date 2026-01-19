import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent, EventBusPort } from './event-bus.port';

@Injectable()
export class NestEventBusService implements EventBusPort {
  constructor(private readonly emitter: EventEmitter2) {}

  async publish<TPayload>(event: DomainEvent<TPayload>): Promise<void> {
    await this.emitter.emitAsync(event.name, event.payload);
  }
}
