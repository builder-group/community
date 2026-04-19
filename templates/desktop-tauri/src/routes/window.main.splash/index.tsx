import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React from 'react';
import { WindowHeader } from '@/components';

export const Route = createFileRoute('/window/main/splash/')({
	component: RouteComponent
});

function RouteComponent() {
	const navigate = useNavigate();

	// MARK: - Effects

	React.useEffect(() => {
		const splashTimer = setTimeout(() => {
			void navigate({ to: '/window/main/home' });
		}, 1000);

		return () => {
			clearTimeout(splashTimer);
		};
	}, [navigate]);

	// MARK: - UI

	return (
		<main className="relative flex h-screen items-center justify-center">
			<WindowHeader floating />
			<img alt="Tauri" className="h-20 w-20" height="80" src="/tauri.svg" width="80" />
		</main>
	);
}
