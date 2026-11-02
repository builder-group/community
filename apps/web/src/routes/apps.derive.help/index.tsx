import { createFileRoute } from '@tanstack/react-router';
import { AppSupportPage } from '@/components';
import { deriveConfig } from '@/environment';

export const Route = createFileRoute('/apps/derive/help/')({
	component: RouteComponent
});

function RouteComponent() {
	return <AppSupportPage app={deriveConfig} iconSrc="/illustrations/logos/derive.png" />;
}
