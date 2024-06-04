export class ContinuousId {
	private static nextIdValue: TContinuousId = 0;
	private id: TContinuousId;

	constructor(id: number) {
		this.id = id;
	}

	public static get ZERO(): ContinuousId {
		this.nextIdValue = 0;
		return new ContinuousId(0);
	}

	public static nextId(): TContinuousId {
		return ++this.nextIdValue;
	}

	public static nextCId(): ContinuousId {
		return new ContinuousId(this.nextIdValue++);
	}

	public toNumber(): TContinuousId {
		return this.id;
	}
}

export type TContinuousId = number;
