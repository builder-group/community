import { createFileRoute, Link } from '@tanstack/react-router';
import { appConfig } from '@/environment';
import { GreetingPanel } from '@/modules/greet';

export const Route = createFileRoute('/home/')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
			<section className="rounded-[28px] border border-black/10 bg-white/80 px-7 py-6 backdrop-blur-sm">
				<h1 className="text-4xl font-bold tracking-tight text-black sm:text-5xl">
					{appConfig.name}
				</h1>
				<p className="mt-3 max-w-2xl text-base leading-7 text-black/60">
					Web app template built with TanStack Start, React, TanStack Router, and TypeScript.
				</p>
				<div className="mt-5 flex gap-4 text-sm">
					<Link to="/about" className="font-medium text-black underline underline-offset-4">
						About this template
					</Link>
				</div>
			</section>
			<GreetingPanel />
		</main>
	);
}
