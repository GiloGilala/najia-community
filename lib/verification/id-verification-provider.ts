/**
 * Identity-verification provider seam.
 *
 * The platform delegates government-ID checks to an external provider
 * (Jumio/Onfido in production). The seam keeps the provider swappable and
 * faked in tests. Only a boolean result + optional reason cross this boundary;
 * the raw government ID must never be persisted by the platform (doc 6.6.3),
 * though it is passed transiently to the provider call.
 */
export interface IdVerificationResult {
  verified: boolean;
  /** Present when verification fails; safe to surface to the user. */
  reason?: string;
}

export interface IdVerificationProvider {
  verify(args: {
    governmentId: string;
    /** Channel hint for the call. */
    channel: "email" | "phone";
  }): Promise<IdVerificationResult>;
}

/** Test fake with programmable outcomes. */
export class FakeIdVerificationProvider implements IdVerificationProvider {
  /** When set, every call returns this result. */
  public nextResult: IdVerificationResult = { verified: true };
  /** Records the last government ID passed to verify(), for assertions. */
  public lastGovernmentId: string | null = null;

  async verify(args: { governmentId: string }): Promise<IdVerificationResult> {
    this.lastGovernmentId = args.governmentId;
    return this.nextResult;
  }
}
