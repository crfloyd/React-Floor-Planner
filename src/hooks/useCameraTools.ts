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

	const handleCameraChange = useCallback(
		(lens: string, xmove: number, xview = 0) => {
			const newZoomFactor = viewbox.width / canvasDimensions.width;
			if (lens == 'zoomright') {
				setViewBox((prev) => ({
					...prev,
					originX: prev.originX + xview,
					zoomFactor: newZoomFactor
				}));
			} else if (lens == 'zoomleft') {
				setViewBox((prev) => ({
					...prev,
					originX: prev.originX - xview,
					zoomFactor: newZoomFactor
				}));
			} else if (lens == 'zoomtop') {
				setViewBox((prev) => ({
					...prev,
					originY: prev.originY - xview,
					zoomFactor: newZoomFactor
				}));
			} else if (lens == 'zoombottom') {
				setViewBox((prev) => ({
					...prev,
					originY: prev.originY + xview,
					zoomFactor: newZoomFactor
				}));
			} else if (lens == 'zoomdrag') {
				setViewBox((prev) => ({
					...prev,
					originX: prev.originX - xmove,
					originY: prev.originY - xview,
					zoomFactor: newZoomFactor
				}));
			} else {
				setViewBox((prev) => ({
					...prev,
					zoomFactor: newZoomFactor
				}));
			}
		},
		[canvasDimensions, viewbox.width, viewbox.zoomLevel]
	);

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

	const moveCamera = useCallback(
		(direction: 'up' | 'down' | 'left' | 'right') => {
			switch (direction) {
				case 'up':
					handleCameraChange('zoomtop', MOVE_AMOUNT, 50);
					break;
				case 'down':
					handleCameraChange('zoombottom', MOVE_AMOUNT, 50);
					break;
				case 'left':
					handleCameraChange('zoomleft', MOVE_AMOUNT, 50);
					break;
				case 'right':
					handleCameraChange('zoomright', MOVE_AMOUNT, 50);
					break;
				default:
					break;
			}
		},
		[handleCameraChange]
	);

	const dragCamera = useCallback(
		(distX: number, distY: number) => {
			handleCameraChange('zoomdrag', distX * viewbox.zoomFactor, distY * viewbox.zoomFactor);
		},
		[handleCameraChange, viewbox.zoomFactor]
	);

	return { viewbox, scaleValue, zoomIn, zoomOut, moveCamera, dragCamera, resetCamera };
};
