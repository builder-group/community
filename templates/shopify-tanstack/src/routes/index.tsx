import { createFileRoute } from '@tanstack/react-router';
import { appConfig } from '@/environment';

export const Route = createFileRoute('/')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<main className="flex min-h-screen items-center px-6 py-16">
			<section className="mx-auto w-full max-w-3xl rounded-3xl border border-black/10 bg-white/80 px-7 py-6 backdrop-blur-sm">
				<h1 className="text-3xl font-semibold tracking-normal text-black sm:text-4xl">
					{appConfig.name}
				</h1>
				<p className="mt-3 max-w-2xl text-base leading-7 text-black/60">
					Shopify app template built with TanStack Start, React, TanStack Router, and
					TypeScript.
				</p>
			</section>
		</main>
	);
}
