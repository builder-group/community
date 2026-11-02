import { createFileRoute } from '@tanstack/react-router';
import { AppSupportPage, getAppPageHead } from '@/components';
import { taplingConfig } from '@/environment';

export const Route = createFileRoute('/apps/tapling/help/')({
	head: () => getAppPageHead(taplingConfig, 'support'),
	component: RouteComponent
});

function RouteComponent() {
	return <AppSupportPage app={taplingConfig} />;
}
