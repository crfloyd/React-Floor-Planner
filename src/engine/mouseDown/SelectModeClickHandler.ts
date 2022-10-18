import {
	Mode,
	ObjectMetaData,
	ViewboxData,
	WallMetaData,
} from "../../models/models";
import { calculateSnap } from "../../utils/utils";
import { CanvasState } from "../CanvasState";
import { handleNodeClicked } from "./NodeClickHandler";
import { handleSegmentClicked } from "./SegmentClickHandler";

interface Props {
	event: React.TouchEvent | React.MouseEvent;
	canvasState: CanvasState;
	viewbox: ViewboxData;
	objectMetaData: ObjectMetaData[];
	wallMetaData: WallMetaData[];
	setWallMetaData: (w: WallMetaData[]) => void;
}

export const handleSelectModeClick = ({
	event,
	canvasState: {
		binder,
		setBinder,
		setMode,
		setAction,
		wallEquations,
		followerData,
		setObjectEquationData,
		setWallEquations,
		setPoint,
		setDrag,
		setCurrentNodeWallObjects,
		setCurrentNodeWalls,
	},
	viewbox,
	objectMetaData,
	wallMetaData,
	setWallMetaData,
}: Props) => {
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
				wallMetaData,
				objectMetaData,
				wallEquations,
				followerData
			);
			setBinder(binderResult);
			setWallMetaData(wallMetaResult);
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
				wallMeta: wallMetaData,
				objectMeta: objectMetaData,
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
