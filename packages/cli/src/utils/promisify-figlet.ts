import figlet from 'figlet';

export function promisifyFiglet(text: string): Promise<string> {
	return new Promise((resolve, reject) => {
		figlet(text, (err, data) => {
			if (err) {
				reject(err);
			} else if (data == null) {
				reject(new Error('Data is null'));
			} else {
				resolve(data);
			}
		});
	});
}
