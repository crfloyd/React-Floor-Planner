import { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { FloorPlanContext } from '../context/FloorPlanContext';
import {
	DeviceMetaData,
	Mode,
	Point2D,
	RoomDisplayData,
	RoomMetaData,
	RoomPathData,
	RoomPolygonData
} from '../models/models';
import { RootState } from '../store/store';
import {
	calculateRoomBorderPathData,
	calculateRoomPathData,
	pointInPolygon,
	renderRooms
} from '../utils/svgTools';

export const useRooms = (
	selectedRoomData: RoomDisplayData | undefined,
	selectedRoomColor: string | undefined,
	deviceBeingMoved: DeviceMetaData | undefined,
	cursorPosition: Point2D,
	save: (roomMeta: RoomMetaData[]) => void
) => {
	const mode = useSelector((state: RootState) => state.floorPlan.mode);
	// const [roomMetaData, setRoomMetaData] = useState<RoomMetaData[]>([]);
	const { roomMetaData, setRoomMetaData } = useContext(FloorPlanContext);
	const [roomPolygonData, setRoomPolygonData] = useState<RoomPolygonData>({
		polygons: [],
		vertex: []
	});
	const [roomPathData, setRoomPathData] = useState<RoomPathData[]>([]);
	const [roomsToRender, setRoomsToRender] = useState<{
		roomData: RoomMetaData[];
		polygonData: RoomPolygonData;
	}>({ roomData: [], polygonData: { polygons: [], vertex: [] } });
	const [roomUnderCursor, setRoomUnderCursor] = useState<RoomMetaData | undefined>();
	const [selectedRoomRenderData, setSelectedRoomRenderData] = useState<
		{ path: string; selected: boolean; selectedColor: string | undefined } | undefined
	>();
	const { deviceMetaData: devices, setDeviceMetaData: setDevices } = useContext(FloorPlanContext);

	/**
	 * If there is a device being moved and the device is inside
	 * of a room, also set that room as the roomUnderCursor
	 */
	useEffect(() => {
		if (!deviceBeingMoved) return;

		let targetRoom: RoomMetaData | undefined = undefined;
		roomsToRender.roomData.forEach((room: RoomMetaData) => {
			if (
				pointInPolygon({ x: cursorPosition.x, y: cursorPosition.y }, room.coords) &&
				(targetRoom == null || targetRoom.area >= room.area)
			) {
				// console.log('Target room set to', room.name);
				targetRoom = room;
			}
		});
		setDevices((prev) => {
			const result = [...prev.filter((d) => d.id !== deviceBeingMoved.id)];
			const updatedDevice = prev.find((d) => d.id === deviceBeingMoved.id);
			if (updatedDevice) {
				updatedDevice.roomName = targetRoom?.name ?? '';
				deviceBeingMoved.roomName = updatedDevice.roomName;
				result.push(updatedDevice);
				// console.log('updated device to room:', targetRoom?.name);
			}
			return result;
		});
		setRoomUnderCursor(targetRoom);
	}, [deviceBeingMoved, roomsToRender.roomData, cursorPosition.x, cursorPosition.y, setDevices]);

	/**
	 * If a room updated with a name, ensure all devices in that room are
	 * assigned that room name
	 */
	useEffect(() => {
		let devicesUpdated = false;
		roomMetaData
			.filter((r) => r.name)
			.forEach((room) => {
				devices.forEach((device) => {
					// console.log(device.name, 'coords:', device.x, device.y, 'room:', room.coords);
					if (
						device.roomName !== room.name &&
						pointInPolygon({ x: device.x, y: device.y }, room.coords)
					) {
						devicesUpdated = true;
						device.roomName = room.name;
						// console.log('setting device room to', room.name);
					}
				});
			});
		if (devicesUpdated) {
			setDevices([...devices]);
		}
	}, [roomMetaData, setDevices]);

	/**
	 * If there is not device being moved and not in room mode
	 * then reset both roomUnderCursor and selectedRoomRenderData
	 */
	useEffect(() => {
		if (mode !== Mode.Room && mode !== Mode.EditRoom && !deviceBeingMoved) {
			setRoomUnderCursor(undefined);
			setSelectedRoomRenderData(undefined);
		}
	}, [deviceBeingMoved, mode]);

	/**
	 * Whenever the room polygon data changes, calculate the
	 * render data and set to state
	 */
	useEffect(() => {
		setRoomMetaData((prev) => {
			return renderRooms(roomPolygonData, prev);
		});
	}, [roomPolygonData, setRoomMetaData]);

	/**
	 * Whenever the room polygon data changes, update the
	 * device room names assigned to that room
	 */
	useEffect(() => {
		let devicesUpdated = false;
		roomMetaData.forEach((room) => {
			devices.forEach((device) => {
				const insideRoom = pointInPolygon({ x: device.x, y: device.y }, room.coords);
				if (insideRoom) {
					if (device.roomName !== room.name) {
						// console.log('adding device', device.name, 'to room', room.name);
						devicesUpdated = true;
						device.roomName = room.name;
					}
				} else {
					if (device.roomName === room.name) {
						// console.log('removing device', device.name, 'from room', room.name);
						devicesUpdated = true;
						device.roomName = '';
					}
				}
			});
		});

		if (devicesUpdated) {
			// devices.forEach((d) => console.log(d.name, ':', d.roomName));
			setDevices([...devices]);
		}
	}, [roomMetaData]);

	/**
	 * Whenever the selected room data changes, update that room's
	 * render data accordingly
	 */
	useEffect(() => {
		if (!selectedRoomData) return;

		const updateRoomData = (roomData: RoomMetaData[]) => {
			const selectedRoomMeta = roomData.filter((r) => r.id === selectedRoomData.roomId)[0];
			if (selectedRoomMeta) {
				selectedRoomMeta.color = selectedRoomData.background;
				selectedRoomMeta.name = selectedRoomData.name;
			}
			return [...roomData];
		};

		setRoomsToRender((prev) => {
			const updatedRoomData = updateRoomData(prev.roomData);
			return { ...prev, roomData: updatedRoomData };
		});

		setRoomMetaData((prev) => {
			return updateRoomData(prev);
		});
	}, [selectedRoomData, setRoomMetaData]);

	/**
	 * Whenever the room data changes, re-render, and set to state
	 */
	useEffect(() => {
		const updatedRoomData = renderRooms(roomPolygonData, roomMetaData);
		setRoomsToRender({ roomData: updatedRoomData, polygonData: roomPolygonData });
	}, [roomMetaData, roomPolygonData]);

	/** Calculate the path for the highlight box and set to state
	 * whenever the room under cursor changes (in ROOM mode)
	 */
	useEffect(() => {
		if (mode !== Mode.Room && !deviceBeingMoved) return;

		if (!roomUnderCursor) {
			setSelectedRoomRenderData(undefined);
			return;
		}

		const highlightPath = calculateRoomBorderPathData(roomUnderCursor, roomPolygonData);
		setSelectedRoomRenderData({
			path: highlightPath,
			selected: false,
			selectedColor: 'none'
		});
	}, [deviceBeingMoved, mode, roomPolygonData, roomUnderCursor]);

	useEffect(() => {
		if (selectedRoomColor) {
			setSelectedRoomRenderData((prev) => {
				// console.log('updating to', prev ? selectedRoomColor : undefined);
				return prev ? { ...prev, selectedColor: selectedRoomColor } : undefined;
			});
		} else {
			setSelectedRoomRenderData(undefined);
		}
	}, [selectedRoomColor]);

	/**
	 * Calculate and set the svg path data for rooms whenever the
	 * room polygon data or roomMetaData is updated
	 */
	useEffect(() => {
		const pathData = calculateRoomPathData(roomsToRender.roomData, roomsToRender.polygonData);
		setRoomPathData(pathData);
		// console.log('re-rendered rooms', roomsToRender);
	}, [roomsToRender]);

	return {
		roomsToRender,
		roomPathData,
		roomUnderCursor,
		setRoomUnderCursor,
		setSelectedRoomRenderData,
		selectedRoomRenderData,
		setRoomPolygonData
	};
};
