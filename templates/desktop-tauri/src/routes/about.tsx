import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/about')({
	component: AboutComponent
});

function AboutComponent() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center">
			<h1 className="text-4xl font-bold">About</h1>
			<p className="mt-4 text-gray-600">Use this template as the starting point for your next desktop app</p>
			<Link to="/" className="mt-8 text-blue-500 hover:underline">
				Back to Home
			</Link>
		</main>
	);
}
