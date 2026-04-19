import { createFileRoute, Link } from '@tanstack/react-router';
import { WindowHeader } from '@/components';
import { appConfig } from '@/environment';
import { useAppInfo } from '@/hooks';
import { GreetingPanel } from '@/modules/greet';

export const Route = createFileRoute('/window/main/home/')({
	component: RouteComponent
});

function RouteComponent() {
	const appInfo = useAppInfo();

	return (
		<main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 pt-16 pb-8">
			<WindowHeader floating title={appConfig.name} />
			<section className="rounded-[28px] border border-black/10 bg-white/80 px-7 py-6 backdrop-blur-sm">
				<h1 className="text-4xl font-bold tracking-tight text-black sm:text-5xl">
					{appConfig.name}
				</h1>
				<p className="mt-3 max-w-2xl text-base leading-7 text-black/60">
					Desktop app template built with Tauri 2, React, TanStack Router, Specta, and macOS Liquid
					Glass.
				</p>
				<p className="mt-2 text-sm text-black/50">
					{appInfo.isPending
						? 'App info: loading'
						: `App info: ${appInfo.version} • ${appInfo.stage} • ${appInfo.distribution}`}
				</p>
				<div className="mt-5 flex gap-4 text-sm">
					<Link
						to="/window/main/about"
						className="font-medium text-black underline underline-offset-4"
					>
						About this template
					</Link>
				</div>
			</section>
			<GreetingPanel />
		</main>
	);
}
