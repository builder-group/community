import { createFileRoute } from '@tanstack/react-router';
import { taplingConfig } from '@/environment';

export const Route = createFileRoute('/apps/tapling/')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<div className="relative flex min-h-screen items-center justify-center">
			<h1 className="text-4xl font-bold">{taplingConfig.name}</h1>
			<a
				href={taplingConfig.appstore}
				target="_blank"
				rel="noopener noreferrer"
				className="absolute bottom-12 left-1/2 -translate-x-1/2"
			>
				<img
					src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83&releaseDate=1704067200"
					alt="Download on the App Store"
					className="h-10"
				/>
			</a>
		</div>
	);
}
