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
