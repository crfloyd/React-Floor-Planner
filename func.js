// import $ from "jquery";
import { constants } from "./constants";
import { qSVG } from "./qSVG";
import { intersectionOfEquations } from "./src/utils";

export const getCanvasDimensions = () => {
	return { w: $("#lin").width() || 0, h: $("#lin").height() || 0 };
};

export const getCanvasOffset = () => {
	return $("#lin").offset();
};

export const appendObjects = (objectMeta) => {
	$("#boxcarpentry").append(objectMeta[objectMeta.length - 1].graph);
};

export const setViewboxContent = (viewbox) => {
	$("svg").each(function () {
		$(this)[0].setAttribute(
			"viewBox",
			viewbox.originX +
				" " +
				viewbox.originY +
				" " +
				viewbox.width +
				" " +
				viewbox.height
		);
	});
};

export const modalToggle = () => {
	$("#myModal").modal("toggle");
};

export const onWindowLoad = (viewbox) => {
	setViewboxContent(viewbox);
	if (!localStorage.getItem("history")) {
		$("#recover").html("<p>Select a plan type.");
	}
	// console.log("done");
	$("#myModal").modal();
};
// 	Object.defineProperty(Array.prototype, "includes", {
// 		value: function (searchElement, fromIndex) {
// 			if (this == null) {
// 				throw new TypeError('"this" is null or not defined');
// 			}

// 			var o = Object(this);
// 			var len = o.length >>> 0;
// 			if (len === 0) {
// 				return false;
// 			}
// 			var n = fromIndex | 0;
// 			var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

// 			while (k < len) {
// 				if (o[k] === searchElement) {
// 					return true;
// 				}
// 				k++;
// 			}
// 			return false;
// 		},
// 	});
// }

// export const isObjectsEquals = (a, b, message = false) => {
// 	if (message) console.log(message);
// 	var isOK = true;
// 	for (var prop in a) {
// 		if (a[prop] !== b[prop]) {
// 			isOK = false;
// 			break;
// 		}
// 	}
// 	return isOK;
// };

export const throttle = (callback, delay) => {
	var last;
	var timer;
	return function () {
		var context = this;
		var now = +new Date();
		var args = arguments;
		if (last && now < last + delay) {
			// le délai n'est pas écoulé on reset le timer
			clearTimeout(timer);
			timer = setTimeout(function () {
				last = now;
				callback.apply(context, args);
			}, delay);
		} else {
			last = now;
			callback.apply(context, args);
		}
	};
};

export const onApplySurfaceClicked = (
	editor,
	rooms,
	roomMeta,
	setRoomMeta,
	binder,
	setBinder
) => {
	// $("#roomTools").hide(100);
	// $("#panel").show(200);
	binder.remove();
	setBinder(null);

	const roomMetaCopy = [...roomMeta];
	var id = $("#roomIndex").val();

	//COLOR
	var data = $("#roomBackground").val();
	roomMetaCopy[id].color = data;

	//ROOM NAME
	var roomName = $("#roomName").val();
	if (roomName == "None") roomName = "";
	roomMetaCopy[id].name = roomName;

	//ROOM SURFACE
	var area = $("#roomSurface").val();
	roomMetaCopy[id].surface = area;

	//SHOW SURFACE
	var show = document.querySelector("#seeArea").checked;
	roomMetaCopy[id].showSurface = show;

	//ACTION PARAM
	var action = document.querySelector("input[type=radio]:checked").value;
	roomMetaCopy[id].action = action;
	if (action == "sub") roomMetaCopy[id].color = "hatch";
	if (action != "sub" && data == "hatch")
		roomMetaCopy[id].color = "gradientNeutral";
	roomMeta = setRoomMeta(roomMetaCopy);
	$("#boxRoom").empty();
	$("#boxSurface").empty();
	editor.roomMaker(rooms, roomMetaCopy, setRoomMeta);
};

export const onRoomColorClicked = (val, binder) => {
	binder.attr({ fill: "url(#" + val + ")" });
};

export const limitObj = (equation, size, coords, message = false) => {
	if (message) console.log(message);
	var Px = coords.x;
	var Py = coords.y;
	var Aq = equation.A;
	var Bq = equation.B;
	if (Aq == "v") {
		var pos1 = { x: Px, y: Py - size / 2 };
		var pos2 = { x: Px, y: Py + size / 2 };
	} else if (Aq == "h") {
		var pos1 = { x: Px - size / 2, y: Py };
		var pos2 = { x: Px + size / 2, y: Py };
	} else {
		var A = 1 + Aq * Aq;
		var B = -2 * Px + 2 * Aq * Bq + -2 * Py * Aq;
		var C = Px * Px + Bq * Bq - 2 * Py * Bq + Py * Py - (size * size) / 4; // -N
		var Delta = B * B - 4 * A * C;
		var posX1 = (-B - Math.sqrt(Delta)) / (2 * A);
		var posX2 = (-B + Math.sqrt(Delta)) / (2 * A);
		var pos1 = { x: posX1, y: Aq * posX1 + Bq };
		var pos2 = { x: posX2, y: Aq * posX2 + Bq };
	}
	return [pos1, pos2];
};

export const minMoveGrid = function (mouse, point) {
	return Math.abs(Math.abs(point.x - mouse.x) + Math.abs(point.y - mouse.y));
};

export const intersectionOff = (lineIntersectionP) => {
	if (lineIntersectionP) {
		lineIntersectionP.remove();
		lineIntersectionP = null;
	}
};

export const intersection = (
	snap,
	wallMeta,
	lineIntersectionP,
	setLineIntersectionP,
	range = Infinity,
	except = [""]
) => {
	// ORANGE LINES 90° NEAR SEGMENT
	var bestEqPoint = {};
	var equation = {};

	bestEqPoint.distance = range;

	if (lineIntersectionP) {
		lineIntersectionP.remove();
		lineIntersectionP = setLineIntersectionP(null);
	}

	const line = qSVG.create("boxbind", "path", {
		// ORANGE TEMP LINE FOR ANGLE 0 90 45 -+
		d: "",
		stroke: "transparent",
		"stroke-width": 0.5,
		"stroke-opacity": "1",
		fill: "none",
	});
	lineIntersectionP = setLineIntersectionP(line);

	for (let index = 0; index < wallMeta.length; index++) {
		if (except.indexOf(wallMeta[index]) == -1) {
			var x1 = wallMeta[index].start.x;
			var y1 = wallMeta[index].start.y;
			var x2 = wallMeta[index].end.x;
			var y2 = wallMeta[index].end.y;

			// EQUATION 90° of segment nf/nf-1 at X2/Y2 Point
			if (Math.abs(y2 - y1) == 0) {
				equation.C = "v"; // C/D equation 90° Coef = -1/E
				equation.D = x1;
				equation.E = "h"; // E/F equation Segment
				equation.F = y1;
				equation.G = "v"; // G/H equation 90° Coef = -1/E
				equation.H = x2;
				equation.I = "h"; // I/J equation Segment
				equation.J = y2;
			} else if (Math.abs(x2 - x1) == 0) {
				equation.C = "h"; // C/D equation 90° Coef = -1/E
				equation.D = y1;
				equation.E = "v"; // E/F equation Segment
				equation.F = x1;
				equation.G = "h"; // G/H equation 90° Coef = -1/E
				equation.H = y2;
				equation.I = "v"; // I/J equation Segment
				equation.J = x2;
			} else {
				equation.C = (x1 - x2) / (y2 - y1);
				equation.D = y1 - x1 * equation.C;
				equation.E = (y2 - y1) / (x2 - x1);
				equation.F = y1 - x1 * equation.E;
				equation.G = (x1 - x2) / (y2 - y1);
				equation.H = y2 - x2 * equation.C;
				equation.I = (y2 - y1) / (x2 - x1);
				equation.J = y2 - x2 * equation.E;
			}
			equation.A = equation.C;
			equation.B = equation.D;
			let eq = qSVG.nearPointOnEquation(equation, snap);
			if (eq.distance < bestEqPoint.distance) {
				bestEqPoint.distance = eq.distance;
				bestEqPoint.node = index;
				bestEqPoint.x = eq.x;
				bestEqPoint.y = eq.y;
				bestEqPoint.x1 = x1;
				bestEqPoint.y1 = y1;
				bestEqPoint.x2 = x2;
				bestEqPoint.y2 = y2;
				bestEqPoint.way = 1;
			}
			equation.A = equation.E;
			equation.B = equation.F;
			eq = qSVG.nearPointOnEquation(equation, snap);
			if (eq.distance < bestEqPoint.distance) {
				bestEqPoint.distance = eq.distance;
				bestEqPoint.node = index;
				bestEqPoint.x = eq.x;
				bestEqPoint.y = eq.y;
				bestEqPoint.x1 = x1;
				bestEqPoint.y1 = y1;
				bestEqPoint.x2 = x2;
				bestEqPoint.y2 = y2;
				bestEqPoint.way = 1;
			}
			equation.A = equation.G;
			equation.B = equation.H;
			eq = qSVG.nearPointOnEquation(equation, snap);
			if (eq.distance < bestEqPoint.distance) {
				bestEqPoint.distance = eq.distance;
				bestEqPoint.node = index;
				bestEqPoint.x = eq.x;
				bestEqPoint.y = eq.y;
				bestEqPoint.x1 = x1;
				bestEqPoint.y1 = y1;
				bestEqPoint.x2 = x2;
				bestEqPoint.y2 = y2;
				bestEqPoint.way = 2;
			}
			equation.A = equation.I;
			equation.B = equation.J;
			eq = qSVG.nearPointOnEquation(equation, snap);
			if (eq.distance < bestEqPoint.distance) {
				bestEqPoint.distance = eq.distance;
				bestEqPoint.node = index;
				bestEqPoint.x = eq.x;
				bestEqPoint.y = eq.y;
				bestEqPoint.x1 = x1;
				bestEqPoint.y1 = y1;
				bestEqPoint.x2 = x2;
				bestEqPoint.y2 = y2;
				bestEqPoint.way = 2;
			}
		} // END INDEXOF EXCEPT TEST
	} // END LOOP FOR

	if (bestEqPoint.distance < range) {
		if (bestEqPoint.way == 2) {
			lineIntersectionP.attr({
				// ORANGE TEMP LINE FOR ANGLE 0 90 45 -+
				d:
					"M" +
					bestEqPoint.x1 +
					"," +
					bestEqPoint.y1 +
					" L" +
					bestEqPoint.x2 +
					"," +
					bestEqPoint.y2 +
					" L" +
					bestEqPoint.x +
					"," +
					bestEqPoint.y,
				stroke: "#d7ac57",
			});
		} else {
			lineIntersectionP.attr({
				// ORANGE TEMP LINE FOR ANGLE 0 90 45 -+
				d:
					"M" +
					bestEqPoint.x2 +
					"," +
					bestEqPoint.y2 +
					" L" +
					bestEqPoint.x1 +
					"," +
					bestEqPoint.y1 +
					" L" +
					bestEqPoint.x +
					"," +
					bestEqPoint.y,
				stroke: "#d7ac57",
			});
		}
		return {
			x: bestEqPoint.x,
			y: bestEqPoint.y,
			wall: wallMeta[bestEqPoint.node],
			distance: bestEqPoint.distance,
		};
	} else {
		return false;
	}
};

function debugPoint(point, name, color = "#00ff00") {
	qSVG.create("boxDebug", "circle", {
		cx: point.x,
		cy: point.y,
		r: 7,
		fill: color,
		id: name,
		class: "visu",
	});
}

var sizeText = [];
var showAllSizeStatus = 0;
export function hideAllSize() {
	$("#boxbind").empty();
	sizeText = [];
	showAllSizeStatus = 0;
}

export const rib = (wallMeta, shift = 5) => {
	// return false;
	const ribMaster = [];
	ribMaster.push([]);
	ribMaster.push([]);
	var inter;
	var distance;
	for (var i in wallMeta) {
		if (wallMeta[i].equations.base) {
			ribMaster[0].push([]);
			ribMaster[0][i].push({
				wallIndex: i,
				crossEdge: i,
				side: "up",
				coords: wallMeta[i].coords[0],
				distance: 0,
			});
			ribMaster[1].push([]);
			ribMaster[1][i].push({
				wallIndex: i,
				crossEdge: i,
				side: "down",
				coords: wallMeta[i].coords[1],
				distance: 0,
			});
			for (var p in wallMeta) {
				if (i != p && wallMeta[p].equations.base) {
					const cross = intersectionOfEquations(
						wallMeta[i].equations.base,
						wallMeta[p].equations.base
					);
					if (cross && wallMeta[i].pointInsideWall(cross, true)) {
						inter = intersectionOfEquations(
							wallMeta[i].equations.up,
							wallMeta[p].equations.up
						);
						if (
							qSVG.btwn(
								inter.x,
								wallMeta[i].coords[0].x,
								wallMeta[i].coords[3].x,
								true
							) &&
							qSVG.btwn(
								inter.y,
								wallMeta[i].coords[0].y,
								wallMeta[i].coords[3].y,
								true
							) &&
							qSVG.btwn(
								inter.x,
								wallMeta[p].coords[0].x,
								wallMeta[p].coords[3].x,
								true
							) &&
							qSVG.btwn(
								inter.y,
								wallMeta[p].coords[0].y,
								wallMeta[p].coords[3].y,
								true
							)
						) {
							distance =
								qSVG.measure(wallMeta[i].coords[0], inter) /
								constants.METER_SIZE;
							ribMaster[0][i].push({
								wallIndex: i,
								crossEdge: p,
								side: "up",
								coords: inter,
								distance: distance.toFixed(2),
							});
						}

						inter = intersectionOfEquations(
							wallMeta[i].equations.up,
							wallMeta[p].equations.down
						);
						if (
							qSVG.btwn(
								inter.x,
								wallMeta[i].coords[0].x,
								wallMeta[i].coords[3].x,
								true
							) &&
							qSVG.btwn(
								inter.y,
								wallMeta[i].coords[0].y,
								wallMeta[i].coords[3].y,
								true
							) &&
							qSVG.btwn(
								inter.x,
								wallMeta[p].coords[1].x,
								wallMeta[p].coords[2].x,
								true
							) &&
							qSVG.btwn(
								inter.y,
								wallMeta[p].coords[1].y,
								wallMeta[p].coords[2].y,
								true
							)
						) {
							distance =
								qSVG.measure(wallMeta[i].coords[0], inter) /
								constants.METER_SIZE;
							ribMaster[0][i].push({
								wallIndex: i,
								crossEdge: p,
								side: "up",
								coords: inter,
								distance: distance.toFixed(2),
							});
						}

						inter = intersectionOfEquations(
							wallMeta[i].equations.down,
							wallMeta[p].equations.up
						);
						if (
							qSVG.btwn(
								inter.x,
								wallMeta[i].coords[1].x,
								wallMeta[i].coords[2].x,
								true
							) &&
							qSVG.btwn(
								inter.y,
								wallMeta[i].coords[1].y,
								wallMeta[i].coords[2].y,
								true
							) &&
							qSVG.btwn(
								inter.x,
								wallMeta[p].coords[0].x,
								wallMeta[p].coords[3].x,
								true
							) &&
							qSVG.btwn(
								inter.y,
								wallMeta[p].coords[0].y,
								wallMeta[p].coords[3].y,
								true
							)
						) {
							distance =
								qSVG.measure(wallMeta[i].coords[1], inter) /
								constants.METER_SIZE;
							ribMaster[1][i].push({
								wallIndex: i,
								crossEdge: p,
								side: "down",
								coords: inter,
								distance: distance.toFixed(2),
							});
						}

						inter = intersectionOfEquations(
							wallMeta[i].equations.down,
							wallMeta[p].equations.down
						);
						if (
							qSVG.btwn(
								inter.x,
								wallMeta[i].coords[1].x,
								wallMeta[i].coords[2].x,
								true
							) &&
							qSVG.btwn(
								inter.y,
								wallMeta[i].coords[1].y,
								wallMeta[i].coords[2].y,
								true
							) &&
							qSVG.btwn(
								inter.x,
								wallMeta[p].coords[1].x,
								wallMeta[p].coords[2].x,
								true
							) &&
							qSVG.btwn(
								inter.y,
								wallMeta[p].coords[1].y,
								wallMeta[p].coords[2].y,
								true
							)
						) {
							distance =
								qSVG.measure(wallMeta[i].coords[1], inter) /
								constants.METER_SIZE;
							ribMaster[1][i].push({
								wallIndex: i,
								crossEdge: p,
								side: "down",
								coords: inter,
								distance: distance.toFixed(2),
							});
						}
					}
				}
			}
			distance =
				qSVG.measure(wallMeta[i].coords[0], wallMeta[i].coords[3]) /
				constants.METER_SIZE;
			ribMaster[0][i].push({
				wallIndex: i,
				crossEdge: i,
				side: "up",
				coords: wallMeta[i].coords[3],
				distance: distance.toFixed(2),
			});
			distance =
				qSVG.measure(wallMeta[i].coords[1], wallMeta[i].coords[2]) /
				constants.METER_SIZE;
			ribMaster[1][i].push({
				wallIndex: i,
				crossEdge: i,
				side: "down",
				coords: wallMeta[i].coords[2],
				distance: distance.toFixed(2),
			});
		}
	}

	for (var a in ribMaster[0]) {
		ribMaster[0][a].sort(function (a, b) {
			return (a.distance - b.distance).toFixed(2);
		});
	}
	for (var a in ribMaster[1]) {
		ribMaster[1][a].sort(function (a, b) {
			return (a.distance - b.distance).toFixed(2);
		});
	}

	var sizeText = [];
	if (shift == 5) $("#boxRib").empty();
	for (var t in ribMaster) {
		for (var a in ribMaster[t]) {
			for (var n = 1; n < ribMaster[t][a].length; n++) {
				if (ribMaster[t][a][n - 1].wallIndex == ribMaster[t][a][n].wallIndex) {
					var edge = ribMaster[t][a][n].wallIndex;
					var found = true;
					var valueText = Math.abs(
						ribMaster[t][a][n - 1].distance - ribMaster[t][a][n].distance
					);
					// CLEAR TOO LITTLE VALUE
					if (valueText < 0.15) {
						found = false;
					}
					// CLEAR (thick) BETWEEN CROSS EDGE
					if (
						found &&
						ribMaster[t][a][n - 1].crossEdge == ribMaster[t][a][n].crossEdge &&
						ribMaster[t][a][n].crossEdge != ribMaster[t][a][n].wallIndex
					) {
						found = false;
					}
					// CLEAR START INTO EDGE
					if (found && ribMaster[t][a].length > 2 && n == 1) {
						var polygon = [];
						for (var pp = 0; pp < 4; pp++) {
							polygon.push({
								x: wallMeta[ribMaster[t][a][n].crossEdge].coords[pp].x,
								y: wallMeta[ribMaster[t][a][n].crossEdge].coords[pp].y,
							}); // FOR Z
						}
						if (qSVG.rayCasting(ribMaster[t][a][0].coords, polygon)) {
							found = false;
						}
					}
					// CLEAR END INTO EDGE
					if (
						found &&
						ribMaster[t][a].length > 2 &&
						n == ribMaster[t][a].length - 1
					) {
						var polygon = [];
						for (var pp = 0; pp < 4; pp++) {
							polygon.push({
								x: wallMeta[ribMaster[t][a][n - 1].crossEdge].coords[pp].x,
								y: wallMeta[ribMaster[t][a][n - 1].crossEdge].coords[pp].y,
							}); // FOR Z
						}
						if (
							qSVG.rayCasting(
								ribMaster[t][a][ribMaster[t][a].length - 1].coords,
								polygon
							)
						) {
							found = false;
						}
					}

					if (found) {
						var angleText =
							wallMeta[ribMaster[t][a][n].wallIndex].angle * (180 / Math.PI);
						var shiftValue = -shift;
						if (ribMaster[t][a][n - 1].side == "down") {
							shiftValue = -shiftValue + 10;
						}
						if (angleText > 90 || angleText < -89) {
							angleText -= 180;
							if (ribMaster[t][a][n - 1].side == "down") {
								shiftValue = -shift;
							} else shiftValue = -shiftValue + 10;
						}
						sizeText[n] = document.createElementNS(
							"http://www.w3.org/2000/svg",
							"text"
						);
						var startText = qSVG.middle(
							ribMaster[t][a][n - 1].coords.x,
							ribMaster[t][a][n - 1].coords.y,
							ribMaster[t][a][n].coords.x,
							ribMaster[t][a][n].coords.y
						);
						sizeText[n].setAttributeNS(null, "x", startText.x);
						sizeText[n].setAttributeNS(null, "y", startText.y + shiftValue);
						sizeText[n].setAttributeNS(null, "text-anchor", "middle");
						sizeText[n].setAttributeNS(null, "font-family", "roboto");
						sizeText[n].setAttributeNS(null, "stroke", "#ffffff");
						sizeText[n].textContent = valueText.toFixed(2);
						if (sizeText[n].textContent < 1) {
							sizeText[n].setAttributeNS(null, "font-size", "0.73em");
							sizeText[n].textContent = sizeText[n].textContent.substring(
								1,
								sizeText[n].textContent.length
							);
						} else sizeText[n].setAttributeNS(null, "font-size", "0.9em");
						sizeText[n].setAttributeNS(null, "stroke-width", "0.2px");
						sizeText[n].setAttributeNS(null, "fill", "#555555");
						sizeText[n].setAttribute(
							"transform",
							"rotate(" +
								angleText +
								" " +
								startText.x +
								"," +
								startText.y +
								")"
						);

						$("#boxRib").append(sizeText[n]);
					}
				}
			}
		}
	}
};
// 	if (i.requestFullscreen) {
// 		i.requestFullscreen();
// 	} else if (i.webkitRequestFullscreen) {
// 		i.webkitRequestFullscreen();
// 	} else if (i.mozRequestFullScreen) {
// 		i.mozRequestFullScreen();
// 	} else if (i.msRequestFullscreen) {
// 		i.msRequestFullscreen();
// 	}
// }

// function outFullscreen() {
// 	if (document.exitFullscreen) {
// 		document.exitFullscreen();
// 	} else if (document.mozCancelFullScreen) {
// 		document.mozCancelFullScreen();
// 	} else if (document.webkitExitFullscreen) {
// 		document.webkitExitFullscreen();
// 	}
// }

// document.addEventListener("fullscreenchange", function () {
// 	if (
// 		!document.fullscreenElement &&
// 		!document.webkitFullscreenElement &&
// 		!document.mozFullScreenElement &&
// 		!document.msFullscreenElement
// 	) {
// 		$("#nofull_mode").display = "none";
// 		$("#full_mode").show();
// 	}
// });

export const flush_button = () => {
	$("#rect_mode").removeClass("btn-success");
	$("#rect_mode").addClass("btn-default");
	$("#select_mode").removeClass("btn-success");
	$("#select_mode").addClass("btn-default");
	$("#line_mode").removeClass("btn-success");
	$("#line_mode").addClass("btn-default");
	$("#partition_mode").removeClass("btn-success");
	$("#partition_mode").addClass("btn-default");
	$("#door_mode").removeClass("btn-success");
	$("#door_mode").addClass("btn-default");
	$("#node_mode").removeClass("btn-success");
	$("#node_mode").addClass("btn-default");
	$("#text_mode").removeClass("btn-success");
	$("#text_mode").addClass("btn-default");
	$("#room_mode").removeClass("btn-success");
	$("#room_mode").addClass("btn-default");
	$("#distance_mode").removeClass("btn-success");
	$("#distance_mode").addClass("btn-default");
	$("#object_mode").removeClass("btn-success");
	$("#object_mode").addClass("btn-default");
	$("#stair_mode").removeClass("btn-success");
	$("#stair_mode").addClass("btn-default");
};
// 	flush_button();
// 	if (option != "simpleStair") {
// 		$("#" + modesetting).removeClass("btn-default");
// 		$("#" + modesetting).addClass("btn-success");
// 	}
// 	mode = modesetting;
// 	modeOption = option;

// 	if (typeof lineIntersectionP != "undefined") {
// 		lineIntersectionP.remove();
// 		lineIntersectionP = null;
// 	}
// };

// $("#distance_mode").click(function () {
// 	$("#lin").css("cursor", "crosshair");
// 	$("#boxinfo").html("Add a measurement");
// 	fonc_button("distance_mode");
// });

// $("#room_mode").click(function () {
// 	$("#lin").css("cursor", "pointer");
// 	$("#boxinfo").html("Config. of rooms");
// 	fonc_button("room_mode");
// });

// $("#select_mode").click(function () {
// 	$("#boxinfo").html('Mode "select"');
// 	if (typeof binder != "undefined") {
// 		binder.remove();
// 		binder = null;
// 	}

// 	fonc_button("select_mode");
// });

// $("#line_mode").click(function () {
// 	$("#lin").css("cursor", "crosshair");
// 	$("#boxinfo").html("Wall Creation");
// 	multi = 0;
// 	action = 0;
// 	// snap = calcul_snap(event, grid_snap);
// 	//
// 	// pox = snap.x;
// 	// poy = snap.y;
// 	fonc_button("line_mode");
// });

// $("#partition_mode").click(function () {
// 	$("#lin").css("cursor", "crosshair");
// 	$("#boxinfo").html("Création de cloison(s)");
// 	multi = 0;
// 	fonc_button("partition_mode");
// });

// $("#rect_mode").click(function () {
// 	$("#lin").css("cursor", "crosshair");
// 	$("#boxinfo").html("Création de pièce(s)");
// 	fonc_button("rect_mode");
// });

// $(".door").click(function () {
// 	$("#lin").css("cursor", "crosshair");
// 	$("#boxinfo").html("Ajouter une porte");
// 	$("#door_list").hide(200);
// 	fonc_button("door_mode", this.id);
// });

// $(".window").click(function () {
// 	$("#lin").css("cursor", "crosshair");
// 	$("#boxinfo").html("Ajouter une fenêtre");
// 	$("#door_list").hide(200);
// 	$("#window_list").hide(200);
// 	fonc_button("door_mode", this.id);
// });

// $(".object").click(function () {
// 	cursor("move");
// 	$("#boxinfo").html("Ajouter un objet");
// 	fonc_button("object_mode", this.id);
// });

// $("#stair_mode").click(function () {
// 	cursor("move");
// 	$("#boxinfo").html("Ajouter un escalier");
// 	fonc_button("object_mode", "simpleStair");
// });

// $("#node_mode").click(function () {
// 	$("#boxinfo").html(
// 		'Couper un mur<br/><span style="font-size:0.7em">Attention : Couper le mur d\'une pièce peut annuler sa configuration</span>'
// 	);
// 	fonc_button("node_mode");
// });

// $("#text_mode").click(function () {
// 	$("#boxinfo").html(
// 		'Ajouter du texte<br/><span style="font-size:0.7em">Amenez le curseur à l\'endroit voulu, puis tapez votre texte.</span>'
// 	);
// 	fonc_button("text_mode");
// });

// $("#grid_mode").click(function () {
// 	if (grid_snap == "on") {
// 		grid_snap = "off";
// 		$("#boxinfo").html("Grille d'aide off");
// 		$("#grid_mode").removeClass("btn-success");
// 		$("#grid_mode").addClass("btn-warning");
// 		$("#grid_mode").html("GRID OFF");
// 		$("#boxgrid").css("opacity", "0.5");
// 	} else {
// 		grid_snap = "on";
// 		$("#boxinfo").html("Grille d'aide on");
// 		$("#grid_mode").removeClass("btn-warning");
// 		$("#grid_mode").addClass("btn-success");
// 		$("#grid_mode").html('GRID ON <i class="fa fa-th" aria-hidden="true"></i>');
// 		$("#boxgrid").css("opacity", "1");
// 	}
// });

//  RETURN PATH(s) ARRAY FOR OBJECT + PROPERTY params => bindBox (false = open sideTool), move, resize, rotate
// export const carpentryCalc = (
// 	classObj,
// 	typeObj,
// 	sizeObj,
// 	thickObj,
// 	dividerObj = 10
// ) => {
// 	var construc = [];
// 	construc.params = {};
// 	construc.params.bindBox = false;
// 	construc.params.move = false;
// 	construc.params.resize = false;
// 	construc.params.resizeLimit = {};
// 	construc.params.resizeLimit.width = { min: false, max: false };
// 	construc.params.resizeLimit.height = { min: false, max: false };
// 	construc.params.rotate = false;

// 	const objClass = constants.OBJECT_CLASSES;

// 	if (classObj == objClass.HOVER_BOX) {
// 		construc.push({
// 			path:
// 				"M " +
// 				-sizeObj / 2 +
// 				"," +
// 				-thickObj / 2 +
// 				" L " +
// 				-sizeObj / 2 +
// 				"," +
// 				thickObj / 2 +
// 				" L " +
// 				sizeObj / 2 +
// 				"," +
// 				thickObj / 2 +
// 				" L " +
// 				sizeObj / 2 +
// 				"," +
// 				-thickObj / 2 +
// 				" Z",
// 			fill: "#5cba79",
// 			stroke: "#5cba79",
// 			strokeDashArray: "",
// 		});
// 	}
// 	if (classObj == objClass.DOOR_WINDOW) {
// 		if (typeObj == "simple") {
// 			construc.push({
// 				path:
// 					"M " +
// 					-sizeObj / 2 +
// 					"," +
// 					-thickObj / 2 +
// 					" L " +
// 					-sizeObj / 2 +
// 					"," +
// 					thickObj / 2 +
// 					" L " +
// 					sizeObj / 2 +
// 					"," +
// 					thickObj / 2 +
// 					" L " +
// 					sizeObj / 2 +
// 					"," +
// 					-thickObj / 2 +
// 					" Z",
// 				fill: "#ccc",
// 				stroke: "none",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path:
// 					"M " +
// 					-sizeObj / 2 +
// 					"," +
// 					-thickObj / 2 +
// 					" L " +
// 					-sizeObj / 2 +
// 					"," +
// 					(-sizeObj - thickObj / 2) +
// 					"  A" +
// 					sizeObj +
// 					"," +
// 					sizeObj +
// 					" 0 0,1 " +
// 					sizeObj / 2 +
// 					"," +
// 					-thickObj / 2,
// 				fill: "none",
// 				stroke: constants.COLOR_WALL,
// 				strokeDashArray: "",
// 			});
// 			construc.params.resize = true;
// 			construc.params.resizeLimit.width = { min: 40, max: 120 };
// 		}
// 		if (typeObj == "double") {
// 			construc.push({
// 				path:
// 					"M " +
// 					-sizeObj / 2 +
// 					"," +
// 					-thickObj / 2 +
// 					" L " +
// 					-sizeObj / 2 +
// 					"," +
// 					thickObj / 2 +
// 					" L " +
// 					sizeObj / 2 +
// 					"," +
// 					thickObj / 2 +
// 					" L " +
// 					sizeObj / 2 +
// 					"," +
// 					-thickObj / 2 +
// 					" Z",
// 				fill: "#ccc",
// 				stroke: "none",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path:
// 					"M " +
// 					-sizeObj / 2 +
// 					"," +
// 					-thickObj / 2 +
// 					" L " +
// 					-sizeObj / 2 +
// 					"," +
// 					(-sizeObj / 2 - thickObj / 2) +
// 					"  A" +
// 					sizeObj / 2 +
// 					"," +
// 					sizeObj / 2 +
// 					" 0 0,1 0," +
// 					-thickObj / 2,
// 				fill: "none",
// 				stroke: constants.COLOR_WALL,
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path:
// 					"M " +
// 					sizeObj / 2 +
// 					"," +
// 					-thickObj / 2 +
// 					" L " +
// 					sizeObj / 2 +
// 					"," +
// 					(-sizeObj / 2 - thickObj / 2) +
// 					"  A" +
// 					sizeObj / 2 +
// 					"," +
// 					sizeObj / 2 +
// 					" 0 0,0 0," +
// 					-thickObj / 2,
// 				fill: "none",
// 				stroke: constants.COLOR_WALL,
// 				strokeDashArray: "",
// 			});
// 			construc.params.resize = true;
// 			construc.params.resizeLimit.width = { min: 40, max: 160 };
// 		}
// 		if (typeObj == "pocket") {
// 			construc.push({
// 				path:
// 					"M " +
// 					-sizeObj / 2 +
// 					"," +
// 					(-(thickObj / 2) - 4) +
// 					" L " +
// 					-sizeObj / 2 +
// 					"," +
// 					thickObj / 2 +
// 					" L " +
// 					sizeObj / 2 +
// 					"," +
// 					thickObj / 2 +
// 					" L " +
// 					sizeObj / 2 +
// 					"," +
// 					(-(thickObj / 2) - 4) +
// 					" Z",
// 				fill: "#ccc",
// 				stroke: "none",
// 				strokeDashArray: "none",
// 			});
// 			construc.push({
// 				path:
// 					"M " +
// 					-sizeObj / 2 +
// 					"," +
// 					-thickObj / 2 +
// 					" L " +
// 					-sizeObj / 2 +
// 					"," +
// 					thickObj / 2 +
// 					" M " +
// 					sizeObj / 2 +
// 					"," +
// 					thickObj / 2 +
// 					" L " +
// 					sizeObj / 2 +
// 					"," +
// 					-thickObj / 2,
// 				fill: "none",
// 				stroke: "#494646",
// 				strokeDashArray: "5 5",
// 			});
// 			construc.push({
// 				path:
// 					"M " +
// 					-sizeObj / 2 +
// 					"," +
// 					-thickObj / 2 +
// 					" L " +
// 					-sizeObj / 2 +
// 					"," +
// 					(-thickObj / 2 - 5) +
// 					" L " +
// 					+sizeObj / 2 +
// 					"," +
// 					(-thickObj / 2 - 5) +
// 					" L " +
// 					+sizeObj / 2 +
// 					"," +
// 					-thickObj / 2 +
// 					" Z",
// 				fill: "url(#hatch)",
// 				stroke: "#494646",
// 				strokeDashArray: "",
// 			});
// 			construc.params.resize = true;
// 			construc.params.resizeLimit.width = { min: 60, max: 200 };
// 		}
// 		if (typeObj == "opening") {
// 			construc.push({
// 				path:
// 					"M " +
// 					-sizeObj / 2 +
// 					"," +
// 					-thickObj / 2 +
// 					" L " +
// 					-sizeObj / 2 +
// 					"," +
// 					thickObj / 2 +
// 					" L " +
// 					sizeObj / 2 +
// 					"," +
// 					thickObj / 2 +
// 					" L " +
// 					sizeObj / 2 +
// 					"," +
// 					-thickObj / 2 +
// 					" Z",
// 				fill: "#ccc",
// 				stroke: "#494646",
// 				strokeDashArray: "5,5",
// 			});
// 			construc.push({
// 				path:
// 					"M " +
// 					-sizeObj / 2 +
// 					"," +
// 					-(thickObj / 2) +
// 					" L " +
// 					-sizeObj / 2 +
// 					"," +
// 					thickObj / 2 +
// 					" L " +
// 					(-sizeObj / 2 + 5) +
// 					"," +
// 					thickObj / 2 +
// 					" L " +
// 					(-sizeObj / 2 + 5) +
// 					"," +
// 					-(thickObj / 2) +
// 					" Z",
// 				fill: "none",
// 				stroke: "#494646",
// 				strokeDashArray: "none",
// 			});
// 			construc.push({
// 				path:
// 					"M " +
// 					(sizeObj / 2 - 5) +
// 					"," +
// 					-(thickObj / 2) +
// 					" L " +
// 					(sizeObj / 2 - 5) +
// 					"," +
// 					thickObj / 2 +
// 					" L " +
// 					sizeObj / 2 +
// 					"," +
// 					thickObj / 2 +
// 					" L " +
// 					sizeObj / 2 +
// 					"," +
// 					-(thickObj / 2) +
// 					" Z",
// 				fill: "none",
// 				stroke: "#494646",
// 				strokeDashArray: "none",
// 			});
// 			construc.params.resize = true;
// 			construc.params.resizeLimit.width = { min: 40, max: 500 };
// 		}
// 		if (typeObj == "fix") {
// 			construc.push({
// 				path:
// 					"M " +
// 					-sizeObj / 2 +
// 					",-2 L " +
// 					-sizeObj / 2 +
// 					",2 L " +
// 					sizeObj / 2 +
// 					",2 L " +
// 					sizeObj / 2 +
// 					",-2 Z",
// 				fill: "#ccc",
// 				stroke: "none",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path:
// 					"M " +
// 					-sizeObj / 2 +
// 					"," +
// 					-thickObj / 2 +
// 					" L " +
// 					-sizeObj / 2 +
// 					"," +
// 					thickObj / 2 +
// 					" M " +
// 					sizeObj / 2 +
// 					"," +
// 					thickObj / 2 +
// 					" L " +
// 					sizeObj / 2 +
// 					"," +
// 					-thickObj / 2,
// 				fill: "none",
// 				stroke: "#ccc",
// 				strokeDashArray: "",
// 			});
// 			construc.params.resize = true;
// 			construc.params.resizeLimit.width = { min: 30, max: 300 };
// 		}
// 		if (typeObj == "flap") {
// 			construc.push({
// 				path:
// 					"M " +
// 					-sizeObj / 2 +
// 					",-2 L " +
// 					-sizeObj / 2 +
// 					",2 L " +
// 					sizeObj / 2 +
// 					",2 L " +
// 					sizeObj / 2 +
// 					",-2 Z",
// 				fill: "#ccc",
// 				stroke: "none",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path:
// 					"M " +
// 					-sizeObj / 2 +
// 					"," +
// 					-thickObj / 2 +
// 					" L " +
// 					-sizeObj / 2 +
// 					"," +
// 					thickObj / 2 +
// 					" M " +
// 					sizeObj / 2 +
// 					"," +
// 					thickObj / 2 +
// 					" L " +
// 					sizeObj / 2 +
// 					"," +
// 					-thickObj / 2,
// 				fill: "none",
// 				stroke: "#ccc",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path:
// 					"M " +
// 					-sizeObj / 2 +
// 					"," +
// 					-thickObj / 2 +
// 					" L " +
// 					(-sizeObj / 2 + sizeObj * 0.866) +
// 					"," +
// 					(-sizeObj / 2 - thickObj / 2) +
// 					"  A" +
// 					sizeObj +
// 					"," +
// 					sizeObj +
// 					" 0 0,1 " +
// 					sizeObj / 2 +
// 					"," +
// 					-thickObj / 2,
// 				fill: "none",
// 				stroke: constants.COLOR_WALL,
// 				strokeDashArray: "",
// 			});
// 			construc.params.resize = true;
// 			construc.params.resizeLimit.width = { min: 20, max: 100 };
// 		}
// 		if (typeObj == "twin") {
// 			construc.push({
// 				path:
// 					"M " +
// 					-sizeObj / 2 +
// 					",-2 L " +
// 					-sizeObj / 2 +
// 					",2 L " +
// 					sizeObj / 2 +
// 					",2 L " +
// 					sizeObj / 2 +
// 					",-2 Z",
// 				fill: "#ccc",
// 				stroke: "none",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path:
// 					"M " +
// 					-sizeObj / 2 +
// 					"," +
// 					-thickObj / 2 +
// 					" L " +
// 					-sizeObj / 2 +
// 					"," +
// 					thickObj / 2 +
// 					" M " +
// 					sizeObj / 2 +
// 					"," +
// 					thickObj / 2 +
// 					" L " +
// 					sizeObj / 2 +
// 					"," +
// 					-thickObj / 2,
// 				fill: "none",
// 				stroke: "#ccc",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path:
// 					"M " +
// 					-sizeObj / 2 +
// 					"," +
// 					-thickObj / 2 +
// 					" L " +
// 					(-sizeObj / 2 + (sizeObj / 2) * 0.866) +
// 					"," +
// 					(-sizeObj / 4 - thickObj / 2) +
// 					"  A" +
// 					sizeObj / 2 +
// 					"," +
// 					sizeObj / 2 +
// 					" 0 0,1 0," +
// 					-thickObj / 2,
// 				fill: "none",
// 				stroke: constants.COLOR_WALL,
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path:
// 					"M " +
// 					sizeObj / 2 +
// 					"," +
// 					-thickObj / 2 +
// 					" L " +
// 					(sizeObj / 2 + (-sizeObj / 2) * 0.866) +
// 					"," +
// 					(-sizeObj / 4 - thickObj / 2) +
// 					"  A" +
// 					sizeObj / 2 +
// 					"," +
// 					sizeObj / 2 +
// 					" 0 0,0 0," +
// 					-thickObj / 2,
// 				fill: "none",
// 				stroke: constants.COLOR_WALL,
// 				strokeDashArray: "",
// 			});
// 			construc.params.resize = true;
// 			construc.params.resizeLimit.width = { min: 40, max: 200 };
// 		}
// 		if (typeObj == "bay") {
// 			construc.push({
// 				path:
// 					"M " +
// 					-sizeObj / 2 +
// 					"," +
// 					-thickObj / 2 +
// 					" L " +
// 					-sizeObj / 2 +
// 					"," +
// 					thickObj / 2 +
// 					" M " +
// 					sizeObj / 2 +
// 					"," +
// 					thickObj / 2 +
// 					" L " +
// 					sizeObj / 2 +
// 					"," +
// 					-thickObj / 2,
// 				fill: "none",
// 				stroke: "#ccc",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path:
// 					"M " +
// 					-sizeObj / 2 +
// 					",-2 L " +
// 					-sizeObj / 2 +
// 					",0 L 2,0 L 2,2 L 3,2 L 3,-2 Z",
// 				fill: "#ccc",
// 				stroke: "none",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path:
// 					"M -2,1 L -2,3 L " +
// 					sizeObj / 2 +
// 					",3 L " +
// 					sizeObj / 2 +
// 					",1 L -1,1 L -1,-1 L -2,-1 Z",
// 				fill: "#ccc",
// 				stroke: "none",
// 				strokeDashArray: "",
// 			});
// 			construc.params.resize = true;
// 			construc.params.resizeLimit.width = { min: 60, max: 300 };
// 		}
// 	}

// 	if (classObj == objClass.MEASURE) {
// 		construc.params.bindBox = true;
// 		construc.push({
// 			path:
// 				"M-" +
// 				sizeObj / 2 +
// 				",0 l10,-10 l0,8 l" +
// 				(sizeObj - 20) +
// 				",0 l0,-8 l10,10 l-10,10 l0,-8 l-" +
// 				(sizeObj - 20) +
// 				",0 l0,8 Z",
// 			fill: "#729eeb",
// 			stroke: "none",
// 			strokeDashArray: "",
// 		});
// 	}

// 	if (classObj == objClass.BOUNDING_BOX) {
// 		construc.push({
// 			path:
// 				"M" +
// 				(-sizeObj / 2 - 10) +
// 				"," +
// 				(-thickObj / 2 - 10) +
// 				" L" +
// 				(sizeObj / 2 + 10) +
// 				"," +
// 				(-thickObj / 2 - 10) +
// 				" L" +
// 				(sizeObj / 2 + 10) +
// 				"," +
// 				(thickObj / 2 + 10) +
// 				" L" +
// 				(-sizeObj / 2 - 10) +
// 				"," +
// 				(thickObj / 2 + 10) +
// 				" Z",
// 			fill: "none",
// 			stroke: "#aaa",
// 			strokeDashArray: "",
// 		});

// 		// construc.push({'path':"M"+dividerObj[0].x+","+dividerObj[0].y+" L"+dividerObj[1].x+","+dividerObj[1].y+" L"+dividerObj[2].x+","+dividerObj[2].y+" L"+dividerObj[3].x+","+dividerObj[3].y+" Z", 'fill':'none', 'stroke':"#000", 'strokeDashArray': ''});
// 	}

// 	//typeObj = color  dividerObj = text
// 	if (classObj == objClass.TEXT) {
// 		construc.params.bindBox = true;
// 		construc.params.move = true;
// 		construc.params.rotate = true;
// 		construc.push({
// 			text: dividerObj.text,
// 			x: "0",
// 			y: "0",
// 			fill: typeObj,
// 			stroke: typeObj,
// 			fontSize: dividerObj.size + "px",
// 			strokeWidth: "0px",
// 		});
// 	}

// 	if (classObj == objClass.STAIR) {
// 		construc.params.bindBox = true;
// 		construc.params.move = true;
// 		construc.params.resize = true;
// 		construc.params.rotate = true;
// 		construc.params.width = 60;
// 		construc.params.height = 180;
// 		if (typeObj == "simpleStair") {
// 			construc.push({
// 				path:
// 					"M " +
// 					-sizeObj / 2 +
// 					"," +
// 					-thickObj / 2 +
// 					" L " +
// 					-sizeObj / 2 +
// 					"," +
// 					thickObj / 2 +
// 					" L " +
// 					sizeObj / 2 +
// 					"," +
// 					thickObj / 2 +
// 					" L " +
// 					sizeObj / 2 +
// 					"," +
// 					-thickObj / 2 +
// 					" Z",
// 				fill: "#fff",
// 				stroke: "#000",
// 				strokeDashArray: "",
// 			});

// 			var heightStep = thickObj / dividerObj;
// 			for (var i = 1; i < dividerObj + 1; i++) {
// 				construc.push({
// 					path:
// 						"M " +
// 						-sizeObj / 2 +
// 						"," +
// 						(-thickObj / 2 + i * heightStep) +
// 						" L " +
// 						sizeObj / 2 +
// 						"," +
// 						(-thickObj / 2 + i * heightStep),
// 					fill: "none",
// 					stroke: "#000",
// 					strokeDashArray: "none",
// 				});
// 			}
// 			construc.params.resizeLimit.width = { min: 40, max: 200 };
// 			construc.params.resizeLimit.height = { min: 40, max: 400 };
// 		}
// 	}

// 	if (classObj == objClass.ENERGY) {
// 		construc.params.bindBox = true;
// 		construc.params.move = true;
// 		construc.params.resize = false;
// 		construc.params.rotate = false;
// 		if (typeObj == "gtl") {
// 			construc.push({
// 				path: "m -20,-20 l 40,0 l0,40 l-40,0 Z",
// 				fill: "#fff",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				text: "GTL",
// 				x: "0",
// 				y: "5",
// 				fill: "#333333",
// 				stroke: "none",
// 				fontSize: "0.9em",
// 				strokeWidth: "0.4px",
// 			});
// 			construc.params.width = 40;
// 			construc.params.height = 40;
// 			construc.family = "stick";
// 		}
// 		if (typeObj == "switch") {
// 			construc.push({
// 				path: qSVG.circlePath(0, 0, 16),
// 				fill: "#fff",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: qSVG.circlePath(-2, 4, 5),
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m 0,0 5,-9",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.params.width = 36;
// 			construc.params.height = 36;
// 			construc.family = "stick";
// 		}
// 		if (typeObj == "doubleSwitch") {
// 			construc.push({
// 				path: qSVG.circlePath(0, 0, 16),
// 				fill: "#fff",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: qSVG.circlePath(0, 0, 4),
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m 2,-3 5,-8 3,2",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m -2,3 -5,8 -3,-2",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.params.width = 36;
// 			construc.params.height = 36;
// 			construc.family = "stick";
// 		}
// 		if (typeObj == "dimmer") {
// 			construc.push({
// 				path: qSVG.circlePath(0, 0, 16),
// 				fill: "#fff",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: qSVG.circlePath(-2, 4, 5),
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m 0,0 5,-9",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "M -2,-6 L 10,-4 L-2,-2 Z",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.params.width = 36;
// 			construc.params.height = 36;
// 			construc.family = "stick";
// 		}
// 		if (typeObj == "plug") {
// 			construc.push({
// 				path: qSVG.circlePath(0, 0, 16),
// 				fill: "#fff",
// 				stroke: "#000",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "M 10,-6 a 10,10 0 0 1 -5,8 10,10 0 0 1 -10,0 10,10 0 0 1 -5,-8",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m 0,3 v 7",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m -10,4 h 20",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.params.width = 36;
// 			construc.params.height = 36;
// 			construc.family = "stick";
// 		}
// 		if (typeObj == "plug20") {
// 			construc.push({
// 				path: qSVG.circlePath(0, 0, 16),
// 				fill: "#fff",
// 				stroke: "#000",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "M 10,-6 a 10,10 0 0 1 -5,8 10,10 0 0 1 -10,0 10,10 0 0 1 -5,-8",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m 0,3 v 7",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m -10,4 h 20",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				text: "20A",
// 				x: "0",
// 				y: "-5",
// 				fill: "#333333",
// 				stroke: "none",
// 				fontSize: "0.65em",
// 				strokeWidth: "0.4px",
// 			});
// 			construc.params.width = 36;
// 			construc.params.height = 36;
// 			construc.family = "stick";
// 		}
// 		if (typeObj == "plug32") {
// 			construc.push({
// 				path: qSVG.circlePath(0, 0, 16),
// 				fill: "#fff",
// 				stroke: "#000",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "M 10,-6 a 10,10 0 0 1 -5,8 10,10 0 0 1 -10,0 10,10 0 0 1 -5,-8",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m 0,3 v 7",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m -10,4 h 20",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				text: "32A",
// 				x: "0",
// 				y: "-5",
// 				fill: "#333333",
// 				stroke: "none",
// 				fontSize: "0.65em",
// 				strokeWidth: "0.4px",
// 			});
// 			construc.params.width = 36;
// 			construc.params.height = 36;
// 			construc.family = "stick";
// 		}
// 		if (typeObj == "roofLight") {
// 			construc.push({
// 				path: qSVG.circlePath(0, 0, 16),
// 				fill: "#fff",
// 				stroke: "#000",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "M -8,-8 L 8,8 M -8,8 L 8,-8",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.params.width = 36;
// 			construc.params.height = 36;
// 			construc.family = "free";
// 		}
// 		if (typeObj == "wallLight") {
// 			construc.push({
// 				path: qSVG.circlePath(0, 0, 16),
// 				fill: "#fff",
// 				stroke: "#000",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "M -8,-8 L 8,8 M -8,8 L 8,-8",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "M -10,10 L 10,10",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.params.width = 36;
// 			construc.params.height = 36;
// 			construc.family = "stick";
// 		}
// 		if (typeObj == "www") {
// 			construc.push({
// 				path: "m -20,-20 l 40,0 l0,40 l-40,0 Z",
// 				fill: "#fff",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				text: "@",
// 				x: "0",
// 				y: "4",
// 				fill: "#333333",
// 				stroke: "none",
// 				fontSize: "1.2em",
// 				strokeWidth: "0.4px",
// 			});
// 			construc.params.width = 40;
// 			construc.params.height = 40;
// 			construc.family = "free";
// 		}
// 		if (typeObj == "rj45") {
// 			construc.push({
// 				path: qSVG.circlePath(0, 0, 16),
// 				fill: "#fff",
// 				stroke: "#000",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m-10,5 l0,-10 m20,0 l0,10",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m 0,5 v 7",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m -10,5 h 20",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				text: "RJ45",
// 				x: "0",
// 				y: "-5",
// 				fill: "#333333",
// 				stroke: "none",
// 				fontSize: "0.5em",
// 				strokeWidth: "0.4px",
// 			});
// 			construc.params.width = 36;
// 			construc.params.height = 36;
// 			construc.family = "stick";
// 		}
// 		if (typeObj == "tv") {
// 			construc.push({
// 				path: qSVG.circlePath(0, 0, 16),
// 				fill: "#fff",
// 				stroke: "#000",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m-10,5 l0-10 m20,0 l0,10",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m-7,-5 l0,7 l14,0 l0,-7",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m 0,5 v 7",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m -10,5 h 20",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				text: "TV",
// 				x: "0",
// 				y: "-5",
// 				fill: "#333333",
// 				stroke: "none",
// 				fontSize: "0.5em",
// 				strokeWidth: "0.4px",
// 			});
// 			construc.params.width = 36;
// 			construc.params.height = 36;
// 			construc.family = "stick";
// 		}

// 		if (typeObj == "heater") {
// 			construc.push({
// 				path: qSVG.circlePath(0, 0, 16),
// 				fill: "#fff",
// 				stroke: "#000",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m-15,-4 l30,0",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m-14,-8 l28,0",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m-11,-12 l22,0",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m-16,0 l32,0",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m-15,4 l30,0",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m-14,8 l28,0",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "m-11,12 l22,0",
// 				fill: "none",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.params.width = 36;
// 			construc.params.height = 36;
// 			construc.family = "stick";
// 		}
// 		if (typeObj == "radiator") {
// 			construc.push({
// 				path: "m -20,-10 l 40,0 l0,20 l-40,0 Z",
// 				fill: "#fff",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "M -15,-10 L -15,10",
// 				fill: "#fff",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "M -10,-10 L -10,10",
// 				fill: "#fff",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "M -5,-10 L -5,10",
// 				fill: "#fff",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "M -0,-10 L -0,10",
// 				fill: "#fff",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "M 5,-10 L 5,10",
// 				fill: "#fff",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "M 10,-10 L 10,10",
// 				fill: "#fff",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.push({
// 				path: "M 15,-10 L 15,10",
// 				fill: "#fff",
// 				stroke: "#333",
// 				strokeDashArray: "",
// 			});
// 			construc.params.width = 40;
// 			construc.params.height = 20;
// 			construc.family = "stick";
// 		}
// 	}

// 	if (classObj == objClass.FURNITURE) {
// 		construc.params.bindBox = true;
// 		construc.params.move = true;
// 		construc.params.resize = true;
// 		construc.params.rotate = true;
// 	}

// 	return construc;
// };
