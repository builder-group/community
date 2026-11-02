import { createFileRoute } from '@tanstack/react-router';
import { AppSupportPage } from '@/components';
import { selfiemirrorConfig } from '@/environment';

export const Route = createFileRoute('/apps/selfiemirror/help/')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<AppSupportPage app={selfiemirrorConfig} iconSrc="/illustrations/logos/selfiemirror.png" />
	);
}
