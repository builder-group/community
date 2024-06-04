import { shortId } from '@ibg/utils';

import type { TAppMessageEvent, TPluginCallbackRegistration } from '../types';

export class PluginCallback<
	GAppMessageEvent extends TAppMessageEvent,
	GPluginEventRegistration extends
		TPluginCallbackRegistration<GAppMessageEvent> = TPluginCallbackRegistration<GAppMessageEvent>
> {
	public readonly key: string;
	public readonly type: GPluginEventRegistration['type'];
	public readonly callback: GPluginEventRegistration['callback'];
	public readonly once: boolean;

	constructor(registration: GPluginEventRegistration) {
		this.key = registration.key != null ? registration.key : shortId();
		this.type = registration.type;
		this.callback = registration.callback;
		this.once = registration.once ?? false;
	}
}
