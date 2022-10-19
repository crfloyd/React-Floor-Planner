import { Mode, ObjectMetaData, Point2D, ViewboxData, WallMetaData } from '../../models/models';
import { calculateSnap } from '../../utils/utils';
import { CanvasState } from '../CanvasState';
import { handleSelectModeNodeClicked } from './SelectModeNodeClickHandler';
import { handleSelectModeSegmentClicked } from './SelectModeSegmentClickHandler';

interface Props {
	event: React.TouchEvent | React.MouseEvent;
	setPoint: (p: Point2D) => void;
	canvasState: CanvasState;
	viewbox: ViewboxData;
	objectMetaData: ObjectMetaData[];
	wallMetaData: WallMetaData[];
	setWallMetaData: (w: WallMetaData[]) => void;
	setSelectedWallData: (data: { wall: WallMetaData; before: Point2D }) => void;
}

export const handleSelectModeClick = ({
	event,
	canvasState: {
		binder,
		setMode,
		setAction,
		wallEquations,
		followerData,
		setObjectEquationData,
		setWallEquations,
		setDrag,
		setCurrentNodeWallObjects,
		setCurrentNodeWalls
	},
	viewbox,
	objectMetaData,
	wallMetaData,
	setWallMetaData,
	setSelectedWallData,
	setPoint
}: Props) => {
	switch (binder?.type) {
		case 'segment': {
			setMode(Mode.Bind);
			setAction(true);
			$('#boxScale').hide(100);
			const {
				selectedWallData,
				wallMeta: wallMetaResult,
				objectEquationData: objectEquationsResult,
				wallEquations: wallEquationsResult
			} = handleSelectModeSegmentClicked(
				binder,
				wallMetaData,
				objectMetaData,
				wallEquations,
				followerData
			);
			setSelectedWallData(selectedWallData);
			setWallMetaData(wallMetaResult);
			setObjectEquationData(objectEquationsResult);
			setWallEquations(wallEquationsResult);
			break;
		}
		case 'node': {
			setMode(Mode.Bind);
			setAction(true);
			$('#boxScale').hide(100);
			const node = binder.data;
			setPoint({ x: node.x, y: node.y });

			const { nodeWalls, nodeWallObjects } = handleSelectModeNodeClicked({
				x: node.x,
				y: node.y,
				wallMeta: wallMetaData,
				objectMeta: objectMetaData
			});

			setCurrentNodeWallObjects(nodeWallObjects);
			setCurrentNodeWalls(nodeWalls);
			break;
		}
		case 'obj':
		case 'boundingBox': {
			setMode(Mode.Bind);
			setAction(true);
			break;
		}
		default: {
			setAction(false);
			setDrag(true);
			const snap = calculateSnap(event, viewbox);
			setPoint({ x: snap.xMouse, y: snap.yMouse });
			break;
		}
	}
};