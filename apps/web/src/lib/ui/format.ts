import { TProjectDate } from '@/environment';

const MONTH_NAMES = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec'
];

export function formatProjectDate(date: TProjectDate): string {
	if (date.month == null) return String(date.year);
	return `${MONTH_NAMES[date.month - 1]} ${date.year}`;
}
