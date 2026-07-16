import {
	AuthScopes,
	HttpResponseError,
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
} from '../../repository';
import {
	exchangeShopifySessionToken,
	isShopifyTokenRequestTransientFailure,
	type TVerifiedShopifySessionToken
} from './session';

/**
 * Resolves a valid offline Admin API credential and persists refreshed or exchanged credentials.
 *
 * A session token is required when stored credentials cannot be reused or refreshed, including
 * when stored scopes might be outdated.
 *
 * https://shopify.dev/docs/apps/build/authentication-authorization/implement-custom-authorization?extension=javascript#token-exchange
 */
export async function resolveShopifyOfflineToken(
	shop: string,
	verifiedSessionToken?: TVerifiedShopifySessionToken
): Promise<TResult<TShopifyOfflineToken, AppError>> {
	const [isStoredTokenOk, storedTokenErr, storedToken] = await loadShopifyOfflineToken(shop);
	if (!isStoredTokenOk) {
		return Err(storedTokenErr);
	}

	// Note: Stored scopes can be stale, so they only decide whether the existing credential can
	// be reused. The scopes returned by token exchange are validated before storage.
	const hasRequiredScopes =
		storedToken != null && new AuthScopes(storedToken.grantedScopes).has(shopifyConfig.scopes);

	// Return a reusable stored offline token
	if (storedToken != null && hasRequiredScopes) {
		const hasSufficientAccessTokenLifetime =
			storedToken.accessTokenExpiresAt.getTime() - shopifyTokenExpiryBufferMs > Date.now();
		if (hasSufficientAccessTokenLifetime) {
			return Ok({
				installationId: storedToken.installationId,
				shop: storedToken.shop,
				accessToken: storedToken.accessToken,
				accessTokenExpiresAt: storedToken.accessTokenExpiresAt
			});
		}
	}

	// Recover a stored offline token through refresh-token rotation
	// Note: Refresh token rotation preserves background access without an embedded user session
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
				// Note: Shopify considers the refresh token invalid only when this exact response
				// is returned
				// https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/offline-access-tokens#refresh-token-behavior
				const isRefreshTokenDefinitivelyInvalid =
					cause instanceof HttpResponseError &&
					cause.response.code === 401 &&
					cause.response.body?.error === 'invalid_request' &&
					cause.response.body?.error_description ===
						'This request requires an active refresh_token';
				if (!isRefreshTokenDefinitivelyInvalid) {
					if (isShopifyTokenRequestTransientFailure(cause)) {
						return Err(
							new AppError('#ERR_SHOPIFY_AUTH_UNAVAILABLE', {
								status: 503,
								title: 'Service Unavailable',
								detail: 'Shopify authentication is temporarily unavailable',
								cause
							})
						);
					}

					return Err(
						new AppError('#ERR_SHOPIFY_TOKEN_REFRESH_FAILED', {
							status: 500,
							title: 'Internal Server Error',
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
					installationId: storedToken.installationId,
					previousRefreshToken: storedToken.refreshToken
				});
			}
		}
	}

	if (verifiedSessionToken == null) {
		return Err(
			new AppError('#ERR_SHOPIFY_SESSION_TOKEN_REQUIRED', {
				status: 401,
				title: 'Unauthorized',
				detail: 'A Shopify session token is required to acquire a new offline access token'
			})
		);
	}

	// Exchange the session token when no stored credential can be reused
	const [isExchangedSessionOk, exchangedSessionErr, exchangedSession] =
		await exchangeShopifySessionToken({
			shop,
			sessionToken: verifiedSessionToken.token,
			requestedTokenType: RequestedTokenType.OfflineAccessToken,
			expiring: shopifyConfig.admin.expiringOfflineAccessTokens
		});
	if (!isExchangedSessionOk) {
		return Err(exchangedSessionErr);
	}

	const [isOfflineTokenOk, offlineTokenErr, offlineToken] =
		parseShopifyOfflineSession(exchangedSession);
	if (!isOfflineTokenOk) {
		return Err(offlineTokenErr);
	}

	return storeExchangedShopifyOfflineToken({
		...offlineToken,
		sessionTokenIssuedAt: verifiedSessionToken.issuedAt
	});
}

export interface TShopifyOfflineToken {
	installationId: string;
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
