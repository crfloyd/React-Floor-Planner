import { useEffect, useState } from "react";
import { ViewboxData } from "../models";

export const useCameraTools = (canvasDimensions: {
	width: number;
	height: number;
}) => {
	const [scaleValue, setScaleValue] = useState(1);
	const [viewbox, setViewBox] = useState<ViewboxData>({
		width: canvasDimensions.width,
		height: canvasDimensions.height,
		originX: 0,
		originY: 0,
		zoomFactor: 1,
		zoomLevel: 1,
	});

	useEffect(() => {
		setViewBox((prev) => ({
			...prev,
			width: canvasDimensions.width,
			height: canvasDimensions.height,
		}));
	}, [canvasDimensions]);

	const handleCameraChange = (lens: string, xmove: number, xview = 0) => {
		if (lens == "zoomout" && viewbox.zoomLevel > 1 && viewbox.zoomLevel < 17) {
			console.log("zooming out. canvas:", canvasDimensions);
			let newWidth = viewbox.width + xmove;
			setViewBox((prev) => {
				const ratio_viewbox = prev.height / newWidth;

				return {
					zoomLevel: prev.zoomLevel - 1,
					zoomFactor: prev.width / canvasDimensions.width,
					width: newWidth,
					height: newWidth * ratio_viewbox,
					originX: prev.originX - xmove / 2,
					originY: prev.originY - (xmove / 2) * ratio_viewbox,
				};
			});
			const ratioWidthZoom = canvasDimensions.width / newWidth;
			setScaleValue(ratioWidthZoom);
		} else if (
			lens == "zoomin" &&
			viewbox.zoomLevel < 14 &&
			viewbox.zoomLevel > 0
		) {
			let newWidth = viewbox.width - xmove;
			setViewBox((prev) => {
				const ratio_viewbox = prev.height / newWidth;
				return {
					zoomLevel: prev.zoomLevel + 1,
					zoomFactor: prev.width / canvasDimensions.width,
					width: newWidth,
					height: newWidth * ratio_viewbox,
					originX: prev.originX + xmove / 2,
					originY: prev.originY + (xmove / 2) * ratio_viewbox,
				};
			});
			const ratioWidthZoom = canvasDimensions.width / newWidth;
			setScaleValue(ratioWidthZoom);
		}

		const newZoomFactor = viewbox.width / canvasDimensions.width;
		if (lens == "zoomreset") {
			setViewBox({
				width: canvasDimensions.width,
				height: canvasDimensions.height,
				originX: 0,
				originY: 0,
				zoomFactor: 1,
				zoomLevel: viewbox.zoomLevel,
			});
		} else if (lens == "zoomright") {
			setViewBox((prev) => ({
				...prev,
				originX: prev.originX + xview,
				zoomFactor: newZoomFactor,
			}));
		} else if (lens == "zoomleft") {
			setViewBox((prev) => ({
				...prev,
				originX: prev.originX - xview,
				zoomFactor: newZoomFactor,
			}));
		} else if (lens == "zoomtop") {
			setViewBox((prev) => ({
				...prev,
				originY: prev.originY - xview,
				zoomFactor: newZoomFactor,
			}));
		} else if (lens == "zoombottom") {
			setViewBox((prev) => ({
				...prev,
				originY: prev.originY + xview,
				zoomFactor: newZoomFactor,
			}));
		} else if (lens == "zoomdrag") {
			setViewBox((prev) => ({
				...prev,
				originX: prev.originX - xmove,
				originY: prev.originY - xview,
				zoomFactor: newZoomFactor,
			}));
		} else {
			setViewBox((prev) => ({
				...prev,
				zoomFactor: newZoomFactor,
			}));
		}
	};

	return { viewbox, scaleValue, handleCameraChange };
};
