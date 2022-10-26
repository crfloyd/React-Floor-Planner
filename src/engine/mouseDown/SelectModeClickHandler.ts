import {
	DeviceMetaData,
	Mode,
	NodeMoveData,
	ObjectEquationData,
	ObjectMetaData,
	Point2D,
	ViewboxData,
	WallEquationGroup,
	WallMetaData
} from '../../models/models';
import { calculateSnap } from '../../utils/utils';
import { CanvasState } from '../';
import { handleSelectModeNodeClicked } from './SelectModeNodeClickHandler';
import { handleSelectModeSegmentClicked } from './SelectModeSegmentClickHandler';

interface Props {
	event: React.TouchEvent | React.MouseEvent;
	setPoint: (p: Point2D) => void;
	wallUnderCursor: WallMetaData | null;
	canvasState: CanvasState;
	viewbox: ViewboxData;
	objectMetaData: ObjectMetaData[];
	wallMetaData: WallMetaData[];
	setWallMetaData: (w: WallMetaData[]) => void;
	setSelectedWallData: (data: { wall: WallMetaData; before: Point2D }) => void;
	nodeUnderCursor: Point2D | undefined;
	setNodeBeingMoved: (data: NodeMoveData | undefined) => void;
	setWallEquationData: (e: WallEquationGroup) => void;
	setDragging: (d: boolean) => void;
	objectUnderCursor: ObjectMetaData | undefined;
	setObjectBeingMoved: (o: ObjectMetaData | null) => void;
	deviceUnderCursor: DeviceMetaData | undefined;
	// setDeviceBeingMoved: (d: DeviceMetaData | undefined) => void;
}

export const handleSelectModeClick = ({
	event,
	canvasState: { setMode, setAction, followerData },
	viewbox,
	objectMetaData,
	wallMetaData,
	setWallMetaData,
	setSelectedWallData,
	setPoint,
	wallUnderCursor,
	nodeUnderCursor,
	setNodeBeingMoved,
	setWallEquationData,
	setDragging,
	objectUnderCursor,
	setObjectBeingMoved,
	deviceUnderCursor
}: Props) => {
	if (deviceUnderCursor) {
		setMode(Mode.Bind);
		setAction(true);
		return;
	}

	if (nodeUnderCursor) {
		setMode(Mode.Bind);
		setAction(true);
		setPoint({ ...nodeUnderCursor });

		const { nodeWalls, nodeWallObjects } = handleSelectModeNodeClicked({
			x: nodeUnderCursor.x,
			y: nodeUnderCursor.y,
			wallMeta: wallMetaData,
			objectMeta: objectMetaData
		});

		setNodeBeingMoved({
			node: nodeUnderCursor,
			connectedWalls: nodeWalls,
			connectedObjects: nodeWallObjects
		});
		return;
	}

	if (wallUnderCursor) {
		setMode(Mode.Bind);
		setAction(true);
		const {
			selectedWallData,
			wallMeta: wallMetaResult,
			wallEquations
		} = handleSelectModeSegmentClicked(wallUnderCursor, wallMetaData, followerData);
		setSelectedWallData(selectedWallData);
		setWallMetaData(wallMetaResult);
		setWallEquationData(wallEquations);
		return;
	}

	if (objectUnderCursor) {
		setObjectBeingMoved(objectUnderCursor);
		console.log('Object Being Moved');
		setMode(Mode.Bind);
		setAction(true);
		return;
	}

	setAction(false);
	setDragging(true);
	const snap = calculateSnap(event, viewbox);
	setPoint({ x: snap.xMouse, y: snap.yMouse });
};
