import { createFileRoute } from '@tanstack/react-router';
import { AppLandingPage } from '@/components';
import { deriveConfig } from '@/environment';

export const Route = createFileRoute('/apps/derive/')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<AppLandingPage
			app={deriveConfig}
			description="Pick a color. Find nine things. Make a photo collection."
			iconSrc="/illustrations/logos/derive.png"
		/>
	);
}
