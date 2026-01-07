import { createFileRoute } from '@tanstack/react-router';
import { appConfig } from '@/environment';

export const Route = createFileRoute('/')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-[#293140] p-8 text-white">
			<h1 className="font-serif text-5xl font-bold tracking-tight">
				builder<span className="text-[#FDE200]">.group</span>
			</h1>

			<p className="mt-4 text-lg text-white/60">Let's build together.</p>

			<img src="/under-construction.gif" alt="Under Construction" className="mt-8" />

			<div className="mt-12 flex gap-4">
				<a
					href={appConfig.social.github}
					target="_blank"
					rel="noopener noreferrer"
					className="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-white/20"
				>
					GitHub
				</a>
				<a
					href={appConfig.help.discord}
					target="_blank"
					rel="noopener noreferrer"
					className="rounded-lg bg-[#FDE200] px-5 py-2.5 text-sm font-medium text-[#293140] transition-colors hover:bg-[#FDE200]/90"
				>
					Discord
				</a>
			</div>
		</div>
	);
}
