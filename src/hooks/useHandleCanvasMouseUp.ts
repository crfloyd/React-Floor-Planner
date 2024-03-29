import { useCallback, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { constants } from '../constants';
import { FloorPlanContext } from '../context/FloorPlanContext';
import {
	CursorType,
	DeviceMetaData,
	FollowerData,
	Mode,
	NodeMoveData,
	ObjectMetaData,
	Point2D,
	RoomDisplayData,
	RoomMetaData,
	SelectedWallData,
	WallMetaData
} from '../models/models';
import { Wall } from '../models/Wall';
import { setAction, setCursor, setMode } from '../store/floorPlanSlice';
import { RootState } from '../store/store';
import { getUpdatedObject } from '../utils/svgTools';
import { distanceBetween } from '../utils/utils';

export const useHandleCanvasMouseUp = (
	snapPosition: Point2D,
	point: Point2D,
	setPoint: (p: Point2D) => void,
	followerData: FollowerData,
	save: () => void,
	saveWalls: () => void,
	saveObjects: (objects: ObjectMetaData[]) => void,
	roomClicked: (data: RoomDisplayData) => void,
	continuousWallMode: boolean,
	startModifyingOpening: (object: ObjectMetaData) => void,
	wallClicked: (wall: WallMetaData) => void,
	roomMetaData: RoomMetaData[],
	wallEndConstructionData: { start: Point2D; end: Point2D } | null,
	wallConstructionShouldEnd: boolean,
	startWallDrawing: (startPoint: Point2D) => void,
	selectedWallData: SelectedWallData | undefined,
	objectBeingMoved: ObjectMetaData | null,
	setObjectBeingMoved: (o: ObjectMetaData | null) => void,
	setNodeBeingMoved: (n: NodeMoveData | undefined) => void,
	roomUnderCursor: RoomMetaData | undefined,
	selectRoomUnderCursor: () => void,
	clearWallHelperState: () => void,
	deviceBeingMoved: DeviceMetaData | undefined,
	setDevices: React.Dispatch<React.SetStateAction<DeviceMetaData[]>>
) => {
	const dispatch = useDispatch();
	const mode = useSelector((state: RootState) => state.floorPlan.mode);

	const updateMode = useCallback((mode: Mode) => dispatch(setMode(mode)), [dispatch]);
	const updateCursor = useCallback((cursor: CursorType) => dispatch(setCursor(cursor)), [dispatch]);
	const updateAction = useCallback((action: boolean) => dispatch(setAction(action)), [dispatch]);

	const { wallMetaData, setWallMetaData, objectMetaData, setObjectMetaData } =
		useContext(FloorPlanContext);

	const handleDeviceMode = useCallback(() => {
		if (deviceBeingMoved) {
			setDevices((prev) => [...prev.filter((d) => d.id !== deviceBeingMoved.id), deviceBeingMoved]);
		}
		updateMode(Mode.Select);
		save();
	}, [deviceBeingMoved, save, setDevices, updateMode]);

	const handleObjectMode = useCallback(() => {
		let objects = objectMetaData;
		if (objectBeingMoved) {
			objects = [...objectMetaData, objectBeingMoved];
			setObjectMetaData(objects);
			setObjectBeingMoved(null);
		}
		updateMode(Mode.Select);
		saveObjects(objects);
	}, [
		objectMetaData,
		objectBeingMoved,
		updateMode,
		saveObjects,
		setObjectMetaData,
		setObjectBeingMoved
	]);

	const handleRoomMode = useCallback(() => {
		if (roomUnderCursor == null) {
			return;
		}
		const area = roomUnderCursor.area / 3600;
		selectRoomUnderCursor();
		roomClicked({
			roomId: roomUnderCursor.id,
			size: area.toFixed(2),
			roomIndex: roomMetaData.indexOf(roomUnderCursor),
			surface: roomUnderCursor.surface,
			showSurface: roomUnderCursor.showSurface,
			background: roomUnderCursor.color,
			name: roomUnderCursor.name,
			action: roomUnderCursor.action
		});

		updateMode(Mode.EditRoom);
		// save();
	}, [roomClicked, roomMetaData, roomUnderCursor, selectRoomUnderCursor, updateMode]);

	const handleOpeningMode = useCallback(() => {
		if (!objectBeingMoved) {
			updateMode(Mode.Select);
			return;
		}
		const newObjectBeingMoved = getUpdatedObject(objectBeingMoved);
		const updatedObjects = [...objectMetaData, newObjectBeingMoved];
		setObjectBeingMoved(null);
		setObjectMetaData(updatedObjects);
		updateMode(Mode.Select);
		saveObjects(updatedObjects);
	}, [
		objectBeingMoved,
		objectMetaData,
		setObjectBeingMoved,
		setObjectMetaData,
		updateMode,
		saveObjects
	]);

	const handleLineMode = useCallback(
		(wallEndData: { start: Point2D; end: Point2D } | null) => {
			clearWallHelperState();

			if (!wallEndData) {
				updateAction(false);
				updateMode(Mode.Select);
				setPoint({ x: snapPosition.x, y: snapPosition.y });
				return;
			}

			let sizeWall = distanceBetween(wallEndData.end, point) / constants.METER_SIZE;
			if (sizeWall > 0.3) {
				sizeWall = mode === Mode.Partition ? constants.PARTITION_SIZE : constants.WALL_SIZE;
				const wall = new Wall(wallEndData.start, wallEndData.end, 'normal', sizeWall);
				const updatedWalls = [...wallMetaData, wall];
				setWallMetaData(updatedWalls);

				const contiueCreatingWalls = continuousWallMode && !wallConstructionShouldEnd;
				if (contiueCreatingWalls) {
					updateCursor('validation');
					updateAction(true);
					startWallDrawing(wallEndData.end);
				} else {
					updateAction(false);
				}
				saveWalls();
			} else {
				updateAction(false);
				updateMode(Mode.Select);
				setPoint({ x: snapPosition.x, y: snapPosition.y });
			}
		},
		[
			clearWallHelperState,
			point,
			mode,
			wallMetaData,
			setWallMetaData,
			continuousWallMode,
			wallConstructionShouldEnd,
			saveWalls,
			updateCursor,
			updateAction,
			startWallDrawing,
			updateMode,
			setPoint,
			snapPosition.x,
			snapPosition.y
		]
	);

	const handleBindMode = useCallback(() => {
		let mode = Mode.Select;

		let objects = [...objectMetaData];
		if (objectBeingMoved?.type === 'boundingBox') {
			const moveObj =
				Math.abs(objectBeingMoved.oldXY.x - objectBeingMoved.x) +
				Math.abs(objectBeingMoved.oldXY.y - objectBeingMoved.y);
			const objTarget = objects.find((o) => o.id === objectBeingMoved.targetId);
			if (!objTarget?.params.move) {
				objects = objects.filter((o) => o !== objTarget);
			}
			if (moveObj < 1 && objTarget?.params.move) {
				mode = Mode.EditBoundingBox;
			} else {
				mode = Mode.Select;
				setObjectBeingMoved(null);
			}
		} else if (objectBeingMoved) {
			const objTarget = objects.find((o) => o.id === objectBeingMoved.targetId);
			const moveDistance =
				Math.abs(objectBeingMoved.oldXY.x - objectBeingMoved.x) +
				Math.abs(objectBeingMoved.oldXY.y - objectBeingMoved.y);
			if (moveDistance < 1 && objTarget) {
				setObjectBeingMoved(null);
				startModifyingOpening(objTarget);
				mode = Mode.EditDoor;
			} else {
				mode = Mode.Select;
				setObjectBeingMoved(null);
			}
		} else if (selectedWallData) {
			if (selectedWallData.wall.start == selectedWallData.before) {
				wallClicked(selectedWallData.wall);
				// mode = Mode.EditWall;
			}
			if (selectedWallData) {
				selectedWallData.equationData.equation1 = null;
				selectedWallData.equationData.equation2 = null;
				selectedWallData.equationData.equation3 = null;
				followerData.intersection = undefined;
			}
		}

		updateMode(mode);
		setObjectMetaData(objects);
		setNodeBeingMoved(undefined);
		save();
	}, [
		objectMetaData,
		objectBeingMoved,
		selectedWallData,
		updateMode,
		setObjectMetaData,
		setNodeBeingMoved,
		save,
		setObjectBeingMoved,
		startModifyingOpening,
		wallClicked,
		followerData
	]);

	const handleMouseUp = useCallback(() => {
		switch (mode) {
			case Mode.Device: {
				handleDeviceMode();
				break;
			}
			case Mode.Object: {
				handleObjectMode();
				break;
			}
			case Mode.Room: {
				handleRoomMode();
				break;
			}
			case Mode.Opening: {
				handleOpeningMode();
				break;
			}
			case Mode.Line:
			case Mode.Partition: {
				handleLineMode(wallEndConstructionData ? { ...wallEndConstructionData } : null);
				break;
			}
			case Mode.Bind: {
				handleBindMode();
				break;
			}
			default:
				break;
		}
	}, [
		handleBindMode,
		handleDeviceMode,
		handleLineMode,
		handleObjectMode,
		handleOpeningMode,
		handleRoomMode,
		mode,
		wallEndConstructionData
	]);

	return handleMouseUp;
};
