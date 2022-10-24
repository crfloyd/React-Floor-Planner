import { constants } from '../../../constants';
import {
	CursorType,
	ObjectMetaData,
	Point2D,
	SnapData,
	ViewboxData,
	WallMetaData
} from '../../models/models';
import { Object2D } from '../../models/Object2D';
import {
	getUpdatedObject,
	pointInPolygon
	// setInWallMeasurementText,
	// updateMeasurementText
} from '../../utils/svgTools';
import { getNearestWallNode, getWallsOnPoint } from '../../utils/utils';
import { CanvasState } from '../';

export const handleMouseMoveSelectMode = (
	snap: SnapData,
	{ binder, setBinder, drag }: CanvasState,
	viewbox: ViewboxData,
	setCursor: (crsr: CursorType) => void,
	handleCameraChange: (lens: string, xmove: number, xview: number) => void,
	wallMeta: WallMetaData[],
	objectMeta: ObjectMetaData[],
	setWallUnderCursor: (wall: WallMetaData | null) => void,
	point: Point2D,
	objectBeingMoved: ObjectMetaData | null,
	setObjectBeingMoved: (o: ObjectMetaData | null) => void,
	setNodeUnderCursor: (p: Point2D | undefined) => void,
	setInWallMeasurementText: (wall: WallMetaData, objects: ObjectMetaData[]) => void
) => {
	setWallUnderCursor(null);

	if (drag) {
		setCursor('move');
		const distX = (snap.xMouse - point.x) * viewbox.zoomFactor;
		const distY = (snap.yMouse - point.y) * viewbox.zoomFactor;
		handleCameraChange('zoomdrag', distX, distY);
		return;
	}
	const objectsToCheck = objectBeingMoved ? objectMeta.concat([objectBeingMoved]) : objectMeta;
	const matches = objectsToCheck.filter((o) => {
		return pointInPolygon({ x: snap.x, y: snap.y }, o.realBbox);
	});
	const objectUnderCursor = matches.length > 0 ? matches[0] : null;

	if (objectUnderCursor) {
		if (objectUnderCursor.params.bindBox) {
			// OBJ -> BOUNDINGBOX TOOL
			if (objectBeingMoved == null) {
				const boundingBox = new Object2D(
					'free',
					constants.OBJECT_CLASSES.BOUNDING_BOX,
					'boundingBox',
					objectUnderCursor.bbox.origin,
					objectUnderCursor.angle,
					false,
					objectUnderCursor.size,
					'normal',
					objectUnderCursor.thick,
					objectUnderCursor.realBbox,
					viewbox
				);
				const updatedObject = getUpdatedObject(boundingBox, objectUnderCursor.id);
				updatedObject.oldXY = { x: boundingBox.x, y: boundingBox.y };
				setObjectBeingMoved(updatedObject);
				// binder = setBinder(boundingBox);

				// binder.obj = objectUnderCursor;
				// $('#boxbind').append(binder.graph);
				if (!objectUnderCursor.params.move) {
					setCursor('trash'); // LIKE MEASURE ON PLAN
				} else setCursor('move');
			}
		} else {
			// DOOR, WINDOW, OPENING.. -- OBJ WITHOUT BINDBOX (params.bindBox = False) -- !!!!
			if (objectBeingMoved == null) {
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
				const updatedObject = getUpdatedObject(hoverBox, objectUnderCursor.id);
				updatedObject.oldXY = { x: objectUnderCursor.x, y: objectUnderCursor.y };
				setObjectBeingMoved(updatedObject);
				// binder = setBinder(hoverBox);

				// $('#boxbind').append(binder.graph);
			} else {
				// if (target == objectBeingMoved) {
				// 	setCursor('move');
				// 	binder.graph.firstChild.setAttribute('class', 'circle_css_2');
				// 	binder.type = 'obj';
				// 	binder.obj = objectUnderCursor;
				// } else {
				// 	setCursor('default');
				// 	binder.graph.firstChild.setAttribute('class', 'circle_css_1');
				// 	binder.type = false;
				// }
			}
		}
	} else {
		if (binder) {
			// if (binder.graph && typeof binder.graph != 'undefined') $(binder.graph).remove();
			if (binder.remove != undefined) binder.remove();
			binder = setBinder(null);
			setCursor('default');
			// updateMeasurementText(wallMeta);
		}
		if (objectBeingMoved) {
			setObjectBeingMoved(null);
		}
	}

	// BIND CIRCLE IF nearNode and GROUP ALL SAME XY SEG POINTS
	const nearestWallNode = getNearestWallNode(snap, wallMeta, 20);
	setNodeUnderCursor(nearestWallNode?.bestPoint);
	if (nearestWallNode) {
		setCursor('move');
		return;
	} else {
		setCursor('default');
	}

	// BIND WALL WITH NEARPOINT function ---> WALL BINDER CREATION
	const wallsUnderCursor = getWallsOnPoint(snap, wallMeta);
	if (wallsUnderCursor.length > 0) {
		const wallUnderCursor = wallsUnderCursor[wallsUnderCursor.length - 1];
		setWallUnderCursor(wallUnderCursor);
		if (wallUnderCursor) {
			// binder = setBinder({ wall: wallUnderCursor, type: 'segment' });
			setInWallMeasurementText(wallUnderCursor, objectMeta);
		}
	}
};
