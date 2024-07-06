export function randomHex(): `#${string}` {
	const randomInt = Math.floor(Math.random() * 0xffffff);
	const hexString = randomInt.toString(16).padStart(6, '0');
	return `#${hexString}`;
}
