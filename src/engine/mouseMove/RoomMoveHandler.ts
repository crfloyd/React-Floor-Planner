import { editor } from "../../../editor";
import { qSVG } from "../../../qSVG";
import { Point2D, RoomMetaData } from "../../models";

export const RoomMoveHandler = (
	binder: any,
	snap: Point2D,
	roomMeta: RoomMetaData[]
) => {
	const roomTarget = editor.rayCastingRoom(snap, roomMeta);
	if (roomTarget) {
		if (binder) {
			binder.remove();
			binder = binder;
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

		binder = qSVG.create("boxbind", "path", {
			id: "roomSelected",
			d: pathCreate,
			fill: "#c9c14c",
			"fill-opacity": 0.5,
			stroke: "#c9c14c",
			"fill-rule": "evenodd",
			"stroke-width": 3,
		});

		binder.type = "room";
		binder.area = roomTarget.area;
		binder.id = roomMeta.indexOf(roomTarget);
	} else {
		if (binder) {
			binder.remove();
			binder = null;
		}
	}

	return binder;
};
