import {
	WallMetaData,
	ObjectMetaData,
	WallEquationGroup,
	WallEquation,
	Point2D,
	ObjectEquationData,
	ViewboxData,
	NodeWallObjectData,
	Mode,
} from "../../models";
import { nearWall } from "../../svgTools";
import { calculateSnap } from "../../utils";
import { handleSelectModeClick } from "./SelectModeClickHandler";

interface Props {
	event: React.TouchEvent | React.MouseEvent;
	mode: string;
	binder: any;
	setBinder: (newVal: any) => void;
	setMode: (newMode: string) => void;
	action: boolean;
	setAction: (on: boolean) => void;
	wallMeta: WallMetaData[];
	setWallMeta: (newData: WallMetaData[]) => void;
	objectMeta: ObjectMetaData[];
	wallEquations: WallEquationGroup;
	followerData: {
		equations: { wall: WallMetaData; eq: WallEquation; type: string }[];
		intersection: Point2D | null;
	};
	setObjectEquationData: (newData: ObjectEquationData[]) => void;
	setWallEquations: (newData: WallEquationGroup) => void;
	setPoint: (newPoint: Point2D) => void;
	setDrag: (shouldDrag: boolean) => void;
	viewbox: ViewboxData;
	setCurrentNodeWallObjects: (newData: NodeWallObjectData[]) => void;
	setCurrentNodeWalls: (newData: WallMetaData[]) => void;
	setCursor: (
		val:
			| "crosshair"
			| "move"
			| "pointer"
			| "validation"
			| "default"
			| "trash"
			| "scissor"
			| "grab"
	) => void;
}

export const handleMouseDown = (props: Props) => {
	props.event?.preventDefault();

	switch (props.mode) {
		case Mode.Line:
		case Mode.Partition: {
			if (!props.action) {
				const snap = calculateSnap(props.event, props.viewbox);
				props.setPoint({ x: snap.x, y: snap.y });
				const near = nearWall(snap, props.wallMeta, 12);
				if (near) {
					props.setPoint({ x: near.x, y: near.y });
				}
			}
			props.setAction(true);
			break;
		}
		case Mode.EditDoor: {
			props.setAction(true);
			props.setCursor("pointer");
			break;
		}
		case Mode.Select: {
			handleSelectModeClick(props);
		}
	}
};
