import type { Context } from 'hono';
import type { TApiEnv } from '@/api/types';
import { getShopify, getShopifySessionStorage } from './shopify';

export async function handleAppUninstalledWebhook(context: Context<TApiEnv>): Promise<Response> {
	const rawBody = await context.req.text();
	const validation = await getShopify().webhooks.validate({
		rawBody,
		rawRequest: context.req.raw
	});

	if (!validation.valid) {
		return context.text('Invalid webhook', 401);
	}

	const sessionStorage = getShopifySessionStorage();
	const sessions = await sessionStorage.findSessionsByShop(validation.domain);
	await sessionStorage.deleteSessions(sessions.map((session) => session.id));

	return context.text('OK', 200);
}
