import { constants } from "../../../constants";
import { editor } from "../../../editor";
import * as func from "../../../func";
import { qSVG } from "../../../qSVG";
import {
	WallMetaData,
	ObjectMetaData,
	WallEquationGroup,
	WallEquation,
	Point2D,
	ViewboxData,
	Mode,
	RoomMetaData,
	RoomDisplayData,
	RoomPolygonData,
	SvgPathMetaData,
} from "../../models";
import { updateMeasurementText } from "../../svgTools";
import { calculateSnap } from "../../utils";
import { Wall } from "../../wall";

interface Props {
	showMeasurements: boolean;
	event: React.TouchEvent | React.MouseEvent;
	mode: string;
	binder: any;
	setBinder: (newVal: any) => void;
	setMode: (newMode: string) => string;
	resetMode: () => string;
	action: boolean;
	setAction: (on: boolean) => void;
	wallMeta: WallMetaData[];
	setWallMeta: (newData: WallMetaData[]) => void;
	objectMeta: ObjectMetaData[];
	setObjectMeta: (newData: ObjectMetaData[]) => void;
	wallEquations: WallEquationGroup;
	followerData: {
		equations: { wall: WallMetaData; eq: WallEquation; type: string }[];
		intersection: Point2D | null;
	};
	setPoint: (newPoint: Point2D) => void;
	setDrag: (shouldDrag: boolean) => void;
	viewbox: ViewboxData;
	roomMeta: RoomMetaData[];
	setRoomMeta: (newData: RoomMetaData[]) => void;
	setRoomPolygonData: (newData: RoomPolygonData) => void;
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
	save: () => void;
	updateRoomDisplayData: (data: RoomDisplayData) => void;
	setHelperLineSvgData: (data: SvgPathMetaData | null) => void;
	wallEndConstruc: boolean;
	setWallEndConstruc: (val: boolean) => void;
	point: Point2D;
	wallDrawPoint: Point2D;
	lengthTemp: any;
	setLengthTemp: (val: any) => void;
	continuousWallMode: boolean;
	showObjectTools: () => void;
	showOpeningTools: (min: number, max: number, value: number) => void;
	showWallTools: (separation: boolean) => void;
}

export const handleMouseUp = ({
	event,
	binder,
	setBinder,
	action,
	setAction,
	mode,
	setMode,
	resetMode,
	objectMeta,
	setObjectMeta,
	wallMeta,
	setWallMeta,
	roomMeta,
	setRoomMeta,
	setRoomPolygonData,
	showMeasurements,
	setDrag,
	setCursor,
	save,
	updateRoomDisplayData,
	wallEquations,
	setHelperLineSvgData,
	point,
	setPoint,
	wallDrawPoint,
	viewbox,
	wallEndConstruc,
	setWallEndConstruc,
	lengthTemp,
	setLengthTemp,
	continuousWallMode,
	followerData,
	showObjectTools,
	showOpeningTools,
	showWallTools,
}: Props) => {
	if (showMeasurements) {
		$("#boxScale").show(200);
	}
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
			const objData = [...objectMeta, binder];
			binder.graph.remove();
			const lastObject = objData[objData.length - 1];
			let targetBox =
				lastObject.class == "energy"
					? "boxEnergy"
					: lastObject.class == "furniture"
					? "boxFurniture"
					: "boxcarpentry";
			$("#" + targetBox).append(lastObject.graph);
			setBinder(null);
			setObjectMeta(objData);
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
			const room = roomMeta[binder.id];
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
			wallMeta.push(newWall);
			setWallMeta(wallMeta);
			oldWall.wall.end = { x: oldWall.x, y: oldWall.y };
			binder.remove();
			binder = setBinder(null);
			editor.architect(
				wallMeta,
				setRoomPolygonData,
				roomMeta,
				setRoomMeta,
				wallEquations
			);
			save();
			break;
		}
		case Mode.Door: {
			if (binder == null) {
				$("#boxinfo").html("The plan currently contains no wall.");
				mode = resetMode();
				break;
			}

			objectMeta.push(binder);
			binder.graph.remove();
			func.appendObjects(objectMeta);
			setObjectMeta(objectMeta);
			binder = setBinder(null);
			$("#boxinfo").html("Element added");
			mode = resetMode();
			save();
			break;
		}
		case Mode.Line:
		case Mode.Partition: {
			$("#linetemp").remove(); // DEL LINE HELP CONSTRUC 0 45 90
			setHelperLineSvgData(null);
			var sizeWall = qSVG.measure(wallDrawPoint, point);
			sizeWall = sizeWall / constants.METER_SIZE;
			if ($("#line_construc").length && sizeWall > 0.3) {
				var sizeWall = constants.WALL_SIZE;
				if (mode == Mode.Partition) sizeWall = constants.PARTITION_SIZE;
				var wall = new Wall(point, wallDrawPoint, "normal", sizeWall);
				wallMeta.push(wall);
				setWallMeta(wallMeta);
				// WALLS.push(wall);
				editor.architect(
					wallMeta,
					setRoomPolygonData,
					roomMeta,
					setRoomMeta,
					wallEquations
				);

				if (continuousWallMode && !wallEndConstruc) {
					setCursor("validation");
					setAction(true);
				} else setAction(false);
				$("#boxinfo").html(
					"Wall added <span style='font-size:0.6em'>approx. " +
						(qSVG.measure(point, wallDrawPoint) / 60).toFixed(2) +
						" m</span>"
				);
				$("#line_construc").remove(); // DEL LINE CONSTRUC HELP TO VIEW NEW SEG PATH
				lengthTemp.remove();
				setLengthTemp(null);
				// construc = 0;
				if (wallEndConstruc) setAction(false);
				setWallEndConstruc(false);
				setPoint(wallDrawPoint);
				save();
			} else {
				setAction(false);
				// construc = 0;
				$("#boxinfo").html("Select mode");
				mode = resetMode();
				if (binder) {
					binder.remove();
					binder = setBinder(null);
				}
				const snap = calculateSnap(event, viewbox);
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
					objectMeta.splice(objectMeta.indexOf(objTarget), 1);
					$("#boxinfo").html("Measure deleted!");
				}
				if (moveObj < 1 && objTarget.params.move) {
					if (!objTarget.params.resize) {
						$("#objBoundingBoxScale").hide();
					} else {
						console.log("showing obj tools");
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
		editor.showScaleBox(roomMeta, wallMeta);
		updateMeasurementText(wallMeta);
	}
};
