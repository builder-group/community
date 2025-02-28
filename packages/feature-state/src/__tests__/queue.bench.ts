import { bench, describe } from 'vitest';
import { FlatQueue } from '../FlatQueue';

function createDataSet(size: number): TDataSet {
	return Array(size)
		.fill(0)
		.map((_, i) => ({ id: i, priority: Math.random() }));
}

function initSortedArray(data: TDataSet): TDataItem[] {
	return [...data];
}

function initFlatQueue(data: TDataSet): FlatQueue<TDataItem> {
	const queue = new FlatQueue<TDataItem>();
	for (let i = 0; i < data.length; i++) {
		queue.push(data[i] as TDataItem, data[i]?.priority as number);
	}
	return queue;
}

function extractFromSortedArray(data: TDataItem[]): number {
	const sortedData = data.sort((a, b) => a.priority - b.priority); // Not sorting at init because thats how the Feature State queue works
	let sum = 0;
	for (let i = 0; i < sortedData.length; i++) {
		sum += sortedData[i]?.id as number;
	}
	return sum;
}

function extractFromFlatQueue(queue: FlatQueue<TDataItem>, count: number): number {
	let sum = 0;
	for (let i = 0; i < count; i++) {
		sum += queue.pop()?.id as number;
	}
	return sum;
}

// Create datasets of different sizes
const smallData: TDataSet = createDataSet(10);
const mediumData: TDataSet = createDataSet(1000);
const largeData: TDataSet = createDataSet(10000);

describe('Priority Queue Benchmark', () => {
	describe('Extraction Phase', () => {
		describe('Small Data (10 items)', () => {
			bench('Array Sort', () => {
				const data = initSortedArray(smallData);
				extractFromSortedArray(data);
			});

			bench('FlatQueue', () => {
				const queue = initFlatQueue(smallData);
				extractFromFlatQueue(queue, smallData.length);
			});
		});

		describe('Medium Data (1,000 items)', () => {
			bench('Array Sort', () => {
				const data = initSortedArray(mediumData);
				extractFromSortedArray(data);
			});

			bench('FlatQueue', () => {
				const queue = initFlatQueue(mediumData);
				extractFromFlatQueue(queue, mediumData.length);
			});
		});

		describe('Large Data (10,000 items)', () => {
			bench('Array Sort', () => {
				const data = initSortedArray(largeData);
				extractFromSortedArray(data);
			});

			bench('FlatQueue', () => {
				const queue = initFlatQueue(largeData);
				extractFromFlatQueue(queue, largeData.length);
			});
		});
	});

	describe('Total Operation', () => {
		describe('Small Data (10 items)', () => {
			bench('Array Sort', () => {
				const data = initSortedArray(smallData);
				extractFromSortedArray(data);
			});

			bench('FlatQueue', () => {
				const queue = initFlatQueue(smallData);
				extractFromFlatQueue(queue, smallData.length);
			});
		});

		describe('Medium Data (1,000 items)', () => {
			bench('Array Sort', () => {
				const data = initSortedArray(mediumData);
				extractFromSortedArray(data);
			});

			bench('FlatQueue', () => {
				const queue = initFlatQueue(mediumData);
				extractFromFlatQueue(queue, mediumData.length);
			});
		});

		describe('Large Data (10,000 items)', () => {
			bench('Array Sort', () => {
				const data = initSortedArray(largeData);
				extractFromSortedArray(data);
			});

			bench('FlatQueue', () => {
				const queue = initFlatQueue(largeData);
				extractFromFlatQueue(queue, largeData.length);
			});
		});
	});
});

interface TDataItem {
	id: number;
	priority: number;
}

type TDataSet = TDataItem[];
