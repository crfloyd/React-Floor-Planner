import {
	Mode,
	ObjectMetaData,
	Point2D,
	WallEquationGroup,
	WallMetaData,
} from "../../models/models";

export const handleMouseUpBindMode = (
	binder: any,
	objectMetaData: ObjectMetaData[],
	showOpeningTools: (min: number, max: number, value: number) => void,
	selectedWallData: { wall: WallMetaData; before: Point2D } | null,
	wallClicked: (wall: WallMetaData) => void,
	resetEquationData: () => void
): {
	updatedBinder: any;
	updatedMode: string;
	updatedObjectMeta: ObjectMetaData[];
	showObjectTools: boolean;
} => {
	let mode = Mode.Select;
	let showObjectTools = false;

	if (selectedWallData) {
		if (selectedWallData.wall.start == selectedWallData.before) {
			wallClicked(selectedWallData.wall);
			mode = Mode.EditWall;
		}

		resetEquationData();
	}

	if (!binder)
		return {
			updatedBinder: binder,
			updatedMode: mode,
			updatedObjectMeta: objectMetaData,
			showObjectTools,
		};
	if (binder.type == "obj") {
		const obj = binder.obj as ObjectMetaData;
		var moveDistance =
			Math.abs(binder.oldXY.x - binder.x) + Math.abs(binder.oldXY.y - binder.y);
		if (moveDistance < 1) {
			const min = obj.params.resizeLimit.width.min;
			const max = obj.params.resizeLimit.width.max;
			showOpeningTools(min, max, obj.size);
			mode = Mode.EditDoor;
		} else {
			mode = Mode.Select;
			$(binder.graph).remove();
			binder = null;
		}
	}

	if (binder && binder.type == "boundingBox") {
		var moveObj =
			Math.abs(binder.oldX - binder.x) + Math.abs(binder.oldY - binder.y);
		var objTarget = binder.obj;
		if (!objTarget.params.move) {
			// TO REMOVE MEASURE ON PLAN
			objTarget.graph.remove();
			objectMetaData = objectMetaData.filter((o) => o !== objTarget);
			$("#boxinfo").html("Measure deleted!");
		}
		if (moveObj < 1 && objTarget.params.move) {
			if (!objTarget.params.resize) {
				$("#objBoundingBoxScale").hide();
			} else {
				console.log("showObjTools true");
				showObjectTools = true;
				$("#objBoundingBoxScale").show();
			}

			mode = Mode.EditBoundingBox;
		} else {
			mode = Mode.Select;
			$(binder.graph).remove();
			binder = null;
		}
	}

	if (mode == Mode.Bind) {
		binder.remove();
		binder = null;
	}

	return {
		updatedBinder: binder,
		updatedMode: mode,
		updatedObjectMeta: objectMetaData,
		showObjectTools,
	};
};
