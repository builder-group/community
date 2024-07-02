import { createState, withUndo } from 'feature-state';

export const $counter = withUndo(createState(0));
