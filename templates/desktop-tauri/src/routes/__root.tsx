import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

export const Route = createRootRoute({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<>
			<Outlet />
			{import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
		</>
	);
}
