import { createFileRoute, Link } from '@tanstack/react-router';
import { appConfig } from '@/environment';

export const Route = createFileRoute('/about')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-12">
			<p className="text-sm font-semibold tracking-[0.22em] text-black/45 uppercase">About</p>
			<h1 className="mt-4 text-4xl leading-tight font-bold tracking-tight text-black sm:text-6xl">
				A reusable web app starter with only the pieces we expect to keep.
			</h1>
			<p className="mt-6 text-base leading-7 text-black/60">
				Use the {appConfig.name} template as a clean baseline for TanStack Start apps. It keeps
				routing, config, modules, and shared helpers separate without adding product-specific
				scaffolding.{' '}
				<Link to="/" className="font-medium text-black underline underline-offset-4">
					Back home
				</Link>
			</p>

			<div className="mt-8 flex flex-wrap gap-4 text-sm">
				<a
					className="font-medium text-black/70 hover:text-black"
					href={appConfig.distribution.github}
				>
					GitHub
				</a>
				<a className="font-medium text-black/70 hover:text-black" href={appConfig.help.discord}>
					Discord
				</a>
				<a
					className="font-medium text-black/70 hover:text-black"
					href={appConfig.help.mailto('Web TanStack template')}
				>
					Email Support
				</a>
			</div>
		</main>
	);
}
