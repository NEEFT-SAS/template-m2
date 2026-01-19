import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EVENT_BUS } from './event-bus.port';
import { NestEventBusService } from './nest-event-bus.service';

@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [{ provide: EVENT_BUS, useClass: NestEventBusService }],
  exports: [EVENT_BUS],
})
export class EventsModule {}
