import { htmlConfig, pathTracker, process, TProcessor } from 'xml-tokenizer';

const articleExtractor: TProcessor<
	{
		articles: Array<{ id: string; title: string }>;
		currentArticle: { id?: string; title?: string } | null;
	},
	[typeof pathTracker]
> = {
	name: 'ArticleExtractor',
	context: {
		articles: [],
		currentArticle: null
	},
	deps: [pathTracker],
	process: (token, context) => {
		const path = context.currentPath;

		// Start tracking a new article when we enter an article element
		if (token.type === 'ElementStart' && token.local === 'article') {
			context.currentArticle = {};
		}

		// Extract ID from data-adid attribute on article element
		if (
			token.type === 'Attribute' &&
			token.local === 'data-adid' &&
			path[path.length - 1] === 'article' &&
			context.currentArticle
		) {
			context.currentArticle.id = token.value;
		}

		// Extract title from text in h2/a path within article
		if (
			token.type === 'Text' &&
			path.includes('article') &&
			path.includes('h2') &&
			path.includes('a') &&
			context.currentArticle
		) {
			const text = token.text.trim();
			if (text.length > 0) {
				context.currentArticle.title = text;
			}
		}

		// Finish article when we close the article element
		if (
			token.type === 'ElementEnd' &&
			token.end.type === 'Close' &&
			token.end.local === 'article' &&
			context.currentArticle &&
			context.currentArticle.id &&
			context.currentArticle.title
		) {
			context.articles.push({
				id: context.currentArticle.id,
				title: context.currentArticle.title
			});
			context.currentArticle = null;
		}
	}
};

export function extractAdsData(html: string): TListingData[] {
	const result = process(html, [pathTracker, articleExtractor], htmlConfig);

	return result.articles;
}

export type TListingData = {
	id: string;
	title?: string;
};
