CREATE TABLE "lawyers" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"bar_number" text NOT NULL,
	"practice_areas" jsonb NOT NULL,
	"licensed_jurisdiction_ids" jsonb NOT NULL,
	"years_practicing" integer NOT NULL,
	"languages" jsonb NOT NULL,
	"pro_bono" boolean DEFAULT false NOT NULL,
	"verification_status" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lawyers" ADD CONSTRAINT "lawyers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lawyers_bar_number_unique" ON "lawyers" USING btree ("bar_number");