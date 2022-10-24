import { constants } from '../../constants';
import { Point2D, SnapData, ViewboxData, WallEquation, WallMetaData } from '../models/models';
import { pointInPolygon } from './svgTools';

export const intersectionOfSideEquations = (equation1: WallEquation, equation2: WallEquation) => {
	return intersectionOfEquations(
		{ A: equation1.A, B: equation1.B as number },
		{ A: equation2.A, B: equation2.B as number }
	);
};

export const pointArraysAreEqual = (p1: Point2D[], p2: Point2D[]): boolean => {
	if (p1.length != p2.length) return false;
	let result = true;
	p1.forEach((point1, idx) => {
		const point2 = p2[idx];
		if (!pointsAreEqual(point1, point2)) {
			result = false;
			return;
		}
	});
	return result;
};

export const getArrayDifferences = (arr1: any[], arr2: any[]) => {
	return arr1.concat(arr2).filter((val) => !arr1.includes(val) || !arr2.includes(val));
};

export const getNumObjectArrayDifferences = (arr1: object[], arr2: object[]) => {
	let count = 0;
	for (let k = 0; k < arr1.length - 1; k++) {
		for (let n = 0; n < arr2.length - 1; n++) {
			if (isObjectsEquals(arr1[k], arr2[n])) {
				count++;
			}
		}
	}
	let waiting = arr1.length - 1;
	if (waiting < arr2.length - 1) waiting = arr2.length;
	return waiting - count;
};

export const arraysAreEqual = (array1: any[], array2: any[]) => {
	if (array1.length != array2.length) return false;
	let result = true;
	array1.forEach((val1, idx) => {
		const val2 = array2[idx];
		if (val1 !== val2) {
			result = false;
			return;
		}
	});
	return result;
};

export const pointsAreEqual = (p1: Point2D, p2: Point2D) => {
	return p1.x === p2.x && p1.y === p2.y;
};

export const distanceBetween = (p1: Point2D, p2: Point2D) => {
	return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const pointIsBetween = (p: Point2D, start: Point2D, end: Point2D, round = false) => {
	if (round) {
		p = { x: Math.round(p.x), y: Math.round(p.y) };
		start = { x: Math.round(start.x), y: Math.round(start.y) };
		end = { x: Math.round(end.x), y: Math.round(end.y) };
	}

	return (
		((p.x >= start.x && p.x <= end.x) || (p.x >= end.x && p.x <= start.x)) &&
		((p.y >= start.y && p.y <= end.y) || (p.y >= end.y && p.y <= start.y))
	);
};

export const valueIsBetween = (num: number, compare1: number, compare2: number, round = false) => {
	if (round) {
		num = Math.round(num);
		compare1 = Math.round(compare1);
		compare2 = Math.round(compare2);
	}
	return (num >= compare1 && num <= compare2) || (num >= compare2 && num <= compare1);
};

export const pDistance = (p1: Point2D, p2: Point2D, p3: Point2D) => {
	const { x: x1, y: y1 } = p1;
	const { x: x2, y: y2 } = p2;
	const { x: x3, y: y3 } = p3;
	const A = x1 - x2;
	const B = y1 - y2;
	const C = x3 - x2;
	const D = y3 - y2;
	const dot = A * C + B * D;
	const seqLen = C * C + D * D;
	const param = seqLen == 0 ? -1 : dot / seqLen;
	let x, y;
	if (param < 0) {
		x = x2;
		y = y2;
	} else if (param > 1) {
		x = x3;
		y = y3;
	} else {
		x = x2 + param * C;
		y = y2 + param * D;
	}
	const dx = x1 - x;
	const dy = y1 - y;
	return {
		x: x,
		y: y,
		distance: Math.sqrt(dx * dx + dy * dy)
	};
};

export const getMidPoint = (p1: Point2D, p2: Point2D): Point2D => {
	return {
		x: Math.abs(p1.x + p2.x) / 2,
		y: Math.abs(p1.y + p2.y) / 2
	};
};

export const vectorXY = (p1: Point2D, p2: Point2D): Point2D => {
	return {
		x: p2.x - p1.x,
		y: p2.y - p1.y
	};
};

export const vectorVertex = (p1: Point2D, p2: Point2D, p3: Point2D) => {
	const v1 = vectorXY(p1, p2);
	const v2 = vectorXY(p2, p3);
	const dist1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
	const dist2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
	const C = (v1.x * v2.x + v1.y * v2.y) / (dist1 * dist2);
	const S = v1.x * v2.y - v1.y * v2.x;
	const BAC = Math.sign(S) * Math.acos(C);
	return BAC * (180 / Math.PI);
};

export const vectorDeter = (p1: Point2D, p2: Point2D) => {
	return p1.x * p2.y - p1.y * p2.x;
};

export const getNearestWallNode = (
	snap: SnapData,
	wallMeta: WallMetaData[],
	range = Infinity,
	except: WallMetaData[] = []
) => {
	let bestPoint: Point2D = { x: 0, y: 0 };
	let bestWallId = '';
	let bestDistance = Infinity;
	for (let k = 0; k < wallMeta.length; k++) {
		const wall = wallMeta[k];

		if (except.indexOf(wall) >= 0) continue;

		const distFromStart = distanceBetween(wall.start, snap);
		if (distFromStart < bestDistance) {
			bestPoint = wall.start;
			bestDistance = distFromStart;
			bestWallId = wall.id;
		}

		const distFromEnd = distanceBetween(wall.end, snap);
		if (distFromEnd < bestDistance) {
			bestPoint = wall.end;
			bestDistance = distFromEnd;
			bestWallId = wall.id;
		}
	}
	return bestDistance <= range ? { bestPoint, bestWallId } : null;
};

export const getWallsOnPoint = (point: Point2D, wallMeta: WallMetaData[]) => {
	const wallsOnPoint: WallMetaData[] = [];
	wallMeta.forEach((wall) => {
		const polygon: Point2D[] = [];
		for (let i = 0; i < 4; i++) {
			polygon.push({
				x: wall.coords[i].x,
				y: wall.coords[i].y
			});
		}
		if (pointInPolygon(point, polygon)) {
			wallsOnPoint.push(wall);
		}
	});
	return wallsOnPoint;
};

export const intersectionOfEquations = (
	equation1: WallEquation,
	equation2: WallEquation
): Point2D | null => {
	if (equation1.A == equation2.A) {
		return null;
	}
	if (equation1.A == 'v') {
		if (equation2.A == 'h') {
			return { x: equation1.B, y: equation2.B };
		}
		if (typeof equation2.A == 'number') {
			return {
				x: equation1.B,
				y: equation2.A * equation1.B + equation2.B
			};
		}
	} else if (equation1.A == 'h') {
		if (equation2.A == 'v') {
			return { x: equation2.B, y: equation1.B };
		}
		if (typeof equation2.A == 'number') {
			return { x: (equation1.B - equation2.B) / equation2.A, y: equation1.B };
		}
	}

	if (typeof equation1.A == 'number') {
		if (equation2.A == 'h') {
			return { x: (equation2.B - equation1.B) / equation1.A, y: equation2.B };
		} else if (equation2.A == 'v') {
			return { x: equation2.B, y: equation1.A * equation2.B + equation1.B };
		} else {
			const xT = (equation2.B - equation1.B) / (equation1.A - (equation2.A as number));
			const yT = equation1.A * xT + equation1.B;
			return { x: xT, y: yT };
		}
	}
	return null;
};

export const findById = (id: string, wallMeta: WallMetaData[]): WallMetaData | null => {
	const match = wallMeta.find((m) => m.id === id);
	return match ?? null;
};

export const isObjectsEquals = (a: object, b: object, message: string | null = null) => {
	if (message) console.log(message);

	// if both null, return true
	// else if only one null, return false
	if (a == null) {
		return b == null;
	} else if (b == null) {
		return false;
	}
	const k2 = Object.keys(b);
	const v2 = Object.values(b);
	return Object.entries(a).every((e, i) => {
		const [k, v] = e;
		return k === k2[i] && v === v2[i];
	});
};

export const computeLimit = (equation: WallEquation, size: number, coords: Point2D): Point2D[] => {
	const pX = coords.x;
	const pY = coords.y;
	const eA = equation.A;
	const eB = equation.B;
	let pos1: Point2D;
	let pos2: Point2D;
	if (eA == 'v') {
		pos1 = { x: pX, y: pY - size / 2 };
		pos2 = { x: pX, y: pY + size / 2 };
	} else if (eA == 'h') {
		pos1 = { x: pX - size / 2, y: pY };
		pos2 = { x: pX + size / 2, y: pY };
	} else {
		const aqNum = eA as number;
		const a = 1 + aqNum * aqNum;
		const b = -2 * pX + 2 * aqNum * eB + -2 * pY * aqNum;
		const c = pX * pX + eB * eB - 2 * pY * eB + pY * pY - (size * size) / 4; // -N
		const delta = b * b - 4 * a * c;
		const posX1 = (-b - Math.sqrt(delta)) / (2 * a);
		const posX2 = (-b + Math.sqrt(delta)) / (2 * a);
		pos1 = { x: posX1, y: aqNum * posX1 + eB };
		pos2 = { x: posX2, y: aqNum * posX2 + eB };
	}
	return [pos1, pos2];
};

export const calculateSnap = (
	event: React.TouchEvent | React.MouseEvent,
	viewbox: ViewboxData,
	state = 'off'
): SnapData => {
	let eY = 0;
	let eX = 0;
	if (event.nativeEvent instanceof TouchEvent && event.nativeEvent.touches) {
		const touches = event.nativeEvent.changedTouches;
		eX = touches[0].pageX;
		eY = touches[0].pageY;
	} else if (event.nativeEvent instanceof MouseEvent) {
		eX = event.nativeEvent.pageX;
		eY = event.nativeEvent.pageY;
	} else {
		throw new Error('Unknown input event');
	}
	const x_mouse = eX * viewbox.zoomFactor + viewbox.originX;
	const y_mouse = eY * viewbox.zoomFactor + viewbox.originY;

	if (state == 'on') {
		return {
			x: Math.round(x_mouse / constants.GRID_SIZE) * constants.GRID_SIZE,
			y: Math.round(y_mouse / constants.GRID_SIZE) * constants.GRID_SIZE,
			xMouse: x_mouse,
			yMouse: y_mouse
		};
	}
	return {
		x: x_mouse,
		y: y_mouse,
		xMouse: x_mouse,
		yMouse: y_mouse
	};
};

export const perpendicularEquation = (
	equation: WallEquation,
	x1: number,
	y1: number
): WallEquation => {
	if (typeof equation.A != 'string') {
		return {
			A: -1 / equation.A,
			B: y1 - (-1 / equation.A) * x1
		};
	}
	if (equation.A == 'h') {
		return {
			A: 'v',
			B: x1
		};
	}

	// equation.A == 'v'
	return {
		A: 'h',
		B: y1
	};
};
