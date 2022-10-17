import { constants } from "../../../constants";
import { editor } from "../../../editor";
import * as func from "../../../func";
import { qSVG } from "../../../qSVG";
import {
	ObjectMetaData,
	Mode,
	RoomDisplayData,
	SvgPathMetaData,
	CursorType,
	ViewboxData,
	RoomMetaData,
	WallMetaData,
	Point2D,
	SnapData,
} from "../../models";
import { updateMeasurementText } from "../../svgTools";
import { Wall } from "../../wall";
import { CanvasState } from "../CanvasState";

export const handleMouseUp = (
	snap: SnapData,
	canvasState: CanvasState,
	resetMode: () => string,
	showMeasurements: boolean,
	save: () => void,
	updateRoomDisplayData: (data: RoomDisplayData) => void,
	continuousWallMode: boolean,
	showObjectTools: () => void,
	showOpeningTools: (min: number, max: number, value: number) => void,
	showWallTools: (separation: boolean) => void,
	setCursor: (crsr: CursorType) => void,
	roomMetaData: RoomMetaData[],
	objectMetaData: ObjectMetaData[],
	setObjectMetaData: (o: ObjectMetaData[]) => void,
	wallMetaData: WallMetaData[],
	setWallMetaData: (w: WallMetaData[]) => void,
	clearWallHelperData: () => void,
	wallEndConstructionData: { start: Point2D; end: Point2D } | null,
	wallConstructionShouldEnd: boolean,
	startWallDrawing: (startPoint: Point2D) => void
) => {
	if (showMeasurements) {
		$("#boxScale").show(200);
	}
	let {
		binder,
		setBinder,
		action,
		setAction,
		mode,
		setMode,
		setDrag,
		wallEquations,
		point,
		setPoint,
		followerData,
	} = canvasState;
	setDrag(false);
	setCursor("default");
	if (mode == Mode.Select) {
		if (binder) {
			binder.remove();
			binder = setBinder(null);
			save();
		}
	}

	switch (mode) {
		case Mode.Text: {
			if (!action) {
				setAction(true);
				$("#textToLayer").modal();
				mode = setMode(Mode.EditText);
			}
			break;
		}
		case Mode.Object: {
			const objData = [...objectMetaData, binder];
			binder.graph.remove();
			const lastObject = objData[objData.length - 1];
			let targetBox =
				lastObject.class == "energy" ? "boxEnergy" : "boxcarpentry";
			$("#" + targetBox).append(lastObject.graph);
			setBinder(null);
			setObjectMetaData(objData);
			$("#boxinfo").html("Object added");
			mode = resetMode();
			save();
			break;
		}
		case Mode.Room: {
			if (binder == null) {
				break;
			}
			const area = binder.area / 3600;
			binder.attr({ fill: "none", stroke: "#ddf00a", "stroke-width": 7 });
			const room = roomMetaData[binder.id];
			updateRoomDisplayData({
				size: area.toFixed(2),
				roomIndex: binder.id,
				surface: room.surface ?? "",
				showSurface: room.showSurface,
				background: room.color,
				name: room.name,
				action: room.action,
			});

			mode = setMode(Mode.EditRoom);
			save();
			break;
		}
		case Mode.Node: {
			mode = resetMode();
			if (!binder) break;
			// ALSO ON MOUSEUP WITH HAVE CIRCLEBINDER ON ADDPOINT
			const oldWall = binder.data;
			var newWall = new Wall(
				{ x: oldWall.x, y: oldWall.y },
				oldWall.wall.end,
				"normal",
				oldWall.wall.thick
			);
			const updatedWalls = [...wallMetaData, newWall];
			setWallMetaData(updatedWalls);
			oldWall.wall.end = { x: oldWall.x, y: oldWall.y };
			binder.remove();
			binder = setBinder(null);
			save();
			break;
		}
		case Mode.Opening: {
			if (binder == null) {
				$("#boxinfo").html("The plan currently contains no wall.");
				mode = resetMode();
				break;
			}

			const updatedObjects = [...objectMetaData, binder];
			binder.graph.remove();
			func.appendObjects(updatedObjects);
			setObjectMetaData(updatedObjects);
			binder = setBinder(null);
			$("#boxinfo").html("Element added");
			mode = resetMode();
			save();
			break;
		}
		case Mode.Line:
		case Mode.Partition: {
			// $("#linetemp").remove(); // DEL LINE HELP CONSTRUC 0 45 90
			clearWallHelperData();
			var sizeWall = qSVG.measure(wallEndConstructionData?.end, point);
			sizeWall = sizeWall / constants.METER_SIZE;
			if (
				wallEndConstructionData &&
				$("#line_construc").length &&
				sizeWall > 0.3
			) {
				var sizeWall =
					mode === Mode.Partition
						? constants.PARTITION_SIZE
						: constants.WALL_SIZE;
				var wall = new Wall(
					wallEndConstructionData.start,
					wallEndConstructionData.end,
					"normal",
					sizeWall
				);
				const updatedWalls = [...wallMetaData, wall];
				setWallMetaData(updatedWalls);

				if (continuousWallMode && !wallConstructionShouldEnd) {
					setCursor("validation");
					setAction(true);
					startWallDrawing(wallEndConstructionData.end);
				} else setAction(false);
				$("#boxinfo").html(
					"Wall added <span style='font-size:0.6em'>approx. " +
						(qSVG.measure(point, wallEndConstructionData.end) / 60).toFixed(2) +
						" m</span>"
				);
				if (wallConstructionShouldEnd) setAction(false);
				save();
			} else {
				setAction(false);
				$("#boxinfo").html("Select mode");
				mode = resetMode();
				if (binder) {
					binder.remove();
					binder = setBinder(null);
				}
				setPoint({ x: snap.x, y: snap.y });
			}
			break;
		}
		case Mode.Bind: {
			setAction(false);
			if (!binder) break;

			mode = resetMode();

			if (binder.type == "segment") {
				var found = false;
				if (binder.wall.start == binder.before) {
					found = true;
				}

				if (found) {
					let isSeparation = binder.wall.type == "separate";
					showWallTools(isSeparation);
					mode = Mode.EditWall;
				}
				wallEquations.equation1 = null;
				wallEquations.equation2 = null;
				wallEquations.equation3 = null;
				followerData.intersection = null;
			}

			if (binder.type == "obj") {
				const obj = binder.obj as ObjectMetaData;
				var moveDistance =
					Math.abs(binder.oldXY.x - binder.x) +
					Math.abs(binder.oldXY.y - binder.y);
				if (moveDistance < 1) {
					const min = obj.params.resizeLimit.width.min;
					const max = obj.params.resizeLimit.width.max;
					showOpeningTools(min, max, obj.size);
					mode = Mode.EditDoor;
				} else {
					mode = Mode.Select;
					setAction(false);
					binder.graph.remove();
					binder = setBinder(null);
				}
			}

			if (binder && binder.type == "boundingBox") {
				var moveObj =
					Math.abs(binder.oldX - binder.x) + Math.abs(binder.oldY - binder.y);
				var objTarget = binder.obj;
				if (!objTarget.params.move) {
					// TO REMOVE MEASURE ON PLAN
					objTarget.graph.remove();
					const updatedObjects = [...objectMetaData];
					updatedObjects.splice(objectMetaData.indexOf(objTarget), 1);
					setObjectMetaData(updatedObjects);
					$("#boxinfo").html("Measure deleted!");
				}
				if (moveObj < 1 && objTarget.params.move) {
					if (!objTarget.params.resize) {
						$("#objBoundingBoxScale").hide();
					} else {
						showObjectTools();
						$("#objBoundingBoxScale").show();
					}

					mode = Mode.EditBoundingBox;
				} else {
					mode = Mode.Select;
					setAction(false);
					binder.graph.remove();
					binder = setBinder(null);
				}
			}

			if (mode == Mode.Bind) {
				binder.remove();
				binder = setBinder(null);
			}

			mode = setMode(mode);
			save();
			break;
		}
		default:
			break;
	}

	if (mode != Mode.EditRoom) {
		editor.showScaleBox(roomMetaData, wallMetaData);
		updateMeasurementText(wallMetaData);
	}
};
