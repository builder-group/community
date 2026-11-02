import { createFileRoute } from '@tanstack/react-router';
import { AppLandingPage, getAppPageHead } from '@/components';
import { kairosConfig } from '@/environment';

export const Route = createFileRoute('/apps/kairos/')({
	head: () => getAppPageHead(kairosConfig),
	component: RouteComponent
});

function RouteComponent() {
	return <AppLandingPage app={kairosConfig} />;
}
