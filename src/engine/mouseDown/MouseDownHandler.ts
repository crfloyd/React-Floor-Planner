import {
	CursorType,
	Mode,
	ObjectMetaData,
	Point2D,
	ViewboxData,
	WallMetaData,
} from "../../models/models";
import { nearWall } from "../../utils/svgTools";
import { calculateSnap } from "../../utils/utils";
import { CanvasState } from "../CanvasState";
import { handleSelectModeClick } from "./SelectModeClickHandler";

interface Props {
	event: React.TouchEvent | React.MouseEvent;
	canvasState: CanvasState;
	setCursor: (crsr: CursorType) => void;
	viewbox: ViewboxData;
	wallMetaData: WallMetaData[];
	setWallMetaData: (w: WallMetaData[]) => void;
	objectMetaData: ObjectMetaData[];
	startWallDrawing: (startPoint: Point2D) => void;
}

export const handleMouseDown = ({
	event,
	canvasState,
	setCursor,
	viewbox,
	wallMetaData,
	setWallMetaData,
	objectMetaData,
	startWallDrawing,
}: Props) => {
	event?.preventDefault();

	const { mode, action, setPoint, setAction } = canvasState;
	switch (mode) {
		case Mode.Line:
		case Mode.Partition: {
			if (!action) {
				const snap = calculateSnap(event, viewbox);
				const nearestWall = nearWall(snap, wallMetaData, 12);
				if (nearestWall) {
					const nearestPoint = { x: nearestWall.x, y: nearestWall.y };
					setPoint(nearestPoint);
					startWallDrawing(nearestPoint);
				} else {
					setPoint(snap);
					startWallDrawing(snap);
				}
			}
			setAction(true);
			break;
		}
		case Mode.EditDoor: {
			setAction(true);
			setCursor("pointer");
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
			});
		}
	}
};
