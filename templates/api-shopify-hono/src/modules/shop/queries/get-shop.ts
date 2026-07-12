import { Err, Ok, type TResult } from 'tuple-result';
import { gql } from '@/environment';
import { AppError } from '@/modules/error';
import { mapShopifyAdminApiError, type ShopifyAdminCx } from '@/modules/shopify';

const GET_SHOP_QUERY = gql(`
	query GetShop {
		shop {
			id
			name
			myshopifyDomain
		}
	}
`);

export async function getShop(cx: ShopifyAdminCx): Promise<TResult<TShop, AppError>> {
	const [isShopOk, shopErr, shopData] = await cx.apiClient.query(GET_SHOP_QUERY);
	if (!isShopOk) {
		return Err(
			mapShopifyAdminApiError(shopErr, {
				code: '#ERR_SHOP_QUERY_FAILED',
				detail: 'Shopify could not return the shop'
			})
		);
	}

	return Ok({
		id: shopData.shop.id,
		name: shopData.shop.name,
		domain: shopData.shop.myshopifyDomain
	});
}

export interface TShop {
	id: string;
	name: string;
	domain: string;
}
