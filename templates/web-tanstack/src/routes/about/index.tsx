import { createFileRoute, Link } from '@tanstack/react-router';
import { appConfig } from '@/environment';

export const Route = createFileRoute('/about/')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<main className="flex min-h-screen items-center px-6 py-16">
			<div className="mx-auto w-full max-w-3xl">
				<section className="rounded-3xl border border-black/10 bg-white/80 px-7 py-6 backdrop-blur-sm">
					<h1 className="text-3xl font-semibold tracking-normal text-black sm:text-4xl">About</h1>
					<p className="mt-3 max-w-2xl text-base leading-7 text-black/60">
						A reusable web app starter with routed pages, environment config, a TypeScript greeting
						example, and SSR support.
					</p>
					<div className="mt-5 flex flex-wrap gap-4 text-sm">
						<Link to="/home" className="font-medium text-black underline underline-offset-4">
							Back home
						</Link>
						<a
							className="font-medium text-black/70 hover:text-black"
							href={appConfig.distribution.github}
							target="_blank"
							rel="noreferrer"
						>
							GitHub
						</a>
						<a
							className="font-medium text-black/70 hover:text-black"
							href={appConfig.help.discord}
							target="_blank"
							rel="noreferrer"
						>
							Discord
						</a>
					</div>
				</section>
			</div>
		</main>
	);
}
