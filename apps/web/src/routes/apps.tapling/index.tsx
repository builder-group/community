import { createFileRoute } from '@tanstack/react-router';
import { AppLandingPage } from '@/components';
import { taplingConfig } from '@/environment';

export const Route = createFileRoute('/apps/tapling/')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<AppLandingPage
			app={taplingConfig}
			description="Type with a Bongo Cat that taps along."
			iconSrc="/illustrations/logos/tapling.png"
		/>
	);
}
