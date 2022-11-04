import { useCallback, useEffect, useState } from 'react';

import { ViewboxData } from '../models/models';

const MOVE_AMOUNT = 200;
const ZOOM_AMOUNT = 200;
const DEFAULT_ZOOM_LEVEL = 4;

export const useCameraTools = (canvasDimensions: { width: number; height: number }) => {
	const [scaleValue, setScaleValue] = useState(1);
	const [viewbox, setViewBox] = useState<ViewboxData>({
		width: canvasDimensions.width,
		height: canvasDimensions.height,
		originX: 0,
		originY: 0,
		zoomFactor: 1,
		zoomLevel: DEFAULT_ZOOM_LEVEL
	});

	useEffect(() => {
		setViewBox((prev) => ({
			...prev,
			width: canvasDimensions.width,
			height: canvasDimensions.height
		}));
	}, [canvasDimensions]);

	const handleCameraChange = useCallback(
		(lens: string, xmove: number, xview = 0) => {
			if (lens == 'zoomout' && viewbox.zoomLevel > 1 && viewbox.zoomLevel < 17) {
				const newWidth = viewbox.width + xmove;
				setViewBox((prev) => {
					const ratio_viewbox = (prev.height + xmove) / newWidth;

					const newVal = {
						zoomLevel: prev.zoomLevel - 1,
						zoomFactor: newWidth / canvasDimensions.width,
						width: newWidth,
						height: newWidth * ratio_viewbox,
						originX: prev.originX - xmove / 2,
						originY: prev.originY - (xmove / 2) * ratio_viewbox
					};
					return newVal;
				});
				const ratioWidthZoom = canvasDimensions.width / newWidth;
				setScaleValue(ratioWidthZoom);
				return;
			} else if (lens == 'zoomin' && viewbox.zoomLevel < 14 && viewbox.zoomLevel > 0) {
				const newWidth = viewbox.width - xmove;

				setViewBox((prev) => {
					const ratio_viewbox = prev.height / newWidth;
					return {
						zoomLevel: prev.zoomLevel + 1,
						zoomFactor: newWidth / canvasDimensions.width,
						width: newWidth,
						height: newWidth * ratio_viewbox,
						originX: prev.originX + xmove / 2,
						originY: prev.originY + (xmove / 2) * ratio_viewbox
					};
				});
				const ratioWidthZoom = canvasDimensions.width / newWidth;
				setScaleValue(ratioWidthZoom);
				return;
			}

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

	const zoomIn = useCallback(() => {
		handleCameraChange('zoomin', ZOOM_AMOUNT, 50);
	}, [handleCameraChange]);

	const zoomOut = useCallback(() => {
		handleCameraChange('zoomout', ZOOM_AMOUNT, 50);
	}, [handleCameraChange]);

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
