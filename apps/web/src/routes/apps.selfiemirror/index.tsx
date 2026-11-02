import { createFileRoute } from '@tanstack/react-router';
import { AppLandingPage } from '@/components';
import { selfiemirrorConfig } from '@/environment';

export const Route = createFileRoute('/apps/selfiemirror/')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<AppLandingPage
			app={selfiemirrorConfig}
			description="Turn your mirror selfies into a timelapse."
			iconSrc="/illustrations/logos/selfiemirror.png"
		/>
	);
}
