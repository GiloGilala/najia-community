CREATE TABLE "evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"uploader_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"sha256_hash" text NOT NULL,
	"storage_key" text NOT NULL,
	"verification_status" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evidence_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"actor_id" uuid,
	"outcome" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "evidence_audit_events" ADD CONSTRAINT "evidence_audit_events_evidence_id_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "evidence_audit_events_evidence_id_idx" ON "evidence_audit_events" USING btree ("evidence_id");