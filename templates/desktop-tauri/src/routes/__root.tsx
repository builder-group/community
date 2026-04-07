import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

export const Route = createRootRoute({
	component: RootComponent
});

function RootComponent() {
	return (
		<>
			<Outlet />
			{import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
		</>
	);
}
