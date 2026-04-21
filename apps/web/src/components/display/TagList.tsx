import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';
import { type TProjectTag } from '@/environment';
import { cn } from '@/lib';

export const TagList: React.FC<TTagListProps> = (props) => {
	const { tags, className } = props;
	const tagLabels = React.useMemo(
		() => ({
			'github': 'GitHub',
			'website': 'Website',
			'app-store': 'App Store',
			'chrome-store': 'Chrome Store',
			'shopify-store': 'Shopify',
			'crate': 'crate',
			'npm': 'npm',
			'youtube': 'YouTube',
			'product-hunt': 'Product Hunt'
		}),
		[]
	);

	const linkTags = tags.filter((t): t is Extract<TProjectTag, { url: string }> => 'url' in t);
	if (!linkTags.length) {
		return null;
	}

	return (
		<div className={cn('flex flex-wrap gap-1.5', className)}>
			{linkTags.map((tag) => (
				<TagLink key={tag.type} href={tag.url}>
					{tagLabels[tag.type]}
				</TagLink>
			))}
		</div>
	);
};

export interface TTagListProps {
	tags: TProjectTag[];
	className?: string;
}

// MARK: - TagLink

export const TagLink: React.FC<TTagLinkProps> = (props) => {
	const { href, children, variant, className } = props;

	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className={cn(tagLinkVariants({ variant }), className)}
		>
			{children}
		</a>
	);
};

export interface TTagLinkProps extends VariantProps<typeof tagLinkVariants> {
	href: string;
	children: React.ReactNode;
	className?: string;
}

export const tagLinkVariants = cva(
	'rounded px-2 py-0.5 text-xs transition-colors hover:text-base-800 ring-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-base-500 focus-visible:ring-offset-1',
	{
		variants: {
			variant: {
				default: 'bg-base-200 text-base-600 ring-base-300 hover:bg-base-300 hover:ring-base-400'
			}
		},
		defaultVariants: { variant: 'default' }
	}
);
