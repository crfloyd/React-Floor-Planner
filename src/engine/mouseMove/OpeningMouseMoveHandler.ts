import { constants } from "../../../constants";
import { Point2D, ViewboxData, WallMetaData } from "../../models/models";
import { Object2D } from "../../models/Object2D";
import { getAngle, findNearestWallInRange } from "../../utils/svgTools";
import {
	computeLimit,
	getMidPoint,
	vectorDeter,
	vectorXY,
} from "../../utils/utils";
import { CanvasState } from "../CanvasState";

export const handleMouseMoveOpeningMode = (
	snap: Point2D,
	{ binder, setBinder, modeOption }: CanvasState,
	viewbox: ViewboxData,
	wallMetaData: WallMetaData[]
) => {
	const wallSelect = findNearestWallInRange(
		snap,
		wallMetaData,
		Infinity,
		false
	);
	if (wallSelect) {
		var wall = wallSelect.wall;
		if (wall.type != "separate") {
			if (binder == null) {
				// family, classe, type, pos, angle, angleSign, size, hinge, thick, value, viewbox
				binder = setBinder(
					new Object2D(
						"inWall",
						constants.OBJECT_CLASSES.DOOR_WINDOW,
						modeOption,
						wallSelect,
						0,
						false,
						60,
						"normal",
						wall.thick,
						0,
						viewbox
					)
				);

				let angleWall = getAngle(wall.start, wall.end, "deg").deg;
				var v1 = vectorXY(
					{ x: wall.start.x, y: wall.start.y },
					{ x: wall.end.x, y: wall.end.y }
				);
				var v2 = vectorXY({ x: wall.end.x, y: wall.end.y }, snap);
				var newAngle = vectorDeter(v1, v2);
				if (Math.sign(newAngle) == 1) {
					angleWall += 180;
					binder.angleSign = 1;
				}
				const startCoords = getMidPoint(wall.start, wall.end);
				binder.x = startCoords.x;
				binder.y = startCoords.y;
				binder.angle = angleWall;
				binder.update();
				$("#boxbind").append(binder.graph);
			} else {
				let angleWall = getAngle(wall.start, wall.end, "deg").deg;
				var v1 = vectorXY(
					{ x: wall.start.x, y: wall.start.y },
					{ x: wall.end.x, y: wall.end.y }
				);
				var v2 = vectorXY({ x: wall.end.x, y: wall.end.y }, snap);
				var newAngle = vectorDeter(v1, v2);
				binder.angleSign = 0;
				if (Math.sign(newAngle) == 1) {
					binder.angleSign = 1;
					angleWall += 180;
				}

				var limits = computeLimit(wall.equations.base, binder.size, wallSelect);
				if (
					wall.pointInsideWall(limits[0], false) &&
					wall.pointInsideWall(limits[1], false)
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
					if (wall.pointInsideWall(limits[0], false)) {
						binder.x = limits[0].x;
						binder.y = limits[0].y;
					}
					if (wall.pointInsideWall(limits[1], false)) {
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

	return binder;
};
