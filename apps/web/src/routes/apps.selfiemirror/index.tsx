import { createFileRoute } from '@tanstack/react-router';
import { AppLandingPage, getAppPageHead } from '@/components';
import { selfiemirrorConfig } from '@/environment';

export const Route = createFileRoute('/apps/selfiemirror/')({
	head: () => getAppPageHead(selfiemirrorConfig),
	component: RouteComponent
});

function RouteComponent() {
	return <AppLandingPage app={selfiemirrorConfig} />;
}
