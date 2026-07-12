import { createFileRoute } from '@tanstack/react-router';
import { ShopPanel } from '@/modules/shop';

export const Route = createFileRoute('/')({
	component: HomePage
});

function HomePage() {
	return (
		<s-page heading="Shopify TanStack">
			<s-section heading="Authenticated shop">
				<ShopPanel />
			</s-section>
		</s-page>
	);
}
