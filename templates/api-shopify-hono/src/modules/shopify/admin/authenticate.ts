import { Err, Ok, type TResult } from 'tuple-result';
import { AppError } from '@/modules/error';
import { ShopifyInstallationCx } from './ShopifyInstallationCx';
import { ShopifyUserCx } from './ShopifyUserCx';
import {
	resolveShopifyOfflineToken,
	resolveShopifyOnlineToken,
	verifyShopifySessionToken
} from './token';

export async function authenticateShopifyInstallation(
	sessionToken: string
): Promise<TResult<ShopifyInstallationCx, AppError>> {
	const [isSessionTokenOk, sessionTokenErr, verifiedSessionToken] =
		await verifyShopifySessionToken(sessionToken);
	if (!isSessionTokenOk) {
		return Err(sessionTokenErr);
	}

	const { shop } = verifiedSessionToken;

	const [isOfflineTokenOk, offlineTokenErr, offlineToken] = await resolveShopifyOfflineToken(
		shop,
		verifiedSessionToken
	);
	if (!isOfflineTokenOk) {
		return Err(offlineTokenErr);
	}

	return Ok(ShopifyInstallationCx.fromOfflineToken(offlineToken));
}

export async function authenticateShopifyUser(
	sessionToken: string
): Promise<TResult<ShopifyUserCx, AppError>> {
	const [isSessionTokenOk, sessionTokenErr, verifiedSessionToken] =
		await verifyShopifySessionToken(sessionToken);
	if (!isSessionTokenOk) {
		return Err(sessionTokenErr);
	}

	const { shop } = verifiedSessionToken;

	// Note: Online exchange does not require an offline token. Resolving it first establishes the
	// installation and guarantees its background credential before attaching user-scoped access.
	const [isOfflineTokenOk, offlineTokenErr, offlineToken] = await resolveShopifyOfflineToken(
		shop,
		verifiedSessionToken
	);
	if (!isOfflineTokenOk) {
		return Err(offlineTokenErr);
	}

	const [isOnlineTokenOk, onlineTokenErr, onlineToken] = await resolveShopifyOnlineToken(
		offlineToken.installationId,
		verifiedSessionToken
	);
	if (!isOnlineTokenOk) {
		return Err(onlineTokenErr);
	}

	return Ok(ShopifyUserCx.fromOnlineToken(onlineToken));
}
