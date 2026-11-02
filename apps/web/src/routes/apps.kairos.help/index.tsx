import { createFileRoute } from '@tanstack/react-router';
import { AppSupportPage } from '@/components';
import { kairosConfig } from '@/environment';

export const Route = createFileRoute('/apps/kairos/help/')({
	component: RouteComponent
});

function RouteComponent() {
	return <AppSupportPage app={kairosConfig} iconSrc="/illustrations/logos/kairos.png" />;
}
