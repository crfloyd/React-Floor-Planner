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
	if (!localStorage.getItem("history")) {
		$("#recover").html("<p>Select a plan type.");
	}
	$("#myModal").modal();
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
