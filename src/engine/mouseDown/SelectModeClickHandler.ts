import {
	Mode,
	NodeWallObjectData,
	ObjectEquationData,
	ObjectMetaData,
	Point2D,
	ViewboxData,
	WallEquation,
	WallEquationGroup,
	WallMetaData,
} from "../../models";
import { calculateSnap } from "../../utils";
import { handleNodeClicked } from "./NodeClickHandler";
import { handleSegmentClicked } from "./SegmentClickHandler";

interface Props {
	event: React.TouchEvent | React.MouseEvent;
	binder: any;
	setBinder: (newVal: any) => void;
	setMode: (newMode: string) => void;
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
}

export const handleSelectModeClick = ({
	event,
	binder,
	setBinder,
	setMode,
	setAction,
	wallMeta,
	setWallMeta,
	objectMeta,
	wallEquations,
	followerData,
	setObjectEquationData,
	setWallEquations,
	setPoint,
	setDrag,
	viewbox,
	setCurrentNodeWallObjects,
	setCurrentNodeWalls,
}: Props) => {
	console.log("HII!!");
	switch (binder?.type) {
		case "segment": {
			setMode(Mode.Bind);
			setAction(true);
			$("#boxScale").hide(100);
			const {
				binder: binderResult,
				wallMeta: wallMetaResult,
				objectEquationData: objectEquationsResult,
				wallEquations: wallEquationsResult,
			} = handleSegmentClicked(
				binder,
				wallMeta,
				objectMeta,
				wallEquations,
				followerData
			);
			setBinder(binderResult);
			setWallMeta(wallMetaResult);
			setObjectEquationData(objectEquationsResult);
			setWallEquations(wallEquationsResult);
			break;
		}
		case "node": {
			setMode(Mode.Bind);
			setAction(true);
			$("#boxScale").hide(100);
			var node = binder.data;
			setPoint({ x: node.x, y: node.y });

			const { nodeWalls, nodeWallObjects } = handleNodeClicked({
				x: node.x,
				y: node.y,
				wallMeta,
				objectMeta,
			});

			setCurrentNodeWallObjects(nodeWallObjects);
			setCurrentNodeWalls(nodeWalls);
			break;
		}
		case "obj":
		case "boundingBox": {
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
