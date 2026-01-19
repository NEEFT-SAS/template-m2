export const EVENT_BUS = Symbol('EVENT_BUS');

export type DomainEvent<TPayload = unknown> = {
  name: string;
  payload: TPayload;
};

export interface EventBusPort {
  publish<TPayload>(event: DomainEvent<TPayload>): Promise<void>;
}
