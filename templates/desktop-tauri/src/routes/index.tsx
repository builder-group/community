import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
	component: IndexComponent
});

function IndexComponent() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center">
			<h1 className="text-4xl font-bold">Desktop Tauri</h1>
			<p className="mt-4 text-gray-600">A starter for Tauri apps in the builder monorepo style</p>
			<Link to="/about" className="mt-8 text-blue-500 hover:underline">
				About
			</Link>
		</main>
	);
}
