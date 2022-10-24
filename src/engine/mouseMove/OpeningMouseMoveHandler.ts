import { constants } from '../../../constants';
import { ObjectMetaData, Point2D, ViewboxData, WallMetaData } from '../../models/models';
import { Object2D } from '../../models/Object2D';
import { findNearestWallInRange, getAngle, getUpdatedObject } from '../../utils/svgTools';
import { computeLimit, getMidPoint, vectorDeter, vectorXY } from '../../utils/utils';
import { CanvasState } from '../';

export const handleMouseMoveOpeningMode = (
	snap: Point2D,
	{ modeOption }: CanvasState,
	viewbox: ViewboxData,
	wallMetaData: WallMetaData[],
	openingBeingMoved: ObjectMetaData | null,
	setOpeningBeingMoved: (o: ObjectMetaData | null) => void
) => {
	const nearestWall = findNearestWallInRange(snap, wallMetaData, Infinity, false);

	if (!nearestWall) {
		return;
	}

	const wall = nearestWall.wall;

	if (wall.type === 'separate') return;

	if (openingBeingMoved) {
		let angleWall = getAngle(wall.start, wall.end, 'deg').deg;
		const v1 = vectorXY({ x: wall.start.x, y: wall.start.y }, { x: wall.end.x, y: wall.end.y });
		const v2 = vectorXY({ x: wall.end.x, y: wall.end.y }, snap);
		const newAngle = vectorDeter(v1, v2);
		const updatedOpeningData = openingBeingMoved;
		updatedOpeningData.angleSign = false;
		if (Math.sign(newAngle) == 1) {
			updatedOpeningData.angleSign = true;
			angleWall += 180;
		}

		const limits = computeLimit(wall.equations.base, updatedOpeningData.size, nearestWall);
		if (wall.pointInsideWall(limits[0], false) && wall.pointInsideWall(limits[1], false)) {
			updatedOpeningData.x = nearestWall.x;
			updatedOpeningData.y = nearestWall.y;
			updatedOpeningData.angle = angleWall;
			updatedOpeningData.thick = wall.thick;
			updatedOpeningData.limit = limits;
		}

		if (
			(nearestWall.x == wall.start.x && nearestWall.y == wall.start.y) ||
			(nearestWall.x == wall.end.x && nearestWall.y == wall.end.y)
		) {
			if (wall.pointInsideWall(limits[0], false)) {
				updatedOpeningData.x = limits[0].x;
				updatedOpeningData.y = limits[0].y;
			}
			if (wall.pointInsideWall(limits[1], false)) {
				updatedOpeningData.x = limits[1].x;
				updatedOpeningData.y = limits[1].y;
			}
			updatedOpeningData.limit = limits;
			updatedOpeningData.angle = angleWall;
			updatedOpeningData.thick = wall.thick;
		}

		setOpeningBeingMoved(getUpdatedObject(updatedOpeningData));
		return;
	}

	const newObj = new Object2D(
		'inWall',
		constants.OBJECT_CLASSES.DOOR_WINDOW,
		modeOption,
		nearestWall,
		0,
		false,
		60,
		'normal',
		wall.thick,
		0,
		viewbox
	);

	let angleWall = getAngle(wall.start, wall.end, 'deg').deg;
	const v1 = vectorXY({ x: wall.start.x, y: wall.start.y }, { x: wall.end.x, y: wall.end.y });
	const v2 = vectorXY({ x: wall.end.x, y: wall.end.y }, snap);
	const newAngle = vectorDeter(v1, v2);
	if (Math.sign(newAngle) == 1) {
		angleWall += 180;
		newObj.angleSign = true;
	}
	const startCoords = getMidPoint(wall.start, wall.end);
	newObj.x = startCoords.x;
	newObj.y = startCoords.y;
	newObj.angle = angleWall;
	newObj.update();
	setOpeningBeingMoved(newObj);
};
