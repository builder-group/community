import { createFileRoute } from '@tanstack/react-router';
import { mdxComponents } from '@/components';
import Content from './content.mdx';

export const Route = createFileRoute('/apps/kairos/legal/privacy/')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<article className="prose prose-base max-w-none">
			<Content components={mdxComponents} />
		</article>
	);
}
