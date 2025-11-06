import { shortId } from '@blgc/utils';
import type { TAppCallbackRegistration, TFromPluginMessageEvent } from '../types';

export class AppCallback<
	GPluginMessageEvent extends TFromPluginMessageEvent,
	GAppEventRegistration extends
		TAppCallbackRegistration<GPluginMessageEvent> = TAppCallbackRegistration<GPluginMessageEvent>
> {
	public readonly key: string;
	public readonly type: GAppEventRegistration['type'];
	public readonly callback: GAppEventRegistration['callback'];
	public readonly once: boolean;

	private _wasCalled = false;

	constructor(registration: GAppEventRegistration) {
		this.key = registration.key ?? shortId();
		this.type = registration.type;
		this.callback = registration.callback;
		this.once = registration.once ?? false;
	}

	public shouldCall(): boolean {
		if (this.once) {
			if (!this._wasCalled) {
				this._wasCalled = true;
				return true;
			}
			return false;
		}
		return true;
	}
}
