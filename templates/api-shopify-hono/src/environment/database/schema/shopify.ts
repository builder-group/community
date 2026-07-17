import { boolean, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

/**
 * Represents this app's installation state for one Shopify shop, including its lifecycle and
 * last-known granted scopes.
 */
export const shopifyInstallationTable = pgTable(
	'shopify_installation',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		// Permanent Shopify-assigned *.myshopify.com domain used to address the shop's Admin API
		shopDomain: text('shop_domain').notNull(),

		// Last-known scopes granted to the app for this shop
		grantedScopes: text('granted_scopes').array().notNull(),
		// Start of the current lifecycle; reset when the app is reinstalled
		installedAt: timestamp('installed_at', { mode: 'date', withTimezone: true })
			.defaultNow()
			.notNull(),
		// End of the current lifecycle; null while the installation is active
		uninstalledAt: timestamp('uninstalled_at', { mode: 'date', withTimezone: true }),

		updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
		createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull()
	},
	(table) => [uniqueIndex('shopify_installation_shop_domain_unique').on(table.shopDomain)]
);

/**
 * Represents the current expiring offline Admin API credential for one Shopify installation.
 *
 * https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/offline-access-tokens
 */
export const shopifyOfflineTokenTable = pgTable('shopify_offline_token', {
	shopifyInstallationId: uuid('shopify_installation_id')
		.primaryKey()
		.references(() => shopifyInstallationTable.id, { onDelete: 'cascade' }),

	accessToken: text('access_token').notNull(),
	accessTokenExpiresAt: timestamp('access_token_expires_at', {
		mode: 'date',
		withTimezone: true
	}).notNull(),
	// Scopes granted to this credential when it was issued
	scopes: text('scopes').array().notNull(),
	refreshToken: text('refresh_token').notNull(),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
		mode: 'date',
		withTimezone: true
	}).notNull(),

	updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
	createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull()
});

/**
 * Represents the last-known profile of a Shopify admin user within one installation.
 */
export const shopifyUserTable = pgTable(
	'shopify_user',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		shopifyInstallationId: uuid('shopify_installation_id')
			.notNull()
			.references(() => shopifyInstallationTable.id, { onDelete: 'cascade' }),

		shopifyId: text('shopify_id').notNull(),
		firstName: text('first_name').notNull(),
		lastName: text('last_name').notNull(),
		email: text('email').notNull(),
		emailVerified: boolean('email_verified').notNull(),
		accountOwner: boolean('account_owner').notNull(),
		locale: text('locale').notNull(),
		collaborator: boolean('collaborator').notNull(),

		updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
		createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		uniqueIndex('shopify_user_installation_shopify_id_unique').on(
			table.shopifyInstallationId,
			table.shopifyId
		)
	]
);

/**
 * Represents the current online Admin API credential associated with one Shopify user.
 *
 * https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/online-access-tokens
 */
export const shopifyOnlineTokenTable = pgTable('shopify_online_token', {
	shopifyUserId: uuid('shopify_user_id')
		.primaryKey()
		.references(() => shopifyUserTable.id, { onDelete: 'cascade' }),

	accessToken: text('access_token').notNull(),
	accessTokenExpiresAt: timestamp('access_token_expires_at', {
		mode: 'date',
		withTimezone: true
	}).notNull(),
	// App scopes granted to this credential when it was issued
	scopes: text('scopes').array().notNull(),
	// Effective subset available under the Shopify user's permissions
	associatedUserScopes: text('associated_user_scopes').array().notNull(),

	updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
	createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull()
});
