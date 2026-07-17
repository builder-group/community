import { and, eq, exists, isNull, lt, lte, or, sql } from 'drizzle-orm';
import { Err, Ok, type TResult } from 'tuple-result';
import {
	db,
	shopifyInstallationTable,
	shopifyOfflineTokenTable,
	shopifyOnlineTokenTable,
	shopifyUserTable
} from '@/environment';
import { AppError } from '@/modules/error';
import type { TShopifyOfflineToken, TShopifyOnlineToken, TShopifyUser } from './admin/token';

export async function loadShopifyOfflineToken(
	shop: string
): Promise<TResult<TStoredShopifyOfflineToken | null, AppError>> {
	try {
		const rows = await db
			.select({
				installationId: shopifyInstallationTable.id,
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

export async function loadShopifyOnlineToken(
	installationId: string,
	shopifyUserId: string
): Promise<TResult<TShopifyOnlineToken | null, AppError>> {
	try {
		const rows = await db
			.select({
				installationId: shopifyInstallationTable.id,
				shop: shopifyInstallationTable.shopDomain,
				shopifyUser: {
					id: shopifyUserTable.id,
					shopifyId: shopifyUserTable.shopifyId,
					firstName: shopifyUserTable.firstName,
					lastName: shopifyUserTable.lastName,
					email: shopifyUserTable.email,
					emailVerified: shopifyUserTable.emailVerified,
					accountOwner: shopifyUserTable.accountOwner,
					locale: shopifyUserTable.locale,
					collaborator: shopifyUserTable.collaborator
				},
				accessToken: shopifyOnlineTokenTable.accessToken,
				accessTokenExpiresAt: shopifyOnlineTokenTable.accessTokenExpiresAt,
				scopes: shopifyOnlineTokenTable.scopes,
				associatedUserScopes: shopifyOnlineTokenTable.associatedUserScopes
			})
			.from(shopifyInstallationTable)
			.innerJoin(
				shopifyUserTable,
				eq(shopifyUserTable.shopifyInstallationId, shopifyInstallationTable.id)
			)
			.innerJoin(
				shopifyOnlineTokenTable,
				eq(shopifyOnlineTokenTable.shopifyUserId, shopifyUserTable.id)
			)
			.where(
				and(
					eq(shopifyInstallationTable.id, installationId),
					eq(shopifyUserTable.shopifyId, shopifyUserId),
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
				detail: 'The Shopify online access token could not be loaded',
				cause
			})
		);
	}
}

/** Stores an exchanged offline token and creates or reactivates its Shopify installation. */
export async function storeExchangedShopifyOfflineToken(
	input: TStoreExchangedShopifyOfflineTokenInput
): Promise<TResult<TShopifyOfflineToken, AppError>> {
	const {
		shop,
		scopes,
		accessToken,
		accessTokenExpiresAt,
		refreshToken,
		refreshTokenExpiresAt,
		sessionTokenIssuedAt
	} = input;
	const now = new Date();

	try {
		const installationId = await db.transaction(async (transaction) => {
			const installations = await transaction
				.insert(shopifyInstallationTable)
				.values({
					shopDomain: shop,
					grantedScopes: scopes,
					installedAt: sessionTokenIssuedAt
				})
				.onConflictDoUpdate({
					target: shopifyInstallationTable.shopDomain,
					set: {
						grantedScopes: scopes,
						// Note: Keep the original installation time while the app remains installed. After
						// a reinstall, reset it so webhooks from the previous installation can be ignored.
						installedAt: sql`case when ${shopifyInstallationTable.uninstalledAt} is null then ${shopifyInstallationTable.installedAt} else ${sessionTokenIssuedAt} end`,
						uninstalledAt: null,
						updatedAt: now
					},
					// Note: Only a session issued during the current lifecycle or after its uninstall
					// may store a replacement credential
					setWhere: or(
						and(
							isNull(shopifyInstallationTable.uninstalledAt),
							lte(shopifyInstallationTable.installedAt, sessionTokenIssuedAt)
						),
						lt(shopifyInstallationTable.uninstalledAt, sessionTokenIssuedAt)
					)
				})
				.returning({ id: shopifyInstallationTable.id });
			const installation = installations[0];
			if (installation == null) {
				return null;
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
		if (installationId == null) {
			return Err(
				new AppError('#ERR_SHOPIFY_SESSION_TOKEN_INVALID', {
					status: 401,
					title: 'Unauthorized',
					detail: 'The Shopify session token is no longer valid for this installation'
				})
			);
		}

		return Ok({
			installationId,
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

interface TStoreExchangedShopifyOfflineTokenInput extends TStoreShopifyOfflineTokenInput {
	sessionTokenIssuedAt: Date;
}

interface TStoreShopifyOfflineTokenInput {
	shop: string;
	scopes: string[];
	accessToken: string;
	accessTokenExpiresAt: Date;
	refreshToken: string;
	refreshTokenExpiresAt: Date;
}

/** Stores an exchanged online token and updates its Shopify user profile. */
export async function storeExchangedShopifyOnlineToken(
	input: TStoreExchangedShopifyOnlineTokenInput
): Promise<TResult<TShopifyOnlineToken, AppError>> {
	const {
		installationId,
		shop,
		shopifyUser,
		accessToken,
		accessTokenExpiresAt,
		scopes,
		associatedUserScopes,
		sessionTokenIssuedAt
	} = input;
	const now = new Date();

	try {
		const userId = await db.transaction(async (transaction) => {
			const installations = await transaction
				.select({ id: shopifyInstallationTable.id })
				.from(shopifyInstallationTable)
				.where(
					and(
						eq(shopifyInstallationTable.id, installationId),
						eq(shopifyInstallationTable.shopDomain, shop),
						isNull(shopifyInstallationTable.uninstalledAt),
						lte(shopifyInstallationTable.installedAt, sessionTokenIssuedAt)
					)
				)
				.for('update');
			if (installations[0] == null) {
				return null;
			}

			const users = await transaction
				.insert(shopifyUserTable)
				.values({
					shopifyInstallationId: installationId,
					shopifyId: shopifyUser.shopifyId,
					firstName: shopifyUser.firstName,
					lastName: shopifyUser.lastName,
					email: shopifyUser.email,
					emailVerified: shopifyUser.emailVerified,
					accountOwner: shopifyUser.accountOwner,
					locale: shopifyUser.locale,
					collaborator: shopifyUser.collaborator
				})
				.onConflictDoUpdate({
					target: [shopifyUserTable.shopifyInstallationId, shopifyUserTable.shopifyId],
					set: {
						firstName: shopifyUser.firstName,
						lastName: shopifyUser.lastName,
						email: shopifyUser.email,
						emailVerified: shopifyUser.emailVerified,
						accountOwner: shopifyUser.accountOwner,
						locale: shopifyUser.locale,
						collaborator: shopifyUser.collaborator,
						updatedAt: now
					}
				})
				.returning({ id: shopifyUserTable.id });
			const storedUser = users[0];
			if (storedUser == null) {
				throw new Error('Shopify user upsert returned no row');
			}

			await transaction
				.insert(shopifyOnlineTokenTable)
				.values({
					shopifyUserId: storedUser.id,
					accessToken,
					accessTokenExpiresAt,
					scopes,
					associatedUserScopes
				})
				.onConflictDoUpdate({
					target: shopifyOnlineTokenTable.shopifyUserId,
					set: {
						accessToken,
						accessTokenExpiresAt,
						scopes,
						associatedUserScopes,
						updatedAt: now
					}
				});

			return storedUser.id;
		});
		if (userId == null) {
			return Err(
				new AppError('#ERR_SHOPIFY_SESSION_TOKEN_INVALID', {
					status: 401,
					title: 'Unauthorized',
					detail: 'The Shopify session token is no longer valid for this installation'
				})
			);
		}

		return Ok({
			installationId,
			shop,
			shopifyUser: {
				id: userId,
				...shopifyUser
			},
			accessToken,
			accessTokenExpiresAt,
			scopes,
			associatedUserScopes
		});
	} catch (cause) {
		return Err(
			new AppError('#ERR_SHOPIFY_TOKEN_STORE_FAILED', {
				status: 503,
				title: 'Service Unavailable',
				detail: 'The Shopify online access token could not be stored',
				cause
			})
		);
	}
}

interface TStoreExchangedShopifyOnlineTokenInput extends TStoreShopifyOnlineTokenInput {
	sessionTokenIssuedAt: Date;
}

interface TStoreShopifyOnlineTokenInput {
	installationId: string;
	shop: string;
	shopifyUser: Omit<TShopifyUser, 'id'>;
	accessToken: string;
	accessTokenExpiresAt: Date;
	scopes: string[];
	associatedUserScopes: string[];
}

/**
 * Rotates an offline token only while the app remains installed and the stored refresh token
 * still matches.
 */
export async function rotateShopifyOfflineToken(
	input: TRotateShopifyOfflineTokenInput
): Promise<TResult<TShopifyOfflineToken, AppError>> {
	const {
		installationId,
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
					eq(shopifyOfflineTokenTable.shopifyInstallationId, installationId),
					eq(shopifyOfflineTokenTable.refreshToken, previousRefreshToken),
					exists(
						db
							.select({ id: shopifyInstallationTable.id })
							.from(shopifyInstallationTable)
							.where(
								and(
									eq(shopifyInstallationTable.id, installationId),
									isNull(shopifyInstallationTable.uninstalledAt)
								)
							)
					)
				)
			)
			.returning({ installationId: shopifyOfflineTokenTable.shopifyInstallationId });
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
			installationId: token.installationId,
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
	installationId: string;
	previousRefreshToken: string;
}

/** Marks a rejected offline access token as expired only if the same token is still stored. */
export async function invalidateShopifyOfflineAccessToken(
	installationId: string,
	rejectedAccessToken: string
): Promise<TResult<void, AppError>> {
	const now = new Date();

	try {
		await db
			.update(shopifyOfflineTokenTable)
			.set({ accessTokenExpiresAt: now, updatedAt: now })
			.where(
				and(
					eq(shopifyOfflineTokenTable.shopifyInstallationId, installationId),
					// Note: Matching the rejected token prevents this request from invalidating a newer
					// token
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

/** Marks a rejected online access token as expired only if the same token is still stored. */
export async function invalidateShopifyOnlineAccessToken(
	userId: string,
	rejectedAccessToken: string
): Promise<TResult<void, AppError>> {
	const now = new Date();

	try {
		await db
			.update(shopifyOnlineTokenTable)
			.set({ accessTokenExpiresAt: now, updatedAt: now })
			.where(
				and(
					eq(shopifyOnlineTokenTable.shopifyUserId, userId),
					// Note: Matching the rejected token prevents this request from invalidating a newer
					// token
					eq(shopifyOnlineTokenTable.accessToken, rejectedAccessToken)
				)
			);
		return Ok(undefined);
	} catch (cause) {
		return Err(
			new AppError('#ERR_SHOPIFY_ACCESS_TOKEN_INVALIDATION_FAILED', {
				status: 503,
				title: 'Service Unavailable',
				detail: 'The Shopify online access token could not be invalidated',
				cause
			})
		);
	}
}

/**
 * Marks the app as uninstalled and removes its credentials and Shopify user data.
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

/**
 * Updates scopes only when the app remains installed and the event was triggered after the
 * installation began.
 */
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
