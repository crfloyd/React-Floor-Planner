import { qSVG } from "./qSVG";
import { constants } from "./constants";
import {
	createSvgElement,
	createEquation,
	pointInPolygon,
	nearPointOnEquation,
} from "./src/svgTools";

export const editor = {
	nearWallNode: function (snap, wallMeta, range = Infinity, except = []) {
		var best;
		var bestWall;
		var i = 0;
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
		let wallDistance = Infinity;
		let wallSelected = {};
		if (wallMeta.length == 0) return false;
		wallMeta.forEach((wall) => {
			const eq1 = createEquation(
				wall.coords[0].x,
				wall.coords[0].y,
				wall.coords[3].x,
				wall.coords[3].y
			);
			result1 = nearPointOnEquation(eq1, snap);
			const eq2 = createEquation(
				wall.coords[1].x,
				wall.coords[1].y,
				wall.coords[2].x,
				wall.coords[2].y
			);
			result2 = nearPointOnEquation(eq2, snap);
			if (
				result1.distance < wallDistance &&
				qSVG.btwn(result1.x, wall.coords[0].x, wall.coords[3].x) &&
				qSVG.btwn(result1.y, wall.coords[0].y, wall.coords[3].y)
			) {
				wallDistance = result1.distance;
				wallSelected = {
					wall: wall,
					x: result1.x,
					y: result1.y,
					distance: result1.distance,
				};
			}
			if (
				result2.distance < wallDistance &&
				qSVG.btwn(result2.x, wall.coords[1].x, wall.coords[2].x) &&
				qSVG.btwn(result2.y, wall.coords[1].y, wall.coords[2].y)
			) {
				wallDistance = result2.distance;
				wallSelected = {
					wall: wall,
					x: result2.x,
					y: result2.y,
					distance: result2.distance,
				};
			}
		});
		var vv = editor.nearVertice(snap, wallMeta);
		if (vv.distance < wallDistance) {
			var eq1 = createEquation(
				vv.number.coords[0].x,
				vv.number.coords[0].y,
				vv.number.coords[3].x,
				vv.number.coords[3].y
			);
			result1 = nearPointOnEquation(eq1, vv);
			var eq2 = createEquation(
				vv.number.coords[1].x,
				vv.number.coords[1].y,
				vv.number.coords[2].x,
				vv.number.coords[2].y
			);
			result2 = nearPointOnEquation(eq2, vv);
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

	// Returns the objects on a wall

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
			if (pointInPolygon(snap, polygon)) {
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
		var objWall = wall.getObjects(objectMeta); // LIST OBJ ON EDGE
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
				nearPointOnEquation(wall.equations.up, objTarget.limit[0]),
				nearPointOnEquation(wall.equations.up, objTarget.limit[1]),
			];
			objTarget.down = [
				nearPointOnEquation(wall.equations.down, objTarget.limit[0]),
				nearPointOnEquation(wall.equations.down, objTarget.limit[1]),
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

	rayCastingRoom: function (point, roomMeta) {
		var roomGroup = [];
		for (var polygon = 0; polygon < roomMeta.length; polygon++) {
			var inside = pointInPolygon(point, roomMeta[polygon].coords);

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
		let wallDistance = Infinity;
		let wallSelected = {};
		let result;
		if (wallMeta.length == 0) return false;
		wallMeta.forEach((wall) => {
			var eq = createEquation(
				wall.start.x,
				wall.start.y,
				wall.end.x,
				wall.end.y
			);
			result = nearPointOnEquation(eq, snap);
			if (result.distance < wallDistance && wall.pointInsideWall(result)) {
				wallDistance = result.distance;
				wallSelected = {
					wall: wall,
					x: result.x,
					y: result.y,
					distance: result.distance,
				};
			}
		});
		const vv = editor.nearVertice(snap, wallMeta);
		if (vv.distance < wallDistance) {
			wallDistance = vv.distance;
			wallSelected = {
				wall: vv.number,
				x: vv.x,
				y: vv.y,
				distance: vv.distance,
			};
		}
		return wallDistance <= range ? wallSelected : false;
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
