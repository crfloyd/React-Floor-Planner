import { qSVG } from "../../../qSVG";
import { Point2D, RoomMetaData, RoomPolygonData } from "../../models/models";
import { createSvgElement, pointInPolygon } from "../../utils/svgTools";
import { CanvasState } from "../CanvasState";

export const handleMouseMoveRoomMode = (
	snap: Point2D,
	{ binder, setBinder }: CanvasState,
	roomMetaData: RoomMetaData[],
	roomPolygonData: RoomPolygonData
) => {
	if (binder) {
		if (typeof binder["remove"] === "function") {
			binder.remove();
		}
		binder = setBinder(null);
	}

	const roomTarget = getRoomOnPoint(snap, roomMetaData);
	if (!roomTarget) return;

	var pathSurface = roomTarget.coords;
	var pathCreate = "M" + pathSurface[0].x + "," + pathSurface[0].y;
	for (var p = 1; p < pathSurface.length - 1; p++) {
		pathCreate =
			pathCreate + " " + "L" + pathSurface[p].x + "," + pathSurface[p].y;
	}
	pathCreate = pathCreate + "Z";

	if (roomTarget.inside.length > 0) {
		for (var ins = 0; ins < roomTarget.inside.length; ins++) {
			const targetPolygon = roomPolygonData.polygons[roomTarget.inside[ins]];
			const numCoords = targetPolygon.coords.length - 1;
			pathCreate =
				pathCreate +
				" M" +
				targetPolygon.coords[numCoords].x +
				"," +
				targetPolygon.coords[numCoords].y;
			for (var free = targetPolygon.coords.length - 2; free > -1; free--) {
				pathCreate =
					pathCreate +
					" L" +
					targetPolygon.coords[free].x +
					"," +
					targetPolygon.coords[free].y;
			}
		}
	}

	binder = setBinder(
		createSvgElement("boxbind", "path", {
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
	binder.id = roomMetaData.indexOf(roomTarget);
};

const getRoomOnPoint = (
	point: Point2D,
	roomMeta: RoomMetaData[]
): RoomMetaData | null => {
	let targetRoom: RoomMetaData | null = null;
	roomMeta.forEach((room) => {
		if (
			pointInPolygon(point, room.coords) &&
			(targetRoom == null || targetRoom.area >= room.area)
		) {
			targetRoom = room;
		}
	});
	return targetRoom;
};
