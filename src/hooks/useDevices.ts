import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { DeviceMetaData, Mode, Point2D } from '../models/models';
import { RootState } from '../store/store';
import { pointInPolygon } from '../utils/svgTools';

export const useDevices = (
	mousePosition: Point2D,
	deviceBeingMoved: DeviceMetaData | undefined,
	setDeviceBeingMoved: React.Dispatch<React.SetStateAction<DeviceMetaData | undefined>>
) => {
	const mode = useSelector((state: RootState) => state.floorPlan.mode);
	const [devices, setDevices] = useState<DeviceMetaData[]>([]);
	const [deviceUnderCursor, setDeviceUnderCursor] = useState<DeviceMetaData>();

	/**
	 * Whenever the mouse position changes in Select Mode,
	 * check for a device under the mouse and set to state
	 */
	useEffect(() => {
		if (mode !== Mode.Select) return;

		const nearDevices = devices.filter((d) => {
			const { width: w, height: h, x, y } = d;
			const poly = [
				{ x, y }, // top left
				{ x: x + w, y }, // top right
				{ x: x + w, y: y + h }, // bottom right
				{ x: x, y: y + h } // bottom left
			];
			return pointInPolygon({ x: mousePosition.x, y: mousePosition.y }, poly);
		});
		setDeviceUnderCursor(nearDevices[0]);
	}, [devices, mode, mousePosition]);

	/**
	 * If the mouse position changes in Bind mode and there,
	 * is a `deviceUnderCursor`, set that device to the
	 * `deviceBeingMoved`.
	 */
	useEffect(() => {
		if (!deviceUnderCursor || mode !== Mode.Bind || deviceBeingMoved) return;
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
