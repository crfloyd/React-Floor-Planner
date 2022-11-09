import { DeviceMetaData, ObjectMetaData, Point2D, ViewboxData, WallMetaData } from '../models';
import {
	FollowerData,
	NodeMoveData,
	ObjectEquationData,
	RoomDisplayData,
	RoomMetaData,
	SelectedWallData
} from '../models/models';
import { useHandleCanvasMouseDown } from './useHandleCanvasMouseDown';
import { useHandleCanvasMouseMove } from './useHandleCanvasMouseMove';
import { useHandleCanvasMouseUp } from './useHandleCanvasMouseUp';

interface Props {
	snapPosition: Point2D;
	point: Point2D;
	setPoint: (p: Point2D) => void;
	viewbox: ViewboxData;
	startWallDrawing: (startPoint: Point2D) => void;
	setSelectedWallData: (data: SelectedWallData) => void;
	setObjectBeingMoved: (o: ObjectMetaData | null) => void;
	nodeUnderCursor: Point2D | undefined;
	setNodeBeingMoved: (n: NodeMoveData | undefined) => void;
	setDragging: (d: boolean) => void;
	objectUnderCursor: ObjectMetaData | undefined;
	deviceUnderCursor: DeviceMetaData | undefined;
	followerData: FollowerData;
	save: () => void;
	roomClicked: (data: RoomDisplayData) => void;
	continuousWallMode: boolean;
	startModifyingOpening: (object: ObjectMetaData) => void;
	wallClicked: (wall: WallMetaData) => void;
	roomMetaData: RoomMetaData[];
	wallEndConstructionData: { start: Point2D; end: Point2D } | null;
	wallConstructionShouldEnd: boolean;
	selectedWallData: SelectedWallData | undefined;
	objectBeingMoved: ObjectMetaData | null;
	roomUnderCursor: RoomMetaData | undefined;
	selectRoomUnderCursor: () => void;
	clearWallHelperState: () => void;
	deviceBeingMoved: DeviceMetaData | undefined;
	setDevices: React.Dispatch<React.SetStateAction<DeviceMetaData[]>>;
	openingType: string;
	objectType: string;
	setObjectUnderCursor: (o: ObjectMetaData | undefined) => void;
	setNodeUnderCursor: (p: Point2D | undefined) => void;
	nodeBeingMoved: NodeMoveData | undefined;
	setRoomUnderCursor: (r: RoomMetaData | undefined) => void;
	setInWallMeasurementText: (wall: WallMetaData, objects: ObjectMetaData[]) => void;
	objectEquationData: ObjectEquationData[];
}

export const useHandleCanvasInput = ({
	point,
	setPoint,
	viewbox,
	startWallDrawing,
	setSelectedWallData,
	nodeUnderCursor,
	setNodeBeingMoved,
	setDragging,
	objectUnderCursor,
	setObjectBeingMoved,
	deviceUnderCursor,
	followerData,
	wallClicked,
	roomClicked,
	continuousWallMode,
	clearWallHelperState,
	deviceBeingMoved,
	objectBeingMoved,
	roomMetaData,
	roomUnderCursor,
	save,
	selectRoomUnderCursor,
	selectedWallData,
	setDevices,
	snapPosition,
	startModifyingOpening,
	wallConstructionShouldEnd,
	wallEndConstructionData,
	openingType,
	objectType,
	setObjectUnderCursor,
	setNodeUnderCursor,
	nodeBeingMoved,
	setRoomUnderCursor,
	setInWallMeasurementText,
	objectEquationData
}: Props) => {
	const handleMouseDown = useHandleCanvasMouseDown({
		setPoint,
		viewbox,
		startWallDrawing,
		setSelectedWallData,
		nodeUnderCursor,
		setNodeBeingMoved,
		setDragging,
		objectUnderCursor,
		setObjectBeingMoved,
		deviceUnderCursor,
		followerData
	});

	const handleMouseUp = useHandleCanvasMouseUp(
		snapPosition,
		point,
		setPoint,
		followerData,
		save,
		roomClicked,
		continuousWallMode,
		startModifyingOpening,
		wallClicked,
		roomMetaData,
		wallEndConstructionData,
		wallConstructionShouldEnd,
		startWallDrawing,
		selectedWallData,
		objectBeingMoved,
		setObjectBeingMoved,
		setNodeBeingMoved,
		roomUnderCursor,
		selectRoomUnderCursor,
		clearWallHelperState,
		deviceBeingMoved,
		setDevices
	);

	const handleMouseMove = useHandleCanvasMouseMove(
		snapPosition,
		followerData,
		openingType,
		objectType,
		viewbox,
		roomMetaData,
		setObjectUnderCursor,
		objectBeingMoved,
		setObjectBeingMoved,
		setNodeUnderCursor,
		nodeBeingMoved,
		setNodeBeingMoved,
		setRoomUnderCursor,
		setInWallMeasurementText,
		objectEquationData,
		deviceBeingMoved,
		deviceUnderCursor,
		selectedWallData
	);

	return { handleMouseDown, handleMouseUp, handleMouseMove };
};
