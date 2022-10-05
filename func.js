import { qSVG } from "./qSVG";

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

export function hideAllSize() {
	$("#boxbind").empty();
}

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
