import { shortId } from '@blgc/utils';
import type { TFromAppMessageEvent, TPluginCallbackRegistration } from '../types';

export class PluginCallback<
	GAppMessageEvent extends TFromAppMessageEvent,
	GPluginEventRegistration extends
		TPluginCallbackRegistration<GAppMessageEvent> = TPluginCallbackRegistration<GAppMessageEvent>
> {
	public readonly key: string;
	public readonly type: GPluginEventRegistration['type'];
	public readonly callback: GPluginEventRegistration['callback'];
	public readonly once: boolean;

	constructor(registration: GPluginEventRegistration) {
		this.key = registration.key ?? shortId();
		this.type = registration.type;
		this.callback = registration.callback;
		this.once = registration.once ?? false;
	}
}
