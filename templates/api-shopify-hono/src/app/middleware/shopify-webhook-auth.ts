import type { MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';
import { AppError } from '@/modules/error';
import {
	authenticateShopifyWebhook,
	type TShopifyWebhook,
	type TShopifyWebhookTopic
} from '@/modules/shopify';

export function createShopifyWebhookAuth(
	expectedTopic: TShopifyWebhookTopic
): MiddlewareHandler<TShopifyWebhookEnv> {
	return createMiddleware<TShopifyWebhookEnv>(async (context, next) => {
		let rawBody: string;
		try {
			rawBody = await context.req.text();
		} catch (cause) {
			throw new AppError('#ERR_SHOPIFY_WEBHOOK_BODY_INVALID', {
				status: 400,
				title: 'Bad Request',
				detail: 'The Shopify webhook body could not be read',
				cause
			});
		}

		const [isWebhookOk, webhookErr, webhook] = await authenticateShopifyWebhook(
			context.req.raw,
			rawBody
		);
		if (!isWebhookOk) {
			throw webhookErr;
		}

		if (webhook.topic !== expectedTopic) {
			throw new AppError('#ERR_SHOPIFY_WEBHOOK_TOPIC_UNEXPECTED', {
				status: 400,
				title: 'Bad Request',
				detail: 'The Shopify webhook topic does not match this endpoint'
			});
		}

		context.set('shopifyWebhook', webhook);
		await next();
	});
}

export interface TShopifyWebhookEnv {
	Variables: { shopifyWebhook: TShopifyWebhook };
}
