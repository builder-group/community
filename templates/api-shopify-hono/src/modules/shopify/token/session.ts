import {
	HttpRequestError,
	HttpResponseError,
	InvalidJwtError,
	type RequestedTokenType,
	type Session
} from '@shopify/shopify-api';
import { Err, Ok, type TResult } from 'tuple-result';
import { shopify } from '@/environment';
import { AppError } from '@/modules/error';

/**
 * Verifies a Shopify session token and resolves its authenticated shop and user identity.
 *
 * https://shopify.dev/docs/apps/build/authentication-authorization/implement-custom-authorization?extension=javascript#validate-the-session-token
 */
export async function verifyShopifySessionToken(
	sessionToken: string
): Promise<TResult<TVerifiedShopifySessionToken, AppError>> {
	try {
		const payload = await shopify.session.decodeSessionToken(sessionToken);
		const shop = shopify.utils.sanitizeShop(new URL(payload.dest).hostname);
		if (shop == null || !Number.isFinite(payload.iat)) {
			return Err(
				new AppError('#ERR_SHOPIFY_SESSION_TOKEN_INVALID', {
					status: 401,
					title: 'Unauthorized',
					detail: 'The Shopify session token could not be verified'
				})
			);
		}

		return Ok({
			token: sessionToken,
			shop,
			shopifyUserId: payload.sub,
			issuedAt: new Date(payload.iat * 1000)
		});
	} catch (cause) {
		return Err(
			new AppError('#ERR_SHOPIFY_SESSION_TOKEN_INVALID', {
				status: 401,
				title: 'Unauthorized',
				detail: 'The Shopify session token could not be verified',
				cause
			})
		);
	}
}

export interface TVerifiedShopifySessionToken {
	token: string;
	shop: string;
	shopifyUserId: string;
	issuedAt: Date;
}

/**
 * Exchanges a verified Shopify session token for the requested Admin API credential.
 *
 * https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/token-exchange
 */
export async function exchangeShopifySessionToken(
	input: TExchangeShopifySessionTokenInput
): Promise<TResult<Session, AppError>> {
	const { shop, sessionToken, requestedTokenType, expiring } = input;

	try {
		const { session } = await shopify.auth.tokenExchange({
			shop,
			sessionToken,
			requestedTokenType,
			...(expiring != null ? { expiring } : {})
		});
		return Ok(session);
	} catch (cause) {
		// Note: Shopify's official integration treats these responses as invalid session tokens
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
			new AppError('#ERR_SHOPIFY_TOKEN_EXCHANGE_FAILED', {
				status: 500,
				title: 'Internal Server Error',
				detail: 'The Shopify session token exchange failed',
				cause
			})
		);
	}
}

interface TExchangeShopifySessionTokenInput {
	shop: string;
	sessionToken: string;
	requestedTokenType: RequestedTokenType;
	expiring?: boolean;
}

/**
 * Returns whether a Shopify token request failed for a transient transport reason.
 *
 * Shopify treats network failures, timeouts, HTTP 429, and 5xx responses as transient.
 *
 * https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/offline-access-tokens#refresh-token-behavior
 */
export function isShopifyTokenRequestTransientFailure(cause: unknown): boolean {
	if (cause instanceof HttpResponseError) {
		return cause.response.code === 429 || cause.response.code >= 500;
	}

	return cause instanceof HttpRequestError || cause instanceof TypeError;
}
