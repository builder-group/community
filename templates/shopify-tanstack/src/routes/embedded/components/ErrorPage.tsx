import type { ErrorComponentProps } from '@tanstack/react-router';
import { isHttpError } from 'feature-fetch';
import React from 'react';
import { appConfig } from '@/environment';

export const ErrorPage: React.FC<ErrorComponentProps> = (props) => {
	const { error } = props;
	const content = getErrorContent(error);
	const reference = getErrorReference(error);

	const handleReload = React.useCallback(() => {
		window.location.reload();
	}, []);

	return (
		<s-page heading={appConfig.name}>
			<s-banner heading={content.heading} tone="critical">
				<s-paragraph>{content.detail}</s-paragraph>
				<s-button slot="secondary-actions" variant="secondary" onClick={handleReload}>
					Reload app
				</s-button>
			</s-banner>
			<div className="flex flex-wrap items-center gap-2">
				<s-badge tone="neutral">Version {appConfig.version}</s-badge>
				{reference != null ? <s-badge tone="neutral">Support reference {reference}</s-badge> : null}
			</div>
		</s-page>
	);
};

interface TErrorContent {
	heading: string;
	detail: string;
}

function getErrorContent(error: unknown): TErrorContent {
	const isRequiredScopeError =
		isHttpError(error) &&
		error.status === 403 &&
		hasErrorCode(error.data, '#ERR_SHOPIFY_REQUIRED_SCOPES_MISSING');
	if (isRequiredScopeError) {
		return {
			heading: 'Additional Shopify permissions required',
			detail:
				'This installation does not grant every permission the app needs. Approve the requested permissions, then reload the app.'
		};
	}

	if (isHttpError(error) && error.status === 429) {
		return {
			heading: 'Shopify is temporarily busy',
			detail: 'Wait a moment, then reload the app.'
		};
	}

	if (isHttpError(error) && error.status === 423) {
		return {
			heading: 'The Shopify store is unavailable',
			detail: 'Confirm that the store is active, then reload the app.'
		};
	}

	const isServiceUnavailable = isHttpError(error) && (error.status === 502 || error.status === 503);
	if (isServiceUnavailable) {
		return {
			heading: 'The app is temporarily unavailable',
			detail: 'Wait a moment, then reload the app.'
		};
	}

	return {
		heading: 'The app could not be loaded',
		detail: 'Reload the app and try again. If the problem continues, contact support.'
	};
}

function hasErrorCode(data: unknown, code: string): boolean {
	return typeof data === 'object' && data != null && 'code' in data && data.code === code;
}

function getErrorReference(error: unknown): string | null {
	if (!isHttpError(error) || typeof error.data !== 'object' || error.data == null) {
		return null;
	}

	const instance = 'instance' in error.data ? error.data.instance : null;
	if (typeof instance !== 'string') {
		return null;
	}

	const prefix = 'urn:uuid:';
	return instance.startsWith(prefix) ? instance.slice(prefix.length) : null;
}
