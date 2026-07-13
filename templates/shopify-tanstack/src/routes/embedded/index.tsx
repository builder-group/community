import { createFileRoute } from '@tanstack/react-router';
import { appConfig } from '@/environment';

export const Route = createFileRoute('/embedded/')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<s-page heading={appConfig.name}>
			<s-section heading="Embedded app">
				<s-text>The Shopify runtime is ready for application modules.</s-text>
			</s-section>
		</s-page>
	);
}
