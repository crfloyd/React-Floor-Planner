import {
	CursorType,
	Mode,
	ObjectMetaData,
	Point2D,
	ViewboxData,
	WallMetaData
} from '../../models/models';
import { findNearestWallInRange } from '../../utils/svgTools';
import { calculateSnap } from '../../utils/utils';
import { CanvasState } from '../';
import { handleSelectModeClick } from './SelectModeClickHandler';

interface Props {
	event: React.TouchEvent | React.MouseEvent;
	canvasState: CanvasState;
	setPoint: (p: Point2D) => void;
	setCursor: (crsr: CursorType) => void;
	viewbox: ViewboxData;
	wallMetaData: WallMetaData[];
	setWallMetaData: (w: WallMetaData[]) => void;
	objectMetaData: ObjectMetaData[];
	startWallDrawing: (startPoint: Point2D) => void;
	setSelectedWallData: (data: { wall: WallMetaData; before: Point2D }) => void;
}

export const handleMouseDown = ({
	event,
	canvasState,
	setPoint,
	setCursor,
	viewbox,
	wallMetaData,
	setWallMetaData,
	objectMetaData,
	startWallDrawing,
	setSelectedWallData
}: Props) => {
	event?.preventDefault();

	const { mode, action, setAction } = canvasState;
	switch (mode) {
		case Mode.Line:
		case Mode.Partition: {
			if (!action) {
				const snap = calculateSnap(event, viewbox);
				const nearestWallData = findNearestWallInRange(snap, wallMetaData, 12);
				if (nearestWallData) {
					const nearestPoint = { x: nearestWallData.x, y: nearestWallData.y };
					setPoint(nearestPoint);
					startWallDrawing(nearestPoint);
				} else {
					const nearestPoint = { x: snap.x, y: snap.y };
					setPoint(nearestPoint);
					startWallDrawing(nearestPoint);
				}
			}
			setAction(true);
			break;
		}
		case Mode.EditDoor: {
			setAction(true);
			setCursor('pointer');
			break;
		}
		case Mode.Select: {
			handleSelectModeClick({
				event,
				canvasState,
				viewbox,
				objectMetaData,
				wallMetaData,
				setWallMetaData,
				setSelectedWallData,
				setPoint
			});
		}
	}
};
