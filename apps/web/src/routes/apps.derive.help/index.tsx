import { createFileRoute } from '@tanstack/react-router';
import { AppSupportPage, getAppPageHead } from '@/components';
import { deriveConfig } from '@/environment';

export const Route = createFileRoute('/apps/derive/help/')({
	head: () => getAppPageHead(deriveConfig, 'support'),
	component: RouteComponent
});

function RouteComponent() {
	return <AppSupportPage app={deriveConfig} />;
}
