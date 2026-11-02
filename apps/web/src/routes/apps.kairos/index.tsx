import { createFileRoute } from '@tanstack/react-router';
import { AppLandingPage } from '@/components';
import { kairosConfig } from '@/environment';

export const Route = createFileRoute('/apps/kairos/')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<AppLandingPage
			app={kairosConfig}
			description="Set a time range. Let the timer surprise you."
			iconSrc="/illustrations/logos/kairos.png"
		/>
	);
}
