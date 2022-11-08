import { SelectedWallData } from '../../components/FloorPlannerCanvas/FloorPlannerCanvas';
import {
	CursorType,
	DeviceMetaData,
	Mode,
	NodeMoveData,
	ObjectEquationData,
	ObjectMetaData,
	Point2D,
	RoomMetaData,
	SnapData,
	ViewboxData,
	WallMetaData
} from '../../models/models';
import { CanvasState } from '../';
import { handleMouseMoveBindMode } from './BindModeMouseMoveHandler';
import { handleMouseMoveObjectMode } from './ObjectModeMouseMoveHandler';
import { handleMouseMoveOpeningMode } from './OpeningMouseMoveHandler';
import { handleMouseMoveRoomMode } from './RoomModeMoveHandler';
import { handleMouseMoveSelectMode } from './SelectModeMouseMoveHandler';

export const handleMouseMove = (
	mode: Mode,
	action: boolean,
	snap: SnapData,
	canvasState: CanvasState,
	openingType: string,
	objectType: string,
	viewbox: ViewboxData,
	wallMetaData: WallMetaData[],
	wallUnderCursor: WallMetaData | null,
	setWallMetaData: (w: WallMetaData[]) => void,
	roomMetaData: RoomMetaData[],
	objectMetaData: ObjectMetaData[],
	setObjectMetaData: (o: ObjectMetaData[]) => void,
	setCursor: (crsr: CursorType) => void,
	setWallUnderCursor: (wall: WallMetaData | null) => void,
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
	if (
		![
			Mode.Device,
			Mode.Object,
			Mode.Room,
			Mode.Opening,
			Mode.Select,
			Mode.Line,
			Mode.Partition,
			Mode.Bind
		].includes(mode)
	)
		return;
	switch (mode) {
		case Mode.Object: {
			handleMouseMoveObjectMode(
				snap,
				objectType,
				viewbox,
				wallMetaData,
				objectBeingMoved,
				setObjectBeingMoved
			);
			break;
		}
		case Mode.Room:
			handleMouseMoveRoomMode(snap, roomMetaData, setRoomUnderCursor);
			break;
		case Mode.Opening: {
			handleMouseMoveOpeningMode(
				snap,
				openingType,
				viewbox,
				wallMetaData,
				objectBeingMoved,
				setObjectBeingMoved
			);
			break;
		}
		case Mode.Select: {
			handleMouseMoveSelectMode(
				snap,
				viewbox,
				setCursor,
				wallMetaData,
				objectMetaData,
				setWallUnderCursor,
				setObjectUnderCursor,
				objectBeingMoved,
				setObjectBeingMoved,
				setNodeUnderCursor,
				setInWallMeasurementText,
				deviceUnderCursor
			);
			break;
		}
		case Mode.Line:
		case Mode.Partition:
			break;
		case Mode.Bind: {
			handleMouseMoveBindMode(
				snap,
				action,
				setCursor,
				canvasState,
				wallMetaData,
				wallUnderCursor,
				objectMetaData,
				setObjectMetaData,
				setWallMetaData,
				objectBeingMoved,
				setObjectBeingMoved,
				nodeBeingMoved,
				setNodeBeingMoved,
				setInWallMeasurementText,
				objectEquationData,
				selectedWallData?.equationData,
				deviceBeingMoved
			);
			break;
		}
		default:
			break;
	}
};
