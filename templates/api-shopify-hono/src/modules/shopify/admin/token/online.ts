import { AuthScopes, RequestedTokenType, type Session } from '@shopify/shopify-api';
import { Err, Ok, type TResult } from 'tuple-result';
import { shopifyConfig } from '@/environment';
import { AppError } from '@/modules/error';
import { loadShopifyOnlineToken, storeExchangedShopifyOnlineToken } from '../../repository';
import { exchangeShopifySessionToken, type TVerifiedShopifySessionToken } from './session';

/**
 * Resolves the current user's online Admin API credential from a verified session token.
 * Online credentials remain separate from the installation's background access.
 *
 * https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/online-access-tokens
 */
export async function resolveShopifyOnlineToken(
	installationId: string,
	verifiedSessionToken: TVerifiedShopifySessionToken
): Promise<TResult<TShopifyOnlineToken, AppError>> {
	const { token: sessionToken, shop, shopifyUserId } = verifiedSessionToken;

	const [isStoredTokenOk, storedTokenErr, storedToken] = await loadShopifyOnlineToken(
		installationId,
		shopifyUserId
	);
	if (!isStoredTokenOk) {
		return Err(storedTokenErr);
	}

	// Return a reusable stored online token
	if (storedToken != null) {
		// Note: Associated user scopes may be a valid subset and are enforced by Shopify per
		// operation
		const hasRequiredScopes = new AuthScopes(storedToken.scopes).has(shopifyConfig.scopes);
		const hasSufficientTokenLifetime =
			storedToken.accessTokenExpiresAt.getTime() - shopifyTokenExpiryBufferMs > Date.now();
		if (hasRequiredScopes && hasSufficientTokenLifetime) {
			return Ok(storedToken);
		}
	}

	// Exchange the session token when no stored credential can be reused
	const [isExchangedSessionOk, exchangedSessionErr, exchangedSession] =
		await exchangeShopifySessionToken({
			shop,
			sessionToken,
			requestedTokenType: RequestedTokenType.OnlineAccessToken
			// Note: Shopify controls online token expiry; `expiring` applies only to offline token exchange
			// https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/token-exchange
		});
	if (!isExchangedSessionOk) {
		return Err(exchangedSessionErr);
	}

	const [isOnlineTokenOk, onlineTokenErr, onlineToken] = parseShopifyOnlineSession(
		exchangedSession,
		installationId,
		shopifyUserId
	);
	if (!isOnlineTokenOk) {
		return Err(onlineTokenErr);
	}

	return storeExchangedShopifyOnlineToken({
		...onlineToken,
		sessionTokenIssuedAt: verifiedSessionToken.issuedAt
	});
}

export interface TShopifyOnlineToken {
	installationId: string;
	shop: string;
	shopifyUser: TShopifyUser;
	accessToken: string;
	accessTokenExpiresAt: Date;
	scopes: string[];
	associatedUserScopes: string[];
}

export interface TShopifyUser {
	id: string;
	shopifyId: string;
	firstName: string;
	lastName: string;
	email: string;
	emailVerified: boolean;
	accountOwner: boolean;
	locale: string;
	collaborator: boolean;
}

// Note: Shopify's official integration renews tokens within five minutes of expiry
// https://github.com/Shopify/shopify-app-js/blob/main/packages/apps/shopify-app-react-router/src/server/authenticate/admin/strategies/token-exchange.ts
const shopifyTokenExpiryBufferMs = 5 * 60 * 1000;

function parseShopifyOnlineSession(
	session: Session,
	installationId: string,
	expectedShopifyUserId: string
): TResult<TValidatedShopifyOnlineToken, AppError> {
	const { shop, accessToken, expires, scope, onlineAccessInfo } = session;
	const associatedUser = onlineAccessInfo?.associated_user;
	const isOnlineTokenInvalid =
		!session.isOnline ||
		accessToken == null ||
		!accessToken.length ||
		expires == null ||
		scope == null ||
		onlineAccessInfo == null ||
		associatedUser == null ||
		String(associatedUser.id) !== expectedShopifyUserId;
	if (isOnlineTokenInvalid) {
		return Err(
			new AppError('#ERR_SHOPIFY_ONLINE_TOKEN_INVALID', {
				status: 502,
				title: 'Bad Gateway',
				detail: 'Shopify returned an incomplete online access token'
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
		installationId,
		shop,
		shopifyUser: {
			shopifyId: String(associatedUser.id),
			firstName: associatedUser.first_name,
			lastName: associatedUser.last_name,
			email: associatedUser.email,
			emailVerified: associatedUser.email_verified,
			accountOwner: associatedUser.account_owner,
			locale: associatedUser.locale,
			collaborator: associatedUser.collaborator
		},
		accessToken,
		accessTokenExpiresAt: expires,
		scopes,
		associatedUserScopes: new AuthScopes(onlineAccessInfo.associated_user_scope)
			.toArray(true)
			.sort()
	});
}

interface TValidatedShopifyOnlineToken {
	installationId: string;
	shop: string;
	shopifyUser: Omit<TShopifyUser, 'id'>;
	accessToken: string;
	accessTokenExpiresAt: Date;
	scopes: string[];
	associatedUserScopes: string[];
}
