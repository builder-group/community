import { createFileRoute } from '@tanstack/react-router';
import { mdxComponents } from '@/components';
import Content from './content.mdx';

export const Route = createFileRoute('/apps/tapling/legal/privacy/')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<article className="prose prose-base dark:prose-invert mx-auto max-w-3xl px-6 py-12">
			<Content components={mdxComponents} />
		</article>
	);
}
