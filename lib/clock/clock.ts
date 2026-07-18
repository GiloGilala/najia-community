/**
 * Clock collaborator.
 *
 * All timestamps written by the services layer (upload time, audit-event time)
 * come from an injected {@link Clock} so that tests can assert on deterministic
 * times. Production code uses {@link systemClock}.
 */
export interface Clock {
  now(): Date;
}

/** Production clock backed by the system time. */
export const systemClock: Clock = {
  now: () => new Date(),
};

/**
 * Test clock returning a fixed instant. Call {@link FixedClock.set} to advance
 * time between steps of a test.
 */
export class FixedClock implements Clock {
  private current: Date;

  constructor(initial: Date) {
    this.current = new Date(initial.getTime());
  }

  now(): Date {
    return new Date(this.current.getTime());
  }

  set(next: Date): void {
    this.current = new Date(next.getTime());
  }

  /** Advance the clock by a number of milliseconds. */
  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}
