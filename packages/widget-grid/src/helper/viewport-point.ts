import { TBoundingRect, TXYPosition } from '../types';

export function windowPointToViewportPoint(
	point: TXYPosition,
	boundingRect: TBoundingRect = { left: 0, top: 0 }
): TXYPosition {
	return { x: point.x - boundingRect.left, y: point.y - boundingRect.top };
}

export function pointerEventToViewportPoint(
	pointerEvent: { clientX: number; clientY: number },
	boundingRect: TBoundingRect = { left: 0, top: 0 }
): TXYPosition {
	return windowPointToViewportPoint(
		{ x: pointerEvent.clientX, y: pointerEvent.clientY },
		boundingRect
	);
}
