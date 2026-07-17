import { WebhookValidationErrorReason } from '@shopify/shopify-api';
import { Err, Ok, type TResult } from 'tuple-result';
import { shopify } from '@/environment';
import { AppError } from '@/modules/error';

export async function authenticateShopifyWebhook(
	request: Request,
	rawBody: string
): Promise<TResult<TShopifyWebhook, AppError>> {
	let validation: Awaited<ReturnType<typeof shopify.webhooks.validate>>;
	try {
		validation = await shopify.webhooks.validate({ rawBody, rawRequest: request });
	} catch (cause) {
		return Err(
			new AppError('#ERR_SHOPIFY_WEBHOOK_VALIDATION_FAILED', {
				status: 500,
				title: 'Internal Server Error',
				detail: 'The Shopify webhook could not be validated',
				cause
			})
		);
	}

	if (!validation.valid) {
		const isHmacRejected =
			validation.reason === WebhookValidationErrorReason.MissingHmac ||
			validation.reason === WebhookValidationErrorReason.InvalidHmac;

		return Err(
			new AppError('#ERR_SHOPIFY_WEBHOOK_INVALID', {
				status: isHmacRejected ? 401 : 400,
				title: isHmacRejected ? 'Unauthorized' : 'Bad Request',
				detail: 'The Shopify webhook could not be verified'
			})
		);
	}

	const shop = shopify.utils.sanitizeShop(validation.domain);
	if (shop == null) {
		return Err(
			new AppError('#ERR_SHOPIFY_WEBHOOK_SHOP_INVALID', {
				status: 400,
				title: 'Bad Request',
				detail: 'The Shopify webhook contains an invalid shop domain'
			})
		);
	}

	const triggeredAt = validation.triggeredAt == null ? null : new Date(validation.triggeredAt);
	if (triggeredAt == null || Number.isNaN(triggeredAt.getTime())) {
		return Err(
			new AppError('#ERR_SHOPIFY_WEBHOOK_TRIGGERED_AT_INVALID', {
				status: 400,
				title: 'Bad Request',
				detail: 'The Shopify webhook does not contain a valid trigger timestamp'
			})
		);
	}

	return Ok({
		shop,
		topic: validation.topic,
		webhookId: validation.webhookId,
		apiVersion: validation.apiVersion,
		triggeredAt,
		eventId: validation.eventId
	});
}

export interface TShopifyWebhook {
	shop: string;
	topic: string;
	webhookId: string;
	apiVersion: string;
	triggeredAt: Date;
	eventId?: string;
}
