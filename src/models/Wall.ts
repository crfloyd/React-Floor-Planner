import { v4 as uuid } from 'uuid';

import {
	angleBetweenEquations,
	calculateDPath,
	createEquation,
	getWallNodes,
	nearPointOnEquation
} from '../utils/svgTools';
import { findById, intersectionOfEquations, pointIsBetween, pointsAreEqual } from '../utils/utils';
import {
	ObjectMetaData,
	Point2D,
	WallEquationGroup,
	WallJunction,
	WallMetaData,
	WallSideEquations
} from './models';

export class Wall implements WallMetaData {
	id: string;
	parent: string | null;
	child: string | null;
	angle = 0;
	equations: WallSideEquations;
	graph: any;
	coords: Point2D[] = [];
	backUp: any = false;
	dPath: string | null = null;

	constructor(
		public start: Point2D,
		public end: Point2D,
		public type: string,
		public thick: number,
		init?: Partial<Wall>
	) {
		this.id = uuid();
		this.parent = null;
		this.child = null;
		this.equations = {
			up: { A: 0, B: 0 },
			down: { A: 0, B: 0 },
			base: { A: 0, B: 0 }
		};
		this.graph = {};
		Object.assign(this, init);
	}

	static fromWall = (from: WallMetaData): Wall => {
		const newWall = new Wall(from.start, from.end, from.type, from.thick);
		newWall.id = from.id;
		newWall.parent = from.parent;
		newWall.child = from.child;
		newWall.angle = from.angle;
		newWall.equations = from.equations;
		newWall.graph = from.graph;
		newWall.coords = from.coords;
		newWall.backUp = from.backUp;
		newWall.dPath = from.dPath;
		return newWall;
	};

	update = (allWalls: WallMetaData[], wallEquations: WallEquationGroup, moveAction: boolean) => {
		let previousWall = null;
		let previousWallStart: Point2D = { x: 0, y: 0 };
		let previousWallEnd: Point2D = { x: 0, y: 0 };
		if (this.parent != null) {
			const parent = findById(this.parent, allWalls);
			if (parent) {
				if (pointsAreEqual(parent.start, this.start)) {
					previousWall = parent;
					previousWallStart = previousWall.end;
					previousWallEnd = previousWall.start;
				} else if (pointsAreEqual(parent.end, this.start)) {
					previousWall = parent;
					previousWallStart = previousWall.start;
					previousWallEnd = previousWall.end;
				}
			}
		} else {
			const nearestNodesToStart = getWallNodes(this.start, allWalls, this);
			for (const k in nearestNodesToStart) {
				const nearest = nearestNodesToStart[k];
				const eqInter = createEquation(
					nearest.wall.start.x,
					nearest.wall.start.y,
					nearest.wall.end.x,
					nearest.wall.end.y
				);
				const angleInter = moveAction
					? angleBetweenEquations(eqInter.A, wallEquations.equation2?.A ?? 0)
					: 90;
				if (
					nearest.type == 'start' &&
					nearest.wall.parent == null &&
					angleInter > 20 &&
					angleInter < 160
				) {
					this.parent = nearest.wall.id;
					nearest.wall.parent = this.id;

					previousWall = findById(this.parent, allWalls);
					if (previousWall) {
						previousWallStart = previousWall.end;
						previousWallEnd = previousWall.start;
					}
				}
				if (
					nearest.type == 'end' &&
					nearest.wall.child == null &&
					angleInter > 20 &&
					angleInter < 160
				) {
					this.parent = nearest.wall.id;
					nearest.wall.child = this.id;
					previousWall = findById(this.parent, allWalls);
					if (previousWall) {
						previousWallStart = previousWall.start;
						previousWallEnd = previousWall.end;
					}
				}
			}
		}

		let thickness = 0;
		let nextWallStart: Point2D = { x: 0, y: 0 };
		let nextWallEnd: Point2D = { x: 0, y: 0 };

		if (this.child != null) {
			const child = findById(this.child, allWalls);
			if (child) {
				thickness = child.thick;
				if (pointsAreEqual(child.end, this.end)) {
					nextWallStart = child.end;
					nextWallEnd = child.start;
				} else {
					nextWallStart = child.start;
					nextWallEnd = child.end;
				}
			}
		} else {
			const nearestNodesToEnd = getWallNodes(this.end, allWalls, this);

			nearestNodesToEnd.forEach((nearest) => {
				const eqInter = createEquation(
					nearest.wall.start.x,
					nearest.wall.start.y,
					nearest.wall.end.x,
					nearest.wall.end.y
				);
				const angleInter = moveAction
					? angleBetweenEquations(eqInter.A, wallEquations.equation2?.A ?? 0)
					: 90;

				if (angleInter <= 20 || angleInter >= 160) {
					return;
				}

				if (nearest.type == 'end' && nearest.wall.child == null) {
					this.child = nearest.wall.id;
					nearest.wall.child = this.id;
					const nextWall = findById(this.child, allWalls);
					if (nextWall) {
						nextWallStart = nextWall.end;
						nextWallEnd = nextWall.start;
						thickness = nextWall.thick;
					}
				}
				if (nearest.type == 'start' && nearest.wall.parent == null) {
					this.child = nearest.wall.id;
					nearest.wall.parent = this.id;
					const nextWall = findById(this.child, allWalls);
					if (nextWall) {
						nextWallStart = nextWall.start;
						nextWallEnd = nextWall.end;
						thickness = nextWall.thick;
					}
				}
			});
		}

		const angleWall = Math.atan2(this.end.y - this.start.y, this.end.x - this.start.x);

		this.angle = angleWall;
		const wallThickX = (this.thick / 2) * Math.sin(angleWall);
		const wallThickY = (this.thick / 2) * Math.cos(angleWall);
		const eqWallUp = createEquation(
			this.start.x + wallThickX,
			this.start.y - wallThickY,
			this.end.x + wallThickX,
			this.end.y - wallThickY
		);
		const eqWallDw = createEquation(
			this.start.x - wallThickX,
			this.start.y + wallThickY,
			this.end.x - wallThickX,
			this.end.y + wallThickY
		);
		const eqWallBase = createEquation(this.start.x, this.start.y, this.end.x, this.end.y);
		this.equations = {
			up: eqWallUp,
			down: eqWallDw,
			base: eqWallBase
		};
		// console.log(
		// 	"id:",
		// 	this.id,
		// 	"2 - prevStart:",
		// 	previousWallStart,
		// 	"start:",
		// 	this.start,
		// 	"end:",
		// 	this.end,
		// 	"parent",
		// 	this.parent,
		// 	"child",
		// 	this.child
		// );

		const dWay = calculateDPath(
			this,
			angleWall,
			previousWallStart,
			previousWallEnd,
			true,
			eqWallUp,
			eqWallDw,
			previousWall?.thick ?? 0,
			''
		);

		this.dPath =
			calculateDPath(
				this,
				angleWall,
				nextWallStart,
				nextWallEnd,
				false,
				eqWallUp,
				eqWallDw,
				thickness,
				dWay ?? ''
			) ?? null;
	};

	makeVisible = () => {
		this.type = 'normal';
		this.thick = this.backUp;
		this.backUp = false;
	};

	makeInvisible = () => {
		this.type = 'separate';
		this.backUp = this.thick;
		this.thick = 0.07;
	};

	getEquation = () => {
		return createEquation(this.start.x, this.start.y, this.end.x, this.end.y);
	};

	pointInsideWall = (point: Point2D, round: boolean) => {
		const p = { ...point };
		const start = { ...this.start };
		const end = { ...this.end };
		return pointIsBetween(p, start, end, round);
	};

	pointBetweenCoords(point: Point2D, coordSet: 1 | 2, round = false) {
		const p = { ...point };
		const start = coordSet == 1 ? this.coords[0] : this.coords[1];
		const end = coordSet == 1 ? this.coords[3] : this.coords[2];

		return pointIsBetween(p, start, end, round);
	}

	getObjects(allObjects: ObjectMetaData[]): ObjectMetaData[] {
		const objectsOnWall: ObjectMetaData[] = [];
		allObjects.forEach((obj) => {
			if (obj.family == 'inWall') {
				const eq = createEquation(this.start.x, this.start.y, this.end.x, this.end.y);
				const searchResult = nearPointOnEquation(eq, obj);
				if (searchResult.distance < 0.01 && this.pointInsideWall(obj, false)) {
					objectsOnWall.push(obj);
				}
			}
		});
		return objectsOnWall;
	}

	getJunctions(allWalls: WallMetaData[]): WallJunction[] {
		const junctions: WallJunction[] = [];
		const thisWallEquation = createEquation(this.start.x, this.start.y, this.end.x, this.end.y);
		allWalls
			.filter((w) => w != this)
			.forEach((otherWall, idx) => {
				// if (otherWall == this) return;

				const otherWallEquation = createEquation(
					otherWall.start.x,
					otherWall.start.y,
					otherWall.end.x,
					otherWall.end.y
				);
				const intersec = intersectionOfEquations(thisWallEquation, otherWallEquation);
				if (intersec) {
					if (
						(this.end.x == otherWall.start.x && this.end.y == otherWall.start.y) ||
						(this.start.x == otherWall.end.x && this.start.y == otherWall.end.y)
					) {
						if (this.end.x == otherWall.start.x && this.end.y == otherWall.start.y) {
							junctions.push({
								segment: 0,
								child: idx,
								values: [otherWall.start.x, otherWall.start.y],
								type: 'natural'
							});
						}
						if (this.start.x == otherWall.end.x && this.start.y == otherWall.end.y) {
							junctions.push({
								segment: 0,
								child: idx,
								values: [this.start.x, this.start.y],
								type: 'natural'
							});
						}
					} else {
						if (this.pointInsideWall(intersec, true) && otherWall.pointInsideWall(intersec, true)) {
							// intersec[0] = intersec[0];
							// intersec[1] = intersec[1];
							junctions.push({
								segment: 0,
								child: idx,
								values: [intersec.x, intersec.y],
								type: 'intersection'
							});
						}
					}
				}
				// IF EQ1 == EQ 2 FIND IF START OF SECOND SEG == END OF FIRST seg (eq.A maybe values H ou V)
				if (
					(Math.abs(thisWallEquation.A as number) == Math.abs(otherWallEquation.A as number) ||
						thisWallEquation.A == otherWallEquation.A) &&
					thisWallEquation.B == otherWallEquation.B
				) {
					if (this.end.x == otherWall.start.x && this.end.y == otherWall.start.y) {
						junctions.push({
							segment: 0,
							child: idx,
							values: [otherWall.start.x, otherWall.start.y],
							type: 'natural'
						});
					}
					if (this.start.x == otherWall.end.x && this.start.y == otherWall.end.y) {
						junctions.push({
							segment: 0,
							child: idx,
							values: [this.start.x, this.start.y],
							type: 'natural'
						});
					}
				}
			});
		return junctions;
	}
}
