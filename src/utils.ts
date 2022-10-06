import { constants } from "../constants";
import { getCanvasOffset } from "../func";
import { Point2D, ViewboxData, WallEquation, WallMetaData } from "./models";

export const intersectionOfSideEquations = (
	equation1: WallEquation,
	equation2: WallEquation
) => {
	return intersectionOfEquations(
		{ A: equation1.A, B: equation1.B as number },
		{ A: equation2.A, B: equation2.B as number }
	);
};

export const intersectionOfEquations = (
	equation1: WallEquation,
	equation2: WallEquation
): Point2D | null => {
	if (equation1.A == equation2.A) {
		return null;
	}
	if (equation1.A == "v") {
		if (equation2.A == "h") {
			return { x: equation1.B, y: equation2.B };
		}
		if (typeof equation2.A == "number") {
			return {
				x: equation1.B,
				y: equation2.A * equation1.B + equation2.B,
			};
		}
	} else if (equation1.A == "h") {
		if (equation2.A == "v") {
			return { x: equation2.B, y: equation1.B };
		}
		if (typeof equation2.A == "number") {
			return { x: (equation1.B - equation2.B) / equation2.A, y: equation1.B };
		}
	}

	if (typeof equation1.A == "number") {
		if (equation2.A == "h") {
			return { x: (equation2.B - equation1.B) / equation1.A, y: equation2.B };
		} else if (equation2.A == "v") {
			return { x: equation2.B, y: equation1.A * equation2.B + equation1.B };
		} else {
			var xT =
				(equation2.B - equation1.B) / (equation1.A - (equation2.A as number));
			var yT = equation1.A * xT + equation1.B;
			return { x: xT, y: yT };
		}
	}
	return null;
};

export const findById = (id: string, wallMeta: WallMetaData[]) => {
	const match = wallMeta.find((m) => m.id === id);
	return match;
};

export const isObjectsEquals = (a: object, b: object, message = false) => {
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

export const computeLimit = (
	equation: WallEquation,
	size: number,
	coords: Point2D
): Point2D[] => {
	const pX = coords.x;
	const pY = coords.y;
	const eA = equation.A;
	const eB = equation.B;
	let pos1: Point2D;
	let pos2: Point2D;
	if (eA == "v") {
		pos1 = { x: pX, y: pY - size / 2 };
		pos2 = { x: pX, y: pY + size / 2 };
	} else if (eA == "h") {
		pos1 = { x: pX - size / 2, y: pY };
		pos2 = { x: pX + size / 2, y: pY };
	} else {
		const aqNum = eA as number;
		var a = 1 + aqNum * aqNum;
		var b = -2 * pX + 2 * aqNum * eB + -2 * pY * aqNum;
		var c = pX * pX + eB * eB - 2 * pY * eB + pY * pY - (size * size) / 4; // -N
		var delta = b * b - 4 * a * c;
		var posX1 = (-b - Math.sqrt(delta)) / (2 * a);
		var posX2 = (-b + Math.sqrt(delta)) / (2 * a);
		pos1 = { x: posX1, y: aqNum * posX1 + eB };
		pos2 = { x: posX2, y: aqNum * posX2 + eB };
	}
	return [pos1, pos2];
};

export const calculateSnap = (
	event: React.TouchEvent | React.MouseEvent,
	viewbox: ViewboxData,
	state: string = "off"
) => {
	let eY = 0;
	let eX = 0;
	if (event.nativeEvent instanceof TouchEvent && event.nativeEvent.touches) {
		var touches = event.nativeEvent.changedTouches;
		eX = touches[0].pageX;
		eY = touches[0].pageY;
	} else if (event.nativeEvent instanceof MouseEvent) {
		eX = event.nativeEvent.pageX;
		eY = event.nativeEvent.pageY;
	} else {
		throw new Error("Unknown input event");
	}
	const offset = getCanvasOffset();
	if (!offset) {
		throw new Error("Could not get canvas offset");
	}
	const x_mouse =
		eX * viewbox.zoomFactor -
		offset.left * viewbox.zoomFactor +
		viewbox.originX;
	const y_mouse =
		eY * viewbox.zoomFactor - offset.top * viewbox.zoomFactor + viewbox.originY;

	if (state == "on") {
		return {
			x: Math.round(x_mouse / constants.GRID_SIZE) * constants.GRID_SIZE,
			y: Math.round(y_mouse / constants.GRID_SIZE) * constants.GRID_SIZE,
			xMouse: x_mouse,
			yMouse: y_mouse,
		};
	}
	return {
		x: x_mouse,
		y: y_mouse,
		xMouse: x_mouse,
		yMouse: y_mouse,
	};
};

export const perpendicularEquation = (
	equation: WallEquation,
	x1: number,
	y1: number
): WallEquation => {
	if (typeof equation.A != "string") {
		return {
			A: -1 / equation.A,
			B: y1 - (-1 / equation.A) * x1,
		};
	}
	if (equation.A == "h") {
		return {
			A: "v",
			B: x1,
		};
	}

	// equation.A == 'v'
	return {
		A: "h",
		B: y1,
	};
};
