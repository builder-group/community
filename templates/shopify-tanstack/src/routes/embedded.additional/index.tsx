import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/embedded/additional/')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<s-page heading="Additional page">
			<s-section heading="Embedded route">
				<s-text>This page inherits the shared Shopify embedded layout.</s-text>
			</s-section>
		</s-page>
	);
}
