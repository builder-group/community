import { createFileRoute } from '@tanstack/react-router';
import { apiClient, appConfig, mapApiError } from '@/environment';
import { ShopPanel } from '@/modules/shop';

export const Route = createFileRoute('/embedded/')({
	loader: async () => {
		const [isShopOk, shopErr, shopResponse] = await apiClient.get('/v1/shop');
		if (!isShopOk) {
			throw mapApiError(shopErr);
		}

		return shopResponse;
	},
	component: RouteComponent
});

function RouteComponent() {
	const { shop } = Route.useLoaderData();

	return (
		<s-page heading={appConfig.name}>
			<s-section heading="Authenticated shop">
				<ShopPanel shop={shop} />
			</s-section>
		</s-page>
	);
}
