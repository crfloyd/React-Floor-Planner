import {
	CursorType,
	Mode,
	ObjectEquationData,
	ObjectMetaData,
	Point2D,
	RoomMetaData,
	RoomPolygonData,
	SnapData,
	ViewboxData,
	WallMetaData
} from '../../models/models';
import { CanvasState } from '../';
import { handleMouseMoveBindMode } from './BindModeMouseMoveHandler';
import { handleMouseMoveOverObject } from './ObjectModeMouseMoveHandler';
import { handleMouseMoveOpeningMode } from './OpeningMouseMoveHandler';
import { handleMouseMoveRoomMode } from './RoomModeMoveHandler';
import { handleMouseMoveSelectMode } from './SelectModeMouseMoveHandler';

export const handleMouseMove = (
	snap: SnapData,
	point: Point2D,
	target: EventTarget,
	canvasState: CanvasState,
	viewbox: ViewboxData,
	wallMetaData: WallMetaData[],
	setWallMetaData: (w: WallMetaData[]) => void,
	roomMetaData: RoomMetaData[],
	roomPolygonData: RoomPolygonData,
	objectMetaData: ObjectMetaData[],
	handleCameraChange: (lens: string, xmove: number, xview: number) => void,
	resetObjectEquationData: () => ObjectEquationData[],
	setCursor: (crsr: CursorType) => void,
	setWallUnderCursor: (wall: WallMetaData | null) => void
) => {
	if (
		![
			Mode.Object,
			Mode.Room,
			Mode.Opening,
			Mode.Select,
			Mode.Line,
			Mode.Partition,
			Mode.Bind
		].includes(canvasState.mode)
	)
		return;
	switch (canvasState.mode) {
		case Mode.Object:
			handleMouseMoveOverObject(snap, canvasState, viewbox, wallMetaData);
			break;
		case Mode.Room:
			handleMouseMoveRoomMode(snap, canvasState, roomMetaData, roomPolygonData);
			break;
		case Mode.Opening:
			handleMouseMoveOpeningMode(snap, canvasState, viewbox, wallMetaData);
			break;
		case Mode.Select:
			handleMouseMoveSelectMode(
				target,
				snap,
				canvasState,
				viewbox,
				setCursor,
				handleCameraChange,
				wallMetaData,
				objectMetaData,
				setWallUnderCursor,
				point
			);
			break;
		case Mode.Line:
		case Mode.Partition:
			break;
		case Mode.Bind:
			handleMouseMoveBindMode(
				snap,
				resetObjectEquationData,
				setCursor,
				canvasState,
				wallMetaData,
				objectMetaData,
				setWallMetaData
			);
			break;
		default:
			break;
	}
};
