import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { FloorPlanContext } from '../context/FloorPlanContext';
import { DeviceDisplayData, DeviceMetaData, Mode, Point2D } from '../models/models';
import { setMode } from '../store/floorPlanSlice';
import { RootState } from '../store/store';
import { pointInPolygon } from '../utils/svgTools';

export const useDevices = (
	mousePosition: Point2D,
	deviceDisplayData: DeviceDisplayData[],
	deviceBeingMoved: DeviceMetaData | undefined,
	setDeviceBeingMoved: React.Dispatch<React.SetStateAction<DeviceMetaData | undefined>>
) => {
	const mode = useSelector((state: RootState) => state.floorPlan.mode);
	const [deviceUnderCursor, setDeviceUnderCursor] = useState<DeviceMetaData>();

	const { deviceMetaData: devices, setDeviceMetaData: setDevices } = useContext(FloorPlanContext);

	const dispatch = useDispatch();

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
		if (!deviceUnderCursor || mode !== Mode.Bind) return;
		setDeviceBeingMoved(deviceUnderCursor);
	}, [mode, deviceUnderCursor, setDeviceBeingMoved]);

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

	/**
	 * If there is a device being moved, change to Device mode
	 */
	useEffect(() => {
		if (deviceBeingMoved) {
			dispatch(setMode(Mode.Device));
		}
	}, [deviceBeingMoved, dispatch]);

	/**
	 * If the device display data changes, update that device's meta data accordingly
	 */
	useEffect(() => {
		setDevices((prev) =>
			prev.map((d) => ({
				...d,
				state: deviceDisplayData.find((dd) => dd.id === d.id)?.status ?? d.state
			}))
		);
	}, [deviceDisplayData]);

	return { devices, setDevices, deviceUnderCursor };
};
