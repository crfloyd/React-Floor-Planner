import {
	CursorType,
	Mode,
	ObjectMetaData,
	ViewboxData,
	WallMetaData,
} from "../../models";
import { nearWall } from "../../svgTools";
import { calculateSnap } from "../../utils";
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
	setObjectMetaData: (o: ObjectMetaData[]) => void;
}

export const handleMouseDown = ({
	event,
	canvasState,
	setCursor,
	viewbox,
	wallMetaData,
	setWallMetaData,
	objectMetaData,
	setObjectMetaData,
}: Props) => {
	event?.preventDefault();

	const { mode, action, setPoint, setAction } = canvasState;
	switch (mode) {
		case Mode.Line:
		case Mode.Partition: {
			if (!action) {
				const snap = calculateSnap(event, viewbox);
				setPoint({ x: snap.x, y: snap.y });
				const near = nearWall(snap, wallMetaData, 12);
				if (near) {
					setPoint({ x: near.x, y: near.y });
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
				setObjectMetaData,
				wallMetaData,
				setWallMetaData,
			});
		}
	}
};
