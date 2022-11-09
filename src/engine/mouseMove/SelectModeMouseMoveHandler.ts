import { constants } from '../../constants';
import {
	CursorType,
	DeviceMetaData,
	ObjectMetaData,
	Point2D,
	ViewboxData,
	WallMetaData
} from '../../models/models';
import { Object2D } from '../../models/Object2D';
import { pointInPolygon } from '../../utils/svgTools';
import { getNearestWallNode, getWallsOnPoint } from '../../utils/utils';

export const handleMouseMoveSelectMode = (
	snap: Point2D,
	viewbox: ViewboxData,
	setCursor: (crsr: CursorType) => void,
	wallMeta: WallMetaData[],
	objectMeta: ObjectMetaData[],
	setWallUnderCursor: (wall: WallMetaData | undefined) => void,
	setObjectUnderCursor: (o: ObjectMetaData | undefined) => void,
	objectBeingMoved: ObjectMetaData | null,
	setObjectBeingMoved: (o: ObjectMetaData | null) => void,
	setNodeUnderCursor: (p: Point2D | undefined) => void,
	setInWallMeasurementText: (wall: WallMetaData, objects: ObjectMetaData[]) => void,
	deviceUnderCursor: DeviceMetaData | undefined
) => {
	setWallUnderCursor(undefined);
	setObjectUnderCursor(undefined);

	if (deviceUnderCursor) {
		setCursor('move');
		return;
	}

	const nearObjects = objectMeta.filter((o) => {
		return pointInPolygon({ x: snap.x, y: snap.y }, o.realBbox);
	});
	const objectUnderCursor = nearObjects.length > 0 ? nearObjects[0] : undefined;

	if (objectUnderCursor) {
		if (objectUnderCursor.params.bindBox) {
			const boundingBox = new Object2D(
				'free',
				constants.OBJECT_CLASSES.BOUNDING_BOX,
				'boundingBox',
				{ x: objectUnderCursor.x, y: objectUnderCursor.y },
				objectUnderCursor.angle,
				false,
				objectUnderCursor.size,
				'normal',
				objectUnderCursor.thick,
				0,
				viewbox
			);
			boundingBox.oldXY = { x: objectUnderCursor.x, y: objectUnderCursor.y };
			boundingBox.update();
			boundingBox.targetId = objectUnderCursor.id;
			setObjectUnderCursor(boundingBox);
			if (!objectUnderCursor.params.move) {
				setCursor('trash');
			} else setCursor('move');

			return;
		} else {
			// DOOR, WINDOW, OPENING.. -- OBJ WITHOUT BINDBOX (params.bindBox = False) -- !!!!
			const wallsOnPoint = getWallsOnPoint(objectUnderCursor, wallMeta);
			const closestWall = wallsOnPoint[0];
			setInWallMeasurementText(closestWall, objectMeta);
			const thickObj = closestWall.thick;
			const sizeObj = objectUnderCursor.size;

			const hoverBox = new Object2D(
				'inWall',
				constants.OBJECT_CLASSES.HOVER_BOX,
				'',
				{ x: objectUnderCursor.x, y: objectUnderCursor.y },
				objectUnderCursor.angle,
				false,
				sizeObj,
				'normal',
				thickObj,
				0,
				viewbox
			);
			hoverBox.update();
			hoverBox.oldXY = { x: objectUnderCursor.x, y: objectUnderCursor.y };
			hoverBox.targetId = objectUnderCursor.id;
			setObjectBeingMoved(hoverBox);
			setObjectUnderCursor(hoverBox);
		}
	} else {
		if (objectBeingMoved) {
			setObjectBeingMoved(null);
		}
	}

	const nearestWallNode = getNearestWallNode(snap, wallMeta, 20);
	setNodeUnderCursor(nearestWallNode?.bestPoint);
	if (nearestWallNode) {
		setCursor('move');
		return;
	} else {
		setCursor('default');
	}

	const wallsUnderCursor = getWallsOnPoint(snap, wallMeta);
	if (wallsUnderCursor.length > 0) {
		const wallUnderCursor = wallsUnderCursor[wallsUnderCursor.length - 1];
		setWallUnderCursor(wallUnderCursor);
		if (wallUnderCursor) {
			setInWallMeasurementText(wallUnderCursor, objectMeta);
		}
	}
};
