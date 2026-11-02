import { createFileRoute } from '@tanstack/react-router';
import { AppLandingPage, getAppPageHead } from '@/components';
import { deriveConfig } from '@/environment';

export const Route = createFileRoute('/apps/derive/')({
	head: () => getAppPageHead(deriveConfig),
	component: RouteComponent
});

function RouteComponent() {
	return <AppLandingPage app={deriveConfig} />;
}
