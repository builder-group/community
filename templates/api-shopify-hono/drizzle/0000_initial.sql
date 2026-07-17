CREATE TABLE "shopify_installation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_domain" text NOT NULL,
	"granted_scopes" text[] NOT NULL,
	"installed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"uninstalled_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopify_offline_token" (
	"shopify_installation_id" uuid PRIMARY KEY NOT NULL,
	"access_token" text NOT NULL,
	"access_token_expires_at" timestamp with time zone NOT NULL,
	"scopes" text[] NOT NULL,
	"refresh_token" text NOT NULL,
	"refresh_token_expires_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopify_online_token" (
	"shopify_user_id" uuid PRIMARY KEY NOT NULL,
	"access_token" text NOT NULL,
	"access_token_expires_at" timestamp with time zone NOT NULL,
	"scopes" text[] NOT NULL,
	"associated_user_scopes" text[] NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopify_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shopify_installation_id" uuid NOT NULL,
	"shopify_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"account_owner" boolean NOT NULL,
	"locale" text NOT NULL,
	"collaborator" boolean NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shopify_offline_token" ADD CONSTRAINT "shopify_offline_token_shopify_installation_id_shopify_installation_id_fk" FOREIGN KEY ("shopify_installation_id") REFERENCES "public"."shopify_installation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopify_online_token" ADD CONSTRAINT "shopify_online_token_shopify_user_id_shopify_user_id_fk" FOREIGN KEY ("shopify_user_id") REFERENCES "public"."shopify_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopify_user" ADD CONSTRAINT "shopify_user_shopify_installation_id_shopify_installation_id_fk" FOREIGN KEY ("shopify_installation_id") REFERENCES "public"."shopify_installation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "shopify_installation_shop_domain_unique" ON "shopify_installation" USING btree ("shop_domain");--> statement-breakpoint
CREATE UNIQUE INDEX "shopify_user_installation_shopify_id_unique" ON "shopify_user" USING btree ("shopify_installation_id","shopify_id");