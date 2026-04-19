import React from 'react';
import { specta } from '@/environment';

export function useAppInfo(): TAppInfo {
	const [appInfo, setAppInfo] = React.useState<TAppInfo>({
		version: 'v0.0.0',
		stage: 'prod',
		distribution: 'direct',
		isPending: true
	});

	React.useEffect(() => {
		(async () => {
			try {
				const nextAppInfo = await specta.commands.getAppInfo();
				setAppInfo({
					...nextAppInfo,
					isPending: false
				});
			} catch {}
		})();
	}, []);

	return appInfo;
}

type TAppInfo = specta.AppInfoDto & { isPending: boolean };
