import { constants } from '../../../constants';
import {
	BoundingBox,
	ObjectMetaData,
	Point2D,
	SnapData,
	ViewboxData,
	WallMetaData
} from '../../models/models';
import { Object2D } from '../../models/Object2D';
import {
	createEquation,
	getAngle,
	getUpdatedObject,
	nearPointOnEquation,
	nearVertice
} from '../../utils/svgTools';
import { getWallsOnPoint, pointIsBetween, vectorDeter, vectorXY } from '../../utils/utils';
import { CanvasState } from '../';

export const handleMouseMoveObjectMode = (
	snap: SnapData,
	objectType: string,
	viewbox: ViewboxData,
	wallMetaData: WallMetaData[],
	objectBeingMoved: ObjectMetaData | null,
	setObjectBeingMoved: (o: ObjectMetaData) => void
) => {
	if (objectBeingMoved == null) {
		// if (modeOption == 'simpleStair') {
		// 	const stairs = new Object2D(
		// 		'free',
		// 		constants.OBJECT_CLASSES.STAIR,
		// 		'simpleStair',
		// 		snap,
		// 		0,
		// 		false,
		// 		0,
		// 		'normal',
		// 		0,
		// 		15,
		// 		viewbox
		// 	);
		// 	setObjectBeingMoved(getUpdatedObject(stairs));
		// } else {
		const device = new Object2D(
			'free',
			constants.OBJECT_CLASSES.ENERGY,
			objectType,
			snap,
			0,
			false,
			0,
			'normal',
			0,
			0,
			viewbox
		);
		setObjectBeingMoved(getUpdatedObject(device));
		// }
		return;
	}

	if (objectBeingMoved.family !== 'stick' || wallMetaData.length == 0) {
		objectBeingMoved.x = snap.x;
		objectBeingMoved.y = snap.y;
		objectBeingMoved.oldXY = { x: objectBeingMoved.x, y: objectBeingMoved.y };
	} else if (objectBeingMoved.family === 'stick') {
		const stickData = stickOnWall(snap, wallMetaData);
		if (!stickData) return { newObject: null };
		const { wall, point } = stickData;
		objectBeingMoved.oldXY = point;
		let angleWall = getAngle(wall.start, wall.end, 'deg').deg;
		const v1 = vectorXY({ x: wall.start.x, y: wall.start.y }, { x: wall.end.x, y: wall.end.y });
		const v2 = vectorXY({ x: wall.end.x, y: wall.end.y }, snap);
		objectBeingMoved.x =
			point.x - (Math.sin(wall.angle * ((360 / 2) * Math.PI)) * objectBeingMoved.thick) / 2;
		objectBeingMoved.y =
			point.y - (Math.cos(wall.angle * ((360 / 2) * Math.PI)) * objectBeingMoved.thick) / 2;
		const newAngle = vectorDeter(v1, v2);
		if (Math.sign(newAngle) == 1) {
			angleWall += 180;
			objectBeingMoved.x =
				point.x + (Math.sin(wall.angle * ((360 / 2) * Math.PI)) * objectBeingMoved.thick) / 2;
			objectBeingMoved.y =
				point.y + (Math.cos(wall.angle * ((360 / 2) * Math.PI)) * objectBeingMoved.thick) / 2;
		}
		objectBeingMoved.angle = angleWall;
	}
	setObjectBeingMoved(getUpdatedObject(objectBeingMoved));
};

const pointsWithBoundingBox = (bbox: BoundingBox, wallMetaData: WallMetaData[]): boolean => {
	let found = false;
	const points = [
		{ x: bbox.left, y: bbox.top },
		{ x: bbox.left, y: bbox.bottom },
		{ x: bbox.right, y: bbox.top },
		{ x: bbox.right, y: bbox.bottom }
	];
	points.forEach((point) => {
		if (getWallsOnPoint(point, wallMetaData)) {
			found = true;
			return;
		}
	});
	return found;
};

const stickOnWall = (
	snap: SnapData,
	wallMeta: WallMetaData[]
): { wall: WallMetaData; point: Point2D; distance: number } | null => {
	if (wallMeta.length == 0) return null;
	let wallDistance = Infinity;
	let wallSelected: { wall: WallMetaData; point: Point2D; distance: number } | null = null;
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
			pointIsBetween(nearPoint1, wall.coords[0], wall.coords[3])
		) {
			wallDistance = nearPoint1.distance;
			wallSelected = {
				wall: wall,
				point: nearPoint1,
				distance: nearPoint1.distance
			};
		}
		if (
			nearPoint2.distance < wallDistance &&
			pointIsBetween(nearPoint2, wall.coords[1], wall.coords[2])
		) {
			wallDistance = nearPoint2.distance;
			wallSelected = {
				wall: wall,
				point: nearPoint2,
				distance: nearPoint2.distance
			};
		}
	});
	const nearestVertic = nearVertice(snap, wallMeta);
	if (nearestVertic && nearestVertic.distance < wallDistance) {
		const nearestWall = nearestVertic.wall;
		const eq1 = createEquation(
			nearestWall.coords[0].x,
			nearestWall.coords[0].y,
			nearestWall.coords[3].x,
			nearestWall.coords[3].y
		);
		const nearestPoint1 = nearPointOnEquation(eq1, nearestVertic);
		const eq2 = createEquation(
			nearestWall.coords[1].x,
			nearestWall.coords[1].y,
			nearestWall.coords[2].x,
			nearestWall.coords[2].y
		);
		const nearestPoint2 = nearPointOnEquation(eq2, nearestVertic);
		if (
			nearestPoint1.distance < wallDistance &&
			pointIsBetween(nearestPoint1, nearestWall.coords[0], nearestWall.coords[3])
		) {
			wallDistance = nearestPoint1.distance;
			wallSelected = {
				wall: nearestWall,
				point: nearestPoint1,
				distance: nearestPoint1.distance
			};
		}
		if (
			nearestPoint2.distance < wallDistance &&
			pointIsBetween(nearestPoint2, nearestWall.coords[1], nearestWall.coords[2])
		) {
			wallDistance = nearestPoint2.distance;
			wallSelected = {
				wall: nearestWall,
				point: nearestPoint2,
				distance: nearestPoint2.distance
			};
		}
	}
	return wallSelected;
};
