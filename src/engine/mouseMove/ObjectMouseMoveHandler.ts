import { constants } from "../../../constants";
import { editor } from "../../../editor";
import { qSVG } from "../../../qSVG";
import { Point2D } from "../../models";
import { Object2D } from "../../Object2D";
import { getAngle } from "../../svgTools";
import { CanvasState } from "../CanvasState";

export const handleMouseMoveOverObject = (
	snap: Point2D,
	{ binder, setBinder, wallMeta, modeOption, viewbox }: CanvasState
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
			wallMeta.length == 0
		) {
			binder.x = snap.x;
			binder.y = snap.y;
			binder.oldX = binder.x;
			binder.oldY = binder.y;
			binder.update();
		}
		if (binder.family == "collision") {
			var found = false;

			if (
				editor.rayCastingWall(
					{ x: binder.bbox.left, y: binder.bbox.top },
					wallMeta
				)
			)
				found = true;
			if (
				!found &&
				editor.rayCastingWall(
					{ x: binder.bbox.left, y: binder.bbox.bottom },
					wallMeta
				)
			)
				found = true;
			if (
				!found &&
				editor.rayCastingWall(
					{ x: binder.bbox.right, y: binder.bbox.top },
					wallMeta
				)
			)
				found = true;
			if (
				!found &&
				editor.rayCastingWall(
					{
						x: binder.bbox.right,
						y: binder.bbox.bottom,
					},
					wallMeta
				)
			)
				found = true;

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
		}
		if (binder.family == "stick") {
			const pos: any = editor.stickOnWall(snap, wallMeta);
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
