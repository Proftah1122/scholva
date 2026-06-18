import type { Clock } from "../../application/ports/auth.port.js";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
