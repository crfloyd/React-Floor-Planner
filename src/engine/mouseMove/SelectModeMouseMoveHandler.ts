import { constants } from '../../../constants';
import { Object2D } from '../../models/Object2D';
import {
	createSvgElement,
	nearPointOnEquation,
	pointInPolygon,
	setInWallMeasurementText,
	updateMeasurementText
} from '../../utils/svgTools';
import { CanvasState } from '../CanvasState';
import {
	CursorType,
	ObjectMetaData,
	Point2D,
	SnapData,
	ViewboxData,
	WallMetaData
} from '../../models/models';
import { distanceBetween, getMidPoint, getNearestWall, getWallsOnPoint } from '../../utils/utils';

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
	point: Point2D
) => {
	setWallUnderCursor(null);
	if (drag) {
		setCursor('move');
		const distX = (snap.xMouse - point.x) * viewbox.zoomFactor;
		const distY = (snap.yMouse - point.y) * viewbox.zoomFactor;
		handleCameraChange('zoomdrag', distX, distY);
	} else {
		const matches = objectMeta.filter((o) => {
			const realBboxCoords = o.realBbox;
			return pointInPolygon(snap, realBboxCoords);
		});
		const objTarget = matches.length > 0 ? matches[0] : null;
		if (objTarget != null) {
			if (binder && binder.type == 'segment') {
				$(binder.graph).remove();
				binder = setBinder(null);
				setCursor('default');
			}
			if (objTarget.params.bindBox) {
				// OBJ -> BOUNDINGBOX TOOL
				if (binder == null) {
					binder = setBinder(
						new Object2D(
							'free',
							constants.OBJECT_CLASSES.BOUNDING_BOX,
							'',
							objTarget.bbox.origin,
							objTarget.angle,
							false,
							objTarget.size,
							'normal',
							objTarget.thick,
							objTarget.realBbox,
							viewbox
						)
					);

					binder.update();
					binder.obj = objTarget;
					binder.type = 'boundingBox';
					binder.oldX = binder.x;
					binder.oldY = binder.y;
					$('#boxbind').append(binder.graph);
					if (!objTarget.params.move) setCursor('trash'); // LIKE MEASURE ON PLAN
					if (objTarget.params.move) setCursor('move');
				}
			} else {
				// DOOR, WINDOW, OPENING.. -- OBJ WITHOUT BINDBOX (params.bindBox = False) -- !!!!
				if (binder == null) {
					const wallsOnPoint = getWallsOnPoint(objTarget, wallMeta);
					const closestWall = wallsOnPoint[0];
					// wall.inWallRib(objectMeta);
					setInWallMeasurementText(closestWall, objectMeta);
					const thickObj = closestWall.thick;
					const sizeObj = objTarget.size;

					binder = setBinder(
						new Object2D(
							'inWall',
							constants.OBJECT_CLASSES.HOVER_BOX,
							'',
							objTarget,
							objTarget.angle,
							false,
							sizeObj,
							'normal',
							thickObj,
							0,
							viewbox
						)
					);
					binder.update();

					binder.oldXY = { x: objTarget.x, y: objTarget.y }; // FOR OBJECT MENU
					$('#boxbind').append(binder.graph);
				} else {
					if (target == binder.graph.firstChild) {
						setCursor('move');
						binder.graph.firstChild.setAttribute('class', 'circle_css_2');
						binder.type = 'obj';
						binder.obj = objTarget;
					} else {
						setCursor('default');
						binder.graph.firstChild.setAttribute('class', 'circle_css_1');
						binder.type = false;
					}
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
				const objWall = wallUnderCursor.getObjects(objectMeta);
				if (objWall.length > 0) updateLenghtText(wallUnderCursor, objectMeta);
				setWallUnderCursor(wallUnderCursor);
				binder = setBinder({ wall: wallUnderCursor, type: 'segment' });
				// binder.wall.inWallRib(objectMeta);
				setInWallMeasurementText(binder.wall, objectMeta);
				const line = createSvgElement('none', 'line', {
					x1: binder.wall.start.x,
					y1: binder.wall.start.y,
					x2: binder.wall.end.x,
					y2: binder.wall.end.y,
					'stroke-width': 5,
					stroke: '#5cba79'
				});
				const ball1 = createSvgElement('none', 'circle', {
					class: 'circle_css',
					cx: binder.wall.start.x,
					cy: binder.wall.start.y,
					r: constants.CIRCLE_BINDER_RADIUS / 1.8
				});
				const ball2 = createSvgElement('none', 'circle', {
					class: 'circle_css',
					cx: binder.wall.end.x,
					cy: binder.wall.end.y,
					r: constants.CIRCLE_BINDER_RADIUS / 1.8
				});
				const graph = createSvgElement('none', 'g');
				graph.appendChild(line);
				graph.appendChild(ball1);
				graph.appendChild(ball2);
				binder.graph = graph;
				$('#boxbind').append(binder.graph);
				setCursor('pointer');
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
	}
};

type WallDistanceData = {
	coords: Point2D;
	distance: number;
};

const updateLenghtText = (wall: WallMetaData, objectMeta: ObjectMetaData[], option = false) => {
	if (!option) $('#boxRib').empty();
	const upDistances: WallDistanceData[] = [];
	const downDistances: WallDistanceData[] = [];

	const angleTextValue = wall.angle * (180 / Math.PI);
	const objectsOnWall = wall.getObjects(objectMeta); // LIST OBJ ON EDGE
	upDistances.push({
		coords: wall.coords[0],
		distance: 0
	});
	downDistances.push({
		coords: wall.coords[1],
		distance: 0
	});

	objectsOnWall.forEach((objTarget) => {
		const upPoints = [
			nearPointOnEquation(wall.equations.up, objTarget.limit[0]),
			nearPointOnEquation(wall.equations.up, objTarget.limit[1])
		];
		const downPoints = [
			nearPointOnEquation(wall.equations.down, objTarget.limit[0]),
			nearPointOnEquation(wall.equations.down, objTarget.limit[1])
		];

		let distance = distanceBetween(wall.coords[0], upPoints[0]) / constants.METER_SIZE;
		upDistances.push({
			coords: upPoints[0],
			distance: +distance.toFixed(2)
		});
		distance = distanceBetween(wall.coords[0], upPoints[1]) / constants.METER_SIZE;
		upDistances.push({
			coords: upPoints[1],
			distance: +distance.toFixed(2)
		});
		distance = distanceBetween(wall.coords[1], downPoints[0]) / constants.METER_SIZE;
		downDistances.push({
			coords: downPoints[0],
			distance: +distance.toFixed(2)
		});
		distance = distanceBetween(wall.coords[1], downPoints[1]) / constants.METER_SIZE;
		downDistances.push({
			coords: downPoints[1],
			distance: +distance.toFixed(2)
		});
	});
	let distance = distanceBetween(wall.coords[0], wall.coords[3]) / constants.METER_SIZE;
	upDistances.push({
		coords: wall.coords[3],
		distance: distance
	});
	distance = distanceBetween(wall.coords[1], wall.coords[2]) / constants.METER_SIZE;
	downDistances.push({
		coords: wall.coords[2],
		distance: distance
	});
	upDistances.sort((a: WallDistanceData, b: WallDistanceData) => {
		return +(a.distance - b.distance).toFixed(2);
	});
	downDistances.sort((a: WallDistanceData, b: WallDistanceData) => {
		return +(a.distance - b.distance).toFixed(2);
	});

	const updateText = (distanceData: WallDistanceData[], direction: 'up' | 'down') => {
		for (let i = 1; i < distanceData.length; i++) {
			const current = distanceData[i];
			const previous = distanceData[i - 1];
			const found = true;
			let shift = -5;
			const valueText = Math.abs(previous.distance - current.distance);
			let angleText = angleTextValue;
			if (found) {
				if (direction == 'down') {
					shift = -shift + 10;
				}
				if (angleText > 89 || angleText < -89) {
					angleText -= 180;
					if (direction == 'down') {
						shift = -5;
					} else shift = -shift + 10;
				}

				const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
				const startText = getMidPoint(previous.coords, current.coords);
				textElement.setAttributeNS(null, 'x', startText.x.toString());
				textElement.setAttributeNS(null, 'y', (startText.y + shift).toString());
				textElement.setAttributeNS(null, 'text-anchor', 'middle');
				textElement.setAttributeNS(null, 'font-family', 'roboto');
				textElement.setAttributeNS(null, 'stroke', '#ffffff');
				textElement.textContent = valueText.toFixed(2);
				if (+textElement.textContent < 1) {
					textElement.setAttributeNS(null, 'font-size', '0.8em');
					textElement.textContent = textElement.textContent.substring(
						1,
						textElement.textContent.length
					);
				} else textElement.setAttributeNS(null, 'font-size', '1em');
				textElement.setAttributeNS(null, 'stroke-width', '0.4px');
				textElement.setAttributeNS(null, 'fill', '#666666');
				textElement.setAttribute(
					'transform',
					'rotate(' + angleText + ' ' + startText.x + ',' + startText.y + ')'
				);

				$('#boxRib').append(textElement);
			}
		}
	};

	updateText(upDistances, 'up');
	updateText(downDistances, 'down');
};
