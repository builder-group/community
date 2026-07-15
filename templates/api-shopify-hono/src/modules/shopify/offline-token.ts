import {
	AuthScopes,
	HttpResponseError,
	InvalidJwtError,
	RequestedTokenType,
	type Session
} from '@shopify/shopify-api';
import { Err, Ok, type TResult } from 'tuple-result';
import { shopify, shopifyConfig } from '@/environment';
import { AppError } from '@/modules/error';
import {
	loadShopifyOfflineToken,
	rotateShopifyOfflineToken,
	storeExchangedShopifyOfflineToken
} from './repository';

/**
 * Resolves a valid offline Admin API credential and persists refreshed or exchanged credentials.
 * A session token is required when stored credentials cannot be reused or refreshed, or when
 * persisted scope state must be reconciled.
 *
 * https://shopify.dev/docs/apps/build/authentication-authorization/implement-custom-authorization?extension=javascript#token-exchange
 */
export async function resolveShopifyOfflineToken(
	shop: string,
	sessionToken?: string
): Promise<TResult<TShopifyOfflineToken, AppError>> {
	const [isStoredTokenOk, storedTokenErr, storedToken] = await loadShopifyOfflineToken(shop);
	if (!isStoredTokenOk) {
		return Err(storedTokenErr);
	}

	const hasRequiredScopes =
		storedToken != null && new AuthScopes(storedToken.grantedScopes).has(shopifyConfig.scopes);

	// Return a reusable stored offline token
	if (storedToken != null && hasRequiredScopes) {
		const hasSufficientAccessTokenLifetime =
			storedToken.accessTokenExpiresAt.getTime() - shopifyTokenExpiryBufferMs > Date.now();
		if (hasSufficientAccessTokenLifetime) {
			return Ok({
				shopifyInstallationId: storedToken.shopifyInstallationId,
				shop: storedToken.shop,
				accessToken: storedToken.accessToken,
				accessTokenExpiresAt: storedToken.accessTokenExpiresAt
			});
		}
	}

	// Recover a stored offline token through refresh-token rotation
	// Note: Refresh-token rotation preserves background access without an embedded user session
	if (storedToken != null && hasRequiredScopes) {
		const hasSufficientRefreshTokenLifetime =
			storedToken.refreshTokenExpiresAt.getTime() - shopifyTokenExpiryBufferMs > Date.now();
		if (hasSufficientRefreshTokenLifetime) {
			let refreshedSession: Session | null = null;
			try {
				refreshedSession = (
					await shopify.auth.refreshToken({
						shop,
						refreshToken: storedToken.refreshToken
					})
				).session;
			} catch (cause) {
				// Note: Match Shopify's exact response for a definitively invalid refresh token
				// https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/offline-access-tokens#refresh-token-behavior
				const isRefreshTokenDefinitivelyInvalid =
					cause instanceof HttpResponseError &&
					cause.response.code === 401 &&
					cause.response.body?.error === 'invalid_request' &&
					cause.response.body?.error_description ===
						'This request requires an active refresh_token';
				if (!isRefreshTokenDefinitivelyInvalid) {
					const isTokenRefreshRejected = isShopifyRequestRejected(cause);
					if (isTokenRefreshRejected) {
						return Err(
							new AppError('#ERR_SHOPIFY_TOKEN_REFRESH_REJECTED', {
								status: 500,
								title: 'Internal Server Error',
								detail: 'Shopify rejected the offline access token refresh request',
								cause
							})
						);
					}

					// Note: Preserve the stored refresh token so transient failures can retry it
					return Err(
						new AppError('#ERR_SHOPIFY_TOKEN_REFRESH_FAILED', {
							status: 503,
							title: 'Service Unavailable',
							detail: 'The Shopify offline access token could not be refreshed',
							cause
						})
					);
				}
			}

			if (refreshedSession != null) {
				const [isOfflineTokenOk, offlineTokenErr, offlineToken] =
					parseShopifyOfflineSession(refreshedSession);
				if (!isOfflineTokenOk) {
					return Err(offlineTokenErr);
				}

				return rotateShopifyOfflineToken({
					...offlineToken,
					shopifyInstallationId: storedToken.shopifyInstallationId,
					previousRefreshToken: storedToken.refreshToken
				});
			}
		}
	}

	// Note: Token exchange requires an active embedded user session
	if (sessionToken == null) {
		return Err(
			new AppError('#ERR_SHOPIFY_SESSION_TOKEN_REQUIRED', {
				status: 401,
				title: 'Unauthorized',
				detail: 'A Shopify session token is required to acquire a new offline access token'
			})
		);
	}

	// Acquire a new offline token or reconcile stale installation state through token exchange
	let exchangedSession: Session;
	try {
		exchangedSession = (
			await shopify.auth.tokenExchange({
				shop,
				sessionToken,
				requestedTokenType: RequestedTokenType.OfflineAccessToken,
				expiring: shopifyConfig.admin.expiringOfflineAccessTokens
			})
		).session;
	} catch (cause) {
		// Note: Match the invalid-token cases classified by Shopify's official integration
		// https://github.com/Shopify/shopify-app-js/blob/main/packages/apps/shopify-app-react-router/src/server/authenticate/admin/strategies/token-exchange.ts
		const isSessionTokenInvalid =
			cause instanceof InvalidJwtError ||
			(cause instanceof HttpResponseError &&
				cause.response.code === 400 &&
				cause.response.body?.error === 'invalid_subject_token');
		if (isSessionTokenInvalid) {
			return Err(
				new AppError('#ERR_SHOPIFY_SESSION_TOKEN_INVALID', {
					status: 401,
					title: 'Unauthorized',
					detail: 'The Shopify session token could not be verified',
					cause
				})
			);
		}

		const isTokenExchangeRejected = isShopifyRequestRejected(cause);
		if (isTokenExchangeRejected) {
			return Err(
				new AppError('#ERR_SHOPIFY_TOKEN_EXCHANGE_REJECTED', {
					status: 500,
					title: 'Internal Server Error',
					detail: 'Shopify rejected the session token exchange',
					cause
				})
			);
		}

		return Err(
			new AppError('#ERR_SHOPIFY_AUTH_UNAVAILABLE', {
				status: 503,
				title: 'Service Unavailable',
				detail: 'Shopify authentication is temporarily unavailable',
				cause
			})
		);
	}

	const [isOfflineTokenOk, offlineTokenErr, offlineToken] =
		parseShopifyOfflineSession(exchangedSession);
	if (!isOfflineTokenOk) {
		return Err(offlineTokenErr);
	}

	return storeExchangedShopifyOfflineToken(offlineToken);
}

export interface TShopifyOfflineToken {
	shopifyInstallationId: string;
	shop: string;
	accessToken: string;
	accessTokenExpiresAt: Date;
}

// Note: Shopify's official integration refreshes tokens within five minutes of expiry
// https://github.com/Shopify/shopify-app-js/blob/main/packages/apps/shopify-app-react-router/src/server/helpers/ensure-offline-token-is-not-expired.ts
const shopifyTokenExpiryBufferMs = 5 * 60 * 1000;

function parseShopifyOfflineSession(
	session: Session
): TResult<TValidatedShopifyOfflineToken, AppError> {
	const { shop, accessToken, expires, refreshToken, refreshTokenExpires, scope } = session;
	const isOfflineTokenInvalid =
		session.isOnline ||
		accessToken == null ||
		!accessToken.length ||
		expires == null ||
		refreshToken == null ||
		!refreshToken.length ||
		refreshTokenExpires == null ||
		scope == null;
	if (isOfflineTokenInvalid) {
		return Err(
			new AppError('#ERR_SHOPIFY_OFFLINE_TOKEN_INVALID', {
				status: 502,
				title: 'Bad Gateway',
				detail: 'Shopify returned an incomplete offline access token'
			})
		);
	}

	const scopes = new AuthScopes(scope).toArray(true).sort();
	const hasRequiredScopes = new AuthScopes(scopes).has(shopifyConfig.scopes);
	if (!hasRequiredScopes) {
		return Err(
			new AppError('#ERR_SHOPIFY_REQUIRED_SCOPES_MISSING', {
				status: 403,
				title: 'Forbidden',
				detail: 'The Shopify installation has not granted all required access scopes'
			})
		);
	}

	return Ok({
		shop,
		scopes,
		accessToken,
		accessTokenExpiresAt: expires,
		refreshToken,
		refreshTokenExpiresAt: refreshTokenExpires
	});
}

interface TValidatedShopifyOfflineToken {
	shop: string;
	scopes: string[];
	accessToken: string;
	accessTokenExpiresAt: Date;
	refreshToken: string;
	refreshTokenExpiresAt: Date;
}

function isShopifyRequestRejected(cause: unknown): cause is HttpResponseError {
	return (
		cause instanceof HttpResponseError &&
		cause.response.code >= 400 &&
		cause.response.code < 500 &&
		cause.response.code !== 429
	);
}
