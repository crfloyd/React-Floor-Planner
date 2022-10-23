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
	createSvgElement,
	getUpdatedObject,
	pointInPolygon,
	setInWallMeasurementText,
	updateMeasurementText
} from '../../utils/svgTools';
import { getNearestWall, getWallsOnPoint } from '../../utils/utils';
import { CanvasState } from '../';

export const handleMouseMoveSelectMode = (
	target: EventTarget,
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
	setObjectBeingMoved: (o: ObjectMetaData | null) => void
) => {
	setWallUnderCursor(null);

	if (drag) {
		setCursor('move');
		const distX = (snap.xMouse - point.x) * viewbox.zoomFactor;
		const distY = (snap.yMouse - point.y) * viewbox.zoomFactor;
		handleCameraChange('zoomdrag', distX, distY);
		return;
	}

	// objectBeingMoved?.update();
	// console.log(
	// 	'Checking for object under cursor: objBeingMoved:',
	// 	objectBeingMoved,
	// 	'meta:',
	// 	objectMeta
	// );
	const objectsToCheck = objectBeingMoved ? objectMeta.concat([objectBeingMoved]) : objectMeta;
	const matches = objectsToCheck.filter((o) => {
		// console.log(
		// 	`mouse: ${snap.x},${snap.y} obj: x:${o.realBbox[0].x}-${o.realBbox[3].x}, y:${o.realBbox[0].y}-${o.realBbox[3].y}`
		// );
		// console.log(o.type, o.realBbox);
		return pointInPolygon({ x: snap.x, y: snap.y }, o.realBbox);
	});
	const objectUnderCursor = matches.length > 0 ? matches[0] : null;

	if (objectUnderCursor) {
		// console.log('found object under cursor objectBeingMoved:', objectBeingMoved, matches);
		if (binder?.type === 'segment') {
			$(binder.graph).remove();
			binder = setBinder(null);
			// setObjectBeingMoved(null);
			setCursor('default');
		}
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

				// newObject.update();

				// const {
				// 	newWidth,
				// 	newHeight,
				// 	newRenderData,
				// 	newRealBbox: newBbox
				// } = calculateObjectRenderData(
				// 	boundingBox.size,
				// 	boundingBox.thick,
				// 	boundingBox.angle,
				// 	boundingBox.class,
				// 	boundingBox.type,
				// 	boundingBox.pos
				// );
				// setObjectBeingMoved({
				// 	...boundingBox,
				// 	width: newWidth,
				// 	height: newHeight,
				// 	renderData: newRenderData,
				// 	realBbox: newBbox,
				// 	oldXY: { x: boundingBox.x, y: boundingBox.y },
				// 	targetId: objectUnderCursor.id
				// });
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
				// const {
				// 	newWidth,
				// 	newHeight,
				// 	newRenderData,
				// 	newRealBbox: newBbox
				// } = calculateObjectRenderData(
				// 	hoverBox.size,
				// 	hoverBox.thick,
				// 	hoverBox.angle,
				// 	hoverBox.class,
				// 	hoverBox.type,
				// 	hoverBox.pos
				// );
				// setObjectBeingMoved({
				// 	...hoverBox,
				// 	width: newWidth,
				// 	height: newHeight,
				// 	renderData: newRenderData,
				// 	realBbox: newBbox,
				// 	targetId: objectUnderCursor.id,
				// 	oldXY: { x: objectUnderCursor.x, y: objectUnderCursor.y }
				// });
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
			if (binder.graph && typeof binder.graph != 'undefined') $(binder.graph).remove();
			else if (binder.remove != undefined) binder.remove();
			binder = setBinder(null);
			setCursor('default');
			updateMeasurementText(wallMeta);
		}
		if (objectBeingMoved) {
			setObjectBeingMoved(null);
		}
	}

	// BIND CIRCLE IF nearNode and GROUP ALL SAME XY SEG POINTS
	const nearestWallData = getNearestWall(snap, wallMeta, 20);
	if (nearestWallData) {
		if (binder == null || binder.type == 'segment') {
			binder = setBinder(
				createSvgElement('boxbind', 'circle', {
					id: 'circlebinder',
					class: 'circle_css_2',
					cx: nearestWallData.bestPoint.x,
					cy: nearestWallData.bestPoint.y,
					r: constants.CIRCLE_BINDER_RADIUS
				})
			);
			binder.data = {
				x: nearestWallData.bestPoint.x,
				y: nearestWallData.bestPoint.y
			};
			binder.type = 'node';
			if ($('#linebinder').length) $('#linebinder').remove();
		} else {
			// REMAKE CIRCLE_CSS ON BINDER AND TAKE DATA SEG GROUP
			// if (typeof(binder) != 'undefined') {
			//     binder.attr({
			//         class: "circle_css_2"
			//     });
			// }
		}
		setCursor('move');
	} else {
		if (binder && binder.type == 'node') {
			binder.remove();
			binder = setBinder(null);
			$('#boxbind').empty();
			setCursor('default');
			updateMeasurementText(wallMeta);
		}
	}

	// BIND WALL WITH NEARPOINT function ---> WALL BINDER CREATION
	const wallsUnderCursor = getWallsOnPoint(snap, wallMeta);
	if (wallsUnderCursor.length > 0) {
		const wallUnderCursor = wallsUnderCursor[wallsUnderCursor.length - 1];
		if (wallUnderCursor && binder == null) {
			// const objWall = wallUnderCursor.getObjects(objectMeta);
			// if (objWall.length > 0) updateLenghtText(wallUnderCursor, objectMeta);
			setWallUnderCursor(wallUnderCursor);
			binder = setBinder({ wall: wallUnderCursor, type: 'segment' });
			// binder.wall.inWallRib(objectMeta);
			setInWallMeasurementText(binder.wall, objectMeta);
			// const line = createSvgElement('none', 'line', {
			// 	x1: binder.wall.start.x,
			// 	y1: binder.wall.start.y,
			// 	x2: binder.wall.end.x,
			// 	y2: binder.wall.end.y,
			// 	'stroke-width': 5,
			// 	stroke: '#5cba79'
			// });
			// const ball1 = createSvgElement('none', 'circle', {
			// 	class: 'circle_css',
			// 	cx: binder.wall.start.x,
			// 	cy: binder.wall.start.y,
			// 	r: constants.CIRCLE_BINDER_RADIUS / 1.8
			// });
			// const ball2 = createSvgElement('none', 'circle', {
			// 	class: 'circle_css',
			// 	cx: binder.wall.end.x,
			// 	cy: binder.wall.end.y,
			// 	r: constants.CIRCLE_BINDER_RADIUS / 1.8
			// });
			// const graph = createSvgElement('none', 'g');
			// graph.appendChild(line);
			// graph.appendChild(ball1);
			// graph.appendChild(ball2);
			// binder.graph = graph;
			// $('#boxbind').append(binder.graph);
			// setCursor('pointer');
		}
	} else {
		if (binder && binder.type == 'segment') {
			$(binder.graph).remove();
			binder = setBinder(null);
			$('#boxbind').empty();
			setCursor('default');
			updateMeasurementText(wallMeta);
		}
	}
};
