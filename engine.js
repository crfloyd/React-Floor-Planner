// document.querySelector("#lin").addEventListener("mouseup", _MOUSEUP);
// document.querySelector("#lin").addEventListener(
// 	"mousemove",
// 	throttle(function (event) {
// 		_MOUSEMOVE(event);
// 	}, 30)
// );
// document.querySelector("#lin").addEventListener("mousedown", _MOUSEDOWN, true);

// $(document).on("click", "#lin", function (event) {
// 	event.preventDefault();
// });

import * as func from "./func";
import { qSVG } from "./qSVG";
import { constants } from "./constants";
import { Mode } from "./src/models";
import {
	computeLimit,
	findById,
	intersectionOfEquations,
	isObjectsEquals,
	calculateSnap,
} from "./src/utils";
import { Object2D, wallsComputing } from "./src/svgTools";
import { Wall } from "./src/wall";

const Rcirclebinder = 8;

export const resetWallCreation = (binder, lengthTemp) => {
	binder?.remove();
	$("#linetemp").remove();
	$("#line_construc").remove();
	lengthTemp?.remove();
};

export const onWindowResize = ({ width, height, originX, originY }) => {
	document
		.querySelector("#lin")
		.setAttribute(
			"viewBox",
			originX + " " + originY + " " + width + " " + height
		);
};

// *****************************************************************************************************
// ******************************        MOUSE MOVE          *******************************************
// *****************************************************************************************************

export const _MOUSEMOVE = (
	event,
	mode,
	modeOption,
	point,
	setPoint,
	x,
	setX,
	y,
	setY,
	multiChecked,
	setCursor,
	editor,
	rooms,
	setRooms,
	roomMeta,
	setRoomMeta,
	wallMeta,
	setWallMeta,
	objectMeta,
	setObjectMeta,
	action,
	drag,
	binder,
	setBinder,
	viewbox,
	zoomMaker,
	lineIntersectionP,
	setLineIntersectionP,
	lengthTemp,
	setLengthTemp,
	setWallStartConstruc,
	wallEndConstruc,
	setWallEndConstruc,
	wallListObj,
	wallEquations,
	followerData,
	objectEquationData,
	resetObjectEquationData,
	wallListRun,
	cross,
	setCross,
	labelMeasure,
	setLabelMeasure
) => {
	event.preventDefault();
	// $(".sub").hide(100);
	let snap;
	let helpConstruc;
	let helpConstrucEnd;

	//**************************************************************************
	//********************   TEXTE   MODE **************************************
	//**************************************************************************
	if (mode == Mode.Text) {
		snap = calculateSnap(event, viewbox);
		if (!action) setCursor("text");
		else {
			setCursor("none");
		}
	}

	//**************************************************************************
	//**************        OBJECT   MODE **************************************
	//**************************************************************************
	if (mode == Mode.Object) {
		snap = calculateSnap(event, viewbox);
		if (binder == null) {
			$("#object_list").hide(200);
			if (modeOption == "simpleStair") {
				binder = setBinder(
					new Object2D(
						"free",
						constants.OBJECT_CLASSES.STAIR,
						"simpleStair",
						snap,
						0,
						0,
						0,
						"normal",
						0,
						15,
						viewbox
					)
				);
			} else {
				var typeObj = modeOption;
				binder = setBinder(
					new Object2D(
						"free",
						constants.OBJECT_CLASSES.ENERGY,
						typeObj,
						snap,
						0,
						0,
						0,
						"normal",
						0,
						0,
						viewbox
					)
				);
			}
			$("#boxbind").append(binder.graph);
		} else {
			if (
				(binder.family != "stick" && binder.family != "collision") ||
				wallMeta.length == 0
			) {
				binder.x = snap.x;
				binder.y = snap.y;
				binder.oldX = binder.x;
				binder.oldY = binder.y;
				binder.update();
				setBinder(binder);
			}
			if (binder.family == "collision") {
				var found = false;

				if (
					editor.rayCastingWall(
						{ x: binder.bbox.left, y: binder.bbox.top },
						wallMeta
					)
				)
					found = true;
				if (
					!found &&
					editor.rayCastingWall(
						{ x: binder.bbox.left, y: binder.bbox.bottom },
						wallMeta
					)
				)
					found = true;
				if (
					!found &&
					editor.rayCastingWall(
						{ x: binder.bbox.right, y: binder.bbox.top },
						wallMeta
					)
				)
					found = true;
				if (
					!found &&
					editor.rayCastingWall(
						{
							x: binder.bbox.right,
							y: binder.bbox.bottom,
						},
						wallMeta
					)
				)
					found = true;

				if (!found) {
					binder.x = snap.x;
					binder.y = snap.y;
					binder.oldX = binder.x;
					binder.oldY = binder.y;
					binder.update();
					setBinder(binder);
				} else {
					binder.x = binder.oldX;
					binder.y = binder.oldY;
					binder.update();
					setBinder(binder);
				}
			}
			if (binder.family == "stick") {
				pos = editor.stickOnWall(snap, wallMeta);
				binder.oldX = pos.x;
				binder.oldY = pos.y;
				var angleWall = qSVG.angleDeg(
					pos.wall.start.x,
					pos.wall.start.y,
					pos.wall.end.x,
					pos.wall.end.y
				);
				var v1 = qSVG.vectorXY(
					{ x: pos.wall.start.x, y: pos.wall.start.y },
					{ x: pos.wall.end.x, y: pos.wall.end.y }
				);
				var v2 = qSVG.vectorXY({ x: pos.wall.end.x, y: pos.wall.end.y }, snap);
				binder.x =
					pos.x -
					(Math.sin(pos.wall.angle * ((360 / 2) * Math.PI)) * binder.thick) / 2;
				binder.y =
					pos.y -
					(Math.cos(pos.wall.angle * ((360 / 2) * Math.PI)) * binder.thick) / 2;
				var newAngle = qSVG.vectorDeter(v1, v2);
				if (Math.sign(newAngle) == 1) {
					angleWall += 180;
					binder.x =
						pos.x +
						(Math.sin(pos.wall.angle * ((360 / 2) * Math.PI)) * binder.thick) /
							2;
					binder.y =
						pos.y +
						(Math.cos(pos.wall.angle * ((360 / 2) * Math.PI)) * binder.thick) /
							2;
				}
				binder.angle = angleWall;
				binder.update();
			}
		}
	}

	//**************************************************************************
	//**************        DISTANCE MODE **************************************
	//**************************************************************************
	if (mode == Mode.Distance) {
		snap = calculateSnap(event, viewbox);
		if (binder == null) {
			cross = setCross(
				qSVG.create("boxbind", "path", {
					d: "M-3000,0 L3000,0 M0,-3000 L0,3000",
					"stroke-width": 0.5,
					"stroke-opacity": "0.8",
					stroke: "#e2b653",
					fill: "#e2b653",
				})
			);
			binder = setBinder(
				new Object2D(
					"free",
					constants.OBJECT_CLASSES.MEASURE,
					"",
					{ x: 0, y: 0 },
					0,
					0,
					0,
					"normal",
					0,
					"",
					viewbox
				)
			);
			labelMeasure = setLabelMeasure(
				qSVG.create("none", "text", {
					x: 0,
					y: -10,
					"font-size": "1.2em",
					stroke: "#ffffff",
					"stroke-width": "0.4px",
					"font-family": "roboto",
					"text-anchor": "middle",
					fill: "#3672d9",
				})
			);
			binder.graph.append(labelMeasure);
			$("#boxbind").append(binder.graph);
		} else {
			x = setX(snap.x);
			y = setY(snap.y);
			// let x = snap.x;
			// let y = snap.y;
			cross.attr({
				transform: "translate(" + snap.x + "," + snap.y + ")",
			});
			if (action) {
				var startText = qSVG.middle(point.x, point.y, x, y);
				var angleText = qSVG.angle(point.y, point.y, x, y);
				var valueText = qSVG.measure(
					{
						x: point.x,
						y: point.y,
					},
					{
						x: x,
						y: y,
					}
				);
				binder.size = valueText;
				binder.x = startText.x;
				binder.y = startText.y;
				binder.angle = angleText.deg;
				valueText = (valueText / constants.METER_SIZE).toFixed(2) + " m";
				labelMeasure.context.textContent = valueText;
				binder.update();
			}
		}
	}

	//**************************************************************************
	//**************        ROOM MODE *****************************************
	//**************************************************************************

	if (mode == Mode.Room) {
		snap = calculateSnap(event, viewbox);
		const roomTarget = editor.rayCastingRoom(snap, roomMeta);
		if (roomTarget) {
			if (binder) {
				binder.remove();
				binder = setBinder(binder);
			}

			var pathSurface = roomTarget.coords;
			var pathCreate = "M" + pathSurface[0].x + "," + pathSurface[0].y;
			for (var p = 1; p < pathSurface.length - 1; p++) {
				pathCreate =
					pathCreate + " " + "L" + pathSurface[p].x + "," + pathSurface[p].y;
			}
			pathCreate = pathCreate + "Z";

			if (roomTarget.inside.length > 0) {
				for (var ins = 0; ins < roomTarget.inside.length; ins++) {
					pathCreate =
						pathCreate +
						" M" +
						rooms.polygons[roomTarget.inside[ins]].coords[
							rooms.polygons[roomTarget.inside[ins]].coords.length - 1
						].x +
						"," +
						rooms.polygons[roomTarget.inside[ins]].coords[
							rooms.polygons[roomTarget.inside[ins]].coords.length - 1
						].y;
					for (
						var free = rooms.polygons[roomTarget.inside[ins]].coords.length - 2;
						free > -1;
						free--
					) {
						pathCreate =
							pathCreate +
							" L" +
							rooms.polygons[roomTarget.inside[ins]].coords[free].x +
							"," +
							rooms.polygons[roomTarget.inside[ins]].coords[free].y;
					}
				}
			}

			binder = setBinder(
				qSVG.create("boxbind", "path", {
					id: "roomSelected",
					d: pathCreate,
					fill: "#c9c14c",
					"fill-opacity": 0.5,
					stroke: "#c9c14c",
					"fill-rule": "evenodd",
					"stroke-width": 3,
				})
			);
			binder.type = "room";
			binder.area = roomTarget.area;
			binder.id = roomMeta.indexOf(roomTarget);
		} else {
			if (binder) {
				binder.remove();
				binder = setBinder(null);
			}
		}
	}

	//**************************************************************************
	//**************        DOOR/WINDOW MODE   *********************************
	//**************************************************************************

	if (mode == Mode.Door) {
		snap = calculateSnap(event, viewbox);
		const wallSelect = editor.nearWall(snap, wallMeta);
		if (wallSelect) {
			var wall = wallSelect.wall;
			if (wall.type != "separate") {
				if (binder == null) {
					// family, classe, type, pos, angle, angleSign, size, hinge, thick
					binder = setBinder(
						new Object2D(
							"inWall",
							constants.OBJECT_CLASSES.DOOR_WINDOW,
							modeOption,
							wallSelect,
							0,
							0,
							60,
							"normal",
							wall.thick,
							0,
							viewbox
						)
					);
					var angleWall = qSVG.angleDeg(
						wall.start.x,
						wall.start.y,
						wall.end.x,
						wall.end.y
					);
					var v1 = qSVG.vectorXY(
						{ x: wall.start.x, y: wall.start.y },
						{ x: wall.end.x, y: wall.end.y }
					);
					var v2 = qSVG.vectorXY({ x: wall.end.x, y: wall.end.y }, snap);
					var newAngle = qSVG.vectorDeter(v1, v2);
					if (Math.sign(newAngle) == 1) {
						angleWall += 180;
						binder.angleSign = 1;
					}
					var startCoords = qSVG.middle(
						wall.start.x,
						wall.start.y,
						wall.end.x,
						wall.end.y
					);
					binder.x = startCoords.x;
					binder.y = startCoords.y;
					binder.angle = angleWall;
					binder.update();
					$("#boxbind").append(binder.graph);
				} else {
					var angleWall = qSVG.angleDeg(
						wall.start.x,
						wall.start.y,
						wall.end.x,
						wall.end.y
					);
					var v1 = qSVG.vectorXY(
						{ x: wall.start.x, y: wall.start.y },
						{ x: wall.end.x, y: wall.end.y }
					);
					var v2 = qSVG.vectorXY({ x: wall.end.x, y: wall.end.y }, snap);
					var newAngle = qSVG.vectorDeter(v1, v2);
					binder.angleSign = 0;
					if (Math.sign(newAngle) == 1) {
						binder.angleSign = 1;
						angleWall += 180;
					}

					var limits = computeLimit(
						wall.equations.base,
						binder.size,
						wallSelect
					);
					if (
						wall.pointInsideWall(limits[0]) &&
						wall.pointInsideWall(limits[1])
					) {
						binder.x = wallSelect.x;
						binder.y = wallSelect.y;
						binder.angle = angleWall;
						binder.thick = wall.thick;
						binder.limit = limits;
						binder.update();
					}

					if (
						(wallSelect.x == wall.start.x && wallSelect.y == wall.start.y) ||
						(wallSelect.x == wall.end.x && wallSelect.y == wall.end.y)
					) {
						if (wall.pointInsideWall(limits[0])) {
							binder.x = limits[0].x;
							binder.y = limits[0].y;
						}
						if (wall.pointInsideWall(limits[1])) {
							binder.x = limits[1].x;
							binder.y = limits[1].y;
						}
						binder.limit = limits;
						binder.angle = angleWall;
						binder.thick = wall.thick;
						binder.update();
					}
				}
			}
		} else {
			if (binder) {
				binder.graph.remove();
				binder = setBinder(null);
			}
		}
	} // END DOOR MODE

	//**************************************************************************
	//**************        NODE MODE *****************************************
	//**************************************************************************

	if (mode == Mode.Node) {
		snap = calculateSnap(event, viewbox);

		if (binder == null) {
			const addNode = editor.nearWall(snap, wallMeta, 30);
			if (addNode) {
				var x2 = addNode.wall.end.x;
				var y2 = addNode.wall.end.y;
				var x1 = addNode.wall.start.x;
				var y1 = addNode.wall.start.y;
				angleWall = qSVG.angle(x1, y1, x2, y2);
				binder = setBinder(
					qSVG.create("boxbind", "path", {
						id: "circlebinder",
						d: "M-20,-10 L-13,0 L-20,10 Z M-13,0 L13,0 M13,0 L20,-10 L20,10 Z",
						stroke: "#5cba79",
						fill: "#5cba79",
						"stroke-width": "1.5px",
					})
				);

				binder.attr({
					transform:
						"translate(" +
						addNode.x +
						"," +
						addNode.y +
						") rotate(" +
						(angleWall.deg + 90) +
						",0,0)",
				});
				binder.data = addNode;
				binder.x1 = x1;
				binder.x2 = x2;
				binder.y1 = y1;
				binder.y2 = y2;
				setBinder(binder);
			}
		} else {
			const addNode = editor.nearWall(snap, wallMeta, 30);
			if (addNode) {
				if (addNode) {
					var x2 = addNode.wall.end.x;
					var y2 = addNode.wall.end.y;
					var x1 = addNode.wall.start.x;
					var y1 = addNode.wall.start.y;
					angleWall = qSVG.angle(x1, y1, x2, y2);
					binder.attr({
						transform:
							"translate(" +
							addNode.x +
							"," +
							addNode.y +
							") rotate(" +
							(angleWall.deg + 90) +
							",0,0)",
					});
					binder.data = addNode;
				} else {
					binder.remove();
					binder = setBinder(null);
				}
			} else {
				binder.remove();
				binder = setBinder(null);
			}
		}
	} // END NODE MODE

	//**********************************  SELECT MODE ***************************************************************
	if (mode == Mode.Select && !drag) {
		// FIRST TEST ON SELECT MODE (and drag OFF) to detect MOUSEOVER DOOR

		snap = calculateSnap(event, viewbox);

		var objTarget = false;
		objectMeta.forEach((objMeta) => {
			var realBboxCoords = objMeta.realBbox;
			if (qSVG.rayCasting(snap, realBboxCoords)) {
				objTarget = objMeta;
			}
		});
		// for (var i = 0; i < objectMeta.length; i++) {
		// 	var realBboxCoords = objectMeta[i].realBbox;
		// 	if (qSVG.rayCasting(snap, realBboxCoords)) {
		// 		objTarget = objectMeta[i];
		// 	}
		// }
		if (objTarget) {
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
							0,
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
					var wallList = editor.rayCastingWall(objTarget, wallMeta);
					if (wallList.length > 1) wallList = wallList[0];
					wallList.inWallRib(objectMeta);
					var thickObj = wallList.thick;
					var sizeObj = objTarget.size;

					binder = setBinder(
						new Object2D(
							"inWall",
							constants.OBJECT_CLASSES.HOVER_BOX,
							"",
							objTarget,
							objTarget.angle,
							0,
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
				func.rib(wallMeta);
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
						r: Rcirclebinder,
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
				func.rib(wallMeta);
			}
		}

		// BIND WALL WITH NEARPOINT function ---> WALL BINDER CREATION
		let wallBind = editor.rayCastingWall(snap, wallMeta);
		if (wallBind) {
			if (wallBind.length > 1) wallBind = wallBind[wallBind.length - 1];
			if (wallBind && binder == null) {
				var objWall = editor.objFromWall(wallBind, objectMeta);
				if (objWall.length > 0) editor.inWallRib2(wallBind, objectMeta);
				binder = setBinder({ wall: wallBind });
				binder.wall.inWallRib(objectMeta);
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
					r: Rcirclebinder / 1.8,
				});
				var ball2 = qSVG.create("none", "circle", {
					class: "circle_css",
					cx: binder.wall.end.x,
					cy: binder.wall.end.y,
					r: Rcirclebinder / 1.8,
				});
				binder.graph = qSVG.create("none", "g");
				binder.graph.append(line);
				binder.graph.append(ball1);
				binder.graph.append(ball2);
				$("#boxbind").append(binder.graph);
				binder.type = "segment";
				setCursor("pointer");
			}
		} else {
			let wallBind = editor.nearWall(snap, wallMeta, 6);
			if (wallBind) {
				if (wallBind && binder == null) {
					wallBind = wallBind.wall;
					var objWall = editor.objFromWall(wallBind, objectMeta);
					if (objWall.length > 0) editor.inWallRib2(wallBind, objectMeta);
					binder = {};
					setBinder(binder);
					binder.wall = wallBind;
					binder.wall.inWallRib(objectMeta);
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
						r: Rcirclebinder / 1.8,
					});
					var ball2 = qSVG.create("none", "circle", {
						class: "circle_css",
						cx: binder.wall.end.x,
						cy: binder.wall.end.y,
						r: Rcirclebinder / 1.8,
					});
					binder.graph = qSVG.create("none", "g");
					binder.graph.append(line);
					binder.graph.append(ball1);
					binder.graph.append(ball2);
					$("#boxbind").append(binder.graph);
					binder.type = "segment";
					setCursor("pointer");
				}
			} else {
				if (binder && binder.type == "segment") {
					binder.graph.remove();
					binder = setBinder(null);
					func.hideAllSize();
					setCursor("default");
					func.rib(wallMeta);
				}
			}
		}
	} // END mode == 'select_mode' && drag == 'off'

	// ------------------------------  LINE MODE ------------------------------------------------------

	if ((mode == Mode.Line || mode == Mode.Partition) && !action) {
		snap = calculateSnap(event, viewbox);
		setCursor("grab");
		point = setPoint({ x: snap.x, y: snap.y });
		helpConstruc = func.intersection(
			snap,
			wallMeta,
			lineIntersectionP,
			setLineIntersectionP,
			25
		);
		if (helpConstruc) {
			if (helpConstruc.distance < 10) {
				point = setPoint({ x: helpConstruc.x, y: helpConstruc.y });
				setCursor("grab");
			} else {
				setCursor("crosshair");
			}
		}
		const wallNode = editor.nearWallNode(snap, wallMeta, 20);
		if (wallNode) {
			point = setPoint({ x: wallNode.x, y: wallNode.y });
			setCursor("grab");
			if (binder == null) {
				binder = setBinder(
					qSVG.create("boxbind", "circle", {
						id: "circlebinder",
						class: "circle_css_2",
						cx: wallNode.x,
						cy: wallNode.y,
						r: Rcirclebinder / 1.5,
					})
				);
			}
			func.intersectionOff(lineIntersectionP);
		} else {
			if (!helpConstruc) setCursor("crosshair");
			if (binder) {
				if (binder.graph) binder.graph.remove();
				else binder.remove();
				binder = setBinder(null);
			}
		}
	}

	// ******************************************************************************************************
	// ************************** ACTION = 1   LINE MODE => WALL CREATE                 *********************
	// ******************************************************************************************************

	if (action && (mode == Mode.Line || mode == Mode.Partition)) {
		snap = calculateSnap(event, viewbox);
		x = setX(snap.x);
		y = setY(snap.y);
		// let x = snap.x;
		// let y = snap.y;
		const starter = func.minMoveGrid(snap, point);

		if (!$("#line_construc").length) {
			const wallNode = editor.nearWallNode(snap, wallMeta, 20);
			if (wallNode) {
				point = setPoint({ x: wallNode.x, y: wallNode.y });

				setWallStartConstruc(false);
				if (wallNode.bestWall == wallMeta.length - 1) {
					setCursor("validation");
				} else {
					setCursor("grab");
				}
			} else {
				setCursor("crosshair");
			}
		}

		if (starter > constants.GRID_SIZE) {
			if (!$("#line_construc").length) {
				var ws = 20;
				if (mode == Mode.Partition) ws = 10;
				const lineconstruc = qSVG.create("boxbind", "line", {
					id: "line_construc",
					x1: point.x,
					y1: point.y,
					x2: x,
					y2: y,
					"stroke-width": ws,
					"stroke-linecap": "butt",
					"stroke-opacity": 0.7,
					stroke: "#9fb2e2",
				});

				const svgadd = qSVG.create("boxbind", "line", {
					// ORANGE TEMP LINE FOR ANGLE 0 90 45 -+
					id: "linetemp",
					x1: point.x,
					y1: point.y,
					x2: x,
					y2: y,
					stroke: "transparent",
					"stroke-width": 0.5,
					"stroke-opacity": "0.9",
				});
			} else {
				// THE LINES AND BINDER ARE CREATED

				$("#linetemp").attr({
					x2: x,
					y2: y,
				});

				helpConstrucEnd = func.intersection(
					snap,
					wallMeta,
					lineIntersectionP,
					setLineIntersectionP,
					10
				);
				if (helpConstrucEnd) {
					x = setX(helpConstrucEnd.x);
					y = setY(helpConstrucEnd.y);
					// x = helpConstrucEnd.x;
					// y = helpConstrucEnd.y;
				}

				wallEndConstruc = setWallEndConstruc(
					editor.nearWall(snap, wallMeta, 12)
				);
				if (wallEndConstruc) {
					// TO SNAP SEGMENT TO FINALIZE X2Y2
					x = setX(wallEndConstruc.x);
					y = setY(wallEndConstruc.y);
					// x = wallEndConstruc.x;
					// y = wallEndConstruc.y;
					setCursor("grab");
				} else {
					setCursor("crosshair");
				}

				// nearNode helped to attach the end of the construc line
				const wallNode = editor.nearWallNode(snap, wallMeta, 20);
				if (wallNode) {
					if (binder == null) {
						binder = setBinder(
							qSVG.create("boxbind", "circle", {
								id: "circlebinder",
								class: "circle_css_2",
								cx: wallNode.x,
								cy: wallNode.y,
								r: Rcirclebinder / 1.5,
							})
						);
					}
					$("#line_construc").attr({
						x2: wallNode.x,
						y2: wallNode.y,
					});
					x = setX(wallNode.x);
					y = setY(wallNode.y);
					// x = wallNode.x;
					// y = wallNode.y;
					wallEndConstruc = setWallEndConstruc(true);
					func.intersectionOff(lineIntersectionP);
					if (wallNode.bestWall == wallMeta.length - 1 && multiChecked) {
						setCursor("validation");
					} else {
						setCursor("grab");
					}
				} else {
					if (binder) {
						binder.remove();
						binder = setBinder(null);
					}
					if (wallEndConstruc === false) setCursor("crosshair");
				}
				// LINETEMP AND LITLLE SNAPPING FOR HELP TO CONSTRUC ANGLE 0 90 45 *****************************************
				var fltt = qSVG.angle(point.x, point.y, x, y);
				var flt = Math.abs(fltt.deg);
				var coeff = fltt.deg / flt; // -45 -> -1     45 -> 1
				var phi = point.y - coeff * point.x;
				var Xdiag = (y - phi) / coeff;
				if (binder == null) {
					// HELP FOR H LINE
					var found = false;
					if (flt < 15 && Math.abs(point.y - y) < 25) {
						y = setY(point.y);
						// y = point.y;
						found = true;
					} // HELP FOR V LINE
					if (flt > 75 && Math.abs(point.x - x) < 25) {
						x = setX(point.x);
						// x = point.x;
						found = true;
					} // HELP FOR DIAG LINE
					if (flt < 55 && flt > 35 && Math.abs(Xdiag - x) < 20) {
						x = setX(Xdiag);
						// x = Xdiag;
						found = true;
					}
					if (found) $("#line_construc").attr({ "stroke-opacity": 1 });
					else $("#line_construc").attr({ "stroke-opacity": 0.7 });
				}
				$("#line_construc").attr({
					x2: x,
					y2: y,
				});

				// SHOW WALL SIZE -------------------------------------------------------------------------
				var startText = qSVG.middle(point.x, point.y, x, y);
				var angleText = qSVG.angle(point.x, point.y, x, y);
				var valueText = (
					qSVG.measure(
						{
							x: point.x,
							y: point.y,
						},
						{
							x: x,
							y: y,
						}
					) / 60
				).toFixed(2);
				//if (typeof lengthTemp == "undefined") {
				if (!lengthTemp) {
					const lt = document.createElementNS(
						"http://www.w3.org/2000/svg",
						"text"
					);
					lt.setAttributeNS(null, "x", startText.x);
					lt.setAttributeNS(null, "y", startText.y - 15);
					lt.setAttributeNS(null, "text-anchor", "middle");
					lt.setAttributeNS(null, "stroke", "none");
					lt.setAttributeNS(null, "stroke-width", "0.6px");
					lt.setAttributeNS(null, "fill", "#777777");
					lt.textContent = valueText + "m";
					setLengthTemp(lt);
					$("#boxbind").append(lengthTemp);
				}
				if (lengthTemp && valueText > 0.1) {
					lengthTemp.setAttributeNS(null, "x", startText.x);
					lengthTemp.setAttributeNS(null, "y", startText.y - 15);
					lengthTemp.setAttribute(
						"transform",
						"rotate(" +
							angleText.deg +
							" " +
							startText.x +
							"," +
							startText.y +
							")"
					);
					lengthTemp.textContent = valueText + " m";
					setLengthTemp(lengthTemp);
				}
				if (lengthTemp && valueText < 0.1) {
					lengthTemp.textContent = "";
					setLengthTemp(lengthTemp);
				}
			}
		}
	} // END LINE MODE DETECT && ACTION = 1

	//ONMOVE
	// **************************************************************************************************
	//        ____ ___ _   _ ____  _____ ____
	//        | __ )_ _| \ | |  _ \| ____|  _ \
	//        |  _ \| ||  \| | | | |  _| | |_) |
	//        | |_) | || |\  | |_| | |___|  _ <
	//        |____/___|_| \_|____/|_____|_| \_\
	//
	// **************************************************************************************************

	if (mode == Mode.Bind) {
		snap = calculateSnap(event, viewbox);

		if (binder.type == "node") {
			var coords = snap;
			var magnetic = false;
			for (var k in wallListRun) {
				if (isObjectsEquals(wallListRun[k].end, binder.data)) {
					if (Math.abs(wallListRun[k].start.x - snap.x) < 20) {
						coords.x = wallListRun[k].start.x;
						magnetic = "H";
					}
					if (Math.abs(wallListRun[k].start.y - snap.y) < 20) {
						coords.y = wallListRun[k].start.y;
						magnetic = "V";
					}
				}
				if (isObjectsEquals(wallListRun[k].start, binder.data)) {
					if (Math.abs(wallListRun[k].end.x - snap.x) < 20) {
						coords.x = wallListRun[k].end.x;
						magnetic = "H";
					}
					if (Math.abs(wallListRun[k].end.y - snap.y) < 20) {
						coords.y = wallListRun[k].end.y;
						magnetic = "V";
					}
				}
			}

			const nodeMove = editor.nearWallNode(snap, wallMeta, 15, wallListRun);
			if (nodeMove) {
				coords.x = nodeMove.x;
				coords.y = nodeMove.y;
				$("#circlebinder").attr({
					class: "circleGum",
					cx: coords.x,
					cy: coords.y,
				});
				setCursor("grab");
			} else {
				if (magnetic != false) {
					if (magnetic == "H") snap.x = coords.x;
					else snap.y = coords.y;
				}
				if (
					(helpConstruc = func.intersection(
						snap,
						wallMeta,
						lineIntersectionP,
						setLineIntersectionP,
						10,
						wallListRun
					))
				) {
					coords.x = helpConstruc.x;
					coords.y = helpConstruc.y;
					snap.x = helpConstruc.x;
					snap.y = helpConstruc.y;
					if (magnetic != false) {
						if (magnetic == "H") snap.x = coords.x;
						else snap.y = coords.y;
					}
					setCursor("grab");
				} else {
					setCursor("move");
				}
				$("#circlebinder").attr({
					class: "circle_css",
					cx: coords.x,
					cy: coords.y,
				});
			}
			for (var k in wallListRun) {
				if (isObjectsEquals(wallListRun[k].start, binder.data)) {
					wallListRun[k].start.x = coords.x;
					wallListRun[k].start.y = coords.y;
				}
				if (isObjectsEquals(wallListRun[k].end, binder.data)) {
					wallListRun[k].end.x = coords.x;
					wallListRun[k].end.y = coords.y;
				}
			}
			binder.data = coords;

			wallsComputing(wallMeta, wallEquations); // UPDATE FALSE
			wallMeta.forEach((wall) => {
				wall.addToScene();
			});

			for (var k in wallListObj) {
				var wall = wallListObj[k].wall;
				var objTarget = wallListObj[k].obj;
				var angleWall = qSVG.angleDeg(
					wall.start.x,
					wall.start.y,
					wall.end.x,
					wall.end.y
				);
				var limits = computeLimit(
					wall.equations.base,
					2 * wallListObj[k].distance,
					wallListObj[k].from
				); // COORDS OBJ AFTER ROTATION
				var indexLimits = 0;
				if (wall.pointInsideWall(limits[1])) indexLimits = 1;
				// NEW COORDS OBJDATA[obj]
				objTarget.x = limits[indexLimits].x;
				objTarget.y = limits[indexLimits].y;
				objTarget.angle = angleWall;
				if (objTarget.angleSign == 1) objTarget.angle = angleWall + 180;

				var limitBtwn = computeLimit(
					wall.equations.base,
					objTarget.size,
					objTarget
				); // OBJ SIZE OK BTWN xy1/xy2

				if (
					wall.pointInsideWall(limitBtwn[0]) &&
					wall.pointInsideWall(limitBtwn[1])
				) {
					objTarget.limit = limitBtwn;
					objTarget.update();
				} else {
					objTarget.graph.remove();
					objTarget = null;
					objectMeta.splice(wall.indexObj, 1);
					wallListObj.splice(k, 1);
				}
			}
			// for (k in toClean)
			$("#boxRoom").empty();
			$("#boxSurface").empty();
			rooms = setRooms(qSVG.polygonize(wallMeta));
			editor.roomMaker(rooms, roomMeta, setRoomMeta);
		}

		// WALL MOVING ----BINDER TYPE SEGMENT-------- FUNCTION FOR H,V and Calculate Vectorial Translation

		if (binder.type == "segment" && action) {
			func.rib(wallMeta);

			if (wallEquations.equation2.A == "v") {
				wallEquations.equation2.B = snap.x;
			} else if (wallEquations.equation2.A == "h") {
				wallEquations.equation2.B = snap.y;
			} else {
				wallEquations.equation2.B = snap.y - snap.x * wallEquations.equation2.A;
			}

			var intersection1 = intersectionOfEquations(
				wallEquations.equation1,
				wallEquations.equation2
			);
			var intersection2 = intersectionOfEquations(
				wallEquations.equation2,
				wallEquations.equation3
			);
			// var intersection3 = intersectionOfEquations(
			// 	wallEquations.equation1,
			// 	wallEquations.equation3
			// );

			if (binder.wall.parent != null) {
				const parent = findById(binder.wall.parent, wallMeta);
				if (isObjectsEquals(parent.end, binder.wall.start))
					parent.end = intersection1;
				else if (isObjectsEquals(parent.start, binder.wall.start))
					parent.start = intersection1;
				else parent.end = intersection1;
			}

			if (binder.wall.child != null) {
				const child = findById(binder.wall.child, wallMeta);
				if (isObjectsEquals(child.start, binder.wall.end))
					child.start = intersection2;
				else if (isObjectsEquals(child.end, binder.wall.end))
					child.end = intersection2;
				else child.start = intersection2;
			}

			binder.wall.start = intersection1;
			binder.wall.end = intersection2;

			binder.graph[0].children[0].setAttribute("x1", intersection1.x);
			binder.graph[0].children[0].setAttribute("x2", intersection2.x);
			binder.graph[0].children[0].setAttribute("y1", intersection1.y);
			binder.graph[0].children[0].setAttribute("y2", intersection2.y);
			binder.graph[0].children[1].setAttribute("cx", intersection1.x);
			binder.graph[0].children[1].setAttribute("cy", intersection1.y);
			binder.graph[0].children[2].setAttribute("cx", intersection2.x);
			binder.graph[0].children[2].setAttribute("cy", intersection2.y);

			// THE EQ FOLLOWED BY eq (PARENT EQ1 --- CHILD EQ3)
			if (wallEquations.equation1.follow != undefined) {
				if (
					!qSVG.rayCasting(intersection1, wallEquations.equation1.backUp.coords)
				) {
					// IF OUT OF WALL FOLLOWED
					var distanceFromStart = qSVG.gap(
						wallEquations.equation1.backUp.start,
						intersection1
					);
					var distanceFromEnd = qSVG.gap(
						wallEquations.equation1.backUp.end,
						intersection1
					);
					if (distanceFromStart > distanceFromEnd) {
						// NEAR FROM End
						wallEquations.equation1.follow.end = intersection1;
					} else {
						wallEquations.equation1.follow.start = intersection1;
					}
				} else {
					wallEquations.equation1.follow.end =
						wallEquations.equation1.backUp.end;
					wallEquations.equation1.follow.start =
						wallEquations.equation1.backUp.start;
				}
			}
			if (wallEquations.equation3.follow != undefined) {
				if (
					!qSVG.rayCasting(intersection2, wallEquations.equation3.backUp.coords)
				) {
					// IF OUT OF WALL FOLLOWED
					var distanceFromStart = qSVG.gap(
						wallEquations.equation3.backUp.start,
						intersection2
					);
					var distanceFromEnd = qSVG.gap(
						wallEquations.equation3.backUp.end,
						intersection2
					);
					if (distanceFromStart > distanceFromEnd) {
						// NEAR FROM End
						wallEquations.equation3.follow.end = intersection2;
					} else {
						wallEquations.equation3.follow.start = intersection2;
					}
				} else {
					wallEquations.equation3.follow.end =
						wallEquations.equation3.backUp.end;
					wallEquations.equation3.follow.start =
						wallEquations.equation3.backUp.start;
				}
			}

			// EQ FOLLOWERS WALL MOVING
			for (var i = 0; i < followerData.equations.length; i++) {
				followerData.intersection = intersectionOfEquations(
					followerData.equations[i].eq,
					wallEquations.equation2
				);
				if (
					followerData.intersection &&
					binder.wall.pointInsideWall(followerData.intersection, true)
				) {
					var size = qSVG.measure(
						followerData.equations[i].wall.start,
						followerData.equations[i].wall.end
					);
					if (followerData.equations[i].type == "start") {
						followerData.equations[i].wall.start = followerData.intersection;
						if (size < 5) {
							if (followerData.equations[i].wall.child == null) {
								wallMeta.splice(
									wallMeta.indexOf(followerData.equations[i].wall),
									1
								);
								followerData.equations.splice(i, 1);
							}
						}
					}
					if (followerData.equations[i].type == "end") {
						followerData.equations[i].wall.end = followerData.intersection;
						if (size < 5) {
							if (followerData.equations[i].wall.parent == null) {
								wallMeta.splice(
									wallMeta.indexOf(followerData.equations[i].wall),
									1
								);
								followerData.equations.splice(i, 1);
							}
						}
					}
				}
			}
			// WALL COMPUTING, BLOCK FAMILY OF BINDERWALL IF NULL (START OR END) !!!!!
			wallsComputing(wallMeta, wallEquations, true);
			wallMeta.forEach((wall) => {
				wall.addToScene();
			});
			rooms = setRooms(qSVG.polygonize(wallMeta));

			// OBJDATA(s) FOLLOW 90° EDGE SELECTED
			for (var rp = 0; rp < objectEquationData.length; rp++) {
				var objTarget = objectEquationData[rp].obj;
				var intersectionObj = intersectionOfEquations(
					objectEquationData[rp].eq,
					wallEquations.equation2
				);
				// NEW COORDS OBJDATA[o]
				objTarget.x = intersectionObj.x;
				objTarget.y = intersectionObj.y;
				var limits = computeLimit(
					wallEquations.equation2,
					objTarget.size,
					objTarget
				);
				if (
					binder.wall.pointInsideWall(limits[0]) &&
					binder.wall.pointInsideWall(limits[1])
				) {
					objTarget.limit = limits;
					objTarget.update();
				}
			}
			// DELETING ALL OBJECT "INWALL" OVERSIZED INTO ITS EDGE (EDGE BY EDGE CONTROL)
			for (var k in wallMeta) {
				var objWall = editor.objFromWall(wallMeta[k], objectMeta); // LIST OBJ ON EDGE
				for (var ob in objWall) {
					var objTarget = objWall[ob];
					var eq = wallMeta[k].getEquation();
					var limits = computeLimit(eq, objTarget.size, objTarget);
					if (
						!wallMeta[k].pointInsideWall(limits[0]) ||
						!wallMeta[k].pointInsideWall(limits[1])
					) {
						objTarget.graph.remove();
						objTarget = null;
						var indexObj = objectMeta.indexOf(objTarget);
						objectMeta.splice(indexObj, 1);
					}
				}
			}

			objectEquationData = resetObjectEquationData(); // REINIT eqObj -> MAYBE ONE OR PLUS OF OBJDATA REMOVED !!!!
			var objWall = editor.objFromWall(binder.wall, objectMeta); // LIST OBJ ON EDGE
			for (var ob = 0; ob < objWall.length; ob++) {
				var objTarget = objWall[ob];
				objectEquationData.push({
					obj: objTarget,
					wall: binder.wall,
					eq: qSVG.perpendicularEquation(
						wallEquations.equation2,
						objTarget.x,
						objTarget.y
					),
				});
			}

			$("#boxRoom").empty();
			$("#boxSurface").empty();
			editor.roomMaker(rooms, roomMeta, setRoomMeta);
			setCursor("pointer");
		}

		// **********************************************************************
		// ----------------------  BOUNDING BOX ------------------------------
		// **********************************************************************
		// binder.obj.params.move ---> FOR MEASURE DONT MOVE
		if (binder.type == "boundingBox" && action && binder.obj.params.move) {
			binder.x = snap.x;
			binder.y = snap.y;
			binder.obj.x = snap.x;
			binder.obj.y = snap.y;
			binder.obj.update();
			binder.update();
		}

		// **********************************************************************
		// OBJ MOVING
		// **********************************************************************
		if (binder.type == "obj" && action) {
			const wallSelect = editor.nearWall(snap, wallMeta);
			if (wallSelect) {
				if (wallSelect.wall.type != "separate") {
					wallSelect.wall.inWallRib(objectMeta);
					var objTarget = binder.obj;
					var wall = wallSelect.wall;
					var angleWall = qSVG.angleDeg(
						wall.start.x,
						wall.start.y,
						wall.end.x,
						wall.end.y
					);
					var v1 = qSVG.vectorXY(
						{ x: wall.start.x, y: wall.start.y },
						{ x: wall.end.x, y: wall.end.y }
					);
					var v2 = qSVG.vectorXY({ x: wall.end.x, y: wall.end.y }, snap);
					var newAngle = qSVG.vectorDeter(v1, v2);
					binder.angleSign = 0;
					objTarget.angleSign = 0;
					if (Math.sign(newAngle) == 1) {
						angleWall += 180;
						binder.angleSign = 1;
						objTarget.angleSign = 1;
					}
					var limits = computeLimit(
						wall.equations.base,
						binder.size,
						wallSelect
					);
					if (
						wall.pointInsideWall(limits[0]) &&
						wall.pointInsideWall(limits[1])
					) {
						binder.x = wallSelect.x;
						binder.y = wallSelect.y;
						binder.angle = angleWall;
						binder.thick = wall.thick;
						objTarget.x = wallSelect.x;
						objTarget.y = wallSelect.y;
						objTarget.angle = angleWall;
						objTarget.thick = wall.thick;
						objTarget.limit = limits;
						binder.update();
						objTarget.update();
					}

					if (
						(wallSelect.x == wall.start.x && wallSelect.y == wall.start.y) ||
						(wallSelect.x == wall.end.x && wallSelect.y == wall.end.y)
					) {
						if (wall.pointInsideWall(limits[0])) {
							binder.x = limits[0].x;
							binder.y = limits[0].y;
							objTarget.x = limits[0].x;
							objTarget.y = limits[0].y;
							objTarget.limit = limits;
						}
						if (wall.pointInsideWall(limits[1])) {
							binder.x = limits[1].x;
							binder.y = limits[1].y;
							objTarget.x = limits[1].x;
							objTarget.y = limits[1].y;
							objTarget.limit = limits;
						}
						binder.angle = angleWall;
						binder.thick = wall.thick;
						objTarget.angle = angleWall;
						objTarget.thick = wall.thick;
						binder.update();
						objTarget.update();
					}
				}
			}
		} // END OBJ MOVE
		if (binder.type != "obj" && binder.type != "segment") {
			func.rib(wallMeta);
		}
	}
	// ENDBIND ACTION MOVE **************************************************************************

	// ---DRAG VIEWBOX PANNING -------------------------------------------------------

	if (mode == Mode.Select && drag) {
		snap = calculateSnap(event, viewbox);
		setCursor("move");
		const distX = (snap.xMouse - point.x) * viewbox.zoomFactor;
		const distY = (snap.yMouse - point.y) * viewbox.zoomFactor;
		// pox = event.pageX;
		// poy = event.pageY;
		zoomMaker("zoomdrag", distX, distY);
	}
}; // END MOUSEMOVE

// *****************************************************************************************************
// *****************************************************************************************************
// *****************************************************************************************************
// ******************************        MOUSE DOWN            *****************************************
// *****************************************************************************************************
// *****************************************************************************************************
// *****************************************************************************************************

export const _MOUSEDOWN = (
	event,
	mode,
	setMode,
	setPoint,
	editor,
	wallMeta,
	setWallMeta,
	objectMeta,
	action,
	setAction,
	setDrag,
	binder,
	setBinder,
	wallStartConstruc,
	setWallStartConstruc,
	wallListObj,
	clearWallListObj,
	wallEquations,
	followerData,
	objectEquationData,
	resetObjectEquationData,
	wallListRun,
	resetWallListRun,
	setCursor,
	viewbox
) => {
	event.preventDefault();
	let snap;
	// *******************************************************************
	// **************************   DISTANCE MODE   **********************
	// *******************************************************************
	if (mode == Mode.Distance) {
		if (!action) {
			action = setAction(true);
			snap = calculateSnap(event, viewbox);
			setPoint({ x: snap.x, y: snap.y });
		}
	}

	// *******************************************************************
	// *************************   LINE/WALL MODE   **********************
	// *******************************************************************
	if (mode == Mode.Line || mode == Mode.Partition) {
		if (!action) {
			snap = calculateSnap(event, viewbox);
			setPoint({ x: snap.x, y: snap.y });
			wallStartConstruc = setWallStartConstruc(
				editor.nearWall(snap, wallMeta, 12)
			);
			if (wallStartConstruc) {
				// TO SNAP SEGMENT TO FINALIZE X2Y2
				setPoint({ x: wallStartConstruc.x, y: wallStartConstruc.y });
			}
		} else {
			// FINALIZE LINE_++
			// construc = 1;
		}
		action = setAction(true);
	}
	if (mode == Mode.EditDoor) {
		// ACTION 1 ACTIVATE EDITION OF THE DOOR
		action = setAction(true);
		setCursor("pointer");
	}

	// *******************************************************************
	// **********************   SELECT MODE + BIND   *********************
	// *******************************************************************
	if (mode == Mode.Select) {
		if (
			binder &&
			(binder.type == "segment" ||
				binder.type == "node" ||
				binder.type == "obj" ||
				binder.type == "boundingBox")
		) {
			mode = setMode(Mode.Bind);

			if (binder.type == "obj") {
				action = setAction(true);
			}

			if (binder.type == "boundingBox") {
				action = setAction(true);
			}

			// INIT FOR HELP BINDER NODE MOVING H V (MOUSE DOWN)
			if (binder.type == "node") {
				$("#boxScale").hide(100);
				var node = binder.data;
				setPoint({ x: node.x, y: node.y });
				var nodeControl = { x: node.x, y: node.y };

				// DETERMINATE DISTANCE OF OPPOSED NODE ON EDGE(s) PARENT(s) OF THIS NODE
				wallListObj = clearWallListObj();
				// wallListObj = []; // SUPER VAR -- WARNING
				var objWall;
				wallListRun = resetWallListRun();
				for (var ee = wallMeta.length - 1; ee > -1; ee--) {
					// SEARCH MOST YOUNG WALL COORDS IN NODE BINDER
					if (
						isObjectsEquals(wallMeta[ee].start, nodeControl) ||
						isObjectsEquals(wallMeta[ee].end, nodeControl)
					) {
						wallListRun.push(wallMeta[ee]);
						break;
					}
				}
				if (wallListRun[0].child != null) {
					if (
						isObjectsEquals(wallListRun[0].child.start, nodeControl) ||
						isObjectsEquals(wallListRun[0].child.end, nodeControl)
					)
						wallListRun.push(wallListRun[0].child);
				}
				if (wallListRun[0].parent != null) {
					const parent = findById(wallListRun[0].parent, wallMeta);
					if (
						isObjectsEquals(parent.start, nodeControl) ||
						isObjectsEquals(parent.end, nodeControl)
					)
						wallListRun.push(parent);
				}

				for (var k in wallListRun) {
					if (
						isObjectsEquals(wallListRun[k].start, nodeControl) ||
						isObjectsEquals(wallListRun[k].end, nodeControl)
					) {
						var nodeTarget = wallListRun[k].start;
						if (isObjectsEquals(wallListRun[k].start, nodeControl)) {
							nodeTarget = wallListRun[k].end;
						}
						objWall = editor.objFromWall(wallListRun[k], objectMeta); // LIST OBJ ON EDGE -- NOT INDEX !!!
						wall = wallListRun[k];
						for (var ob = 0; ob < objWall.length; ob++) {
							var objTarget = objWall[ob];
							var distance = qSVG.measure(objTarget, nodeTarget);
							wallListObj.push({
								wall: wall,
								from: nodeTarget,
								distance: distance,
								obj: objTarget,
								indexObj: ob,
							});
						}
					}
				}
				action = setAction(true);
			}
			if (binder.type == "segment") {
				$("#boxScale").hide(100);
				var wall = { ...binder.wall };
				binder.before = binder.wall.start;
				wallEquations.equation2 = wall.getEquation();
				if (wall.parent != null) {
					const parent = findById(wall.parent, wallMeta);
					wallEquations.equation1 = parent.getEquation();
					var angle12 = qSVG.angleBetweenEquations(
						wallEquations.equation1.A,
						wallEquations.equation2.A
					);
					if (angle12 < 20 || angle12 > 160) {
						var found = true;
						for (var k in wallMeta) {
							if (
								qSVG.rayCasting(wall.start, wallMeta[k].coords) &&
								wallMeta[k].id !== parent.id &&
								// !isObjectsEquals(wallMeta[k], wall.parent) &&
								!isObjectsEquals(wallMeta[k], wall)
							) {
								const parentOfParent = findById(parent.parent, wallMeta);
								if (
									parentOfParent != null &&
									parentOfParent.id === wall.id
									// isObjectsEquals(wall, wall.parent.parent)
								) {
									// const p = parent;
									// p.parent = null;
									// wall.parent.parent = null;
									parent.parent = null;
								}

								const childOfParent = findById(parent.child, wallMeta);
								if (
									childOfParent != null &&
									childOfParent.id === wall.id
									// isObjectsEquals(wall, wall.parent.child)
								) {
									parent.child = null;
								}
								wall.parent = null;
								found = false;
								binder = setBinder({ ...binder, wall: wall });
								break;
							}
						}
						if (found) {
							var newWall;
							const parent = findById(wall.parent, wallMeta);
							if (parent.end === wall.start) {
								// if (isObjectsEquals(wall.parent.end, wall.start, "1")) {
								newWall = new Wall(
									parent.end,
									wall.start,
									"normal",
									wall.thick
								);
								newWall.parent = wall.parent;
								newWall.child = wall.id;
								// WALLS.push(newWall);
								wallMeta = setWallMeta([...wallMeta, newWall]);
								parent.child = newWall.id;
								wall.parent = newWall.id;
								wallEquations.equation1 = qSVG.perpendicularEquation(
									wallEquations.equation2,
									wall.start.x,
									wall.start.y
								);
							} else if (parent.start === wall.start) {
								// } else if (isObjectsEquals(parent.start, wall.start, "2")) {
								newWall = new Wall(
									parent.start,
									wall.start,
									"normal",
									wall.thick
								);
								newWall.parent = wall.parent;
								newWall.child = wall.id;
								wallMeta = setWallMeta([...wallMeta, newWall]);
								// WALLS.push(newWall);
								parent.parent = newWall.id;
								wall.parent = newWall.id;
								wallEquations.equation1 = qSVG.perpendicularEquation(
									wallEquations.equation2,
									wall.start.x,
									wall.start.y
								);
							}
							// CREATE NEW WALL
						}
					}
				}

				if (wall.parent == null) {
					var foundEq = false;
					for (var k in wallMeta) {
						if (
							qSVG.rayCasting(wall.start, wallMeta[k].coords) &&
							!isObjectsEquals(wallMeta[k].coords, wall.coords)
						) {
							var angleFollow = qSVG.angleBetweenEquations(
								wallMeta[k].equations.base.A,
								wallEquations.equation2.A
							);
							if (angleFollow < 20 || angleFollow > 160) break;
							wallEquations.equation1 = wallMeta[k].getEquation();
							wallEquations.equation1.follow = wallMeta[k];
							wallEquations.equation1.backUp = {
								coords: wallMeta[k].coords,
								start: wallMeta[k].start,
								end: wallMeta[k].end,
								child: wallMeta[k].child,
								parent: wallMeta[k].parent,
							};
							foundEq = true;
							break;
						}
					}
					if (!foundEq)
						wallEquations.equation1 = qSVG.perpendicularEquation(
							wallEquations.equation2,
							wall.start.x,
							wall.start.y
						);
				}

				if (wall.child != null) {
					const child = findById(wall.child, wallMeta);
					wallEquations.equation3 = child.getEquation();
					var angle23 = qSVG.angleBetweenEquations(
						wallEquations.equation3.A,
						wallEquations.equation2.A
					);
					if (angle23 < 20 || angle23 > 160) {
						var found = true;
						for (var k in wallMeta) {
							if (
								qSVG.rayCasting(wall.end, wallMeta[k].coords) &&
								wallMeta[k].id !== wall.child &&
								// !isObjectsEquals(wallMeta[k], wall.child) &&
								!isObjectsEquals(wallMeta[k], wall)
							) {
								if (
									child.parent != null &&
									wall.id === child.parent
									// isObjectsEquals(wall, wall.child.parent)
								) {
									child.parent = null;
									// wall.child.parent = null;
								}

								const childOfChild = findById(child.child, wallMeta);
								if (
									childOfChild != null &&
									wall.id === childOfChild.id
									// isObjectsEquals(wall, wall.child.child)
								) {
									// wall.child.child = null;
									child.child = null;
								}

								wall.child = null;
								found = false;
								break;
							}
						}
						if (found) {
							const child = findById(wall.child, wallMeta);
							if (isObjectsEquals(child.start, wall.end)) {
								var newWall = new Wall(
									wall.end,
									child.start,
									"new",
									wall.thick
								);
								newWall.parent = wall.id;
								newWall.child = wall.child;
								wallMeta = setWallMeta([...wallMeta, newWall]);
								// WALLS.push(newWall);
								child.parent = newWall.id;
								wall.child = newWall.id;
								wallEquations.equation3 = qSVG.perpendicularEquation(
									wallEquations.equation2,
									wall.end.x,
									wall.end.y
								);
							} else if (isObjectsEquals(child.end, wall.end)) {
								var newWall = new Wall(
									wall.end,
									child.end,
									"normal",
									wall.thick
								);
								newWall.parent = wall.id;
								newWall.child = child.id;
								wallMeta = setWallMeta([...wallMeta, newWall]);
								// WALLS.push(newWall);
								child.child = newWall.id;
								wall.child = newWall.id;
								wallEquations.equation3 = qSVG.perpendicularEquation(
									wallEquations.equation2,
									wall.end.x,
									wall.end.y
								);
							}
							// CREATE NEW WALL
						}
					}
				}
				if (wall.child == null) {
					var foundEq = false;
					for (var k in wallMeta) {
						if (
							qSVG.rayCasting(wall.end, wallMeta[k].coords) &&
							!isObjectsEquals(wallMeta[k].coords, wall.coords, "4")
						) {
							var angleFollow = qSVG.angleBetweenEquations(
								wallMeta[k].equations.base.A,
								wallEquations.equation2.A
							);
							if (angleFollow < 20 || angleFollow > 160) break;
							wallEquations.equation3 = wallMeta[k].getEquation();
							wallEquations.equation3.follow = wallMeta[k];
							wallEquations.equation3.backUp = {
								coords: wallMeta[k].coords,
								start: wallMeta[k].start,
								end: wallMeta[k].end,
								child: wallMeta[k].child,
								parent: wallMeta[k].parent,
							};
							foundEq = true;
							break;
						}
					}
					if (!foundEq)
						wallEquations.equation3 = qSVG.perpendicularEquation(
							wallEquations.equation2,
							wall.end.x,
							wall.end.y
						);
				}

				followerData.equations = [];
				for (var k in wallMeta) {
					if (
						wallMeta[k].child == null &&
						qSVG.rayCasting(wallMeta[k].end, wall.coords) &&
						!isObjectsEquals(wall, wallMeta[k])
					) {
						followerData.equations.push({
							wall: wallMeta[k],
							eq: wallMeta[k].getEquation(),
							type: "end",
						});
					}
					if (
						wallMeta[k].parent == null &&
						qSVG.rayCasting(wallMeta[k].start, wall.coords) &&
						!isObjectsEquals(wall, wallMeta[k])
					) {
						followerData.equations.push({
							wall: wallMeta[k],
							eq: wallMeta[k].getEquation(),
							type: "start",
						});
					}
				}

				objectEquationData = resetObjectEquationData();
				var objWall = editor.objFromWall(wall, objectMeta); // LIST OBJ ON EDGE
				for (var ob = 0; ob < objWall.length; ob++) {
					var objTarget = objWall[ob];
					objectEquationData.push({
						obj: objTarget,
						wall: wall,
						eq: qSVG.perpendicularEquation(
							wallEquations.equation2,
							objTarget.x,
							objTarget.y
						),
					});
				}
				action = setAction(true);
			}
		} else {
			action = setAction(false);
			setDrag(true);
			const snap = calculateSnap(event, viewbox);
			setPoint({ x: snap.xMouse, y: snap.yMouse });
		}
	}
};

//******************************************************************************************************
//*******************  *****  ******        ************************************************************
//*******************  *****  ******  ****  ************************************************************
//*******************  *****  ******  ****  ************************************************************
//*******************  *****  ******        ************************************************************
//*******************         ******  ******************************************************************
//**********************************  ******************************************************************

export const _MOUSEUP = (
	event,
	mode,
	setMode,
	multiChecked,
	resetMode,
	setCursor,
	editor,
	setRooms,
	roomMeta,
	setRoomMeta,
	wallMeta,
	setWallMeta,
	objectMeta,
	setObjectMeta,
	action,
	setAction,
	setDrag,
	binder,
	setBinder,
	viewbox,
	lineIntersectionP,
	lengthTemp,
	setLengthTemp,
	point,
	setPoint,
	x,
	y,
	wallEndConstruc,
	setWallEndConstruc,
	save,
	wallEquations,
	followerData,
	showWallTools,
	showObjectTools,
	showOpeningTools,
	showRoomTools,
	cross,
	setCross,
	labelMeasure,
	setLabelMeasure,
	showMeasurements
) => {
	if (showMeasurements) {
		$("#boxScale").show(200);
	}
	// if (showRib) $("#boxScale").show(200);
	// console.log("mouseUp:", viewbox);
	setDrag(false);
	setCursor("default");
	let snap;
	if (mode == Mode.Select) {
		if (binder) {
			binder.remove();
			binder = setBinder(null);
			save();
		}
	}

	//**************************************************************************
	//********************   TEXTE   MODE **************************************
	//**************************************************************************
	if (mode == Mode.Text) {
		if (!action) {
			action = setAction(true);
			$("#textToLayer").modal();
			mode = setMode(Mode.EditText);
		}
	}

	//**************************************************************************
	//**************        OBJECT   MODE **************************************
	//**************************************************************************
	if (mode == Mode.Object) {
		const objData = [...objectMeta, binder];
		// OBJDATA.push(binder);
		binder.graph.remove();
		var targetBox = "boxcarpentry";
		if (objData[objData.length - 1].class == "energy") targetBox = "boxEnergy";
		if (objData[objData.length - 1].class == "furniture")
			targetBox = "boxFurniture";
		$("#" + targetBox).append(objData[objData.length - 1].graph);
		binder = setBinder(null);
		objectMeta = setObjectMeta(objData);
		$("#boxinfo").html("Object added");
		mode = resetMode();
		save();
	}

	// *******************************************************************
	// **************************   DISTANCE MODE   **********************
	// *******************************************************************
	if (mode == Mode.Distance) {
		if (action) {
			action = setAction(false);
			// MODIFY BBOX FOR BINDER ZONE (TXT)
			var bbox = labelMeasure.get(0).getBoundingClientRect();
			const offset = $("#lin").offset();
			bbox.x =
				bbox.x * viewbox.zoomFactor -
				offset.left * viewbox.zoomFactor +
				viewbox.origX;
			bbox.y =
				bbox.y * viewbox.zoomFactor -
				offset.top * viewbox.zoomFactor +
				viewbox.origY;
			bbox.origin = { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
			binder.bbox = bbox;
			binder.realBbox = [
				{ x: binder.bbox.x, y: binder.bbox.y },
				{ x: binder.bbox.x + binder.bbox.width, y: binder.bbox.y },
				{
					x: binder.bbox.x + binder.bbox.width,
					y: binder.bbox.y + binder.bbox.height,
				},
				{ x: binder.bbox.x, y: binder.bbox.y + binder.bbox.height },
			];
			binder.size = binder.bbox.width;
			binder.thick = binder.bbox.height;
			binder.graph.append(labelMeasure);

			const objData = [...objectMeta, binder];
			// OBJDATA.push(binder);
			binder.graph.remove();
			func.appendObjects(objData);
			objectMeta = setObjectMeta(objData);
			binder = setBinder(null);
			labelMeasure = setLabelMeasure(null);
			cross.remove();
			cross = setCross(null);
			$("#boxinfo").html("Measure added");
			mode = resetMode();
			save();
		}
	}

	// *******************************************************************
	// **************************   ROOM MODE   **************************
	// *******************************************************************

	if (mode == Mode.Room) {
		if (binder == null) {
			return false;
		}

		var area = binder.area / 3600;
		binder.attr({ fill: "none", stroke: "#ddf00a", "stroke-width": 7 });
		const room = roomMeta[binder.id];
		showRoomTools({
			size: area.toFixed(2),
			roomIndex: binder.id,
			surface: room.surface ?? "",
			showSurface: room.showSurface,
			seesArea: room.showSurface,
			background: room.color,
			name: room.name,
			action: room.action,
		});

		mode = setMode(Mode.EditRoom);
		save();
	}

	// *******************************************************************
	// **************************   NODE MODE   **************************
	// *******************************************************************

	if (mode == Mode.Node) {
		if (binder) {
			// ALSO ON MOUSEUP WITH HAVE CIRCLEBINDER ON ADDPOINT
			var newWall = new Wall(
				{ x: binder.data.x, y: binder.data.y },
				binder.data.wall.end,
				"normal",
				binder.data.wall.thick
			);
			wallMeta = setWallMeta([...wallMeta, newWall]);
			// WALLS.push(newWall);
			binder.data.wall.end = { x: binder.data.x, y: binder.data.y };
			binder.remove();
			binder = setBinder(null);
			editor.architect(
				wallMeta,
				setRooms,
				roomMeta,
				setRoomMeta,
				wallEquations
			);
			save();
		}
		mode = resetMode();
	}

	// *******************************************************************  ***** ****      *******  ******  ******  *****
	// **************************   OBJ MODE   ***************************  *   * *******     *****  ******  ******   **
	// *******************************************************************  ***** ****       ******  ******  ******  ***

	if (mode == Mode.Door) {
		if (binder == null) {
			$("#boxinfo").html("The plan currently contains no wall.");
			mode = resetMode();
			return false;
		}

		const objData = [...objectMeta, binder];
		// OBJDATA.push(binder);
		binder.graph.remove();
		func.appendObjects(objData);
		objectMeta = setObjectMeta(objData);
		binder = setBinder(null);
		$("#boxinfo").html("Element added");
		mode = resetMode();
		save();
	}

	// *******************************************************************
	// ********************   LINE MODE MOUSE UP   ***********************
	// *******************************************************************

	if (mode == Mode.Line || mode == Mode.Partition) {
		$("#linetemp").remove(); // DEL LINE HELP CONSTRUC 0 45 90
		func.intersectionOff(lineIntersectionP);

		var sizeWall = qSVG.measure({ x: x, y: y }, point);
		sizeWall = sizeWall / constants.METER_SIZE;
		if ($("#line_construc").length && sizeWall > 0.3) {
			var sizeWall = constants.WALL_SIZE;
			if (mode == Mode.Partition) sizeWall = constants.PARTITION_SIZE;
			var wall = new Wall(point, { x: x, y: y }, "normal", sizeWall);
			wallMeta = setWallMeta([...wallMeta, wall]);
			// WALLS.push(wall);
			editor.architect(
				wallMeta,
				setRooms,
				roomMeta,
				setRoomMeta,
				wallEquations
			);

			if (multiChecked && !wallEndConstruc) {
				setCursor("validation");
				action = setAction(true);
			} else action = setAction(false);
			$("#boxinfo").html(
				"Wall added <span style='font-size:0.6em'>approx. " +
					(qSVG.measure(point, { x: x, y: y }) / 60).toFixed(2) +
					" m</span>"
			);
			$("#line_construc").remove(); // DEL LINE CONSTRUC HELP TO VIEW NEW SEG PATH
			lengthTemp.remove();
			setLengthTemp(null);
			// construc = 0;
			if (wallEndConstruc) action = setAction(false);
			wallEndConstruc = setWallEndConstruc(false);
			point = setPoint({ x: x, y: y });
			save();
		} else {
			action = setAction(false);
			// construc = 0;
			$("#boxinfo").html("Select mode");
			mode = resetMode();
			if (binder) {
				binder.remove();
				binder = setBinder(null);
			}
			snap = calculateSnap(event, viewbox);
			point = setPoint({ x: snap.x, y: snap.y });
		}
	}
	// **************************** END LINE MODE MOUSE UP **************************

	//**************************************************************************************
	//**********************      BIND MODE MOUSE UP    ************************************
	//**************************************************************************************

	if (mode == Mode.Bind) {
		action = setAction(false);
		// construc = 0; // CONSTRUC 0 TO FREE BINDER GROUP NODE WALL MOVING
		if (binder) {
			mode = resetMode();

			if (binder.type == "segment") {
				var found = false;
				if (binder.wall.start == binder.before) {
					found = true;
				}

				if (found) {
					var objWall = editor.objFromWall(binder.wall, objectMeta);

					let isSeparation = binder.wall.type == "separate";
					showWallTools(binder.wall.thick, isSeparation);
					mode = setMode(Mode.EditWall);
				}
				wallEquations.equation1 = null;
				wallEquations.equation2 = null;
				wallEquations.equation3 = null;
				followerData.intersection = null;
			}

			if (binder.type == "obj") {
				var moveDistance =
					Math.abs(binder.oldXY.x - binder.x) +
					Math.abs(binder.oldXY.y - binder.y);
				if (moveDistance < 1) {
					const min = binder.obj.params.resizeLimit.width.min;
					const max = binder.obj.params.resizeLimit.width.max;
					showOpeningTools(min, max, binder.obj.size);
					// setCursor("default");
					// $("#boxinfo").html("Config. the door/window");
					// document
					// 	.getElementById("doorWindowWidth")
					// 	.setAttribute("min", binder.obj.params.resizeLimit.width.min);
					// document
					// 	.getElementById("doorWindowWidth")
					// 	.setAttribute("max", binder.obj.params.resizeLimit.width.max);
					// document.getElementById("doorWindowWidthScale").textContent =
					// 	binder.obj.params.resizeLimit.width.min +
					// 	"-" +
					// 	binder.obj.params.resizeLimit.width.max;
					// document.getElementById("doorWindowWidth").value = binder.obj.size;
					// document.getElementById("doorWindowWidthVal").textContent =
					// 	binder.obj.size;
					mode = setMode(Mode.EditDoor);
				} else {
					mode = setMode(Mode.Select);
					action = setAction(false);
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
					objectMeta.splice(objectMeta.indexOf(objectMeta), 1);
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
					// if (!objTarget.params.rotate) $("#objBoundingBoxRotation").hide();
					// else $("#objBoundingBoxRotation").show();
					// $("#panel").hide(100);
					// $("#objBoundingBox").show("200", function () {
					// 	setCursor("default");
					// 	$("#boxinfo").html("Modify the object");
					// 	document
					// 		.getElementById("bboxWidth")
					// 		.setAttribute("min", objTarget.params.resizeLimit.width.min);
					// 	document
					// 		.getElementById("bboxWidth")
					// 		.setAttribute("max", objTarget.params.resizeLimit.width.max);
					// 	document.getElementById("bboxWidthScale").textContent =
					// 		objTarget.params.resizeLimit.width.min +
					// 		"-" +
					// 		objTarget.params.resizeLimit.height.max;
					// 	document
					// 		.getElementById("bboxHeight")
					// 		.setAttribute("min", objTarget.params.resizeLimit.height.min);
					// 	document
					// 		.getElementById("bboxHeight")
					// 		.setAttribute("max", objTarget.params.resizeLimit.height.max);
					// 	document.getElementById("bboxHeightScale").textContent =
					// 		objTarget.params.resizeLimit.height.min +
					// 		"-" +
					// 		objTarget.params.resizeLimit.height.max;
					// 	$("#stepsCounter").hide();
					// 	if (objTarget.class == "stair") {
					// 		document.getElementById("bboxStepsVal").textContent =
					// 			objTarget.value;
					// 		$("#stepsCounter").show();
					// 	}
					// 	document.getElementById("bboxWidth").value = objTarget.width * 100;
					// 	document.getElementById("bboxWidthVal").textContent =
					// 		objTarget.width * 100;
					// 	document.getElementById("bboxHeight").value =
					// 		objTarget.height * 100;
					// 	document.getElementById("bboxHeightVal").textContent =
					// 		objTarget.height * 100;
					// 	document.getElementById("bboxRotation").value = objTarget.angle;
					// 	document.getElementById("bboxRotationVal").textContent =
					// 		objTarget.angle;
					// });
					mode = setMode(Mode.EditBoundingBox);
				} else {
					mode = setMode(Mode.Select);
					action = setAction(false);
					binder.graph.remove();
					binder = setBinder(null);
				}
			}

			if (mode == Mode.Bind) {
				binder.remove();
				binder = setBinder(null);
			}
		} // END BIND IS DEFINED
		save();
	} // END BIND MODE

	if (mode != Mode.EditRoom) {
		editor.showScaleBox(roomMeta, wallMeta);
		func.rib(wallMeta);
	}
};
