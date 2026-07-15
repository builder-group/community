import { and, eq, exists, isNull, lte, sql } from 'drizzle-orm';
import { Err, Ok, type TResult } from 'tuple-result';
import {
	db,
	shopifyInstallationTable,
	shopifyOfflineTokenTable,
	shopifyUserTable
} from '@/environment';
import { AppError } from '@/modules/error';
import type { TShopifyOfflineToken } from './offline-token';

export async function loadShopifyOfflineToken(
	shop: string
): Promise<TResult<TStoredShopifyOfflineToken | null, AppError>> {
	try {
		const rows = await db
			.select({
				shopifyInstallationId: shopifyInstallationTable.id,
				shop: shopifyInstallationTable.shopDomain,
				grantedScopes: shopifyInstallationTable.grantedScopes,
				accessToken: shopifyOfflineTokenTable.accessToken,
				accessTokenExpiresAt: shopifyOfflineTokenTable.accessTokenExpiresAt,
				refreshToken: shopifyOfflineTokenTable.refreshToken,
				refreshTokenExpiresAt: shopifyOfflineTokenTable.refreshTokenExpiresAt
			})
			.from(shopifyInstallationTable)
			.innerJoin(
				shopifyOfflineTokenTable,
				eq(shopifyOfflineTokenTable.shopifyInstallationId, shopifyInstallationTable.id)
			)
			.where(
				and(
					eq(shopifyInstallationTable.shopDomain, shop),
					isNull(shopifyInstallationTable.uninstalledAt)
				)
			)
			.limit(1);

		return Ok(rows[0] ?? null);
	} catch (cause) {
		return Err(
			new AppError('#ERR_SHOPIFY_TOKEN_STORE_UNAVAILABLE', {
				status: 503,
				title: 'Service Unavailable',
				detail: 'The Shopify offline access token could not be loaded',
				cause
			})
		);
	}
}

export interface TStoredShopifyOfflineToken extends TShopifyOfflineToken {
	grantedScopes: string[];
	refreshToken: string;
	refreshTokenExpiresAt: Date;
}

/** Stores an exchanged offline token and creates or reactivates its Shopify installation. */
export async function storeExchangedShopifyOfflineToken(
	input: TStoreShopifyOfflineTokenInput
): Promise<TResult<TShopifyOfflineToken, AppError>> {
	const { shop, scopes, accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt } =
		input;
	const now = new Date();

	try {
		const shopifyInstallationId = await db.transaction(async (transaction) => {
			const installations = await transaction
				.insert(shopifyInstallationTable)
				.values({ shopDomain: shop, grantedScopes: scopes })
				.onConflictDoUpdate({
					target: shopifyInstallationTable.shopDomain,
					set: {
						grantedScopes: scopes,
						installedAt: sql`case when ${shopifyInstallationTable.uninstalledAt} is null then ${shopifyInstallationTable.installedAt} else now() end`,
						uninstalledAt: null,
						updatedAt: now
					}
				})
				.returning({ id: shopifyInstallationTable.id });
			const installation = installations[0];
			if (installation == null) {
				throw new Error('Shopify installation upsert returned no row');
			}

			await transaction
				.insert(shopifyOfflineTokenTable)
				.values({
					shopifyInstallationId: installation.id,
					accessToken,
					accessTokenExpiresAt,
					scopes,
					refreshToken,
					refreshTokenExpiresAt
				})
				.onConflictDoUpdate({
					target: shopifyOfflineTokenTable.shopifyInstallationId,
					set: {
						accessToken,
						accessTokenExpiresAt,
						scopes,
						refreshToken,
						refreshTokenExpiresAt,
						updatedAt: now
					}
				});

			return installation.id;
		});

		return Ok({
			shopifyInstallationId,
			shop,
			accessToken,
			accessTokenExpiresAt
		});
	} catch (cause) {
		return Err(
			new AppError('#ERR_SHOPIFY_TOKEN_STORE_FAILED', {
				status: 503,
				title: 'Service Unavailable',
				detail: 'The Shopify offline access token could not be stored',
				cause
			})
		);
	}
}

interface TStoreShopifyOfflineTokenInput {
	shop: string;
	scopes: string[];
	accessToken: string;
	accessTokenExpiresAt: Date;
	refreshToken: string;
	refreshTokenExpiresAt: Date;
}

/**
 * Rotates an existing offline token without creating or reactivating its installation.
 * Rejects the refresh result if the installation or credential changed before persistence.
 */
export async function rotateShopifyOfflineToken(
	input: TRotateShopifyOfflineTokenInput
): Promise<TResult<TShopifyOfflineToken, AppError>> {
	const {
		shopifyInstallationId,
		shop,
		previousRefreshToken,
		scopes,
		accessToken,
		accessTokenExpiresAt,
		refreshToken,
		refreshTokenExpiresAt
	} = input;
	const now = new Date();

	try {
		const tokens = await db
			.update(shopifyOfflineTokenTable)
			.set({
				accessToken,
				accessTokenExpiresAt,
				scopes,
				refreshToken,
				refreshTokenExpiresAt,
				updatedAt: now
			})
			.where(
				and(
					eq(shopifyOfflineTokenTable.shopifyInstallationId, shopifyInstallationId),
					eq(shopifyOfflineTokenTable.refreshToken, previousRefreshToken),
					exists(
						db
							.select({ id: shopifyInstallationTable.id })
							.from(shopifyInstallationTable)
							.where(
								and(
									eq(shopifyInstallationTable.id, shopifyInstallationId),
									isNull(shopifyInstallationTable.uninstalledAt)
								)
							)
					)
				)
			)
			.returning({ shopifyInstallationId: shopifyOfflineTokenTable.shopifyInstallationId });
		const token = tokens[0];
		if (token == null) {
			return Err(
				new AppError('#ERR_SHOPIFY_TOKEN_ROTATION_CONFLICT', {
					status: 503,
					title: 'Service Unavailable',
					detail: 'The Shopify offline access token changed while it was being refreshed'
				})
			);
		}

		return Ok({
			shopifyInstallationId: token.shopifyInstallationId,
			shop,
			accessToken,
			accessTokenExpiresAt
		});
	} catch (cause) {
		return Err(
			new AppError('#ERR_SHOPIFY_TOKEN_ROTATION_FAILED', {
				status: 503,
				title: 'Service Unavailable',
				detail: 'The Shopify offline access token could not be rotated',
				cause
			})
		);
	}
}

interface TRotateShopifyOfflineTokenInput extends TStoreShopifyOfflineTokenInput {
	shopifyInstallationId: string;
	previousRefreshToken: string;
}

/** Invalidates a rejected offline access token only if it remains current for the installation. */
export async function invalidateShopifyOfflineAccessToken(
	shopifyInstallationId: string,
	rejectedAccessToken: string
): Promise<TResult<void, AppError>> {
	const now = new Date();

	try {
		await db
			.update(shopifyOfflineTokenTable)
			.set({ accessTokenExpiresAt: now, updatedAt: now })
			.where(
				and(
					eq(shopifyOfflineTokenTable.shopifyInstallationId, shopifyInstallationId),
					// Note: This match makes the update a no-op if another request already stored a replacement token
					eq(shopifyOfflineTokenTable.accessToken, rejectedAccessToken)
				)
			);
		return Ok(undefined);
	} catch (cause) {
		return Err(
			new AppError('#ERR_SHOPIFY_ACCESS_TOKEN_INVALIDATION_FAILED', {
				status: 503,
				title: 'Service Unavailable',
				detail: 'The Shopify offline access token could not be invalidated',
				cause
			})
		);
	}
}

/**
 * Ends the current installation lifecycle and removes its credentials and Shopify user data.
 * Retains the installation record until Shopify requests shop redaction.
 */
export async function uninstallShopifyInstallation(
	shop: string,
	triggeredAt: Date
): Promise<TResult<void, AppError>> {
	try {
		await db.transaction(async (transaction) => {
			const installations = await transaction
				.update(shopifyInstallationTable)
				.set({ uninstalledAt: triggeredAt, updatedAt: new Date() })
				.where(
					and(
						eq(shopifyInstallationTable.shopDomain, shop),
						lte(shopifyInstallationTable.installedAt, triggeredAt)
					)
				)
				.returning({ id: shopifyInstallationTable.id });
			const installation = installations[0];
			if (installation == null) {
				return;
			}

			await transaction
				.delete(shopifyOfflineTokenTable)
				.where(eq(shopifyOfflineTokenTable.shopifyInstallationId, installation.id));
			await transaction
				.delete(shopifyUserTable)
				.where(eq(shopifyUserTable.shopifyInstallationId, installation.id));
		});
		return Ok(undefined);
	} catch (cause) {
		return Err(
			new AppError('#ERR_SHOPIFY_INSTALLATION_UNINSTALL_FAILED', {
				status: 503,
				title: 'Service Unavailable',
				detail: 'The Shopify installation could not be uninstalled',
				cause
			})
		);
	}
}

/** Updates grants for an active installation when the scope event belongs to its current lifecycle. */
export async function updateShopifyInstallationScopes(
	shop: string,
	grantedScopes: string[],
	scopesUpdatedAt: Date
): Promise<TResult<void, AppError>> {
	try {
		await db
			.update(shopifyInstallationTable)
			.set({ grantedScopes: [...grantedScopes].sort(), updatedAt: new Date() })
			.where(
				and(
					eq(shopifyInstallationTable.shopDomain, shop),
					isNull(shopifyInstallationTable.uninstalledAt),
					lte(shopifyInstallationTable.installedAt, scopesUpdatedAt)
				)
			);
		return Ok(undefined);
	} catch (cause) {
		return Err(
			new AppError('#ERR_SHOPIFY_INSTALLATION_SCOPE_UPDATE_FAILED', {
				status: 503,
				title: 'Service Unavailable',
				detail: 'The Shopify installation scopes could not be updated',
				cause
			})
		);
	}
}

/** Permanently removes the installation and its associated credential and user records. */
export async function redactShopifyInstallation(
	shop: string,
	triggeredAt: Date
): Promise<TResult<void, AppError>> {
	try {
		await db
			.delete(shopifyInstallationTable)
			.where(
				and(
					eq(shopifyInstallationTable.shopDomain, shop),
					lte(shopifyInstallationTable.installedAt, triggeredAt)
				)
			);
		return Ok(undefined);
	} catch (cause) {
		return Err(
			new AppError('#ERR_SHOPIFY_INSTALLATION_REDACTION_FAILED', {
				status: 503,
				title: 'Service Unavailable',
				detail: 'The Shopify installation could not be redacted',
				cause
			})
		);
	}
}
