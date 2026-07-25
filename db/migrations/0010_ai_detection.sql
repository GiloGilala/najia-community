CREATE TABLE "ai_detection_results" (
	"id" text PRIMARY KEY NOT NULL,
	"evidence_id" uuid NOT NULL,
	"detection_type" text NOT NULL,
	"confidence_score" integer NOT NULL,
	"category" text NOT NULL,
	"model_version" text NOT NULL,
	"model_thresholds" text,
	"detection_methods" text NOT NULL,
	"is_flagged" boolean DEFAULT false NOT NULL,
	"flag_reason" text,
	"detected_at" timestamp with time zone NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_decision" text,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_detection_method_results" (
	"id" text PRIMARY KEY NOT NULL,
	"detection_result_id" text NOT NULL,
	"method" text NOT NULL,
	"confidence" integer NOT NULL,
	"findings" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_detection_models" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"provider" text NOT NULL,
	"api_endpoint" text,
	"api_key_encrypted" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"capabilities" text NOT NULL,
	"cost_per_request" numeric,
	"rate_limit_per_minute" integer,
	"config" text,
	"last_tested_at" timestamp with time zone,
	"last_test_result" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_detection_models_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "ai_detection_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"evidence_id" uuid NOT NULL,
	"priority" text NOT NULL,
	"status" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"assigned_to" text,
	"assigned_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_detection_appeals" (
	"id" text PRIMARY KEY NOT NULL,
	"detection_result_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"status" text NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"decision" text,
	"decision_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_detection_results" ADD CONSTRAINT "ai_detection_results_evidence_id_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_detection_results" ADD CONSTRAINT "ai_detection_results_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_detection_method_results" ADD CONSTRAINT "ai_detection_method_results_detection_result_id_ai_detection_results_id_fk" FOREIGN KEY ("detection_result_id") REFERENCES "public"."ai_detection_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_detection_queue" ADD CONSTRAINT "ai_detection_queue_evidence_id_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_detection_appeals" ADD CONSTRAINT "ai_detection_appeals_detection_result_id_ai_detection_results_id_fk" FOREIGN KEY ("detection_result_id") REFERENCES "public"."ai_detection_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_detection_appeals" ADD CONSTRAINT "ai_detection_appeals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_detection_appeals" ADD CONSTRAINT "ai_detection_appeals_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_detection_results_evidence" ON "ai_detection_results" USING btree ("evidence_id");--> statement-breakpoint
CREATE INDEX "idx_ai_detection_results_category" ON "ai_detection_results" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_ai_detection_results_flagged" ON "ai_detection_results" USING btree ("is_flagged");--> statement-breakpoint
CREATE INDEX "idx_ai_detection_results_detected" ON "ai_detection_results" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "idx_ai_detection_results_reviewed" ON "ai_detection_results" USING btree ("reviewed_at");--> statement-breakpoint
CREATE INDEX "idx_ai_detection_method_results_result" ON "ai_detection_method_results" USING btree ("detection_result_id");--> statement-breakpoint
CREATE INDEX "idx_ai_detection_method_results_method" ON "ai_detection_method_results" USING btree ("method");--> statement-breakpoint
CREATE INDEX "idx_ai_detection_models_provider" ON "ai_detection_models" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_ai_detection_models_active" ON "ai_detection_models" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_ai_detection_queue_status" ON "ai_detection_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ai_detection_queue_priority" ON "ai_detection_queue" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_ai_detection_queue_evidence" ON "ai_detection_queue" USING btree ("evidence_id");--> statement-breakpoint
CREATE INDEX "idx_ai_detection_queue_created" ON "ai_detection_queue" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_detection_appeals_result" ON "ai_detection_appeals" USING btree ("detection_result_id");--> statement-breakpoint
CREATE INDEX "idx_ai_detection_appeals_user" ON "ai_detection_appeals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ai_detection_appeals_status" ON "ai_detection_appeals" USING btree ("status");
