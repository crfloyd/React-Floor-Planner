import {
	Mode,
	NodeMoveData,
	ObjectMetaData,
	Point2D,
	ViewboxData,
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
	objectBeingMoved: ObjectMetaData | null;
	nodeUnderCursor: Point2D | undefined;
	setNodeBeingMoved: (data: NodeMoveData | undefined) => void;
}

export const handleSelectModeClick = ({
	event,
	canvasState: {
		setMode,
		setAction,
		wallEquations,
		followerData,
		setObjectEquationData,
		setWallEquations,
		setDrag
	},
	viewbox,
	objectMetaData,
	wallMetaData,
	setWallMetaData,
	setSelectedWallData,
	setPoint,
	wallUnderCursor,
	objectBeingMoved,
	nodeUnderCursor,
	setNodeBeingMoved
}: Props) => {
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
			objectEquationData: objectEquationsResult,
			wallEquations: wallEquationsResult
		} = handleSelectModeSegmentClicked(
			wallUnderCursor,
			wallMetaData,
			objectMetaData,
			wallEquations,
			followerData
		);
		setSelectedWallData(selectedWallData);
		setWallMetaData(wallMetaResult);
		setObjectEquationData(objectEquationsResult);
		setWallEquations(wallEquationsResult);
		return;
	}

	if (objectBeingMoved) {
		setMode(Mode.Bind);
		setAction(true);
		return;
	}

	setAction(false);
	setDrag(true);
	const snap = calculateSnap(event, viewbox);
	setPoint({ x: snap.xMouse, y: snap.yMouse });
};
