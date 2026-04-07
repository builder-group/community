import { createFileRoute, Link } from '@tanstack/react-router';
import { appConfig } from '@/environment';

export const Route = createFileRoute('/about')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
			<h1 className="text-4xl font-bold">About</h1>
			<p className="mt-4 max-w-md text-center text-gray-600">
				Use this template as the starting point for your next desktop app.{' '}
				<Link to="/" className="font-medium text-blue-500 hover:underline">
					Back home
				</Link>
			</p>

			<div className="mt-8 flex flex-wrap items-center justify-center gap-4">
				<a
					className={'text-sm font-medium text-blue-500 hover:underline'}
					href={appConfig.distribution.github}
				>
					GitHub
				</a>
				<a
					className={'text-sm font-medium text-blue-500 hover:underline'}
					href={appConfig.help.discord}
				>
					Discord
				</a>
				<a
					className={'text-sm font-medium text-blue-500 hover:underline'}
					href={appConfig.help.mailto('Desktop Tauri template')}
				>
					Email Support
				</a>
			</div>
		</main>
	);
}
