import { createFileRoute, Link } from '@tanstack/react-router';
import { appConfig } from '@/environment';

export const Route = createFileRoute('/about/')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
			<section className="rounded-[28px] border border-black/10 bg-white/80 px-7 py-6 backdrop-blur-sm">
				<h1 className="text-4xl font-bold tracking-tight text-black sm:text-5xl">About</h1>
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
		</main>
	);
}
