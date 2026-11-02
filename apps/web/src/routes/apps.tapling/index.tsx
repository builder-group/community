import { createFileRoute } from '@tanstack/react-router';
import { AppLandingPage, getAppPageHead } from '@/components';
import { taplingConfig } from '@/environment';

export const Route = createFileRoute('/apps/tapling/')({
	head: () => getAppPageHead(taplingConfig),
	component: RouteComponent
});

function RouteComponent() {
	return <AppLandingPage app={taplingConfig} />;
}
