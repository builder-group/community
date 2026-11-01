import { createFileRoute } from '@tanstack/react-router';
import { selfiemirrorConfig } from '@/environment';

export const Route = createFileRoute('/apps/selfiemirror/help/')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
			<h1 className="text-3xl font-bold">Need Help?</h1>
			<div className="flex flex-col gap-4">
				<a
					href={selfiemirrorConfig.help.mailto()}
					className="rounded-lg bg-blue-600 px-6 py-3 text-center text-white transition-colors hover:bg-blue-700"
				>
					Email Support
				</a>
				<a
					href={selfiemirrorConfig.help.discord}
					target="_blank"
					rel="noopener noreferrer"
					className="rounded-lg bg-[#5865F2] px-6 py-3 text-center text-white transition-colors hover:bg-[#4752C4]"
				>
					Join Discord
				</a>
			</div>
		</div>
	);
}
