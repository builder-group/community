import { Err, Ok, type TResult } from 'tuple-result';
import { gql } from '@/environment';
import { AppError } from '@/modules/error';
import { mapShopifyAdminApiError, type ShopifyUserCx } from '@/modules/shopify';

// https://shopify.dev/docs/api/admin-graphql/latest/queries/productsCount
const GET_PRODUCT_COUNT_QUERY = gql(`
	query GetProductCount {
		productsCount {
			count
			precision
		}
	}
`);

export async function getProductCount(
	cx: ShopifyUserCx
): Promise<TResult<TProductCount, AppError>> {
	const [isProductCountOk, productCountErr, productCountData] =
		await cx.apiClient.query(GET_PRODUCT_COUNT_QUERY);
	if (!isProductCountOk) {
		return Err(
			mapShopifyAdminApiError(productCountErr, {
				code: '#ERR_PRODUCT_COUNT_QUERY_FAILED',
				detail: 'Shopify could not return the product count'
			})
		);
	}

	const productCount = productCountData.productsCount;
	if (productCount == null) {
		return Err(
			new AppError('#ERR_PRODUCT_COUNT_QUERY_FAILED', {
				status: 502,
				title: 'Bad Gateway',
				detail: 'Shopify returned an incomplete product count'
			})
		);
	}

	return Ok(productCount);
}

export interface TProductCount {
	count: number;
	precision: 'EXACT' | 'AT_LEAST';
}
