import React from 'react';

export const mdxComponents: Record<string, React.ComponentType<TMdxElementProps>> = {
	em: (props) => <i {...props} />,
	a: (props) => {
		// Open external links in new tab
		const isExternal = props.href?.startsWith('http') || props.href?.startsWith('https');
		if (isExternal) {
			return <a {...props} target="_blank" rel="noopener noreferrer" />;
		}
		return <a {...props} />;
	}
};

type TMdxElementProps = React.HTMLAttributes<HTMLElement> & {
	href?: string;
};
