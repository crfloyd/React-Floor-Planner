import { constants } from '../../constants';
import {
	Point2D,
	SVGCreationData,
	SVGData,
	ObjectMetaData,
	WallMetaData,
	WallEquationGroup,
	WallEquation,
	SvgPathMetaData,
	WallJunction,
	WallVertex,
	Polygon,
	RoomPolygonData,
	RoomMetaData
} from '../models/models';
import {
	arraysAreEqual,
	distanceBetween,
	findById,
	getArrayDifferences,
	getMidPoint,
	getNumObjectArrayDifferences,
	intersectionOfEquations,
	intersectionOfSideEquations,
	pDistance,
	perpendicularEquation,
	pointsAreEqual,
	valueIsBetween,
	vectorVertex
} from './utils';

export const createSvgElement = (id: string, shape: string, attrs?: any) => {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', shape);
	if (attrs) {
		for (const k in attrs) {
			const v = attrs[k];
			if (v) {
				svg.setAttribute(k, v);
			}
			// s.attr(k, attrs[k]);
		}
	}

	if (id != 'none') {
		$('#' + id).append(svg);
	}
	return svg;
};

export const carpentryCalc = (
	classType: string,
	type: string,
	size: number,
	thickness: number,
	divider: any = 10
): SVGCreationData => {
	const construc: SVGData[] = [];
	const result: SVGCreationData = {
		construc: construc,
		bindBox: false,
		move: false,
		resize: false,
		resizeLimit: {
			width: { min: 0, max: 0 },
			height: { min: 0, max: 0 }
		},
		rotate: false
	};

	const circlePath = (cx: number, cy: number, r: number) => {
		return (
			'M ' +
			cx +
			' ' +
			cy +
			' m -' +
			r +
			', 0 a ' +
			r +
			',' +
			r +
			' 0 1,0 ' +
			r * 2 +
			',0 a ' +
			r +
			',' +
			r +
			' 0 1,0 -' +
			r * 2 +
			',0'
		);
	};

	const objClass = constants.OBJECT_CLASSES;

	if (classType == objClass.HOVER_BOX) {
		construc.push({
			path:
				'M ' +
				-size / 2 +
				',' +
				-thickness / 2 +
				' L ' +
				-size / 2 +
				',' +
				thickness / 2 +
				' L ' +
				size / 2 +
				',' +
				thickness / 2 +
				' L ' +
				size / 2 +
				',' +
				-thickness / 2 +
				' Z',
			fill: '#5cba79',
			stroke: '#5cba79',
			strokeDashArray: ''
		});
	}

	if (classType == objClass.DOOR_WINDOW) {
		if (type == 'simple') {
			construc.push({
				path:
					'M ' +
					-size / 2 +
					',' +
					-thickness / 2 +
					' L ' +
					-size / 2 +
					',' +
					thickness / 2 +
					' L ' +
					size / 2 +
					',' +
					thickness / 2 +
					' L ' +
					size / 2 +
					',' +
					-thickness / 2 +
					' Z',
				fill: '#ccc',
				stroke: 'none',
				strokeDashArray: ''
			});
			construc.push({
				path:
					'M ' +
					-size / 2 +
					',' +
					-thickness / 2 +
					' L ' +
					-size / 2 +
					',' +
					(-size - thickness / 2) +
					'  A' +
					size +
					',' +
					size +
					' 0 0,1 ' +
					size / 2 +
					',' +
					-thickness / 2,
				fill: 'none',
				stroke: constants.COLOR_WALL,
				strokeDashArray: ''
			});
			result.resize = true;
			result.resizeLimit.width = { min: 40, max: 120 };
		}
		if (type == 'double') {
			construc.push({
				path:
					'M ' +
					-size / 2 +
					',' +
					-thickness / 2 +
					' L ' +
					-size / 2 +
					',' +
					thickness / 2 +
					' L ' +
					size / 2 +
					',' +
					thickness / 2 +
					' L ' +
					size / 2 +
					',' +
					-thickness / 2 +
					' Z',
				fill: '#ccc',
				stroke: 'none',
				strokeDashArray: ''
			});
			construc.push({
				path:
					'M ' +
					-size / 2 +
					',' +
					-thickness / 2 +
					' L ' +
					-size / 2 +
					',' +
					(-size / 2 - thickness / 2) +
					'  A' +
					size / 2 +
					',' +
					size / 2 +
					' 0 0,1 0,' +
					-thickness / 2,
				fill: 'none',
				stroke: constants.COLOR_WALL,
				strokeDashArray: ''
			});
			construc.push({
				path:
					'M ' +
					size / 2 +
					',' +
					-thickness / 2 +
					' L ' +
					size / 2 +
					',' +
					(-size / 2 - thickness / 2) +
					'  A' +
					size / 2 +
					',' +
					size / 2 +
					' 0 0,0 0,' +
					-thickness / 2,
				fill: 'none',
				stroke: constants.COLOR_WALL,
				strokeDashArray: ''
			});
			result.resize = true;
			result.resizeLimit.width = { min: 40, max: 160 };
		}
		if (type == 'pocket') {
			construc.push({
				path:
					'M ' +
					-size / 2 +
					',' +
					(-(thickness / 2) - 4) +
					' L ' +
					-size / 2 +
					',' +
					thickness / 2 +
					' L ' +
					size / 2 +
					',' +
					thickness / 2 +
					' L ' +
					size / 2 +
					',' +
					(-(thickness / 2) - 4) +
					' Z',
				fill: '#ccc',
				stroke: 'none',
				strokeDashArray: 'none'
			});
			construc.push({
				path:
					'M ' +
					-size / 2 +
					',' +
					-thickness / 2 +
					' L ' +
					-size / 2 +
					',' +
					thickness / 2 +
					' M ' +
					size / 2 +
					',' +
					thickness / 2 +
					' L ' +
					size / 2 +
					',' +
					-thickness / 2,
				fill: 'none',
				stroke: '#494646',
				strokeDashArray: '5 5'
			});
			construc.push({
				path:
					'M ' +
					-size / 2 +
					',' +
					-thickness / 2 +
					' L ' +
					-size / 2 +
					',' +
					(-thickness / 2 - 5) +
					' L ' +
					+size / 2 +
					',' +
					(-thickness / 2 - 5) +
					' L ' +
					+size / 2 +
					',' +
					-thickness / 2 +
					' Z',
				fill: 'url(#hatch)',
				stroke: '#494646',
				strokeDashArray: ''
			});
			result.resize = true;
			result.resizeLimit.width = { min: 60, max: 200 };
		}
		if (type == 'opening') {
			construc.push({
				path:
					'M ' +
					-size / 2 +
					',' +
					-thickness / 2 +
					' L ' +
					-size / 2 +
					',' +
					thickness / 2 +
					' L ' +
					size / 2 +
					',' +
					thickness / 2 +
					' L ' +
					size / 2 +
					',' +
					-thickness / 2 +
					' Z',
				fill: '#ccc',
				stroke: '#494646',
				strokeDashArray: '5,5'
			});
			construc.push({
				path:
					'M ' +
					-size / 2 +
					',' +
					-(thickness / 2) +
					' L ' +
					-size / 2 +
					',' +
					thickness / 2 +
					' L ' +
					(-size / 2 + 5) +
					',' +
					thickness / 2 +
					' L ' +
					(-size / 2 + 5) +
					',' +
					-(thickness / 2) +
					' Z',
				fill: 'none',
				stroke: '#494646',
				strokeDashArray: 'none'
			});
			construc.push({
				path:
					'M ' +
					(size / 2 - 5) +
					',' +
					-(thickness / 2) +
					' L ' +
					(size / 2 - 5) +
					',' +
					thickness / 2 +
					' L ' +
					size / 2 +
					',' +
					thickness / 2 +
					' L ' +
					size / 2 +
					',' +
					-(thickness / 2) +
					' Z',
				fill: 'none',
				stroke: '#494646',
				strokeDashArray: 'none'
			});
			result.resize = true;
			result.resizeLimit.width = { min: 40, max: 500 };
		}
		if (type == 'fix') {
			construc.push({
				path:
					'M ' +
					-size / 2 +
					',-2 L ' +
					-size / 2 +
					',2 L ' +
					size / 2 +
					',2 L ' +
					size / 2 +
					',-2 Z',
				fill: '#ccc',
				stroke: 'none',
				strokeDashArray: ''
			});
			construc.push({
				path:
					'M ' +
					-size / 2 +
					',' +
					-thickness / 2 +
					' L ' +
					-size / 2 +
					',' +
					thickness / 2 +
					' M ' +
					size / 2 +
					',' +
					thickness / 2 +
					' L ' +
					size / 2 +
					',' +
					-thickness / 2,
				fill: 'none',
				stroke: '#ccc',
				strokeDashArray: ''
			});
			result.resize = true;
			result.resizeLimit.width = { min: 30, max: 300 };
		}
	}

	if (classType == objClass.BOUNDING_BOX) {
		construc.push({
			path:
				'M' +
				(-size / 2 - 10) +
				',' +
				(-thickness / 2 - 10) +
				' L' +
				(size / 2 + 10) +
				',' +
				(-thickness / 2 - 10) +
				' L' +
				(size / 2 + 10) +
				',' +
				(thickness / 2 + 10) +
				' L' +
				(-size / 2 - 10) +
				',' +
				(thickness / 2 + 10) +
				' Z',
			fill: 'none',
			stroke: '#aaa',
			strokeDashArray: ''
		});

		// construc.push({'path':"M"+dividerObj[0].x+","+dividerObj[0].y+" L"+dividerObj[1].x+","+dividerObj[1].y+" L"+dividerObj[2].x+","+dividerObj[2].y+" L"+dividerObj[3].x+","+dividerObj[3].y+" Z", 'fill':'none', 'stroke':"#000", 'strokeDashArray': ''});
	}

	if (classType == objClass.TEXT) {
		result.bindBox = true;
		result.move = true;
		result.rotate = true;
		construc.push({
			text: divider.text,
			x: '0',
			y: '0',
			fill: type,
			stroke: type,
			fontSize: divider.size + 'px',
			strokeWidth: '0px'
		});
	}

	if (classType == objClass.STAIR) {
		result.bindBox = true;
		result.move = true;
		result.resize = true;
		result.rotate = true;
		result.width = 60;
		result.height = 180;
		if (type == 'simpleStair') {
			construc.push({
				path:
					'M ' +
					-size / 2 +
					',' +
					-thickness / 2 +
					' L ' +
					-size / 2 +
					',' +
					thickness / 2 +
					' L ' +
					size / 2 +
					',' +
					thickness / 2 +
					' L ' +
					size / 2 +
					',' +
					-thickness / 2 +
					' Z',
				fill: '#fff',
				stroke: '#000',
				strokeDashArray: ''
			});

			const heightStep = thickness / divider;
			for (let i = 1; i < divider + 1; i++) {
				construc.push({
					path:
						'M ' +
						-size / 2 +
						',' +
						(-thickness / 2 + i * heightStep) +
						' L ' +
						size / 2 +
						',' +
						(-thickness / 2 + i * heightStep),
					fill: 'none',
					stroke: '#000',
					strokeDashArray: 'none'
				});
			}
			result.resizeLimit.width = { min: 40, max: 200 };
			result.resizeLimit.height = { min: 40, max: 400 };
		}
	}

	if (classType == objClass.ENERGY) {
		result.bindBox = true;
		result.move = true;
		result.resize = false;
		result.rotate = false;
		if (type == 'switch') {
			construc.push({
				path: circlePath(0, 0, 16),
				fill: '#fff',
				stroke: '#333',
				strokeDashArray: ''
			});
			construc.push({
				path: circlePath(-2, 4, 5),
				fill: 'none',
				stroke: '#333',
				strokeDashArray: ''
			});
			construc.push({
				path: 'm 0,0 5,-9',
				fill: 'none',
				stroke: '#333',
				strokeDashArray: ''
			});
			result.width = 36;
			result.height = 36;
			result.family = 'stick';
		}
		if (type == 'doubleSwitch') {
			construc.push({
				path: circlePath(0, 0, 16),
				fill: '#fff',
				stroke: '#333',
				strokeDashArray: ''
			});
			construc.push({
				path: circlePath(0, 0, 4),
				fill: 'none',
				stroke: '#333',
				strokeDashArray: ''
			});
			construc.push({
				path: 'm 2,-3 5,-8 3,2',
				fill: 'none',
				stroke: '#333',
				strokeDashArray: ''
			});
			construc.push({
				path: 'm -2,3 -5,8 -3,-2',
				fill: 'none',
				stroke: '#333',
				strokeDashArray: ''
			});
			result.width = 36;
			result.height = 36;
			result.family = 'stick';
		}
		if (type == 'dimmer') {
			construc.push({
				path: circlePath(0, 0, 16),
				fill: '#fff',
				stroke: '#333',
				strokeDashArray: ''
			});
			construc.push({
				path: circlePath(-2, 4, 5),
				fill: 'none',
				stroke: '#333',
				strokeDashArray: ''
			});
			construc.push({
				path: 'm 0,0 5,-9',
				fill: 'none',
				stroke: '#333',
				strokeDashArray: ''
			});
			construc.push({
				path: 'M -2,-6 L 10,-4 L-2,-2 Z',
				fill: 'none',
				stroke: '#333',
				strokeDashArray: ''
			});
			result.width = 36;
			result.height = 36;
			result.family = 'stick';
		}
		if (type == 'plug') {
			construc.push({
				path: circlePath(0, 0, 16),
				fill: '#fff',
				stroke: '#000',
				strokeDashArray: ''
			});
			construc.push({
				path: 'M 10,-6 a 10,10 0 0 1 -5,8 10,10 0 0 1 -10,0 10,10 0 0 1 -5,-8',
				fill: 'none',
				stroke: '#333',
				strokeDashArray: ''
			});
			construc.push({
				path: 'm 0,3 v 7',
				fill: 'none',
				stroke: '#333',
				strokeDashArray: ''
			});
			construc.push({
				path: 'm -10,4 h 20',
				fill: 'none',
				stroke: '#333',
				strokeDashArray: ''
			});
			result.width = 36;
			result.height = 36;
			result.family = 'stick';
		}
		if (type == 'roofLight') {
			construc.push({
				path: circlePath(0, 0, 16),
				fill: '#fff',
				stroke: '#000',
				strokeDashArray: ''
			});
			construc.push({
				path: 'M -8,-8 L 8,8 M -8,8 L 8,-8',
				fill: 'none',
				stroke: '#333',
				strokeDashArray: ''
			});
			result.width = 36;
			result.height = 36;
			result.family = 'free';
		}
		if (type == 'wallLight') {
			construc.push({
				path: circlePath(0, 0, 16),
				fill: '#fff',
				stroke: '#000',
				strokeDashArray: ''
			});
			construc.push({
				path: 'M -8,-8 L 8,8 M -8,8 L 8,-8',
				fill: 'none',
				stroke: '#333',
				strokeDashArray: ''
			});
			construc.push({
				path: 'M -10,10 L 10,10',
				fill: 'none',
				stroke: '#333',
				strokeDashArray: ''
			});
			result.width = 36;
			result.height = 36;
			result.family = 'stick';
		}
	}

	return result;
};

export const getWallNodes = (
	coords: Point2D,
	wallMeta: WallMetaData[],
	except: WallMetaData | null = null
) => {
	const nodes = [];
	for (const k in wallMeta) {
		const wall = wallMeta[k];
		if (except && wall.id === except.id) continue;

		if (wall.start.x === coords.x && wall.start.y === coords.y) {
			nodes.push({ wall: wall, type: 'start' });
		}
		if (wall.end.x === coords.x && wall.end.y === coords.y) {
			nodes.push({ wall: wall, type: 'end' });
		}
	}
	return nodes;
};

const clearParentsAndChildren = (wallMeta: WallMetaData[]) => {
	for (let i = 0; i < wallMeta.length; i++) {
		const wall = wallMeta[i];
		const parentId = wall.parent;
		if (parentId != null) {
			const parent = findById(parentId, wallMeta);
			if (
				!parent ||
				(!pointsAreEqual(parent.start, wall.start) && !pointsAreEqual(parent.end, wall.start))
			) {
				wall.parent = null;
			}
		}

		const childId = wall.child;
		if (childId) {
			const child = findById(childId ?? '', wallMeta);
			if (
				!child ||
				// (child.start !== wall.end && child.end !== wall.end)
				(!pointsAreEqual(child.start, wall.end) && !pointsAreEqual(child.end, wall.end))
			) {
				wall.child = null;
			}
		}
	}
};

export const calculateDPath = (
	wall: WallMetaData,
	angleWall: number,
	comparePointStart: Point2D,
	comparePointEnd: Point2D,
	fromParent: boolean,
	upEquation: WallEquation,
	downEquation: WallEquation,
	thickness: number,
	dWay: string
) => {
	const refRelative = fromParent ? wall.parent : wall.child;
	const refPoint = fromParent ? wall.start : wall.end;
	const perpEquation = perpendicularEquation(upEquation, refPoint.x, refPoint.y);
	if (refRelative == null) {
		const interUp = intersectionOfEquations(upEquation, perpEquation);
		const interDw = intersectionOfEquations(downEquation, perpEquation);

		let newPath = '';
		if (fromParent && interUp && interDw) {
			wall.coords = [interUp, interDw];
			newPath = 'M' + interUp.x + ',' + interUp.y + ' L' + interDw.x + ',' + interDw.y + ' ';
		} else {
			if (interDw && interUp) {
				wall.coords.push(interDw, interUp);
				newPath =
					dWay + 'L' + interDw.x + ',' + interDw.y + ' L' + interUp.x + ',' + interUp.y + ' Z';
			}
		}

		return newPath;
	}

	const comparisonAngle = Math.atan2(
		comparePointEnd.y - comparePointStart.y,
		comparePointEnd.x - comparePointStart.x
	);
	// console.log("2 - prevStart:", comparePointStart);
	const halfThick = thickness / 2;
	const compareThickX = halfThick * Math.sin(comparisonAngle);
	const compareThickY = halfThick * Math.cos(comparisonAngle);

	const comparisonUpEq = createEquation(
		comparePointStart.x + compareThickX,
		comparePointStart.y - compareThickY,
		comparePointEnd.x + compareThickX,
		comparePointEnd.y - compareThickY
	);
	const comparisonDownEq = createEquation(
		comparePointStart.x - compareThickX,
		comparePointStart.y + compareThickY,
		comparePointEnd.x - compareThickX,
		comparePointEnd.y + compareThickY
	);

	let interUp = null;
	let interDw = null;
	if (Math.abs(comparisonAngle - angleWall) > 0.09) {
		interUp = intersectionOfEquations(upEquation, comparisonUpEq);
		interDw = intersectionOfEquations(downEquation, comparisonDownEq);

		wall.angle = angleWall;
		const wallThickX = (wall.thick / 2) * Math.sin(angleWall);
		const wallThickY = (wall.thick / 2) * Math.cos(angleWall);

		if (upEquation.A == comparisonUpEq.A) {
			interUp = {
				x: refPoint.x + wallThickX,
				y: refPoint.y - wallThickY
			};
			interDw = {
				x: refPoint.x - wallThickX,
				y: refPoint.y + wallThickY
			};
		}

		if (interUp) {
			const miterPoint = fromParent ? comparePointEnd : comparePointStart;
			const miter = distanceBetween(interUp, {
				x: miterPoint.x,
				y: miterPoint.y
			});
			if (miter > 55) {
				const eqAUp = fromParent ? perpEquation : upEquation;
				const eqADown = fromParent ? perpEquation : downEquation;
				const eqBUp = fromParent ? upEquation : perpEquation;
				const eqBDown = fromParent ? downEquation : perpEquation;
				interUp = intersectionOfEquations(eqAUp, eqBUp);
				interDw = intersectionOfEquations(eqADown, eqBDown);
			}
		}
	} else {
		const eqAUp = fromParent ? perpEquation : upEquation;
		const eqADown = fromParent ? perpEquation : downEquation;
		const eqBUp = fromParent ? upEquation : perpEquation;
		const eqBDown = fromParent ? downEquation : perpEquation;
		interUp = intersectionOfEquations(eqAUp, eqBUp);
		interDw = intersectionOfEquations(eqADown, eqBDown);
	}

	if (fromParent && interUp && interDw) {
		wall.coords = [interUp, interDw];
		return 'M' + interUp.x + ',' + interUp.y + ' L' + interDw.x + ',' + interDw.y + ' ';
	} else {
		if (interUp && interDw) {
			wall.coords.push(interDw, interUp);
			return dWay + 'L' + interDw.x + ',' + interDw.y + ' L' + interUp.x + ',' + interUp.y + ' Z';
		}
	}
};

export const refreshWalls = (
	wallMetas: WallMetaData[],
	wallEquations: WallEquationGroup,
	moveAction = false
) => {
	clearParentsAndChildren(wallMetas);

	wallMetas.forEach((wall) => wall.update(wallMetas, wallEquations, moveAction));
};

export const setInWallMeasurementText = (
	wall: WallMetaData,
	objectMetas: ObjectMetaData[],
	option = false
) => {
	if (!option) $('#boxRib').empty();
	const upWalls: WallMeasurementData[] = [];
	const downWalls: WallMeasurementData[] = [];
	upWalls.push({
		side: 'up',
		coords: wall.coords[0],
		distance: 0
	});
	downWalls.push({
		side: 'down',
		coords: wall.coords[1],
		distance: 0
	});

	const addMeasureData = (
		p1: { x: number; y: number },
		p2: { x: number; y: number },
		objSide: 'up' | 'down'
	) => {
		const mesureArray = objSide === 'up' ? upWalls : downWalls;
		const distance = distanceBetween(p1, p2) / constants.METER_SIZE;
		mesureArray.push({
			side: objSide,
			coords: p2,
			distance: parseInt(distance.toFixed(2))
		});
	};

	const objectsOnWall = wall.getObjects(objectMetas);
	for (const ob in objectsOnWall) {
		const objTarget = objectsOnWall[ob];
		const upPoints = [
			nearPointOnEquation(wall.equations.up, objTarget.limit[0]),
			nearPointOnEquation(wall.equations.up, objTarget.limit[1])
		];
		const downPoints = [
			nearPointOnEquation(wall.equations.down, objTarget.limit[0]),
			nearPointOnEquation(wall.equations.down, objTarget.limit[1])
		];
		addMeasureData(wall.coords[0], upPoints[0], 'up');
		addMeasureData(wall.coords[0], upPoints[1], 'up');
		addMeasureData(wall.coords[1], downPoints[0], 'down');
		addMeasureData(wall.coords[1], downPoints[1], 'down');
	}

	addMeasureData(wall.coords[0], wall.coords[3], 'up');
	addMeasureData(wall.coords[1], wall.coords[2], 'down');

	upWalls.sort((a, b) => {
		return parseInt((a.distance - b.distance).toFixed(2));
	});
	downWalls.sort((a, b) => {
		return parseInt((a.distance - b.distance).toFixed(2));
	});

	addInWallMeasurementsToScene(upWalls, wall);
	addInWallMeasurementsToScene(downWalls, wall);
};

export const updateMeasurementText = (wallMeta: WallMetaData[], shift = 5) => {
	const { downWalls, upWalls } = buildWallMeasurementData(wallMeta);

	if (shift == 5) $('#boxRib').empty();

	upWalls.forEach((upWallArray) => {
		addWallMeasurementsToScene(upWallArray, wallMeta, shift);
	});
	downWalls.forEach((downWallArray) => {
		addWallMeasurementsToScene(downWallArray, wallMeta, shift);
	});
};

type WallMeasurementData = {
	wallIndex?: number;
	crossEdge?: number;
	side: string;
	coords: Point2D;
	distance: number;
};

const buildWallMeasurementData = (
	wallMeta: WallMetaData[]
): { upWalls: WallMeasurementData[][]; downWalls: WallMeasurementData[][] } => {
	const upWalls: WallMeasurementData[][] = [];
	const downWalls: WallMeasurementData[][] = [];
	for (const i in wallMeta) {
		const wall = wallMeta[i];
		if (!wall.equations.base) continue;

		const upDataArray: WallMeasurementData[] = [];
		upDataArray.push({
			wallIndex: +i,
			crossEdge: +i,
			side: 'up',
			coords: wall.coords[0],
			distance: 0
		});

		const downDataArray: WallMeasurementData[] = [];
		downDataArray.push({
			wallIndex: +i,
			crossEdge: +i,
			side: 'down',
			coords: wall.coords[1],
			distance: 0
		});
		for (const p in wallMeta) {
			if (i === p) continue;

			const comparisonWall = wallMeta[p];
			if (!comparisonWall.equations.base) continue;

			const cross = intersectionOfSideEquations(wall.equations.base, comparisonWall.equations.base);
			if (!cross || !wall.pointInsideWall(cross, true)) continue;

			let inter = intersectionOfSideEquations(wall.equations.up, comparisonWall.equations.up);
			if (
				inter &&
				wall.pointBetweenCoords(inter, 1, true) &&
				comparisonWall.pointBetweenCoords(inter, 1, true)
			) {
				const distance = distanceBetween(wall.coords[0], inter) / constants.METER_SIZE;
				upDataArray.push({
					wallIndex: +i,
					crossEdge: +p,
					side: 'up',
					coords: inter,
					distance: +distance.toFixed(2)
				});
			}

			inter = intersectionOfSideEquations(wall.equations.up, comparisonWall.equations.down);
			if (
				inter &&
				wall.pointBetweenCoords(inter, 1, true) &&
				comparisonWall.pointBetweenCoords(inter, 2, true)
			) {
				const distance = distanceBetween(wall.coords[0], inter) / constants.METER_SIZE;
				upDataArray.push({
					wallIndex: +i,
					crossEdge: +p,
					side: 'up',
					coords: inter,
					distance: +distance.toFixed(2)
				});
			}

			inter = intersectionOfSideEquations(wall.equations.down, comparisonWall.equations.up);
			if (
				inter &&
				wall.pointBetweenCoords(inter, 2, true) &&
				comparisonWall.pointBetweenCoords(inter, 1, true)
			) {
				const distance = distanceBetween(wall.coords[1], inter) / constants.METER_SIZE;
				downDataArray.push({
					wallIndex: +i,
					crossEdge: +p,
					side: 'down',
					coords: inter,
					distance: +distance.toFixed(2)
				});
			}

			inter = intersectionOfSideEquations(wall.equations.down, comparisonWall.equations.down);
			if (
				inter &&
				wall.pointBetweenCoords(inter, 2, true) &&
				comparisonWall.pointBetweenCoords(inter, 2, true)
			) {
				const distance = distanceBetween(wall.coords[1], inter) / constants.METER_SIZE;
				downDataArray.push({
					wallIndex: +i,
					crossEdge: +p,
					side: 'down',
					coords: inter,
					distance: +distance.toFixed(2)
				});
			}
		}
		const distance = distanceBetween(wall.coords[0], wall.coords[3]) / constants.METER_SIZE;
		upDataArray.push({
			wallIndex: +i,
			crossEdge: +i,
			side: 'up',
			coords: wall.coords[3],
			distance: +distance.toFixed(2)
		});
		const distance2 = distanceBetween(wall.coords[1], wall.coords[2]) / constants.METER_SIZE;
		downDataArray.push({
			wallIndex: +i,
			crossEdge: +i,
			side: 'down',
			coords: wall.coords[2],
			distance: +distance2.toFixed(2)
		});

		upWalls.push(upDataArray);
		downWalls.push(downDataArray);
	}

	// Sort by distance
	for (const a in upWalls) {
		upWalls[a].sort(function (a, b) {
			return +(a.distance - b.distance).toFixed(2);
		});
	}
	for (const a in downWalls) {
		downWalls[a].sort(function (a, b) {
			return +(a.distance - b.distance).toFixed(2);
		});
	}

	return { upWalls, downWalls };
};

const addWallMeasurementsToScene = (
	measureData: WallMeasurementData[],
	wallMeta: WallMetaData[],
	shift: number
) => {
	for (let n = 1; n < measureData.length; n++) {
		const current = measureData[n];
		const previous = measureData[n - 1];
		const edge = current.wallIndex ?? 0;
		const crossEdge = current.crossEdge ?? 0;
		const prevCrossEdge = previous.crossEdge ?? 0;
		if (previous.wallIndex == edge) {
			const valueText = Math.abs(previous.distance - current.distance);

			if (valueText < 0.15) continue;

			if (prevCrossEdge == crossEdge && crossEdge != edge) continue;

			if (measureData.length > 2) {
				const polygon = [];
				if (n == 1) {
					for (let pp = 0; pp < 4; pp++) {
						polygon.push({
							x: wallMeta[crossEdge].coords[pp].x,
							y: wallMeta[crossEdge].coords[pp].y
						});
					}
					if (pointInPolygon(measureData[0].coords, polygon)) {
						continue;
					}
				} else if (n == measureData.length - 1) {
					for (let pp = 0; pp < 4; pp++) {
						polygon.push({
							x: wallMeta[prevCrossEdge].coords[pp].x,
							y: wallMeta[prevCrossEdge].coords[pp].y
						});
					}
					if (pointInPolygon(measureData[measureData.length - 1].coords, polygon)) {
						continue;
					}
				}
			}

			let angle = wallMeta[edge].angle * (180 / Math.PI);
			let shiftValue = -shift;
			if (previous.side == 'down') {
				shiftValue = -shiftValue + 10;
			}
			if (angle > 90 || angle < -89) {
				angle -= 180;
				shiftValue = -shift;
				if (previous.side !== 'down') {
					shiftValue = -shiftValue + 10;
				}
			}

			addSizeTextToScene(current, previous, valueText, angle, shiftValue);
		}
	}
};

const addInWallMeasurementsToScene = (measureData: WallMeasurementData[], wall: WallMetaData) => {
	for (let i = 1; i < measureData.length; i++) {
		let angleTextValue = wall.angle * (180 / Math.PI);
		const current = measureData[i];
		const previous = measureData[i - 1];
		const valueText = Math.abs(previous.distance - current.distance);

		let shift = -5;
		if (previous.side === 'down') {
			shift = -shift + 10;
		}
		if (angleTextValue > 89 || angleTextValue < -89) {
			angleTextValue -= 180;
			if (previous.side === 'down') {
				shift = -5;
			} else {
				shift = -shift + 10;
			}
		}

		addSizeTextToScene(current, previous, valueText, angleTextValue, shift, true);
	}
};

const addSizeTextToScene = (
	current: WallMeasurementData,
	previous: WallMeasurementData,
	valueText: number,
	angleText: number,
	shiftValue: number,
	inWall = false
) => {
	const sizeTextSvg = document.createElementNS('http://www.w3.org/2000/svg', 'text');
	const startText = getMidPoint(previous.coords, current.coords);
	sizeTextSvg.setAttributeNS(null, 'x', startText.x.toString());
	sizeTextSvg.setAttributeNS(null, 'y', (startText.y + shiftValue).toString());
	sizeTextSvg.setAttributeNS(null, 'text-anchor', 'middle');
	sizeTextSvg.setAttributeNS(null, 'font-family', 'roboto');
	sizeTextSvg.setAttributeNS(null, 'stroke', '#ffffff');
	sizeTextSvg.textContent = valueText.toFixed(2);
	if (+sizeTextSvg.textContent < 1) {
		sizeTextSvg.setAttributeNS(null, 'font-size', inWall ? '0.8em' : '0.73em');
		sizeTextSvg.textContent = sizeTextSvg.textContent.substring(1, sizeTextSvg.textContent.length);
	} else {
		sizeTextSvg.setAttributeNS(null, 'font-size', inWall ? '1em' : '0.9em');
	}
	sizeTextSvg.setAttributeNS(null, 'stroke-width', inWall ? '0.27px' : '0.2px');
	sizeTextSvg.setAttributeNS(null, 'fill', inWall ? '#666666' : '#555555');
	sizeTextSvg.setAttribute('transform', `rotate(${angleText} ${startText.x},${startText.y})`);

	$('#boxRib').append(sizeTextSvg);
};

export const createEquation = (x0: number, y0: number, x1: number, y1: number): WallEquation => {
	if (x1 - x0 == 0) {
		return {
			A: 'v',
			B: x0
		};
	} else if (y1 - y0 == 0) {
		return {
			A: 'h',
			B: y0
		};
	} else {
		return {
			A: (y1 - y0) / (x1 - x0),
			B: y1 - x1 * ((y1 - y0) / (x1 - x0))
		};
	}
};

export const angleBetweenPoints = (
	x1: number,
	y1: number,
	x2: number,
	y2: number
): { rad: number; deg: number } => {
	const rad = x1 - x2 == 0 ? Math.PI / 2 : Math.atan((y1 - y2) / (x1 - x2));
	const deg = (rad * 180) / Math.PI;
	return { rad, deg };
};

export const angleBetweenEquations = (m1: number | 'v' | 'h', m2: number | 'v' | 'h') => {
	if (m1 == 'h') m1 = 0;
	if (m2 == 'h') m2 = 0;
	if (m1 == 'v') m1 = 10000;
	if (m2 == 'v') m2 = 10000;
	const angleRad = Math.atan(Math.abs((m2 - m1) / (1 + m1 * m2)));
	return (360 * angleRad) / (2 * Math.PI);
};

export const angleBetweenThreePoints = (
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	x3: number,
	y3: number
): { rad: number; deg: number } => {
	const a = Math.sqrt(Math.pow(Math.abs(x2 - x1), 2) + Math.pow(Math.abs(y2 - y1), 2));
	const b = Math.sqrt(Math.pow(Math.abs(x2 - x3), 2) + Math.pow(Math.abs(y2 - y3), 2));
	const c = Math.sqrt(Math.pow(Math.abs(x3 - x1), 2) + Math.pow(Math.abs(y3 - y1), 2));
	const rad =
		a == 0 || b == 0
			? Math.PI / 2
			: Math.acos((Math.pow(a, 2) + Math.pow(b, 2) - Math.pow(c, 2)) / (2 * a * b));
	const deg = (360 * rad) / (2 * Math.PI);
	return { rad, deg };
};

export const getAngle = (
	p1: Point2D,
	p2: Point2D,
	format: 'deg' | 'rad' | 'both' = 'both'
): { deg: number; rad: number } => {
	const dy = p2.y - p1.y;
	const dx = p2.x - p1.x;

	const result = { deg: 0, rad: 0 };
	result.rad = Math.atan2(dy, dx);
	if (format === 'deg' || format == 'both') {
		result.deg = (result.rad * 180) / Math.PI;
	}

	return result;
};

const calculateArea = (coords: Point2D[]) => {
	if (coords.length < 2) return false;
	let realArea = 0;
	let j = coords.length - 1;
	for (let i = 0; i < coords.length; i++) {
		realArea = realArea + (coords[j].x + coords[i].x) * (coords[j].y - coords[i].y);
		j = i;
	}
	realArea = realArea / 2;
	return Math.abs(+realArea.toFixed(2));
};

const calculateRoomArea = (vertex: WallVertex[], coords: number[]) => {
	let realArea = 0;
	let j = coords.length - 2;
	for (let i = 0; i < coords.length - 1; i++) {
		realArea =
			realArea +
			(vertex[coords[j]].x + vertex[coords[i]].x) * (vertex[coords[j]].y - vertex[coords[i]].y);
		j = i;
	}
	realArea = realArea / 2;
	return Math.abs(+realArea.toFixed(2));
};

// Point in polygon algorithm
export const pointInPolygon = (point: Point2D, polygon: Point2D[]) => {
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i].x,
			yi = polygon[i].y;
		const xj = polygon[j].x,
			yj = polygon[j].y;
		const intersect =
			yi > point.y != yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
		if (intersect) {
			inside = !inside;
		}
	}
	return inside;
};

export const createWallGuideLine = (
	snap: Point2D,
	wallMeta: WallMetaData[],
	range = Infinity,
	except: WallMetaData[] = []
) => {
	// ORANGE LINES 90° NEAR SEGMENT
	const equation: any = {};
	let p1: Point2D = { x: 0, y: 0 };
	let p2: Point2D = { x: 0, y: 0 };
	let p3: Point2D = { x: 0, y: 0 };
	let node = 0;
	let distance = range;
	let way = 1;

	for (let index = 0; index < wallMeta.length; index++) {
		if (except.indexOf(wallMeta[index]) != -1) continue;

		const x1 = wallMeta[index].start.x;
		const y1 = wallMeta[index].start.y;
		const x2 = wallMeta[index].end.x;
		const y2 = wallMeta[index].end.y;

		// EQUATION 90° of segment nf/nf-1 at X2/Y2 Point
		if (Math.abs(y2 - y1) == 0) {
			equation.C = 'v'; // C/D equation 90° Coef = -1/E
			equation.D = x1;
			equation.E = 'h'; // E/F equation Segment
			equation.F = y1;
			equation.G = 'v'; // G/H equation 90° Coef = -1/E
			equation.H = x2;
			equation.I = 'h'; // I/J equation Segment
			equation.J = y2;
		} else if (Math.abs(x2 - x1) == 0) {
			equation.C = 'h'; // C/D equation 90° Coef = -1/E
			equation.D = y1;
			equation.E = 'v'; // E/F equation Segment
			equation.F = x1;
			equation.G = 'h'; // G/H equation 90° Coef = -1/E
			equation.H = y2;
			equation.I = 'v'; // I/J equation Segment
			equation.J = x2;
		} else {
			equation.C = (x1 - x2) / (y2 - y1);
			equation.D = y1 - x1 * equation.C;
			equation.E = (y2 - y1) / (x2 - x1);
			equation.F = y1 - x1 * equation.E;
			equation.G = (x1 - x2) / (y2 - y1);
			equation.H = y2 - x2 * equation.C;
			equation.I = (y2 - y1) / (x2 - x1);
			equation.J = y2 - x2 * equation.E;
		}
		equation.A = equation.C;
		equation.B = equation.D;
		let eq = nearPointOnEquation(equation, snap);
		if (eq.distance < distance) {
			distance = eq.distance;
			p1 = { x: x1, y: y1 };
			p2 = { x: x2, y: y2 };
			p3 = { x: eq.x, y: eq.y };
			node = index;
		}
		equation.A = equation.E;
		equation.B = equation.F;
		eq = nearPointOnEquation(equation, snap);
		if (eq.distance < distance) {
			distance = eq.distance;
			p1 = { x: x1, y: y1 };
			p2 = { x: x2, y: y2 };
			p3 = { x: eq.x, y: eq.y };
			node = index;
		}
		equation.A = equation.G;
		equation.B = equation.H;
		eq = nearPointOnEquation(equation, snap);
		if (eq.distance < distance) {
			distance = eq.distance;
			p1 = { x: x1, y: y1 };
			p2 = { x: x2, y: y2 };
			p3 = { x: eq.x, y: eq.y };
			way = 2;
			node = index;
		}
		equation.A = equation.I;
		equation.B = equation.J;
		eq = nearPointOnEquation(equation, snap);
		if (eq.distance < distance) {
			distance = eq.distance;
			p1 = { x: x1, y: y1 };
			p2 = { x: x2, y: y2 };
			p3 = { x: eq.x, y: eq.y };
			way = 2;
			node = index;
		}
	} // END LOOP FOR

	if (distance >= range) {
		return null;
	}
	const helperData: SvgPathMetaData = {
		p1: way == 2 ? p1 : p2,
		p2: way == 2 ? p2 : p1,
		p3: p3,
		stroke: '#d7ac57'
	};

	return {
		x: p3.x,
		y: p3.y,
		wall: wallMeta[node],
		distance: distance,
		svgData: helperData
	};
};

export const nearPointOnEquation = (equation: WallEquation, point: Point2D) => {
	// Y = Ax + B ---- equation {A:val, B:val}
	if (equation.A === 'h') {
		return {
			x: point.x,
			y: equation.B,
			distance: Math.abs(equation.B - point.y)
		};
	} else if (equation.A === 'v') {
		return {
			x: equation.B,
			y: point.y,
			distance: Math.abs(equation.B - point.x)
		};
	} else {
		const p1 = { x: point.x, y: equation.A * point.x + equation.B };
		const p2 = { x: (point.y - equation.B) / equation.A, y: point.y };
		return pDistance(point, p1, p2);
	}
};

export const create = (id: string, shape: string, attrs: string[]) => {
	const svg = $(document.createElementNS('http://www.w3.org/2000/svg', shape));
	for (const k in attrs) {
		svg.attr(k, attrs[k]);
	}
	if (id != 'none') {
		$('#' + id).append(svg);
	}
	return svg;
};

export const vertexList = (junction: WallJunction[]) => {
	const verticies: WallVertex[] = [];
	// var vertextest = [];
	for (let jj = 0; jj < junction.length; jj++) {
		let found = true;
		for (let vv = 0; vv < verticies.length; vv++) {
			if (
				Math.round(junction[jj].values[0]) == Math.round(verticies[vv].x) &&
				Math.round(junction[jj].values[1]) == Math.round(verticies[vv].y)
			) {
				found = false;
				verticies[vv].segment.push(junction[jj].segment);
				break;
			} else {
				found = true;
			}
		}
		if (found) {
			verticies.push({
				x: Math.round(junction[jj].values[0]),
				y: Math.round(junction[jj].values[1]),
				segment: [junction[jj].segment],
				bypass: 0,
				type: junction[jj].type
			});
		}
	}

	let toClean = [];
	for (let ss = 0; ss < verticies.length; ss++) {
		const vert = verticies[ss];
		const vertChildren: { id: number; angle: number }[] = [];
		const vertRemoved: number[] = [];
		vert.child = vertChildren;
		vert.removed = vertRemoved;
		for (let sg = 0; sg < vert.segment.length; sg++) {
			const vertSegment = vert.segment[sg];
			for (let sc = 0; sc < verticies.length; sc++) {
				if (sc === ss) continue;
				const vertCompare = verticies[sc];
				for (let scg = 0; scg < vertCompare.segment.length; scg++) {
					if (vertCompare.segment[scg] == vertSegment) {
						vertChildren.push({
							id: sc,
							angle: Math.floor(getAngle(vert, vertCompare, 'deg').deg)
						});
					}
				}
			}
		}
		toClean = [];
		for (let fr = 0; fr < vertChildren.length - 1; fr++) {
			for (let ft = fr + 1; ft < vertChildren.length; ft++) {
				if (fr != ft && typeof vertChildren[fr] != 'undefined') {
					const angleFt = vertChildren[ft].angle;
					const angleFr = vertChildren[fr].angle;
					if (valueIsBetween(angleFt, angleFr + 3, angleFr - 3)) {
						const dist1 = distanceBetween(vert, verticies[vertChildren[ft].id]);
						const dist2 = distanceBetween(vert, verticies[vertChildren[fr].id]);
						toClean.push(dist1 > dist2 ? ft : fr);
					}
				}
			}
		}
		toClean.sort(function (a, b) {
			return b - a;
		});
		toClean.push(-1);
		for (let cc = 0; cc < toClean.length - 1; cc++) {
			if (toClean[cc] > toClean[cc + 1]) {
				vert.removed.push(vertChildren[toClean[cc]].id);
				vertChildren.splice(toClean[cc], 1);
			}
		}
	}
	// vertexTest = vertex;
	return verticies;
};

export const polygonize = (walls: WallMetaData[]) => {
	let junction: WallJunction[] = [];
	walls.forEach((wall, idx) => {
		const wallJunctions = wall
			.getJunctions(walls)
			.map((junction) => ({ ...junction, segment: idx }));
		junction = junction.concat(wallJunctions);
	});

	const vertex = vertexList(junction);

	const edgesChild = [];
	for (let j = 0; j < vertex.length; j++) {
		const vert = vertex[j];
		const numChild = vert.child?.length ?? 0;
		for (let vv = 0; vv < numChild; vv++) {
			const child = vert.child;
			if (child) {
				edgesChild.push([j, child[vv].id]);
			}
		}
	}
	const polygons: Polygon[] = [];
	for (let jc = 0; jc < edgesChild.length; jc++) {
		let bestVertexIndex = 0;
		let bestVertexValue = Infinity;
		for (let j = 0; j < vertex.length; j++) {
			const vert = vertex[j];
			const vertChild = vert.child ?? [];
			if (vert.x < bestVertexValue && vertChild.length > 1 && vert.bypass == 0) {
				bestVertexValue = vert.x;
				bestVertexIndex = j;
			}
			if (vert.x == bestVertexValue && vertChild.length > 1 && vert.bypass == 0) {
				if (vert.y > vertex[bestVertexIndex].y) {
					bestVertexValue = vert.x;
					bestVertexIndex = j;
				}
			}
		}

		const bestVertex = vertex[bestVertexIndex];

		const waypoints: string[] = segmentTree(bestVertexIndex, vertex);
		if (waypoints.length == 0) {
			bestVertex.bypass = 1;
		}
		if (waypoints.length > 0) {
			const tempSurface = waypoints[0].split('-').map((a) => parseInt(a));
			const lengthRoom = calculateRoomArea(vertex, tempSurface);
			const bestArea = lengthRoom;
			for (let sss = 0; sss < polygons.length; sss++) {
				if (arraysAreEqual(polygons[sss].way, tempSurface)) {
					bestVertex.bypass = 1;
					break;
				}
			}

			if (bestArea < 360) {
				bestVertex.bypass = 1;
			}
			if (bestVertex.bypass == 0) {
				// <-------- TO REVISE IMPORTANT !!!!!!!! bestArea Control ???
				const realCoords = polygonIntoWalls(vertex, tempSurface, walls);
				const realArea = calculateArea(realCoords.inside);
				const outsideArea = calculateArea(realCoords.outside);
				const coords = [];
				for (let rr = 0; rr < tempSurface.length; rr++) {
					coords.push({
						x: vertex[tempSurface[rr]].x,
						y: vertex[tempSurface[rr]].y
					});
				}
				// WARNING -> FAKE
				if (realCoords.inside.length != realCoords.outside.length) {
					polygons.push({
						way: tempSurface,
						coords: coords,
						coordsOutside: realCoords.outside ?? [],
						coordsInside: realCoords.inside,
						area: realArea as number,
						outsideArea: outsideArea as number,
						realArea: bestArea
					});
				} else {
					// REAL INSIDE POLYGONE -> ROOM
					polygons.push({
						way: tempSurface,
						coords: realCoords.inside,
						coordsOutside: realCoords.outside ?? [],
						area: realArea as number,
						outsideArea: outsideArea as number,
						realArea: bestArea
					});
				}

				// REMOVE FIRST POINT OF WAY ON CHILDS FIRST VERTEX
				const bestVertexChild = bestVertex.child ?? [];
				for (let aa = 0; aa < bestVertexChild.length; aa++) {
					if (bestVertexChild[aa].id == tempSurface[1]) {
						bestVertexChild.splice(aa, 1);
					}
				}

				// REMOVE FIRST VERTEX OF WAY ON CHILDS SECOND VERTEX
				const tempSurfaceVertChild = vertex[tempSurface[1]].child ?? [];
				for (let aa = 0; aa < tempSurfaceVertChild.length; aa++) {
					if (tempSurfaceVertChild[aa].id == bestVertexIndex) {
						tempSurfaceVertChild.splice(aa, 1);
					}
				}
				//REMOVE FILAMENTS ?????

				let found: boolean;
				do {
					found = false;
					for (let aa = 0; aa < vertex.length; aa++) {
						const vertChild = vertex[aa].child ?? [];
						if (vertChild.length == 1) {
							found = true;
							vertex[aa].child = [];
							for (let ab = 0; ab < vertex.length; ab++) {
								// OR MAKE ONLY ON THE WAY tempSurface ?? BETTER ??

								const vertChild2 = vertex[aa].child ?? [];
								for (let ac = 0; ac < vertChild2.length; ac++) {
									if (vertChild2[ac].id == aa) {
										vertChild2.splice(ac, 1);
									}
								}
							}
						}
					}
				} while (found);
			}
		}
	}
	//SUB AREA(s) ON POLYGON CONTAINS OTHERS FREE POLYGONS (polygon without commonSideEdge)
	for (let pp = 0; pp < polygons.length; pp++) {
		const inside = [];
		for (let free = 0; free < polygons.length; free++) {
			if (pp != free) {
				const polygonFree = polygons[free].coords;
				const countCoords = polygonFree.length;
				let found = true;
				for (let pf = 0; pf < countCoords; pf++) {
					found = pointInPolygon(
						{ x: polygonFree[pf]?.x, y: polygonFree[pf]?.y },
						polygons[pp].coords.map((c) => ({ x: c?.x, y: c?.y }))
					);
					if (!found) {
						break;
					}
				}
				if (found) {
					inside.push(free);
					polygons[pp].area =
						(polygons[pp].area as number) - (polygons[free].outsideArea as number);
				}
			}
		}
		polygons[pp].inside = inside;
	}
	return { polygons: polygons, vertex: vertex };
};

const segmentTree = (VERTEX_NUMBER: number, vertex: WallVertex[]) => {
	const treeList: string[] = [VERTEX_NUMBER.toString()];
	const waypoints: string[] = [];
	const vertexCount = vertex.length;
	const origin = VERTEX_NUMBER;
	tree(treeList, origin, vertexCount);
	return waypoints;

	function tree(treeList: string[], origin: number, vertexCount: number) {
		if (treeList.length == 0) return;
		const treeTemp = [];
		vertexCount--;
		for (let k = 0; k < treeList.length; k++) {
			let found = true;
			const wro = treeList[k];
			const wroList = wro
				.toString()
				.split('-')
				.map((s) => +s);
			const wr = wroList[wroList.length - 1];
			const vertexChild = vertex[wr].child;
			if (!vertexChild) continue;

			for (let v = 0; v < vertexChild.length; v++) {
				if (vertexChild[v].id == origin && vertexCount < vertex.length - 1 && wroList.length > 2) {
					waypoints.push(wro + '-' + origin);
					found = false;
					break;
				}
			}

			if (found) {
				let nextVertex = -1;
				let nextDeterValue = Infinity;
				let nextDeterVal = 0;
				let nextFlag = 0;
				if (vertexChild.length == 1) {
					if (wr == origin && vertexCount == vertex.length - 1) {
						treeTemp.push(wro + '-' + vertexChild[0].id);
					}
					if (wr != origin && vertexCount < vertex.length - 1) {
						treeTemp.push(wro + '-' + vertexChild[0].id);
					}
				} else {
					for (let v = 0; v < vertexChild.length && vertexChild.length > 0; v++) {
						if (wr == origin && vertexCount == vertex.length - 1) {
							// TO INIT FUNCTION -> // CLOCKWISE Research
							const vDet = vectorVertex({ x: 0, y: -1 }, vertex[wr], vertex[vertexChild[v].id]);
							if (vDet >= nextDeterVal) {
								nextFlag = 1;
								nextDeterVal = vDet;
								nextVertex = vertexChild[v].id;
							}
							if (Math.sign(vDet) == -1 && nextFlag == 0) {
								if (vDet < nextDeterValue && Math.sign(nextDeterValue) > -1) {
									nextDeterValue = vDet;
									nextVertex = vertexChild[v].id;
								}
								if (vDet > nextDeterValue && Math.sign(nextDeterValue) == -1) {
									nextDeterValue = vDet;
									nextVertex = vertexChild[v].id;
								}
							}
						}
						if (
							wr != origin &&
							wroList[wroList.length - 2] != vertexChild[v].id &&
							vertexCount < vertex.length - 1
						) {
							// COUNTERCLOCKWISE Research
							const vDet = vectorVertex(
								vertex[wroList[wroList.length - 2]],
								vertex[wr],
								vertex[vertexChild[v].id]
							);
							if (vDet < nextDeterValue && nextFlag == 0) {
								nextDeterValue = vDet;
								nextVertex = vertexChild[v].id;
							}
							if (Math.sign(vDet) == -1) {
								nextFlag = 1;
								if (vDet <= nextDeterValue) {
									nextDeterValue = vDet;
									nextVertex = vertexChild[v].id;
								}
							}
						}
					}
					if (nextVertex != -1) treeTemp.push(wro + '-' + nextVertex);
				}
			}
		}
		if (vertexCount > 0) tree(treeTemp, origin, vertexCount);
	}
};

export const polygonIntoWalls = (
	vertex: WallVertex[],
	surface: number[],
	walls: WallMetaData[]
) => {
	const vertexArray = surface;
	const wall: {
		x1: number;
		y1: number;
		x2: number;
		y2: number;
		segment: number;
	}[] = [];
	const polygon: Point2D[] = vertexArray.map((v) => ({
		x: vertex[v].x,
		y: vertex[v].y
	}));
	// FIND EDGE (WALLS HERE) OF THESE TWO VERTEX
	for (let i = 0; i < vertexArray.length - 1; i++) {
		const current = vertex[vertexArray[i]];
		const next = vertex[vertexArray[i + 1]];
		next.segment.forEach((nextSegment) => {
			current.segment.forEach((currentSegment) => {
				if (nextSegment !== currentSegment) return;
				wall.push({
					x1: current.x,
					y1: current.y,
					x2: next.x,
					y2: next.y,
					segment: nextSegment
				});
			});
		});
		// for (var segStart = 0; segStart < next.segment.length; segStart++) {
		// 	for (var segEnd = 0; segEnd < current.segment.length; segEnd++) {
		// 		if (next.segment[segStart] == current.segment[segEnd]) {
		// 			wall.push({
		// 				x1: current.x,
		// 				y1: current.y,
		// 				x2: next.x,
		// 				y2: next.y,
		// 				segment: next.segment[segStart],
		// 			});
		// 		}
		// 	}
		// }
	}
	// CALC INTERSECS OF EQ PATHS OF THESE TWO WALLS.
	const inside: Point2D[] = [];
	const outside: Point2D[] = [];
	for (let i = 0; i < wall.length; i++) {
		const inter = [];
		const edge = wall[i];
		let nextEdge: { x1: number; x2: number; y1: number; y2: number; segment: number };
		if (i < wall.length - 1) nextEdge = wall[i + 1];
		else nextEdge = wall[0];
		let angleEdge = Math.atan2(edge.y2 - edge.y1, edge.x2 - edge.x1);
		let angleNextEdge = Math.atan2(nextEdge.y2 - nextEdge.y1, nextEdge.x2 - nextEdge.x1);
		const edgeThicknessX = (walls[edge.segment].thick / 2) * Math.sin(angleEdge);
		const edgeThicknessY = (walls[edge.segment].thick / 2) * Math.cos(angleEdge);
		const nextEdgeThicknessX = (walls[nextEdge.segment].thick / 2) * Math.sin(angleNextEdge);
		const nextEdgeThicknessY = (walls[nextEdge.segment].thick / 2) * Math.cos(angleNextEdge);
		const eqEdgeUp = createEquation(
			edge.x1 + edgeThicknessX,
			edge.y1 - edgeThicknessY,
			edge.x2 + edgeThicknessX,
			edge.y2 - edgeThicknessY
		);
		const eqEdgeDw = createEquation(
			edge.x1 - edgeThicknessX,
			edge.y1 + edgeThicknessY,
			edge.x2 - edgeThicknessX,
			edge.y2 + edgeThicknessY
		);
		const eqNextEdgeUp = createEquation(
			nextEdge.x1 + nextEdgeThicknessX,
			nextEdge.y1 - nextEdgeThicknessY,
			nextEdge.x2 + nextEdgeThicknessX,
			nextEdge.y2 - nextEdgeThicknessY
		);
		const eqNextEdgeDw = createEquation(
			nextEdge.x1 - nextEdgeThicknessX,
			nextEdge.y1 + nextEdgeThicknessY,
			nextEdge.x2 - nextEdgeThicknessX,
			nextEdge.y2 + nextEdgeThicknessY
		);

		angleEdge = angleEdge * (180 / Math.PI);
		angleNextEdge = angleNextEdge * (180 / Math.PI);

		if (eqEdgeUp.A != eqNextEdgeUp.A) {
			inter.push(intersectionOfEquations(eqEdgeUp, eqNextEdgeUp));
			inter.push(intersectionOfEquations(eqEdgeDw, eqNextEdgeDw));
		} else {
			inter.push({
				x: edge.x2 + edgeThicknessX,
				y: edge.y2 - edgeThicknessY
			});
			inter.push({
				x: edge.x2 - edgeThicknessX,
				y: edge.y2 + edgeThicknessY
			});
		}

		inter.forEach((interPoint) => {
			if (interPoint == null) return;
			if (pointInPolygon(interPoint, polygon)) {
				inside.push(interPoint);
			} else {
				outside.push(interPoint);
			}
		});
	}
	inside.push(inside[0]);
	outside.push(outside[0]);
	return { inside: inside, outside: outside };
};

/**
 * Attemps to find the nearest wall to the fromPoint provided
 * within the given range.If snapToVertice is true, the point
 * returned will snap to the nearest wall vertice if within
 * the provided range.
 *
 * @param fromPoint
 * @param wallMeta
 * @param range
 * @param snapToVertice
 * @returns
 */
export const findNearestWallInRange = (
	fromPoint: Point2D,
	wallMeta: WallMetaData[],
	range: number,
	snapToVertice = true
): { x: number; y: number; distance: number; wall: WallMetaData } | null => {
	let wallDistance = Infinity;
	let wallPointSelected: {
		x: number;
		y: number;
		distance: number;
		wall: WallMetaData;
	} | null = null;
	let result;
	if (wallMeta.length == 0) return null;
	wallMeta.forEach((wall) => {
		const eq = createEquation(wall.start.x, wall.start.y, wall.end.x, wall.end.y);
		result = nearPointOnEquation(eq, fromPoint);
		if (result.distance < wallDistance && wall.pointInsideWall(result, false)) {
			wallDistance = result.distance;
			wallPointSelected = {
				wall: wall,
				x: result.x,
				y: result.y,
				distance: result.distance
			};
		}
	});
	if (snapToVertice) {
		const vertexData = nearVertice(fromPoint, wallMeta, range);
		if (vertexData && vertexData.distance < range) {
			wallDistance = vertexData.distance;
			wallPointSelected = {
				wall: vertexData.wall,
				x: vertexData.x,
				y: vertexData.y,
				distance: vertexData.distance
			};
		}
	}

	return wallDistance <= range ? wallPointSelected : null;
};

type VertexData = {
	x: number;
	y: number;
	distance: number;
	wall: WallMetaData;
};

export const nearVertice = (
	snap: Point2D,
	wallMeta: WallMetaData[],
	range = 10000
): VertexData | null => {
	let bestDistance = Infinity;
	let bestVertice: VertexData | null = null;
	wallMeta.forEach((wall) => {
		const start = wall.start;
		const end = wall.end;
		const distance1 = distanceBetween(snap, {
			x: start.x,
			y: start.y
		});
		const distance2 = distanceBetween(snap, {
			x: end.x,
			y: end.y
		});
		if (distance1 < distance2 && distance1 < range) {
			bestDistance = distance1;
			bestVertice = {
				wall,
				x: start.x,
				y: start.y,
				distance: bestDistance
			};
		} else if (distance2 < distance1 && distance2 < range) {
			bestDistance = distance2;
			bestVertice = {
				wall,
				x: end.x,
				y: end.y,
				distance: bestDistance
			};
		}
	});
	return bestDistance < range ? bestVertice : null;
};

export const applyPolygonDataToRooms = (
	roomPolygonData: RoomPolygonData,
	roomMeta: RoomMetaData[],
	setRoomMeta: (r: RoomMetaData[]) => void
) => {
	if (roomPolygonData.polygons.length == 0) {
		roomMeta = [];
	}
	roomPolygonData.polygons.forEach((roomPoly) => {
		let foundRoom = false;
		roomMeta.forEach((room) => {
			let countCoords = roomPoly.coords.length;
			const diffCoords = getNumObjectArrayDifferences(roomPoly.coords, room.coords);
			const differences = getArrayDifferences(roomPoly.way, room.way);
			if (roomPoly.way.length == room.way.length) {
				if (differences.length == 0 || diffCoords == 0) {
					countCoords = 0;
				}
			} else if (roomPoly.way.length == room.way.length + 1) {
				if (differences.length == 1 || diffCoords == 2) {
					countCoords = 0;
				}
			} else if (roomPoly.way.length == room.way.length - 1) {
				if (differences.length == 1) {
					countCoords = 0;
				}
			}

			if (countCoords == 0) {
				foundRoom = true;
				roomMeta = [
					...roomMeta.filter((r) => r !== room),
					{
						...room,
						area: roomPoly.area,
						inside: roomPoly.inside ?? [],
						coords: roomPoly.coords,
						coordsOutside: roomPoly.coordsOutside,
						way: roomPoly.way,
						coordsInside: roomPoly.coordsInside ?? []
					}
				];
				return;
			}
		});

		if (!foundRoom) {
			roomMeta = [
				...roomMeta,
				{
					coords: roomPoly.coords,
					coordsOutside: roomPoly.coordsOutside,
					coordsInside: roomPoly.coordsInside ?? [],
					inside: roomPoly.inside ?? [],
					way: roomPoly.way,
					area: roomPoly.area,
					surface: '',
					name: '',
					color: 'gradientWhite',
					showSurface: true,
					action: 'add'
				}
			];
		}
	});

	const toSplice: number[] = [];
	roomMeta.forEach((room, idx) => {
		let found = true;
		roomPolygonData.polygons.forEach((roomPoly) => {
			let countRoom = room.coords.length;
			const numDifferentCoords = getNumObjectArrayDifferences(roomPoly.coords, room.coords);
			const numDifferences = getArrayDifferences(roomPoly.way, room.way).length;
			if (roomPoly.way.length == room.way.length) {
				if (numDifferences == 0 || numDifferentCoords == 0) {
					countRoom = 0;
				}
			} else if (roomPoly.way.length == room.way.length + 1) {
				if (numDifferences == 1 || numDifferentCoords == 2) {
					countRoom = 0;
				}
			} else if (roomPoly.way.length == room.way.length - 1) {
				if (numDifferences == 1) {
					countRoom = 0;
				}
			}

			if (countRoom == 0) {
				found = true;
				return;
			} else found = false;
		});
		if (!found) toSplice.push(idx);
	});

	toSplice.sort(function (a, b) {
		return b - a;
	});

	for (let ss = 0; ss < toSplice.length; ss++) {
		roomMeta.splice(toSplice[ss], 1);
	}
	setRoomMeta(roomMeta);
	return roomMeta;
};

export const renderRooms = (
	roomPolygonData: RoomPolygonData,
	roomMeta: RoomMetaData[],
	setRoomMeta: (r: RoomMetaData[]) => void
) => {
	// console.log("before room reander:", roomMeta.length);
	// roomMeta = applyPolygonDataToRooms(roomPolygonData, roomMeta, setRoomMeta);
	// console.log("after room render", roomMeta.length);

	if (roomPolygonData.polygons.length == 0) {
		roomMeta = [];
	}
	for (let pp = 0; pp < roomPolygonData.polygons.length; pp++) {
		let foundRoom = false;
		const roomPoly = roomPolygonData.polygons[pp];
		// for (let rr = 0; rr < roomMeta.length; rr++) {
		roomMeta.forEach((room) => {
			let countCoords = roomPoly.coords.length;
			const numDifferentCoords = getNumObjectArrayDifferences(roomPoly.coords, room.coords);
			const numDifferences = getArrayDifferences(roomPoly.way, room.way).length;
			if (roomPoly.way.length == room.way.length) {
				if (numDifferences == 0 || numDifferentCoords == 0) {
					countCoords = 0;
				}
			} else if (roomPoly.way.length == room.way.length + 1) {
				if (numDifferences == 1 || numDifferentCoords == 2) {
					countCoords = 0;
				}
			} else if (roomPoly.way.length == room.way.length - 1) {
				if (numDifferences == 1) {
					countCoords = 0;
				}
			}

			if (countCoords == 0) {
				foundRoom = true;
				roomMeta = [
					...roomMeta.filter((r) => r !== room),
					{
						...room,
						area: roomPoly.area,
						inside: roomPoly.inside ?? [],
						coords: roomPoly.coords,
						coordsOutside: roomPoly.coordsOutside,
						way: roomPoly.way,
						coordsInside: roomPoly.coordsInside ?? []
					}
				];
				return;
			}
		});
		// }
		if (!foundRoom) {
			roomMeta = [
				...roomMeta,
				{
					coords: roomPoly.coords,
					coordsOutside: roomPoly.coordsOutside,
					coordsInside: roomPoly.coordsInside ?? [],
					inside: roomPoly.inside ?? [],
					way: roomPoly.way,
					area: roomPoly.area,
					surface: '',
					name: '',
					color: 'gradientWhite',
					showSurface: true,
					action: 'add'
				}
			];
		}
	}

	const toSplice = [];
	for (let rr = 0; rr < roomMeta.length; rr++) {
		let found = true;
		const roomData = roomMeta[rr];
		for (let pp = 0; pp < roomPolygonData.polygons.length; pp++) {
			let countRoom = roomData.coords.length;
			const roomPoly = roomPolygonData.polygons[pp];
			const numDifferentCoords = getNumObjectArrayDifferences(roomPoly.coords, roomData.coords);
			const numDifferences = getArrayDifferences(roomPoly.way, roomData.way).length;
			if (roomPoly.way.length == roomData.way.length) {
				if (numDifferences == 0 || numDifferentCoords == 0) {
					countRoom = 0;
				}
			}
			if (roomPoly.way.length == roomData.way.length + 1) {
				if (numDifferences == 1 || numDifferentCoords == 2) {
					countRoom = 0;
				}
			}
			if (roomPoly.way.length == roomData.way.length - 1) {
				if (numDifferences == 1) {
					countRoom = 0;
				}
			}
			if (countRoom == 0) {
				found = true;
				break;
			} else found = false;
		}
		if (!found) toSplice.push(rr);
	}

	toSplice.sort(function (a, b) {
		return b - a;
	});

	for (let ss = 0; ss < toSplice.length; ss++) {
		roomMeta.splice(toSplice[ss], 1);
	}
	setRoomMeta([...roomMeta]);
};

export const getPolygonVisualCenter = (room: RoomMetaData, allRooms: RoomMetaData[]) => {
	const polygon = room.coords;
	const insideArray = room.inside;
	const sample = 80;
	const grid = [];
	//BOUNDING BOX OF POLYGON
	let minX = 0;
	let minY = 0;
	let maxX = 0;
	let maxY = 0;
	for (let i = 0; i < polygon.length; i++) {
		const p = polygon[i];
		if (!i || p.x < minX) minX = p.x;
		if (!i || p.y < minY) minY = p.y;
		if (!i || p.x > maxX) maxX = p.x;
		if (!i || p.y > maxY) maxY = p.y;
	}
	const width = maxX - minX;
	const height = maxY - minY;
	//INIT GRID
	const sampleWidth = Math.floor(width / sample);
	const sampleHeight = Math.floor(height / sample);
	for (let hh = 0; hh < sample; hh++) {
		for (let ww = 0; ww < sample; ww++) {
			const posX = minX + ww * sampleWidth;
			const posY = minY + hh * sampleHeight;
			if (pointInPolygon({ x: posX, y: posY }, polygon)) {
				let found = true;
				for (let ii = 0; ii < insideArray.length; ii++) {
					if (pointInPolygon({ x: posX, y: posY }, allRooms[insideArray[ii]].coordsOutside)) {
						found = false;
						break;
					}
				}
				if (found) {
					grid.push({ x: posX, y: posY });
				}
			}
		}
	}
	let bestRange = 0;
	let bestMatrix = 0;

	for (let matrix = 0; matrix < grid.length; matrix++) {
		let minDistance = Infinity;
		for (let pp = 0; pp < polygon.length - 1; pp++) {
			const scanDistance = pDistance(grid[matrix], polygon[pp], polygon[pp + 1]);

			if (scanDistance.distance < minDistance) {
				minDistance = scanDistance.distance;
			}
		}
		if (minDistance > bestRange) {
			bestMatrix = matrix;
			bestRange = minDistance;
		}
	}
	return grid[bestMatrix];
};