CREATE TABLE "moderation_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"content_type" text NOT NULL,
	"content_id" text NOT NULL,
	"reported_by" uuid,
	"reported_at" timestamp with time zone NOT NULL,
	"reason" text NOT NULL,
	"priority" text NOT NULL,
	"status" text NOT NULL,
	"assigned_to" uuid,
	"assigned_at" timestamp with time zone,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"resolution" text,
	"resolution_notes" text,
	"is_automated" boolean DEFAULT false NOT NULL,
	"ai_confidence" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"queue_item_id" text,
	"action_type" text NOT NULL,
	"actioned_by" uuid,
	"actioned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"details" text,
	"ip_address" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "moderation_appeals" (
	"id" text PRIMARY KEY NOT NULL,
	"moderation_action_id" text NOT NULL,
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
CREATE TABLE "user_warnings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"issued_by" uuid NOT NULL,
	"reason" text NOT NULL,
	"severity" text NOT NULL,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_suspensions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"issued_by" uuid NOT NULL,
	"reason" text NOT NULL,
	"type" text NOT NULL,
	"duration" integer,
	"ends_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"can_appeal" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"content_type" text NOT NULL,
	"pattern" text,
	"keywords" text,
	"action" text NOT NULL,
	"severity" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "moderation_rules_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "moderation_queue" ADD CONSTRAINT "moderation_queue_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_queue" ADD CONSTRAINT "moderation_queue_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_queue" ADD CONSTRAINT "moderation_queue_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_queue_item_id_moderation_queue_id_fk" FOREIGN KEY ("queue_item_id") REFERENCES "public"."moderation_queue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_actioned_by_users_id_fk" FOREIGN KEY ("actioned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_moderation_action_id_moderation_actions_id_fk" FOREIGN KEY ("moderation_action_id") REFERENCES "public"."moderation_actions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_appeals" ADD CONSTRAINT "moderation_appeals_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_warnings" ADD CONSTRAINT "user_warnings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_warnings" ADD CONSTRAINT "user_warnings_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_suspensions" ADD CONSTRAINT "user_suspensions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_suspensions" ADD CONSTRAINT "user_suspensions_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_moderation_queue_content" ON "moderation_queue" USING btree ("content_type","content_id");--> statement-breakpoint
CREATE INDEX "idx_moderation_queue_status" ON "moderation_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_moderation_queue_priority" ON "moderation_queue" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_moderation_queue_assigned" ON "moderation_queue" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_moderation_queue_reported_by" ON "moderation_queue" USING btree ("reported_by");--> statement-breakpoint
CREATE INDEX "idx_moderation_queue_created" ON "moderation_queue" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_moderation_actions_queue" ON "moderation_actions" USING btree ("queue_item_id");--> statement-breakpoint
CREATE INDEX "idx_moderation_actions_type" ON "moderation_actions" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "idx_moderation_actions_by" ON "moderation_actions" USING btree ("actioned_by");--> statement-breakpoint
CREATE INDEX "idx_moderation_actions_at" ON "moderation_actions" USING btree ("actioned_at");--> statement-breakpoint
CREATE INDEX "idx_moderation_appeals_action" ON "moderation_appeals" USING btree ("moderation_action_id");--> statement-breakpoint
CREATE INDEX "idx_moderation_appeals_user" ON "moderation_appeals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_moderation_appeals_status" ON "moderation_appeals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_user_warnings_user" ON "user_warnings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_warnings_issued" ON "user_warnings" USING btree ("issued_by");--> statement-breakpoint
CREATE INDEX "idx_user_warnings_active" ON "user_warnings" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_user_suspensions_user" ON "user_suspensions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_suspensions_issued" ON "user_suspensions" USING btree ("issued_by");--> statement-breakpoint
CREATE INDEX "idx_user_suspensions_active" ON "user_suspensions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_moderation_rules_content" ON "moderation_rules" USING btree ("content_type");--> statement-breakpoint
CREATE INDEX "idx_moderation_rules_active" ON "moderation_rules" USING btree ("is_active");
