import { createFileRoute, Link } from '@tanstack/react-router';
import { GreetingCard } from '@/modules/example';

export const Route = createFileRoute('/')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
			<h1 className="text-center text-4xl font-bold">Desktop Tauri</h1>
			<p className="mt-4 text-center text-black/60">
				A starter for desktop apps with TanStack Router, Tauri, and typed Rust bindings.{' '}
				<Link to="/about" className="font-medium text-blue-500 hover:underline">
					Learn more
				</Link>
			</p>
			<GreetingCard />
		</main>
	);
}
