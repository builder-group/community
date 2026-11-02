import { createFileRoute } from '@tanstack/react-router';
import { AppSupportPage, getAppPageHead } from '@/components';
import { kairosConfig } from '@/environment';

export const Route = createFileRoute('/apps/kairos/help/')({
	head: () => getAppPageHead(kairosConfig, 'support'),
	component: RouteComponent
});

function RouteComponent() {
	return <AppSupportPage app={kairosConfig} />;
}
