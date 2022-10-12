import { CursorType, Mode, ViewboxData } from "../../models";
import { nearWall } from "../../svgTools";
import { calculateSnap } from "../../utils";
import { CanvasState } from "../CanvasState";
import { handleSelectModeClick } from "./SelectModeClickHandler";

interface Props {
	event: React.TouchEvent | React.MouseEvent;
	canvasState: CanvasState;
	setCursor: (crsr: CursorType) => void;
	viewbox: ViewboxData;
}

export const handleMouseDown = ({
	event,
	canvasState,
	setCursor,
	viewbox,
}: Props) => {
	event?.preventDefault();

	const { mode, action, setPoint, wallMeta, setAction } = canvasState;
	switch (mode) {
		case Mode.Line:
		case Mode.Partition: {
			if (!action) {
				const snap = calculateSnap(event, viewbox);
				setPoint({ x: snap.x, y: snap.y });
				const near = nearWall(snap, wallMeta, 12);
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
			handleSelectModeClick({ event, canvasState, viewbox });
		}
	}
};
