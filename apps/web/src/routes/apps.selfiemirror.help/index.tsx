import { createFileRoute } from '@tanstack/react-router';
import { AppSupportPage, getAppPageHead } from '@/components';
import { selfiemirrorConfig } from '@/environment';

export const Route = createFileRoute('/apps/selfiemirror/help/')({
	head: () => getAppPageHead(selfiemirrorConfig, 'support'),
	component: RouteComponent
});

function RouteComponent() {
	return <AppSupportPage app={selfiemirrorConfig} />;
}
