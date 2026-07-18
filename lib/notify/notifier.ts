/**
 * Notifier collaborator for delivering one-time codes.
 *
 * Production delivers by email/SMS; tests inject a fake that captures the code
 * so it can be confirmed within the same test. This keeps contact delivery out
 * of the service's business logic and the test's critical path.
 */
export interface Notifier {
  /** Send the one-time verification `code` to the user's channel. */
  sendCode(args: { userId: string; channel: "email" | "phone"; code: string }): Promise<void>;
}

/** Captures emitted codes; used in tests to recover the code for confirmation. */
export class CapturingNotifier implements Notifier {
  public lastCode: string | null = null;
  public lastUserId: string | null = null;

  async sendCode(args: { userId: string; channel: "email" | "phone"; code: string }): Promise<void> {
    this.lastCode = args.code;
    this.lastUserId = args.userId;
  }
}
