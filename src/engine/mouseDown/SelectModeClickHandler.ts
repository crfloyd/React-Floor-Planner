import { Mode } from "../../models";
import { calculateSnap } from "../../utils";
import { CanvasState } from "../CanvasState";
import { handleNodeClicked } from "./NodeClickHandler";
import { handleSegmentClicked } from "./SegmentClickHandler";

interface Props {
	event: React.TouchEvent | React.MouseEvent;
	canvasState: CanvasState;
}

export const handleSelectModeClick = ({
	event,
	canvasState: {
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
	},
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
