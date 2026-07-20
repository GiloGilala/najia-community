CREATE TABLE "officials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"jurisdiction_id" uuid NOT NULL,
	"term_starts_at" timestamp with time zone NOT NULL,
	"term_ends_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "confidence_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"official_id" uuid NOT NULL,
	"voter_id" uuid NOT NULL,
	"option" text NOT NULL,
	"quarter" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "officials" ADD CONSTRAINT "officials_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confidence_votes" ADD CONSTRAINT "confidence_votes_official_id_officials_id_fk" FOREIGN KEY ("official_id") REFERENCES "public"."officials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confidence_votes" ADD CONSTRAINT "confidence_votes_voter_id_users_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "confidence_votes_official_voter_quarter_unique" ON "confidence_votes" USING btree ("official_id","voter_id","quarter");