CREATE TABLE "lawyer_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lawyer_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"anonymous" boolean DEFAULT false NOT NULL,
	"moderated" boolean DEFAULT false NOT NULL,
	"response" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lawyer_reviews" ADD CONSTRAINT "lawyer_reviews_lawyer_id_lawyers_user_id_fk" FOREIGN KEY ("lawyer_id") REFERENCES "public"."lawyers"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_reviews" ADD CONSTRAINT "lawyer_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lawyer_reviews_lawyer_reviewer_unique" ON "lawyer_reviews" USING btree ("lawyer_id","reviewer_id");