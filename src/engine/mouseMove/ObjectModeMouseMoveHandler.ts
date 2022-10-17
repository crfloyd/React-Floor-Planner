import { constants } from "../../../constants";
import { editor } from "../../../editor";
import { qSVG } from "../../../qSVG";
import { BoundingBox, SnapData, ViewboxData, WallMetaData } from "../../models";
import { Object2D } from "../../Object2D";
import { createEquation, getAngle, nearPointOnEquation } from "../../svgTools";
import { getWallsOnPoint } from "../../utils";
import { CanvasState } from "../CanvasState";

export const handleMouseMoveOverObject = (
	snap: SnapData,
	{ binder, setBinder, modeOption }: CanvasState,
	viewbox: ViewboxData,
	wallMetaData: WallMetaData[]
) => {
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
					false,
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
					false,
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
			wallMetaData.length == 0
		) {
			binder.x = snap.x;
			binder.y = snap.y;
			binder.oldX = binder.x;
			binder.oldY = binder.y;
			binder.update();
		}
		if (binder.family == "collision") {
			let found = pointsWithBoundingBox(binder.bbox, wallMetaData);

			if (!found) {
				binder.x = snap.x;
				binder.y = snap.y;
				binder.oldX = binder.x;
				binder.oldY = binder.y;
				binder.update();
			} else {
				binder.x = binder.oldX;
				binder.y = binder.oldY;
				binder.update();
			}
		} else if (binder.family == "stick") {
			const pos: any = stickOnWall(snap, wallMetaData);
			binder.oldX = pos.x;
			binder.oldY = pos.y;
			let angleWall = getAngle(pos.wall.start, pos.wall.end, "deg").deg;
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
					(Math.sin(pos.wall.angle * ((360 / 2) * Math.PI)) * binder.thick) / 2;
				binder.y =
					pos.y +
					(Math.cos(pos.wall.angle * ((360 / 2) * Math.PI)) * binder.thick) / 2;
			}
			binder.angle = angleWall;
			binder.update();
		}
	}
};

const pointsWithBoundingBox = (
	bbox: BoundingBox,
	wallMetaData: WallMetaData[]
): boolean => {
	let found = false;
	const points = [
		{ x: bbox.left, y: bbox.top },
		{ x: bbox.left, y: bbox.bottom },
		{ x: bbox.right, y: bbox.top },
		{ x: bbox.right, y: bbox.bottom },
	];
	points.forEach((point) => {
		if (getWallsOnPoint(point, wallMetaData)) {
			found = true;
			return;
		}
	});
	return found;
};

const stickOnWall = (snap: SnapData, wallMeta: WallMetaData[]) => {
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
		const nearPoint1 = nearPointOnEquation(eq1, snap);
		const eq2 = createEquation(
			wall.coords[1].x,
			wall.coords[1].y,
			wall.coords[2].x,
			wall.coords[2].y
		);
		const nearPoint2 = nearPointOnEquation(eq2, snap);
		if (
			nearPoint1.distance < wallDistance &&
			qSVG.btwn(nearPoint1.x, wall.coords[0].x, wall.coords[3].x) &&
			qSVG.btwn(nearPoint1.y, wall.coords[0].y, wall.coords[3].y)
		) {
			wallDistance = nearPoint1.distance;
			wallSelected = {
				wall: wall,
				x: nearPoint1.x,
				y: nearPoint1.y,
				distance: nearPoint1.distance,
			};
		}
		if (
			nearPoint2.distance < wallDistance &&
			qSVG.btwn(nearPoint2.x, wall.coords[1].x, wall.coords[2].x) &&
			qSVG.btwn(nearPoint2.y, wall.coords[1].y, wall.coords[2].y)
		) {
			wallDistance = nearPoint2.distance;
			wallSelected = {
				wall: wall,
				x: nearPoint2.x,
				y: nearPoint2.y,
				distance: nearPoint2.distance,
			};
		}
	});
	const nearestVertic = editor.nearVertice(snap, wallMeta);
	if (nearestVertic && nearestVertic.distance < wallDistance) {
		var eq1 = createEquation(
			nearestVertic.number.coords[0].x,
			nearestVertic.number.coords[0].y,
			nearestVertic.number.coords[3].x,
			nearestVertic.number.coords[3].y
		);
		const nearestPoint1 = nearPointOnEquation(eq1, nearestVertic);
		var eq2 = createEquation(
			nearestVertic.number.coords[1].x,
			nearestVertic.number.coords[1].y,
			nearestVertic.number.coords[2].x,
			nearestVertic.number.coords[2].y
		);
		const nearestPoint2 = nearPointOnEquation(eq2, nearestVertic);
		if (
			nearestPoint1.distance < wallDistance &&
			qSVG.btwn(
				nearestPoint1.x,
				nearestVertic.number.coords[0].x,
				nearestVertic.number.coords[3].x
			) &&
			qSVG.btwn(
				nearestPoint1.y,
				nearestVertic.number.coords[0].y,
				nearestVertic.number.coords[3].y
			)
		) {
			wallDistance = nearestPoint1.distance;
			wallSelected = {
				wall: nearestVertic.number,
				x: nearestPoint1.x,
				y: nearestPoint1.y,
				distance: nearestPoint1.distance,
			};
		}
		if (
			nearestPoint2.distance < wallDistance &&
			qSVG.btwn(
				nearestPoint2.x,
				nearestVertic.number.coords[1].x,
				nearestVertic.number.coords[2].x
			) &&
			qSVG.btwn(
				nearestPoint2.y,
				nearestVertic.number.coords[1].y,
				nearestVertic.number.coords[2].y
			)
		) {
			wallDistance = nearestPoint2.distance;
			wallSelected = {
				wall: nearestVertic.number,
				x: nearestPoint2.x,
				y: nearestPoint2.y,
				distance: nearestPoint2.distance,
			};
		}
	}
	return wallSelected;
};
