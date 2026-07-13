import { createFileRoute, redirect } from '@tanstack/react-router';
import { appConfig } from '@/environment';

export const Route = createFileRoute('/')({
	beforeLoad: ({ location }) => {
		const searchParams = new URLSearchParams(location.searchStr);
		const isShopifyLaunch = searchParams.has('shop');
		if (isShopifyLaunch) {
			throw redirect({
				to: '/embedded',
				search: location.search
			});
		}
	},
	component: RouteComponent
});

function RouteComponent() {
	return (
		<main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
			<h1 className="text-4xl font-semibold tracking-tight">{appConfig.name}</h1>
			<p className="mt-4 text-lg text-neutral-600">
				Open this app from Shopify Admin to enter the embedded application.
			</p>
		</main>
	);
}
