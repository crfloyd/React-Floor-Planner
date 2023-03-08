import { useCallback, useEffect, useState } from 'react';

import { Point2D, ViewboxData } from '../models/models';

const MOVE_AMOUNT = 200;
const DEFAULT_ZOOM_LEVEL = 4;
const MAX_ZOOM_LEVEL = 9;

export const useCameraTools = (
	canvasDimensions: {
		width: number;
		height: number;
		top: number;
		left: number;
	},
	getLocalCoords: (pt: Point2D) => Point2D | undefined
) => {
	const [scaleValue, setScaleValue] = useState(1);
	const [viewbox, setViewBox] = useState<ViewboxData>({
		width: canvasDimensions.width,
		height: canvasDimensions.height,
		originX: canvasDimensions.left,
		originY: canvasDimensions.top,
		zoomFactor: 1,
		zoomLevel: DEFAULT_ZOOM_LEVEL
	});

	useEffect(() => {
		console.log('canvas dimensions changed', canvasDimensions);
		setViewBox((prev) => ({
			...prev,
			width: canvasDimensions.width,
			height: canvasDimensions.height,
			originX: canvasDimensions.left,
			originY: canvasDimensions.top
		}));
	}, [canvasDimensions]);

	const resetCamera = useCallback(() => {
		setViewBox({
			width: canvasDimensions.width,
			height: canvasDimensions.height,
			originX: 0,
			originY: 0,
			zoomFactor: 1,
			zoomLevel: DEFAULT_ZOOM_LEVEL
		});
	}, [canvasDimensions]);

	const zoom = useCallback(
		(delta: number, direction: 'in' | 'out', point?: Point2D) => {
			if (direction === 'out' && viewbox.zoomLevel >= MAX_ZOOM_LEVEL) return;
			if (direction === 'in' && viewbox.zoomLevel <= 0) return;
			const scaleFactor = 1.2;
			// const normalized = delta % 120 == 0 ? delta / 120 : delta / 12;
			// const normalized = -(delta % 3 ? delta * 10 : delta / 3);
			const scaleDelta = delta > 0 ? 1 / scaleFactor : scaleFactor;
			let localPoint: Point2D = { x: 0, y: 0 };
			if (point) {
				localPoint = getLocalCoords(point) ?? { x: 0, y: 0 };
			} else {
				localPoint = {
					x: viewbox.originX + viewbox.width / 2,
					y: viewbox.originY + viewbox.height / 2
				};
			}

			setViewBox((prev) => {
				const deltaX = (localPoint.x - prev.originX) * (scaleDelta - 1);
				const deltaY = (localPoint.y - prev.originY) * (scaleDelta - 1);
				const newVal = {
					originX: prev.originX - deltaX,
					originY: prev.originY - deltaY,
					width: prev.width * scaleDelta,
					height: prev.height * scaleDelta,
					zoomFactor: (prev.width * scaleDelta) / canvasDimensions.width,
					zoomLevel: direction === 'in' ? prev.zoomLevel - 1 : prev.zoomLevel + 1
				};
				const ratioWidthZoom = canvasDimensions.width / newVal.width;
				setScaleValue(ratioWidthZoom);
				return newVal;
			});
		},
		[
			canvasDimensions.width,
			getLocalCoords,
			viewbox.height,
			viewbox.originX,
			viewbox.originY,
			viewbox.width,
			viewbox.zoomLevel
		]
	);

	const zoomIn = (delta: number, point?: Point2D) => {
		zoom(delta, 'in', point);
	};

	const zoomOut = (delta: number, point?: Point2D) => {
		zoom(delta, 'out', point);
	};

	const moveCamera = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
		switch (direction) {
			case 'up':
				setViewBox((prev) => ({
					...prev,
					originY: prev.originY - MOVE_AMOUNT
				}));
				break;
			case 'down':
				setViewBox((prev) => ({
					...prev,
					originY: prev.originY + MOVE_AMOUNT
				}));
				break;
			case 'left':
				setViewBox((prev) => ({
					...prev,
					originX: prev.originX - MOVE_AMOUNT
				}));
				break;
			case 'right':
				setViewBox((prev) => ({
					...prev,
					originX: prev.originX + MOVE_AMOUNT
				}));
				break;
		}
	}, []);

	const dragCamera = useCallback((distX: number, distY: number) => {
		setViewBox((prev) => ({
			...prev,
			originX: prev.originX - distX,
			originY: prev.originY - distY
		}));
	}, []);

	return { viewbox, scaleValue, zoomIn, zoomOut, moveCamera, dragCamera, resetCamera };
};
