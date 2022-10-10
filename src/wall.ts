import {
	ObjectMetaData,
	Point2D,
	WallEquation,
	WallEquationGroup,
	WallMetaData,
	WallSideEquations,
	WallJunction,
} from "./models";
import { v4 as uuid } from "uuid";
import { editor } from "../editor";
import { qSVG } from "../qSVG";
import { findById, intersectionOfEquations, isObjectsEquals } from "./utils";
import { constants } from "../constants";
import {
	calculateDPath,
	createEquation,
	getWallNodes,
	nearPointOnEquation,
} from "./svgTools";

export class Wall implements WallMetaData {
	id: string;
	parent: string | null;
	child: string | null;
	angle = 0;
	equations: WallSideEquations;
	graph: any;
	coords = [];
	backUp: any = false;
	dPath: string | null = null;

	constructor(
		public start: Point2D,
		public end: Point2D,
		public type: string,
		public thick: number
	) {
		this.id = uuid();
		this.parent = null;
		this.child = null;
		this.equations = {
			up: { A: 0, B: 0 },
			down: { A: 0, B: 0 },
			base: { A: 0, B: 0 },
		};
		this.graph = {};
	}

	static fromWall = (from: Wall): Wall => {
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

	update = (
		allWalls: WallMetaData[],
		wallEquations: WallEquationGroup,
		moveAction: boolean
	) => {
		let previousWall = null;
		let previousWallStart: Point2D = { x: 0, y: 0 };
		let previousWallEnd: Point2D = { x: 0, y: 0 };
		if (this.parent != null) {
			const parent = findById(this.parent, allWalls);
			if (parent) {
				if (isObjectsEquals(parent.start, this.start)) {
					previousWall = parent;
					previousWallStart = previousWall.end;
					previousWallEnd = previousWall.start;
				} else if (isObjectsEquals(parent.end, this.start)) {
					previousWall = parent;
					previousWallStart = previousWall.start;
					previousWallEnd = previousWall.end;
				}
			}
		} else {
			var nearestNodesToStart = getWallNodes(this.start, allWalls, this);
			for (var k in nearestNodesToStart) {
				const nearest = nearestNodesToStart[k];
				const eqInter = createEquation(
					nearest.wall.start.x,
					nearest.wall.start.y,
					nearest.wall.end.x,
					nearest.wall.end.y
				);
				const angleInter = moveAction
					? qSVG.angleBetweenEquations(eqInter.A, wallEquations.equation2?.A)
					: 90;
				if (
					nearest.type == "start" &&
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
					nearest.type == "end" &&
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
				if (isObjectsEquals(child.end, this.end)) {
					nextWallStart = child.end;
					nextWallEnd = child.start;
				} else {
					nextWallStart = child.start;
					nextWallEnd = child.end;
				}
			}
		} else {
			var nearestNodesToEnd = getWallNodes(this.end, allWalls, this);
			nearestNodesToEnd.forEach((nearest) => {
				var eqInter = createEquation(
					nearest.wall.start.x,
					nearest.wall.start.y,
					nearest.wall.end.x,
					nearest.wall.end.y
				);
				var angleInter = moveAction
					? qSVG.angleBetweenEquations(eqInter.A, wallEquations.equation2?.A)
					: 90;

				if (angleInter <= 20 || angleInter >= 160) {
					return;
				}

				if (nearest.type == "end" && nearest.wall.child == null) {
					this.child = nearest.wall.id;
					nearest.wall.child = this.id;
					const nextWall = findById(this.child, allWalls);
					if (nextWall) {
						nextWallStart = nextWall.end;
						nextWallEnd = nextWall.start;
						thickness = nextWall.thick;
					}
				}
				if (nearest.type == "start" && nearest.wall.parent == null) {
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

		const angleWall = Math.atan2(
			this.end.y - this.start.y,
			this.end.x - this.start.x
		);

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
		const eqWallBase = createEquation(
			this.start.x,
			this.start.y,
			this.end.x,
			this.end.y
		);
		this.equations = {
			up: eqWallUp,
			down: eqWallDw,
			base: eqWallBase,
		};

		let dWay = calculateDPath(
			this,
			angleWall,
			previousWallStart,
			previousWallEnd,
			true,
			eqWallUp,
			eqWallDw,
			previousWall?.thick ?? 0,
			""
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
				dWay ?? ""
			) ?? null;
	};

	makeVisible = () => {
		this.type = "normal";
		this.thick = this.backUp;
		this.backUp = false;
	};

	getEquation = () => {
		return createEquation(this.start.x, this.start.y, this.end.x, this.end.y);
	};

	addToScene = () => {
		this.graph = qSVG.create("none", "path", {
			d: this.dPath,
			stroke: "none",
			fill: constants.COLOR_WALL,
			"stroke-width": 1,
			"stroke-linecap": "butt",
			"stroke-linejoin": "miter",
			"stroke-miterlimit": 4,
			"fill-rule": "nonzero",
		});
		$("#boxwall").append(this.graph);
	};

	pointInsideWall = (point: Point2D, round = false) => {
		let p = { ...point };
		let start = { ...this.start };
		let end = { ...this.end };
		return this.isBetween(p, start, end, round);
	};

	pointBetweenCoords(point: Point2D, coordSet: 1 | 2, round = false) {
		let p = { ...point };
		let start = coordSet == 1 ? this.coords[0] : this.coords[1];
		let end = coordSet == 1 ? this.coords[3] : this.coords[2];

		return this.isBetween(p, start, end, round);
	}

	getObjects(allObjects: ObjectMetaData[]): ObjectMetaData[] {
		const objectsOnWall: ObjectMetaData[] = [];
		allObjects.forEach((obj) => {
			if (obj.family == "inWall") {
				var eq = createEquation(
					this.start.x,
					this.start.y,
					this.end.x,
					this.end.y
				);
				const searchResult = nearPointOnEquation(eq, obj);
				if (searchResult.distance < 0.01 && this.pointInsideWall(obj)) {
					objectsOnWall.push(obj);
				}
			}
		});
		return objectsOnWall;
	}

	getJunctions(allWalls: WallMetaData[]): WallJunction[] {
		const junctions: WallJunction[] = [];
		var thisWallEquation = createEquation(
			this.start.x,
			this.start.y,
			this.end.x,
			this.end.y
		);
		allWalls
			.filter((w) => w != this)
			.forEach((otherWall, idx) => {
				// if (otherWall == this) return;

				var otherWallEquation = createEquation(
					otherWall.start.x,
					otherWall.start.y,
					otherWall.end.x,
					otherWall.end.y
				);
				var intersec = intersectionOfEquations(
					thisWallEquation,
					otherWallEquation
				);
				if (intersec) {
					if (
						(this.end.x == otherWall.start.x &&
							this.end.y == otherWall.start.y) ||
						(this.start.x == otherWall.end.x && this.start.y == otherWall.end.y)
					) {
						if (
							this.end.x == otherWall.start.x &&
							this.end.y == otherWall.start.y
						) {
							junctions.push({
								segment: 0,
								child: idx,
								values: [otherWall.start.x, otherWall.start.y],
								type: "natural",
							});
						}
						if (
							this.start.x == otherWall.end.x &&
							this.start.y == otherWall.end.y
						) {
							junctions.push({
								segment: 0,
								child: idx,
								values: [this.start.x, this.start.y],
								type: "natural",
							});
						}
					} else {
						if (
							this.pointInsideWall(intersec, true) &&
							otherWall.pointInsideWall(intersec, true)
						) {
							// intersec[0] = intersec[0];
							// intersec[1] = intersec[1];
							junctions.push({
								segment: 0,
								child: idx,
								values: [intersec.x, intersec.y],
								type: "intersection",
							});
						}
					}
				}
				// IF EQ1 == EQ 2 FIND IF START OF SECOND SEG == END OF FIRST seg (eq.A maybe values H ou V)
				if (
					(Math.abs(thisWallEquation.A as number) ==
						Math.abs(otherWallEquation.A as number) ||
						thisWallEquation.A == otherWallEquation.A) &&
					thisWallEquation.B == otherWallEquation.B
				) {
					if (
						this.end.x == otherWall.start.x &&
						this.end.y == otherWall.start.y
					) {
						junctions.push({
							segment: 0,
							child: idx,
							values: [otherWall.start.x, otherWall.start.y],
							type: "natural",
						});
					}
					if (
						this.start.x == otherWall.end.x &&
						this.start.y == otherWall.end.y
					) {
						junctions.push({
							segment: 0,
							child: idx,
							values: [this.start.x, this.start.y],
							type: "natural",
						});
					}
				}
			});
		return junctions;
	}

	private isBetween(p: Point2D, start: Point2D, end: Point2D, round = false) {
		if (round) {
			p = { x: Math.round(p.x), y: Math.round(p.y) };
			start = { x: Math.round(start.x), y: Math.round(start.y) };
			end = { x: Math.round(end.x), y: Math.round(end.y) };
		}

		return (
			((p.x >= start.x && p.x <= end.x) || (p.x >= end.x && p.x <= start.x)) &&
			((p.y >= start.y && p.y <= end.y) || (p.y >= end.y && p.y <= start.y))
		);
	}
}
