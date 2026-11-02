import { createFileRoute } from '@tanstack/react-router';
import { AppSupportPage } from '@/components';
import { taplingConfig } from '@/environment';

export const Route = createFileRoute('/apps/tapling/help/')({
	component: RouteComponent
});

function RouteComponent() {
	return <AppSupportPage app={taplingConfig} iconSrc="/illustrations/logos/tapling.png" />;
}
