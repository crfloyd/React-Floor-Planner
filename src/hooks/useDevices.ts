import React, { useEffect, useState } from 'react';

import { DeviceMetaData, Mode, Point2D } from '../models/models';
import { pointInPolygon } from '../utils/svgTools';

export const useDevices = (
	mousePosition: Point2D,
	mode: string,
	deviceBeingMoved: DeviceMetaData | undefined,
	setDeviceBeingMoved: React.Dispatch<React.SetStateAction<DeviceMetaData | undefined>>
) => {
	const [devices, setDevices] = useState<DeviceMetaData[]>([]);
	const [deviceUnderCursor, setDeviceUnderCursor] = useState<DeviceMetaData>();

	/**
	 * Whenever the mouse position changes in Select Mode,
	 * check for a device under the mouse and set to state
	 */
	useEffect(() => {
		if (mode !== Mode.Select) return;
		// console.log('SelectMode - setting device under cursor');

		const nearDevices = devices.filter((d) => {
			const { width: w, height: h, x, y } = d;
			const padding = 5;
			const poly = [
				{ x: x - w / 2 - padding, y: y - h / 2 - padding }, // top left
				{ x: x + w / 2 + padding, y: y - h / 2 - padding }, // top right
				{ x: x + w / 2 + padding, y: y + h / 2 + padding }, // bottom right
				{ x: x - w / 2 - padding, y: y + h / 2 + padding } // bottom left
			];
			return pointInPolygon({ x: mousePosition.x, y: mousePosition.y }, poly);
		});
		const underCursor = nearDevices.length > 0 ? nearDevices[0] : undefined;
		setDeviceUnderCursor(underCursor);
	}, [devices, mode, mousePosition]);

	/**
	 * If the mouse position changes in Bind mode and there,
	 * is a `deviceUnderCursor`, set that device to the
	 * `deviceBeingMoved`.
	 */
	useEffect(() => {
		if (!deviceUnderCursor || mode !== Mode.Bind || deviceBeingMoved) return;
		// console.log('BindMode - setting deviceBeingMoved');
		setDeviceBeingMoved(deviceUnderCursor);
	}, [mode, deviceUnderCursor, setDeviceBeingMoved, deviceBeingMoved]);

	/**
	 * Whenever the mouse position changes and there is,
	 * a `deviceBeingMoved`, set the deviceBeingMoved position
	 * to the current mouse position
	 */
	useEffect(() => {
		setDeviceBeingMoved((prev) => {
			if (!prev) return prev;
			// console.log('updating deviceBeingMoved position');
			return { ...prev, x: mousePosition.x - prev.width / 2, y: mousePosition.y - prev.height / 2 };
		});
	}, [setDeviceBeingMoved, mousePosition]);

	/**
	 * If the mode changes to Select, remove the `deviceBeingMoved`
	 */
	useEffect(() => {
		if (mode !== Mode.Device && mode !== Mode.Bind) {
			setDeviceBeingMoved(undefined);
		}
	}, [mode, setDeviceBeingMoved]);

	return { devices, setDevices, deviceUnderCursor };
};
