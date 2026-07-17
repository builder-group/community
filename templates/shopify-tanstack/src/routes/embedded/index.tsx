import { createFileRoute } from '@tanstack/react-router';
import { isHttpError } from 'feature-fetch';
import { apiClient, appConfig, mapApiError } from '@/environment';
import { ProductPicker } from '@/modules/product';
import { ShopPanel } from '@/modules/shop';
import { UserPanel } from '@/modules/user';

export const Route = createFileRoute('/embedded/')({
	loader: async () => {
		const [isShopOk, shopErr, shopResponse] = await apiClient.get('/v1/shop');
		if (!isShopOk) {
			throw mapApiError(shopErr);
		}

		const [isUserOk, userErr, userResponse] = await apiClient.get('/v1/user');
		if (!isUserOk) {
			throw mapApiError(userErr);
		}

		const [isProductCountOk, productCountErr, productCountResponse] =
			await apiClient.get('/v1/products/count');
		if (!isProductCountOk) {
			const isProductAccessDenied =
				isHttpError(productCountErr) &&
				productCountErr.status === 403 &&
				productCountErr.data?.code === '#ERR_PRODUCT_COUNT_QUERY_FAILED';
			if (!isProductAccessDenied) {
				throw mapApiError(productCountErr);
			}
		}
		const productCount = productCountResponse ?? null;

		return {
			shop: shopResponse.shop,
			user: userResponse.user,
			productCount
		};
	},
	component: RouteComponent
});

function RouteComponent() {
	const { shop, user, productCount } = Route.useLoaderData();

	return (
		<s-page heading={appConfig.name}>
			<s-section heading="Authenticated shop">
				<ShopPanel shop={shop} />
			</s-section>
			<s-section heading="Authenticated user">
				<UserPanel user={user} />
			</s-section>
			<s-section heading="User-scoped Admin API">
				<s-text>{getProductCountLabel(productCount)}</s-text>
			</s-section>
			<s-section heading="App Bridge resource picker">
				<ProductPicker />
			</s-section>
		</s-page>
	);
}

function getProductCountLabel(productCount: TProductCount | null): string {
	if (productCount == null) {
		return 'Product access is unavailable to this user';
	}

	const count =
		productCount.precision === 'AT_LEAST'
			? `At least ${productCount.count}`
			: String(productCount.count);
	const productLabel = productCount.count === 1 ? 'product' : 'products';
	return `${count} ${productLabel} available to this user`;
}

interface TProductCount {
	count: number;
	precision: 'EXACT' | 'AT_LEAST';
}
