import { constants } from "../../../constants";
import * as func from "../../../func";
import { editor } from "../../../editor";
import { qSVG } from "../../../qSVG";
import { Object2D } from "../../Object2D";
import {
	pointInPolygon,
	setInWallMeasurementText,
	updateMeasurementText,
} from "../../svgTools";
import { CanvasState } from "../CanvasState";
import { CursorType } from "../../models";

export const handleMouseMoveSelectMode = (
	event: React.TouchEvent | React.MouseEvent,
	snap: { x: number; y: number; xMouse: number; yMouse: number },
	{
		binder,
		setBinder,
		wallMeta,
		objectMeta,
		point,
		drag,
		viewbox,
	}: CanvasState,
	setCursor: (crsr: CursorType) => void,
	handleCameraChange: (lens: string, xmove: number, xview: number) => void
) => {
	if (drag) {
		setCursor("move");
		const distX = (snap.xMouse - point.x) * viewbox.zoomFactor;
		const distY = (snap.yMouse - point.y) * viewbox.zoomFactor;
		handleCameraChange("zoomdrag", distX, distY);
	} else {
		var matches = objectMeta.filter((o) => {
			var realBboxCoords = o.realBbox;
			return pointInPolygon(snap, realBboxCoords);
		});
		let objTarget = matches.length > 0 ? matches[0] : null;
		if (objTarget != null) {
			if (binder && binder.type == "segment") {
				binder.graph.remove();
				binder = setBinder(null);
				setCursor("default");
			}
			if (objTarget.params.bindBox) {
				// OBJ -> BOUNDINGBOX TOOL
				if (binder == null) {
					binder = setBinder(
						new Object2D(
							"free",
							constants.OBJECT_CLASSES.BOUNDING_BOX,
							"",
							objTarget.bbox.origin,
							objTarget.angle,
							false,
							objTarget.size,
							"normal",
							objTarget.thick,
							objTarget.realBbox,
							viewbox
						)
					);

					binder.update();
					binder.obj = objTarget;
					binder.type = "boundingBox";
					binder.oldX = binder.x;
					binder.oldY = binder.y;
					$("#boxbind").append(binder.graph);
					if (!objTarget.params.move) setCursor("trash"); // LIKE MEASURE ON PLAN
					if (objTarget.params.move) setCursor("move");
				}
			} else {
				// DOOR, WINDOW, OPENING.. -- OBJ WITHOUT BINDBOX (params.bindBox = False) -- !!!!
				if (binder == null) {
					var wall = editor.rayCastingWall(objTarget, wallMeta);
					if (wall.length > 1) wall = wall[0];
					// wall.inWallRib(objectMeta);
					setInWallMeasurementText(wall, objectMeta);
					var thickObj = wall.thick;
					var sizeObj = objTarget.size;

					binder = setBinder(
						new Object2D(
							"inWall",
							constants.OBJECT_CLASSES.HOVER_BOX,
							"",
							objTarget,
							objTarget.angle,
							false,
							sizeObj,
							"normal",
							thickObj,
							0,
							viewbox
						)
					);
					binder.update();

					binder.oldXY = { x: objTarget.x, y: objTarget.y }; // FOR OBJECT MENU
					$("#boxbind").append(binder.graph);
				} else {
					if (event.target == binder.graph.get(0).firstChild) {
						setCursor("move");
						binder.graph
							.get(0)
							.firstChild.setAttribute("class", "circle_css_2");
						binder.type = "obj";
						binder.obj = objTarget;
					} else {
						setCursor("default");
						binder.graph
							.get(0)
							.firstChild.setAttribute("class", "circle_css_1");
						binder.type = false;
					}
				}
			}
		} else {
			if (binder) {
				if (binder.graph && typeof binder.graph != "undefined")
					binder.graph.remove();
				else if (binder.remove != undefined) binder.remove();
				binder = setBinder(null);
				setCursor("default");
				updateMeasurementText(wallMeta);
			}
		}

		// BIND CIRCLE IF nearNode and GROUP ALL SAME XY SEG POINTS
		let wallNode = editor.nearWallNode(snap, wallMeta, 20);
		if (wallNode) {
			if (binder == null || binder.type == "segment") {
				binder = setBinder(
					qSVG.create("boxbind", "circle", {
						id: "circlebinder",
						class: "circle_css_2",
						cx: wallNode.x,
						cy: wallNode.y,
						r: constants.CIRCLE_BINDER_RADIUS,
					})
				);
				binder.data = wallNode;
				binder.type = "node";
				if ($("#linebinder").length) $("#linebinder").remove();
			} else {
				// REMAKE CIRCLE_CSS ON BINDER AND TAKE DATA SEG GROUP
				// if (typeof(binder) != 'undefined') {
				//     binder.attr({
				//         class: "circle_css_2"
				//     });
				// }
			}
			setCursor("move");
		} else {
			if (binder && binder.type == "node") {
				binder.remove();
				binder = setBinder(null);
				func.hideAllSize();
				setCursor("default");
				updateMeasurementText(wallMeta);
			}
		}

		// BIND WALL WITH NEARPOINT function ---> WALL BINDER CREATION
		let wallUnderCursor = editor.rayCastingWall(snap, wallMeta);
		if (wallUnderCursor) {
			if (wallUnderCursor.length > 1)
				wallUnderCursor = wallUnderCursor[wallUnderCursor.length - 1];
			if (wallUnderCursor && binder == null) {
				var objWall = wallUnderCursor.getObjects(objectMeta);
				if (objWall.length > 0) editor.inWallRib2(wallUnderCursor, objectMeta);
				binder = setBinder({ wall: wallUnderCursor, type: "segment" });
				// binder.wall.inWallRib(objectMeta);
				setInWallMeasurementText(binder.wall, objectMeta);
				var line = qSVG.create("none", "line", {
					x1: binder.wall.start.x,
					y1: binder.wall.start.y,
					x2: binder.wall.end.x,
					y2: binder.wall.end.y,
					"stroke-width": 5,
					stroke: "#5cba79",
				});
				var ball1 = qSVG.create("none", "circle", {
					class: "circle_css",
					cx: binder.wall.start.x,
					cy: binder.wall.start.y,
					r: constants.CIRCLE_BINDER_RADIUS / 1.8,
				});
				var ball2 = qSVG.create("none", "circle", {
					class: "circle_css",
					cx: binder.wall.end.x,
					cy: binder.wall.end.y,
					r: constants.CIRCLE_BINDER_RADIUS / 1.8,
				});
				binder.graph = qSVG.create("none", "g");
				binder.graph.append(line);
				binder.graph.append(ball1);
				binder.graph.append(ball2);
				$("#boxbind").append(binder.graph);
				setCursor("pointer");
			}
		} else {
			if (binder && binder.type == "segment") {
				binder.graph.remove();
				binder = setBinder(null);
				func.hideAllSize();
				setCursor("default");
				updateMeasurementText(wallMeta);
			}
		}
	}
};
