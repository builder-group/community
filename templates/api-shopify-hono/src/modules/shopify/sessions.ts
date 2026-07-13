import {
	HttpResponseError,
	InvalidJwtError,
	RequestedTokenType,
	type Session
} from '@shopify/shopify-api';
import { Err, Ok, type TResult } from 'tuple-result';
import { shopify, shopifyConfig, shopifySessionStorage } from '@/environment';
import { AppError } from '@/modules/error';

export async function loadOrCreateOfflineShopifySession(
	shop: string,
	sessionToken: string
): Promise<TResult<Session, AppError>> {
	let storedSession: Session | undefined;
	try {
		const sessionId = shopify.session.getOfflineId(shop);
		storedSession = await shopifySessionStorage.loadSession(sessionId);
	} catch (cause) {
		return Err(
			new AppError('#ERR_SHOPIFY_SESSION_STORE_UNAVAILABLE', {
				status: 503,
				title: 'Service Unavailable',
				detail: 'The Shopify session could not be loaded',
				cause
			})
		);
	}

	if (storedSession?.isActive(shopifyConfig.scopes)) {
		return Ok(storedSession);
	}

	let session: Session;
	try {
		const tokenExchange = await shopify.auth.tokenExchange({
			shop,
			sessionToken,
			requestedTokenType: RequestedTokenType.OfflineAccessToken,
			expiring: shopifyConfig.admin.expiringOfflineAccessTokens
		});
		session = tokenExchange.session;
	} catch (cause) {
		if (cause instanceof InvalidJwtError) {
			return Err(
				new AppError('#ERR_SHOPIFY_SESSION_TOKEN_INVALID', {
					status: 401,
					title: 'Unauthorized',
					detail: 'The Shopify session token could not be verified',
					cause
				})
			);
		}

		const isRejectedTokenExchange =
			cause instanceof HttpResponseError &&
			cause.response.code >= 400 &&
			cause.response.code < 500 &&
			cause.response.code !== 429;
		if (isRejectedTokenExchange) {
			return Err(
				new AppError('#ERR_SHOPIFY_TOKEN_EXCHANGE_REJECTED', {
					status: 401,
					title: 'Unauthorized',
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

	try {
		const isSessionStored = await shopifySessionStorage.storeSession(session);
		if (!isSessionStored) {
			return Err(
				new AppError('#ERR_SHOPIFY_SESSION_STORE_FAILED', {
					status: 503,
					title: 'Service Unavailable',
					detail: 'The Shopify session could not be stored'
				})
			);
		}
	} catch (cause) {
		return Err(
			new AppError('#ERR_SHOPIFY_SESSION_STORE_FAILED', {
				status: 503,
				title: 'Service Unavailable',
				detail: 'The Shopify session could not be stored',
				cause
			})
		);
	}

	return Ok(session);
}

export async function deleteShopifySessions(
	shop: string
): Promise<TResult<void, AppError>> {
	try {
		const sessions = await shopifySessionStorage.findSessionsByShop(shop);
		if (!sessions.length) {
			return Ok(undefined);
		}

		const areSessionsDeleted = await shopifySessionStorage.deleteSessions(
			sessions.map((session) => session.id)
		);
		if (!areSessionsDeleted) {
			return Err(
				new AppError('#ERR_SHOPIFY_SESSION_DELETE_FAILED', {
					status: 503,
					title: 'Service Unavailable',
					detail: 'The Shopify sessions could not be deleted'
				})
			);
		}

		return Ok(undefined);
	} catch (cause) {
		return Err(
			new AppError('#ERR_SHOPIFY_SESSION_DELETE_FAILED', {
				status: 503,
				title: 'Service Unavailable',
				detail: 'The Shopify sessions could not be deleted',
				cause
			})
		);
	}
}

export async function updateShopifySessionScopes(
	shop: string,
	scopes: string[]
): Promise<TResult<void, AppError>> {
	try {
		const sessions = await shopifySessionStorage.findSessionsByShop(shop);
		if (!sessions.length) {
			return Ok(undefined);
		}

		const scope = scopes.join(',');
		const storeResults = await Promise.all(
			sessions.map((session) => {
				session.scope = scope;
				return shopifySessionStorage.storeSession(session);
			})
		);
		if (storeResults.some((isStored) => !isStored)) {
			return Err(
				new AppError('#ERR_SHOPIFY_SESSION_SCOPE_UPDATE_FAILED', {
					status: 503,
					title: 'Service Unavailable',
					detail: 'The Shopify session scopes could not be updated'
				})
			);
		}

		return Ok(undefined);
	} catch (cause) {
		return Err(
			new AppError('#ERR_SHOPIFY_SESSION_SCOPE_UPDATE_FAILED', {
				status: 503,
				title: 'Service Unavailable',
				detail: 'The Shopify session scopes could not be updated',
				cause
			})
		);
	}
}
