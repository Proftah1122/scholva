import type { UUID } from "@scholva/shared-types";

export interface DomainEvent<TPayload extends object = object> {
  readonly id: UUID;
  readonly name: string;
  readonly occurredAt: Date;
  readonly payload: TPayload;
}

export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
}
