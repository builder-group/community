import { bench, describe } from 'vitest';
import { FifoQueue, FlatQueue } from '../queue';

const dataSets: TBenchmarkDataSet[] = [
	{ name: 'Tiny data (5 items)', data: createDataSet(5) },
	{ name: 'Small data (10 items)', data: createDataSet(10) },
	{ name: 'Medium data (1,000 items)', data: createDataSet(1000) },
	{ name: 'Large data (10,000 items)', data: createDataSet(10000) }
];

describe('queue benchmark', () => {
	for (const { name, data } of dataSets) {
		describe(name, () => {
			bench('array insertion order', () => {
				const queue = createArrayQueue(data);
				drainArrayQueueInInsertionOrder(queue);
			});

			bench('FifoQueue insertion order', () => {
				const queue = createFifoQueue(data);
				drainFifoQueue(queue);
			});

			bench('array priority sort', () => {
				const queue = createArrayQueue(data);
				drainArrayQueueByPriority(queue);
			});

			bench('FlatQueue priority heap', () => {
				const queue = createFlatQueue(data);
				drainFlatQueue(queue);
			});
		});
	}
});

interface TDataItem {
	id: number;
	priority: number;
}

type TDataSet = TDataItem[];

interface TBenchmarkDataSet {
	name: string;
	data: TDataSet;
}

function createDataSet(size: number): TDataSet {
	let seed = size;
	const data: TDataSet = [];

	for (let id = 0; id < size; id++) {
		seed = (seed * 1664525 + 1013904223) >>> 0;
		data.push({ id, priority: seed / 0xffffffff });
	}

	return data;
}

function createArrayQueue(data: TDataSet): TDataItem[] {
	const queue: TDataItem[] = [];

	for (const item of data) {
		queue.push(item);
	}

	return queue;
}

function createFifoQueue(data: TDataSet): FifoQueue<TDataItem> {
	const queue = new FifoQueue<TDataItem>();

	for (const item of data) {
		queue.push(item);
	}

	return queue;
}

function drainFifoQueue(queue: FifoQueue<TDataItem>): number {
	let sum = 0;

	while (queue.length > 0) {
		const item = queue.pop();
		if (item != null) {
			sum += item.id;
		}
	}

	return sum;
}

function drainArrayQueueInInsertionOrder(queue: TDataItem[]): number {
	let sum = 0;

	for (const item of queue) {
		sum += item.id;
	}

	return sum;
}

function drainArrayQueueByPriority(queue: TDataItem[]): number {
	queue.sort(comparePriority);

	let sum = 0;
	for (const item of queue) {
		sum += item.id;
	}

	return sum;
}

function createFlatQueue(data: TDataSet): FlatQueue<TDataItem> {
	const queue = new FlatQueue<TDataItem>();

	for (const item of data) {
		queue.push(item, item.priority);
	}

	return queue;
}

function drainFlatQueue(queue: FlatQueue<TDataItem>): number {
	let sum = 0;

	while (queue.length > 0) {
		const item = queue.pop();
		if (item != null) {
			sum += item.id;
		}
	}

	return sum;
}

function comparePriority(a: TDataItem, b: TDataItem): number {
	return a.priority - b.priority;
}
