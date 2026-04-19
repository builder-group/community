import { createFileRoute, Link } from '@tanstack/react-router';
import { WindowHeader } from '@/components';
import { appConfig } from '@/environment';
import { openExternalUrl } from '@/lib';

export const Route = createFileRoute('/window/main/about/')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-12">
			<WindowHeader floating title="About" />
			<section className="rounded-[28px] border border-black/10 bg-white/80 px-8 py-8 backdrop-blur-sm">
				<h1 className="mt-4 text-4xl font-bold tracking-tight text-black sm:text-5xl">
					{appConfig.name}
				</h1>
				<p className="mt-4 max-w-2xl text-base leading-7 text-black/60">
					Desktop app template with Tauri 2, React, TanStack Router, Specta bindings, Rust and Swift
					greetings, and macOS Liquid Glass support.
				</p>
				<div className="mt-8 flex flex-wrap gap-4 text-sm">
					<Link
						to="/window/main/home"
						className="font-medium text-black underline underline-offset-4"
					>
						Back home
					</Link>
					<button
						className="font-medium text-black/70 hover:text-black"
						onClick={() => void openExternalUrl(appConfig.distribution.github)}
						type="button"
					>
						GitHub
					</button>
					<button
						className="font-medium text-black/70 hover:text-black"
						onClick={() => void openExternalUrl(appConfig.help.discord)}
						type="button"
					>
						Discord
					</button>
				</div>
			</section>
		</main>
	);
}
