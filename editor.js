import { qSVG } from "./qSVG";
import { constants } from "./constants";
import {
	findById,
	intersectionOfEquations,
	isObjectsEquals,
} from "./src/utils";
import { createSvgElement } from "./src/svgTools";
import { v4 as uuid } from "uuid";
import { Wall } from "./src/wall";

export const editor = {
	colorWall: "#666",

	// RETURN OBJECTS ARRAY INDEX OF WALLS [WALL1, WALL2, n...] WALLS WITH THIS NODE, EXCEPT PARAM = OBJECT WALL
	getWallNodes: function (coords, wallMeta, except = null) {
		var nodes = [];
		for (var k in wallMeta) {
			if (isObjectsEquals(wallMeta[k], except)) continue;

			if (isObjectsEquals(wallMeta[k].start, coords)) {
				nodes.push({ wall: wallMeta[k], type: "start" });
			}
			if (isObjectsEquals(wallMeta[k].end, coords)) {
				nodes.push({ wall: wallMeta[k], type: "end" });
			}
		}
		return nodes.length == 0 ? false : nodes;
	},

	wallsComputing: function (wallMeta, wallEquations, action = null) {
		// IF ACTION == MOVE -> equation2 exist !!!!!
		$("#boxwall").empty();
		$("#boxArea").empty();

		for (var vertice = 0; vertice < wallMeta.length; vertice++) {
			var wall = wallMeta[vertice];
			if (wall.parent != null) {
				const parent = findById(wall.parent, wallMeta);
				if (
					!parent ||
					// (parent.start !== wall.start && parent.end !== wall.start)
					(!isObjectsEquals(parent.start, wall.start) &&
						!isObjectsEquals(parent.end, wall.start))
				) {
					wall.parent = null;
				}
				// if (
				// 	!isObjectsEquals(wall.parent.start, wall.start) &&
				// 	!isObjectsEquals(wall.parent.end, wall.start)
				// ) {
				// 	wall.parent = null;
				// }
			}

			const child = findById(wall.child, wallMeta);
			if (
				!child ||
				// (child.start !== wall.end && child.end !== wall.end)
				(!isObjectsEquals(child.start, wall.end) &&
					!isObjectsEquals(wall.child.end, wall.end))
			) {
				wall.child = null;
			}
		}

		for (var vertice = 0; vertice < wallMeta.length; vertice++) {
			var wall = wallMeta[vertice];
			if (wall.parent != null) {
				const parent = findById(wall.parent, wallMeta);
				if (isObjectsEquals(parent.start, wall.start)) {
					var previousWall = parent;
					var previousWallStart = previousWall.end;
					var previousWallEnd = previousWall.start;
				}
				if (isObjectsEquals(parent.end, wall.start)) {
					var previousWall = parent;
					var previousWallStart = previousWall.start;
					var previousWallEnd = previousWall.end;
				}
			} else {
				var nearestNodesToStart = editor.getWallNodes(
					wall.start,
					wallMeta,
					wall
				);
				// if (wallInhibation && isObjectsEquals(wall, wallInhibation)) S = false;
				for (var k in nearestNodesToStart) {
					var eqInter = editor.createEquationFromWall(
						nearestNodesToStart[k].wall
					);
					var angleInter = 90; // TO PASS TEST
					if (action == "move") {
						angleInter = qSVG.angleBetweenEquations(
							eqInter.A,
							wallEquations.equation2.A
						);
					}
					if (
						nearestNodesToStart[k].type == "start" &&
						nearestNodesToStart[k].wall.parent == null &&
						angleInter > 20 &&
						angleInter < 160
					) {
						wall.parent = nearestNodesToStart[k].wall.id;
						nearestNodesToStart[k].wall.parent = wall.id;
						var previousWall = findById(wall.parent, wallMeta);
						var previousWallStart = previousWall.end;
						var previousWallEnd = previousWall.start;
					}
					if (
						nearestNodesToStart[k].type == "end" &&
						nearestNodesToStart[k].wall.child == null &&
						angleInter > 20 &&
						angleInter < 160
					) {
						wall.parent = nearestNodesToStart[k].wall.id;
						nearestNodesToStart[k].wall.child = wall.id;
						var previousWall = findById(wall.parent, wallMeta);
						var previousWallStart = previousWall.start;
						var previousWallEnd = previousWall.end;
					}
				}
			}

			if (wall.child != null) {
				const child = findById(wall.child, wallMeta);
				if (isObjectsEquals(child.end, wall.end)) {
					var nextWall = child;
					var nextWallStart = nextWall.end;
					var nextWallEnd = nextWall.start;
				} else {
					var nextWall = child;
					var nextWallStart = nextWall.start;
					var nextWallEnd = nextWall.end;
				}
			} else {
				var nearestNodesToEnd = editor.getWallNodes(wall.end, wallMeta, wall);
				// if (wallInhibation && isObjectsEquals(wall, wallInhibation)) E = false;
				for (var k in nearestNodesToEnd) {
					var eqInter = editor.createEquationFromWall(
						nearestNodesToEnd[k].wall
					);
					var angleInter = 90; // TO PASS TEST
					if (action == "move") {
						angleInter = qSVG.angleBetweenEquations(
							eqInter.A,
							wallEquations.equation2.A
						);
					}
					if (
						nearestNodesToEnd[k].type == "end" &&
						nearestNodesToEnd[k].wall.child == null &&
						angleInter > 20 &&
						angleInter < 160
					) {
						wall.child = nearestNodesToEnd[k].wall.id;
						nearestNodesToEnd[k].wall.child = wall.id;
						var nextWall = findById(wall.child, wallMeta);
						var nextWallStart = nextWall.end;
						var nextWallEnd = nextWall.start;
					}
					if (
						nearestNodesToEnd[k].type == "start" &&
						nearestNodesToEnd[k].wall.parent == null &&
						angleInter > 20 &&
						angleInter < 160
					) {
						wall.child = nearestNodesToEnd[k].wall.id;
						nearestNodesToEnd[k].wall.parent = wall.id;
						var nextWall = findById(wall.child, wallMeta);
						var nextWallStart = nextWall.start;
						var nextWallEnd = nextWall.end;
					}
				}
			}

			var angleWall = Math.atan2(
				wall.end.y - wall.start.y,
				wall.end.x - wall.start.x
			);
			wall.angle = angleWall;
			var wallThickX = (wall.thick / 2) * Math.sin(angleWall);
			var wallThickY = (wall.thick / 2) * Math.cos(angleWall);
			var eqWallUp = qSVG.createEquation(
				wall.start.x + wallThickX,
				wall.start.y - wallThickY,
				wall.end.x + wallThickX,
				wall.end.y - wallThickY
			);
			var eqWallDw = qSVG.createEquation(
				wall.start.x - wallThickX,
				wall.start.y + wallThickY,
				wall.end.x - wallThickX,
				wall.end.y + wallThickY
			);
			var eqWallBase = qSVG.createEquation(
				wall.start.x,
				wall.start.y,
				wall.end.x,
				wall.end.y
			);
			wall.equations = { up: eqWallUp, down: eqWallDw, base: eqWallBase };
			var dWay;

			// WALL STARTED
			if (wall.parent == null) {
				var eqP = qSVG.perpendicularEquation(
					eqWallUp,
					wall.start.x,
					wall.start.y
				);
				var interUp = intersectionOfEquations(eqWallUp, eqP);
				var interDw = intersectionOfEquations(eqWallDw, eqP);
				wall.coords = [interUp, interDw];
				dWay =
					"M" +
					interUp.x +
					"," +
					interUp.y +
					" L" +
					interDw.x +
					"," +
					interDw.y +
					" ";
			} else {
				var eqP = qSVG.perpendicularEquation(
					eqWallUp,
					wall.start.x,
					wall.start.y
				);
				// var previousWall = wall.parent;
				//   var previousWallStart = previousWall.start;
				//   var previousWallEnd = previousWall.end;
				var anglePreviousWall = Math.atan2(
					previousWallEnd.y - previousWallStart.y,
					previousWallEnd.x - previousWallStart.x
				);
				var previousWallThickX =
					(previousWall.thick / 2) * Math.sin(anglePreviousWall);
				var previousWallThickY =
					(previousWall.thick / 2) * Math.cos(anglePreviousWall);
				var eqPreviousWallUp = qSVG.createEquation(
					previousWallStart.x + previousWallThickX,
					previousWallStart.y - previousWallThickY,
					previousWallEnd.x + previousWallThickX,
					previousWallEnd.y - previousWallThickY
				);
				var eqPreviousWallDw = qSVG.createEquation(
					previousWallStart.x - previousWallThickX,
					previousWallStart.y + previousWallThickY,
					previousWallEnd.x - previousWallThickX,
					previousWallEnd.y + previousWallThickY
				);
				if (Math.abs(anglePreviousWall - angleWall) > 0.09) {
					var interUp = intersectionOfEquations(eqWallUp, eqPreviousWallUp);
					var interDw = intersectionOfEquations(eqWallDw, eqPreviousWallDw);

					if (eqWallUp.A == eqPreviousWallUp.A) {
						interUp = {
							x: wall.start.x + wallThickX,
							y: wall.start.y - wallThickY,
						};
						interDw = {
							x: wall.start.x - wallThickX,
							y: wall.start.y + wallThickY,
						};
					}

					var miter = qSVG.gap(interUp, {
						x: previousWallEnd.x,
						y: previousWallEnd.y,
					});
					if (miter > 1000) {
						var interUp = intersectionOfEquations(eqP, eqWallUp);
						var interDw = intersectionOfEquations(eqP, eqWallDw);
					}
				}
				if (Math.abs(anglePreviousWall - angleWall) <= 0.09) {
					var interUp = intersectionOfEquations(eqP, eqWallUp);
					var interDw = intersectionOfEquations(eqP, eqWallDw);
				}
				wall.coords = [interUp, interDw];
				dWay =
					"M" +
					interUp.x +
					"," +
					interUp.y +
					" L" +
					interDw.x +
					"," +
					interDw.y +
					" ";
			}

			// WALL FINISHED
			if (wall.child == null) {
				var eqP = qSVG.perpendicularEquation(eqWallUp, wall.end.x, wall.end.y);
				var interUp = intersectionOfEquations(eqWallUp, eqP);
				var interDw = intersectionOfEquations(eqWallDw, eqP);
				wall.coords.push(interDw, interUp);
				dWay =
					dWay +
					"L" +
					interDw.x +
					"," +
					interDw.y +
					" L" +
					interUp.x +
					"," +
					interUp.y +
					" Z";
			} else {
				var eqP = qSVG.perpendicularEquation(eqWallUp, wall.end.x, wall.end.y);
				// var nextWall = wall.child;
				//   var nextWallStart = nextWall.start;
				//   var nextWallEnd = nextWall.end;
				var angleNextWall = Math.atan2(
					nextWallEnd.y - nextWallStart.y,
					nextWallEnd.x - nextWallStart.x
				);
				var nextWallThickX = (nextWall.thick / 2) * Math.sin(angleNextWall);
				var nextWallThickY = (nextWall.thick / 2) * Math.cos(angleNextWall);
				var eqNextWallUp = qSVG.createEquation(
					nextWallStart.x + nextWallThickX,
					nextWallStart.y - nextWallThickY,
					nextWallEnd.x + nextWallThickX,
					nextWallEnd.y - nextWallThickY
				);
				var eqNextWallDw = qSVG.createEquation(
					nextWallStart.x - nextWallThickX,
					nextWallStart.y + nextWallThickY,
					nextWallEnd.x - nextWallThickX,
					nextWallEnd.y + nextWallThickY
				);
				if (Math.abs(angleNextWall - angleWall) > 0.09) {
					var interUp = intersectionOfEquations(eqWallUp, eqNextWallUp);
					var interDw = intersectionOfEquations(eqWallDw, eqNextWallDw);

					if (eqWallUp.A == eqNextWallUp.A) {
						interUp = {
							x: wall.end.x + wallThickX,
							y: wall.end.y - wallThickY,
						};
						interDw = {
							x: wall.end.x - wallThickX,
							y: wall.end.y + wallThickY,
						};
					}

					var miter = qSVG.gap(interUp, {
						x: nextWallStart.x,
						y: nextWallStart.y,
					});
					if (miter > 1000) {
						var interUp = intersectionOfEquations(eqWallUp, eqP);
						var interDw = intersectionOfEquations(eqWallDw, eqP);
					}
				}
				if (Math.abs(angleNextWall - angleWall) <= 0.09) {
					var interUp = intersectionOfEquations(eqWallUp, eqP);
					var interDw = intersectionOfEquations(eqWallUp, eqP);
				}

				wall.coords.push(interDw, interUp);
				dWay =
					dWay +
					"L" +
					interDw.x +
					"," +
					interDw.y +
					" L" +
					interUp.x +
					"," +
					interUp.y +
					" Z";
			}

			wall.graph = editor.makeWall(dWay);
			$("#boxwall").append(wall.graph);
		}
	},

	makeWall: function (way) {
		var wallScreen = qSVG.create("none", "path", {
			d: way,
			stroke: "none",
			fill: constants.COLOR_WALL,
			"stroke-width": 1,
			"stroke-linecap": "butt",
			"stroke-linejoin": "miter",
			"stroke-miterlimit": 4,
			"fill-rule": "nonzero",
		});
		return wallScreen;
	},

	architect: function (walls, setRooms, roomMeta, setRoomMeta, wallEquations) {
		editor.wallsComputing(walls, wallEquations);
		const rooms = qSVG.polygonize(walls);
		setRooms(rooms);
		editor.roomMaker(rooms, roomMeta, setRoomMeta);
		return true;
	},

	nearWallNode: function (snap, wallMeta, range = Infinity, except = [""]) {
		var best;
		var bestWall;
		var i = 0;
		var scanDistance;
		var bestDistance = Infinity;
		for (var k = 0; k < wallMeta.length; k++) {
			if (except.indexOf(wallMeta[k]) == -1) {
				const scanStart = wallMeta[k].start;
				const scanEnd = wallMeta[k].end;
				let scanDistance = qSVG.measure(scanStart, snap);
				if (scanDistance < bestDistance) {
					best = scanStart;
					bestDistance = scanDistance;
					bestWall = k;
				}
				scanDistance = qSVG.measure(scanEnd, snap);
				if (scanDistance < bestDistance) {
					best = scanEnd;
					bestDistance = scanDistance;
					bestWall = k;
				}
			}
		}
		if (bestDistance <= range) {
			return {
				x: best.x,
				y: best.y,
				bestWall: bestWall,
			};
		} else {
			return false;
		}
	},

	stickOnWall: function (snap, wallMeta) {
		if (wallMeta.length == 0) return false;
		var wallDistance = Infinity;
		var wallSelected = {};
		var result;
		if (wallMeta.length == 0) return false;
		for (var e = 0; e < wallMeta.length; e++) {
			var eq1 = qSVG.createEquation(
				wallMeta[e].coords[0].x,
				wallMeta[e].coords[0].y,
				wallMeta[e].coords[3].x,
				wallMeta[e].coords[3].y
			);
			result1 = qSVG.nearPointOnEquation(eq1, snap);
			var eq2 = qSVG.createEquation(
				wallMeta[e].coords[1].x,
				wallMeta[e].coords[1].y,
				wallMeta[e].coords[2].x,
				wallMeta[e].coords[2].y
			);
			result2 = qSVG.nearPointOnEquation(eq2, snap);
			if (
				result1.distance < wallDistance &&
				qSVG.btwn(
					result1.x,
					wallMeta[e].coords[0].x,
					wallMeta[e].coords[3].x
				) &&
				qSVG.btwn(result1.y, wallMeta[e].coords[0].y, wallMeta[e].coords[3].y)
			) {
				wallDistance = result1.distance;
				wallSelected = {
					wall: wallMeta[e],
					x: result1.x,
					y: result1.y,
					distance: result1.distance,
				};
			}
			if (
				result2.distance < wallDistance &&
				qSVG.btwn(
					result2.x,
					wallMeta[e].coords[1].x,
					wallMeta[e].coords[2].x
				) &&
				qSVG.btwn(result2.y, wallMeta[e].coords[1].y, wallMeta[e].coords[2].y)
			) {
				wallDistance = result2.distance;
				wallSelected = {
					wall: wallMeta[e],
					x: result2.x,
					y: result2.y,
					distance: result2.distance,
				};
			}
		}
		var vv = editor.nearVertice(snap, wallMeta);
		if (vv.distance < wallDistance) {
			var eq1 = qSVG.createEquation(
				vv.number.coords[0].x,
				vv.number.coords[0].y,
				vv.number.coords[3].x,
				vv.number.coords[3].y
			);
			result1 = qSVG.nearPointOnEquation(eq1, vv);
			var eq2 = qSVG.createEquation(
				vv.number.coords[1].x,
				vv.number.coords[1].y,
				vv.number.coords[2].x,
				vv.number.coords[2].y
			);
			result2 = qSVG.nearPointOnEquation(eq2, vv);
			if (
				result1.distance < wallDistance &&
				qSVG.btwn(result1.x, vv.number.coords[0].x, vv.number.coords[3].x) &&
				qSVG.btwn(result1.y, vv.number.coords[0].y, vv.number.coords[3].y)
			) {
				wallDistance = result1.distance;
				wallSelected = {
					wall: vv.number,
					x: result1.x,
					y: result1.y,
					distance: result1.distance,
				};
			}
			if (
				result2.distance < wallDistance &&
				qSVG.btwn(result2.x, vv.number.coords[1].x, vv.number.coords[2].x) &&
				qSVG.btwn(result2.y, vv.number.coords[1].y, vv.number.coords[2].y)
			) {
				wallDistance = result2.distance;
				wallSelected = {
					wall: vv.number,
					x: result2.x,
					y: result2.y,
					distance: result2.distance,
				};
			}
		}
		return wallSelected;
	},

	// RETURN OBJDATA INDEX LIST FROM AN WALL
	objFromWall: function (wall, objectMeta) {
		var objList = [];
		for (var scan = 0; scan < objectMeta.length; scan++) {
			var search;
			if (objectMeta[scan].family == "inWall") {
				var eq = qSVG.createEquation(
					wall.start.x,
					wall.start.y,
					wall.end.x,
					wall.end.y
				);
				search = qSVG.nearPointOnEquation(eq, objectMeta[scan]);
				if (
					search.distance < 0.01 &&
					qSVG.btwn(objectMeta[scan].x, wall.start.x, wall.end.x) &&
					qSVG.btwn(objectMeta[scan].y, wall.start.y, wall.end.y)
				)
					objList.push(objectMeta[scan]);
				// WARNING 0.01 TO NO COUNT OBJECT ON LIMITS OF THE EDGE !!!!!!!!!!!! UGLY CODE( MOUSE PRECISION)
				// TRY WITH ANGLE MAYBE ???
			}
		}
		return objList;
	},

	createEquationFromWall: function (wall) {
		return qSVG.createEquation(
			wall.start.x,
			wall.start.y,
			wall.end.x,
			wall.end.y
		);
	},

	rayCastingWall: function (snap, wallMeta) {
		var wallList = [];
		wallMeta.forEach((wall) => {
			var polygon = [];
			for (var pp = 0; pp < 4; pp++) {
				polygon.push({
					x: wall.coords[pp].x,
					y: wall.coords[pp].y,
				}); // FOR Z
			}
			if (qSVG.rayCasting(snap, polygon)) {
				wallList.push(wall); // Return EDGES Index
			}
		});
		if (wallList.length == 0) return false;
		if (wallList.length == 1) return wallList[0];
		return wallList;
	},

	inWallRib2: function (wall, objectMeta, option = false) {
		if (!option) $("#boxRib").empty();
		const ribMaster = [];
		var emptyArray = [];
		ribMaster.push(emptyArray);
		ribMaster.push(emptyArray);
		var distance;
		var angleTextValue = wall.angle * (180 / Math.PI);
		var objWall = editor.objFromWall(wall, objectMeta); // LIST OBJ ON EDGE
		ribMaster[0].push({
			wall: wall,
			crossObj: false,
			side: "up",
			coords: wall.coords[0],
			distance: 0,
		});
		ribMaster[1].push({
			wall: wall,
			crossObj: false,
			side: "down",
			coords: wall.coords[1],
			distance: 0,
		});
		for (var ob in objWall) {
			var objTarget = objWall[ob];
			objTarget.up = [
				qSVG.nearPointOnEquation(wall.equations.up, objTarget.limit[0]),
				qSVG.nearPointOnEquation(wall.equations.up, objTarget.limit[1]),
			];
			objTarget.down = [
				qSVG.nearPointOnEquation(wall.equations.down, objTarget.limit[0]),
				qSVG.nearPointOnEquation(wall.equations.down, objTarget.limit[1]),
			];

			distance =
				qSVG.measure(wall.coords[0], objTarget.up[0]) / constants.METER_SIZE;
			ribMaster[0].push({
				wall: wall,
				crossObj: ob,
				side: "up",
				coords: objTarget.up[0],
				distance: distance.toFixed(2),
			});
			distance =
				qSVG.measure(wall.coords[0], objTarget.up[1]) / constants.METER_SIZE;
			ribMaster[0].push({
				wall: wall,
				crossObj: ob,
				side: "up",
				coords: objTarget.up[1],
				distance: distance.toFixed(2),
			});
			distance =
				qSVG.measure(wall.coords[1], objTarget.down[0]) / constants.METER_SIZE;
			ribMaster[1].push({
				wall: wall,
				crossObj: ob,
				side: "down",
				coords: objTarget.down[0],
				distance: distance.toFixed(2),
			});
			distance =
				qSVG.measure(wall.coords[1], objTarget.down[1]) / constants.METER_SIZE;
			ribMaster[1].push({
				wall: wall,
				crossObj: ob,
				side: "down",
				coords: objTarget.down[1],
				distance: distance.toFixed(2),
			});
		}
		distance =
			qSVG.measure(wall.coords[0], wall.coords[3]) / constants.METER_SIZE;
		ribMaster[0].push({
			wall: wall,
			crossObj: false,
			side: "up",
			coords: wall.coords[3],
			distance: distance,
		});
		distance =
			qSVG.measure(wall.coords[1], wall.coords[2]) / constants.METER_SIZE;
		ribMaster[1].push({
			wall: wall,
			crossObj: false,
			side: "down",
			coords: wall.coords[2],
			distance: distance,
		});
		ribMaster[0].sort(function (a, b) {
			return (a.distance - b.distance).toFixed(2);
		});
		ribMaster[1].sort(function (a, b) {
			return (a.distance - b.distance).toFixed(2);
		});

		for (var t in ribMaster) {
			const sizeText = [];
			for (var n = 1; n < ribMaster[t].length; n++) {
				var found = true;
				var shift = -5;
				var valueText = Math.abs(
					ribMaster[t][n - 1].distance - ribMaster[t][n].distance
				);
				var angleText = angleTextValue;
				if (found) {
					if (ribMaster[t][n - 1].side == "down") {
						shift = -shift + 10;
					}
					if (angleText > 89 || angleText < -89) {
						angleText -= 180;
						if (ribMaster[t][n - 1].side == "down") {
							shift = -5;
						} else shift = -shift + 10;
					}

					const textElement = document.createElementNS(
						"http://www.w3.org/2000/svg",
						"text"
					);
					var startText = qSVG.middle(
						ribMaster[t][n - 1].coords.x,
						ribMaster[t][n - 1].coords.y,
						ribMaster[t][n].coords.x,
						ribMaster[t][n].coords.y
					);
					textElement.setAttributeNS(null, "x", startText.x);
					textElement.setAttributeNS(null, "y", startText.y + shift);
					textElement.setAttributeNS(null, "text-anchor", "middle");
					textElement.setAttributeNS(null, "font-family", "roboto");
					textElement.setAttributeNS(null, "stroke", "#ffffff");
					textElement.textContent = valueText.toFixed(2);
					if (textElement.textContent < 1) {
						textElement.setAttributeNS(null, "font-size", "0.8em");
						textElement.textContent = textElement.textContent.substring(
							1,
							textElement.textContent.length
						);
					} else textElement.setAttributeNS(null, "font-size", "1em");
					textElement.setAttributeNS(null, "stroke-width", "0.4px");
					textElement.setAttributeNS(null, "fill", "#666666");
					textElement.setAttribute(
						"transform",
						"rotate(" + angleText + " " + startText.x + "," + startText.y + ")"
					);

					$("#boxRib").append(textElement);
				}
			}
		}
	},

	roomMaker: function (roomPolygonData, roomMeta, setRoomMeta) {
		let globalArea = 0;
		// var oldVertexNumber = [];
		if (roomPolygonData.polygons.length == 0) {
			roomMeta = setRoomMeta([]);
		}
		for (var pp = 0; pp < roomPolygonData.polygons.length; pp++) {
			var foundRoom = false;
			let roomPoly = roomPolygonData.polygons[pp];
			for (var rr = 0; rr < roomMeta.length; rr++) {
				var countCoords = roomPoly.coords.length;
				var diffCoords = qSVG.diffObjIntoArray(
					roomPoly.coords,
					roomMeta[rr].coords
				);
				if (roomPoly.way.length == roomMeta[rr].way.length) {
					if (
						qSVG.diffArray(roomPoly.way, roomMeta[rr].way).length == 0 ||
						diffCoords == 0
					) {
						countCoords = 0;
					}
				}
				if (roomPoly.way.length == roomMeta[rr].way.length + 1) {
					if (
						qSVG.diffArray(roomPoly.way, roomMeta[rr].way).length == 1 ||
						diffCoords == 2
					) {
						countCoords = 0;
					}
				}
				if (roomPoly.way.length == roomMeta[rr].way.length - 1) {
					if (qSVG.diffArray(roomPoly.way, roomMeta[rr].way).length == 1) {
						countCoords = 0;
					}
				}
				if (countCoords == 0) {
					foundRoom = true;
					roomMeta = setRoomMeta([
						...roomMeta.filter((r) => r !== roomMeta[rr]),
						{
							...roomMeta[rr],
							area: roomPoly.area,
							inside: roomPoly.inside,
							coords: roomPoly.coords,
							coordsOutside: roomPoly.coordsOutside,
							way: roomPoly.way,
							coordsInside: roomPoly.coordsInside,
						},
					]);
					// ROOM[rr].area = roomPoly.area;
					// ROOM[rr].inside = roomPoly.inside;
					// ROOM[rr].coords = roomPoly.coords;
					// ROOM[rr].coordsOutside = roomPoly.coordsOutside;
					// ROOM[rr].way = roomPoly.way;
					// ROOM[rr].coordsInside = roomPoly.coordsInside;
					break;
				}
			}
			if (!foundRoom) {
				roomMeta = setRoomMeta([
					...roomMeta,
					{
						coords: roomPoly.coords,
						coordsOutside: roomPoly.coordsOutside,
						coordsInside: roomPoly.coordsInside,
						inside: roomPoly.inside,
						way: roomPoly.way,
						area: roomPoly.area,
						surface: "",
						name: "",
						color: "gradientWhite",
						showSurface: true,
						action: "add",
					},
				]);
			}
		}

		var toSplice = [];
		for (var rr = 0; rr < roomMeta.length; rr++) {
			var found = true;
			for (var pp = 0; pp < roomPolygonData.polygons.length; pp++) {
				var countRoom = roomMeta[rr].coords.length;
				let roomPoly = roomPolygonData.polygons[pp];
				var diffCoords = qSVG.diffObjIntoArray(
					roomPoly.coords,
					roomMeta[rr].coords
				);
				if (roomPoly.way.length == roomMeta[rr].way.length) {
					if (
						qSVG.diffArray(roomPoly.way, roomMeta[rr].way).length == 0 ||
						diffCoords == 0
					) {
						countRoom = 0;
					}
				}
				if (roomPoly.way.length == roomMeta[rr].way.length + 1) {
					if (
						qSVG.diffArray(roomPoly.way, roomMeta[rr].way).length == 1 ||
						diffCoords == 2
					) {
						countRoom = 0;
					}
				}
				if (roomPoly.way.length == roomMeta[rr].way.length - 1) {
					if (qSVG.diffArray(roomPoly.way, roomMeta[rr].way).length == 1) {
						countRoom = 0;
					}
				}
				if (countRoom == 0) {
					found = true;
					break;
				} else found = false;
			}
			if (!found) toSplice.push(rr);
		}

		toSplice.sort(function (a, b) {
			return b - a;
		});

		for (var ss = 0; ss < toSplice.length; ss++) {
			roomMeta.splice(toSplice[ss], 1);
		}
		setRoomMeta(roomMeta);
		$("#boxRoom").empty();
		$("#boxSurface").empty();
		$("#boxArea").empty();
		for (var rr = 0; rr < roomMeta.length; rr++) {
			if (roomMeta[rr].action == "add")
				globalArea = globalArea + roomMeta[rr].area;

			var pathSurface = roomMeta[rr].coords;
			var pathCreate = "M" + pathSurface[0].x + "," + pathSurface[0].y;
			for (var p = 1; p < pathSurface.length; p++) {
				pathCreate =
					pathCreate + " " + "L" + pathSurface[p].x + "," + pathSurface[p].y;
			}
			if (roomMeta[rr].inside.length > 0) {
				for (var ins = 0; ins < roomMeta[rr].inside.length; ins++) {
					pathCreate =
						pathCreate +
						" M" +
						roomPolygonData.polygons[roomMeta[rr].inside[ins]].coords[
							roomPolygonData.polygons[roomMeta[rr].inside[ins]].coords.length -
								1
						].x +
						"," +
						roomPolygonData.polygons[roomMeta[rr].inside[ins]].coords[
							roomPolygonData.polygons[roomMeta[rr].inside[ins]].coords.length -
								1
						].y;
					for (
						var free =
							roomPolygonData.polygons[roomMeta[rr].inside[ins]].coords.length -
							2;
						free > -1;
						free--
					) {
						pathCreate =
							pathCreate +
							" L" +
							roomPolygonData.polygons[roomMeta[rr].inside[ins]].coords[free]
								.x +
							"," +
							roomPolygonData.polygons[roomMeta[rr].inside[ins]].coords[free].y;
					}
				}
			}
			createSvgElement("boxRoom", "path", {
				d: pathCreate,
				fill: "url(#" + roomMeta[rr].color + ")",
				"fill-opacity": 1,
				stroke: "none",
				"fill-rule": "evenodd",
				class: "room",
			});

			createSvgElement("boxSurface", "path", {
				d: pathCreate,
				fill: "#fff",
				"fill-opacity": 1,
				stroke: "none",
				"fill-rule": "evenodd",
				class: "room",
			});

			var centroid = qSVG.polygonVisualCenter(roomMeta[rr], roomMeta);

			if (roomMeta[rr].name != "") {
				var styled = { color: "#343938" };
				if (
					roomMeta[rr].color == "gradientBlack" ||
					roomMeta[rr].color == "gradientBlue"
				)
					styled.color = "white";
				qSVG.textOnDiv(roomMeta[rr].name, centroid, styled, "boxArea");
			}

			if (roomMeta[rr].name != "") centroid.y = centroid.y + 20;
			var area =
				(
					roomMeta[rr].area /
					(constants.METER_SIZE * constants.METER_SIZE)
				).toFixed(2) + " m²";
			var styled = {
				color: "#343938",
				fontSize: "12.5px",
				fontWeight: "normal",
			};
			if (roomMeta[rr].surface != "") {
				styled.fontWeight = "bold";
				area = roomMeta[rr].surface + " m²";
			}
			if (
				roomMeta[rr].color == "gradientBlack" ||
				roomMeta[rr].color == "gradientBlue"
			)
				styled.color = "white";
			if (roomMeta[rr].showSurface)
				qSVG.textOnDiv(area, centroid, styled, "boxArea");
		}
		if (globalArea <= 0) {
			globalArea = 0;
			$("#areaValue").html("");
		} else {
			$("#areaValue").html(
				'<i class="fa fa-map-o" aria-hidden="true"></i> ' +
					(globalArea / 3600).toFixed(1) +
					" m²"
			);
		}
	},

	rayCastingRoom: function (point, roomMeta) {
		var roomGroup = [];
		for (var polygon = 0; polygon < roomMeta.length; polygon++) {
			var inside = qSVG.rayCasting(point, roomMeta[polygon].coords);

			if (inside) {
				roomGroup.push(polygon);
			}
		}
		if (roomGroup.length > 0) {
			var bestArea = roomMeta[roomGroup[0]].area;
			var roomTarget;
			for (var siz = 0; siz < roomGroup.length; siz++) {
				if (roomMeta[roomGroup[siz]].area <= bestArea) {
					bestArea = roomMeta[roomGroup[siz]].area;
					roomTarget = roomMeta[roomGroup[siz]];
				}
			}
			return roomTarget;
		} else {
			return false;
		}
	},

	nearVertice: function (snap, wallMeta, range = 10000) {
		var bestDistance = Infinity;
		var bestVertice;
		for (var i = 0; i < wallMeta.length; i++) {
			var distance1 = qSVG.gap(snap, {
				x: wallMeta[i].start.x,
				y: wallMeta[i].start.y,
			});
			var distance2 = qSVG.gap(snap, {
				x: wallMeta[i].end.x,
				y: wallMeta[i].end.y,
			});
			if (distance1 < distance2 && distance1 < bestDistance) {
				bestDistance = distance1;
				bestVertice = {
					number: wallMeta[i],
					x: wallMeta[i].start.x,
					y: wallMeta[i].start.y,
					distance: Math.sqrt(bestDistance),
				};
			}
			if (distance2 < distance1 && distance2 < bestDistance) {
				bestDistance = distance2;
				bestVertice = {
					number: wallMeta[i],
					x: wallMeta[i].end.x,
					y: wallMeta[i].end.y,
					distance: Math.sqrt(bestDistance),
				};
			}
		}
		if (bestDistance < range * range) return bestVertice;
		else return false;
	},

	nearWall: function (snap, wallMeta, range = Infinity) {
		var wallDistance = Infinity;
		var wallSelected = {};
		var result;
		if (wallMeta.length == 0) return false;
		for (var e = 0; e < wallMeta.length; e++) {
			var eq = qSVG.createEquation(
				wallMeta[e].start.x,
				wallMeta[e].start.y,
				wallMeta[e].end.x,
				wallMeta[e].end.y
			);
			result = qSVG.nearPointOnEquation(eq, snap);
			if (
				result.distance < wallDistance &&
				qSVG.btwn(result.x, wallMeta[e].start.x, wallMeta[e].end.x) &&
				qSVG.btwn(result.y, wallMeta[e].start.y, wallMeta[e].end.y)
			) {
				wallDistance = result.distance;
				wallSelected = {
					wall: wallMeta[e],
					x: result.x,
					y: result.y,
					distance: result.distance,
				};
			}
		}
		var vv = editor.nearVertice(snap, wallMeta);
		if (vv.distance < wallDistance) {
			wallDistance = vv.distance;
			wallSelected = {
				wall: vv.number,
				x: vv.x,
				y: vv.y,
				distance: vv.distance,
			};
		}
		if (wallDistance <= range) return wallSelected;
		else return false;
	},

	showScaleBox: function (roomMeta, wallMeta) {
		if (roomMeta.length > 0) {
			var minX, minY, maxX, maxY;
			for (var i = 0; i < wallMeta.length; i++) {
				var px = wallMeta[i].start.x;
				var py = wallMeta[i].start.y;
				if (!i || px < minX) minX = px;
				if (!i || py < minY) minY = py;
				if (!i || px > maxX) maxX = px;
				if (!i || py > maxY) maxY = py;
				var px = wallMeta[i].end.x;
				var py = wallMeta[i].end.y;
				if (!i || px < minX) minX = px;
				if (!i || py < minY) minY = py;
				if (!i || px > maxX) maxX = px;
				if (!i || py > maxY) maxY = py;
			}
			var width = maxX - minX;
			var height = maxY - minY;

			var labelWidth = ((maxX - minX) / constants.METER_SIZE).toFixed(2);
			var labelHeight = ((maxY - minY) / constants.METER_SIZE).toFixed(2);

			var sideRight = "m" + (maxX + 40) + "," + minY;
			sideRight = sideRight + " l60,0 m-40,10 l10,-10 l10,10 m-10,-10";
			sideRight = sideRight + " l0," + height;
			sideRight = sideRight + " m-30,0 l60,0 m-40,-10 l10,10 l10,-10";

			sideRight = sideRight + "M" + minX + "," + (minY - 40);
			sideRight = sideRight + " l0,-60 m10,40 l-10,-10 l10,-10 m-10,10";
			sideRight = sideRight + " l" + width + ",0";
			sideRight = sideRight + " m0,30 l0,-60 m-10,40 l10,-10 l-10,-10";

			$("#boxScale").empty();

			createSvgElement("boxScale", "path", {
				d: sideRight,
				stroke: "#555",
				fill: "none",
				"stroke-width": 0.3,
				"stroke-linecap": "butt",
				"stroke-linejoin": "miter",
				"stroke-miterlimit": 4,
				"fill-rule": "nonzero",
			});

			var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
			text.setAttributeNS(null, "x", maxX + 70);
			text.setAttributeNS(null, "y", (maxY + minY) / 2 + 35);
			text.setAttributeNS(null, "fill", "#555");
			text.setAttributeNS(null, "text-anchor", "middle");
			text.textContent = labelHeight + " m";
			text.setAttribute(
				"transform",
				"rotate(270 " + (maxX + 70) + "," + (maxY + minY) / 2 + ")"
			);
			$("#boxScale").append(text);

			var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
			text.setAttributeNS(null, "x", (maxX + minX) / 2);
			text.setAttributeNS(null, "y", minY - 95);
			text.setAttributeNS(null, "fill", "#555");
			text.setAttributeNS(null, "text-anchor", "middle");
			text.textContent = labelWidth + " m";
			$("#boxScale").append(text);
		}
	},
};
