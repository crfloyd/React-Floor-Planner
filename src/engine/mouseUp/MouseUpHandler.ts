import { constants } from "../../../constants";
import { qSVG } from "../../../qSVG";
import {
	ObjectMetaData,
	Mode,
	RoomDisplayData,
	CursorType,
	RoomMetaData,
	WallMetaData,
	Point2D,
	SnapData,
} from "../../models/models";
import { updateMeasurementText } from "../../utils/svgTools";
import { Wall } from "../../models/Wall";
import { CanvasState } from "../CanvasState";
import { handleMouseUpBindMode } from "./BindModeMouseUpHandler";

export const handleMouseUp = (
	snap: SnapData,
	point: Point2D,
	setPoint: (p: Point2D) => void,
	canvasState: CanvasState,
	resetMode: () => string,
	showMeasurements: boolean,
	save: () => void,
	updateRoomDisplayData: (data: RoomDisplayData) => void,
	continuousWallMode: boolean,
	showObjectTools: () => void,
	showOpeningTools: (min: number, max: number, value: number) => void,
	wallClicked: (wall: WallMetaData) => void,
	setCursor: (crsr: CursorType) => void,
	roomMetaData: RoomMetaData[],
	objectMetaData: ObjectMetaData[],
	setObjectMetaData: (o: ObjectMetaData[]) => void,
	wallMetaData: WallMetaData[],
	setWallMetaData: (w: WallMetaData[]) => void,
	clearWallHelperData: () => void,
	wallEndConstructionData: { start: Point2D; end: Point2D } | null,
	wallConstructionShouldEnd: boolean,
	startWallDrawing: (startPoint: Point2D) => void,
	selectedWallData: { wall: WallMetaData; before: Point2D } | null
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
			$(binder.graph).remove();
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
			const svg = binder as SVGElement;
			svg.setAttribute("fill", "none");
			svg.setAttribute("stroke", "#ddf00a");
			svg.setAttribute("stroke-width", "7");
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
			$(binder.graph).remove();
			$("#boxcarpentry").append(
				updatedObjects[updatedObjects.length - 1].graph
			);
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
			const {
				updatedMode,
				updatedBinder,
				updatedObjectMeta,
				showObjectTools: shouldShowObjectTools,
			} = handleMouseUpBindMode(
				binder,
				objectMetaData,
				showOpeningTools,
				selectedWallData,
				wallClicked,
				() => {
					wallEquations.equation1 = null;
					wallEquations.equation2 = null;
					wallEquations.equation3 = null;
					followerData.intersection = null;
				}
			);
			setMode(updatedMode);
			setBinder(updatedBinder);
			setObjectMetaData(updatedObjectMeta);
			if (shouldShowObjectTools) {
				showObjectTools();
			}
			save();
			break;
		}
		default:
			break;
	}

	if (mode != Mode.EditRoom) {
		// editor.showScaleBox(roomMetaData, wallMetaData);
		updateMeasurementText(wallMetaData);
	}
};
