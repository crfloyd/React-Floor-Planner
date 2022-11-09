import { useCallback, useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { FloorPlanContext } from '../context/FloorPlanContext';
import {
	handleMouseMoveBindMode,
	handleMouseMoveObjectMode,
	handleMouseMoveOpeningMode,
	handleMouseMoveSelectMode
} from '../engine';
import {
	CursorType,
	DeviceMetaData,
	ObjectMetaData,
	Point2D,
	RoomMetaData,
	ViewboxData,
	WallMetaData
} from '../models';
import {
	FollowerData,
	Mode,
	NodeMoveData,
	ObjectEquationData,
	SelectedWallData
} from '../models/models';
import { setCursor } from '../store/floorPlanSlice';
import { RootState } from '../store/store';
import { pointInPolygon } from '../utils/svgTools';

export const useHandleCanvasMouseMove = (
	snapPosition: Point2D,
	followerData: FollowerData,
	openingType: string,
	objectType: string,
	viewbox: ViewboxData,
	roomMetaData: RoomMetaData[],
	setObjectUnderCursor: (o: ObjectMetaData | undefined) => void,
	objectBeingMoved: ObjectMetaData | null,
	setObjectBeingMoved: (o: ObjectMetaData | null) => void,
	setNodeUnderCursor: (p: Point2D | undefined) => void,
	nodeBeingMoved: NodeMoveData | undefined,
	setNodeBeingMoved: (n: NodeMoveData | undefined) => void,
	setRoomUnderCursor: (r: RoomMetaData | undefined) => void,
	setInWallMeasurementText: (wall: WallMetaData, objects: ObjectMetaData[]) => void,
	objectEquationData: ObjectEquationData[],
	deviceBeingMoved: DeviceMetaData | undefined,
	deviceUnderCursor: DeviceMetaData | undefined,
	selectedWallData: SelectedWallData | undefined
) => {
	const dispatch = useDispatch();
	const mode = useSelector((state: RootState) => state.floorPlan.mode);
	const action = useSelector((state: RootState) => state.floorPlan.action);
	const updateCursor = useCallback((cursor: CursorType) => dispatch(setCursor(cursor)), [dispatch]);
	const {
		wallMetaData,
		setWallMetaData,
		objectMetaData,
		setObjectMetaData,
		wallUnderCursor,
		setWallUnderCursor
	} = useContext(FloorPlanContext);

	const modeFilter = useMemo(
		() => [
			Mode.Device,
			Mode.Object,
			Mode.Room,
			Mode.Opening,
			Mode.Select,
			Mode.Line,
			Mode.Partition,
			Mode.Bind
		],
		[]
	);

	const handleObjectMode = useCallback(() => {
		handleMouseMoveObjectMode(
			snapPosition,
			objectType,
			viewbox,
			wallMetaData,
			objectBeingMoved,
			setObjectBeingMoved
		);
	}, [objectBeingMoved, objectType, setObjectBeingMoved, snapPosition, viewbox, wallMetaData]);

	const handleRoomMode = useCallback(() => {
		let targetRoom: RoomMetaData | undefined = undefined;
		roomMetaData.forEach((room) => {
			if (
				pointInPolygon(snapPosition, room.coords) &&
				(targetRoom == null || targetRoom.area >= room.area)
			) {
				targetRoom = room;
			}
		});
		setRoomUnderCursor(targetRoom);
	}, [roomMetaData, setRoomUnderCursor, snapPosition]);

	const handleOpeningMode = useCallback(() => {
		handleMouseMoveOpeningMode(
			snapPosition,
			openingType,
			viewbox,
			wallMetaData,
			objectBeingMoved,
			setObjectBeingMoved
		);
	}, [objectBeingMoved, openingType, setObjectBeingMoved, snapPosition, viewbox, wallMetaData]);

	const handleSelectMode = useCallback(() => {
		handleMouseMoveSelectMode(
			snapPosition,
			viewbox,
			updateCursor,
			wallMetaData,
			objectMetaData,
			(w: WallMetaData | undefined) => setWallUnderCursor(w),
			setObjectUnderCursor,
			objectBeingMoved,
			setObjectBeingMoved,
			setNodeUnderCursor,
			setInWallMeasurementText,
			deviceUnderCursor
		);
	}, [
		deviceUnderCursor,
		objectBeingMoved,
		objectMetaData,
		setInWallMeasurementText,
		setNodeUnderCursor,
		setObjectBeingMoved,
		setObjectUnderCursor,
		setWallUnderCursor,
		snapPosition,
		updateCursor,
		viewbox,
		wallMetaData
	]);

	const handleBindMode = useCallback(() => {
		handleMouseMoveBindMode(
			snapPosition,
			action,
			updateCursor,
			followerData,
			wallMetaData,
			wallUnderCursor,
			objectMetaData,
			(o: ObjectMetaData[]) => setObjectMetaData(o),
			(w: WallMetaData[]) => setWallMetaData(w),
			objectBeingMoved,
			setObjectBeingMoved,
			nodeBeingMoved,
			setNodeBeingMoved,
			setInWallMeasurementText,
			objectEquationData,
			selectedWallData?.equationData,
			deviceBeingMoved
		);
	}, [
		action,
		deviceBeingMoved,
		followerData,
		nodeBeingMoved,
		objectBeingMoved,
		objectEquationData,
		objectMetaData,
		selectedWallData?.equationData,
		setInWallMeasurementText,
		setNodeBeingMoved,
		setObjectBeingMoved,
		setObjectMetaData,
		setWallMetaData,
		snapPosition,
		updateCursor,
		wallMetaData,
		wallUnderCursor
	]);

	const handleMouseMove = useCallback(() => {
		if (!modeFilter.includes(mode)) return;

		switch (mode) {
			case Mode.Object: {
				handleObjectMode();
				break;
			}
			case Mode.Room:
				handleRoomMode();
				break;
			case Mode.Opening: {
				handleOpeningMode();
				break;
			}
			case Mode.Select: {
				handleSelectMode();
				break;
			}
			case Mode.Line:
			case Mode.Partition:
				break;
			case Mode.Bind: {
				handleBindMode();
				break;
			}
			default:
				break;
		}
	}, [
		handleBindMode,
		handleObjectMode,
		handleOpeningMode,
		handleRoomMode,
		handleSelectMode,
		mode,
		modeFilter
	]);

	return handleMouseMove;
};
