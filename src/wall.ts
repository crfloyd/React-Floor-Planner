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
import { findById, intersectionOfEquations } from "./utils";
import { constants } from "../constants";
import { createEquation } from "./svgTools";

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
			up: { A: "", B: "" },
			down: { A: "", B: "" },
			base: { A: "", B: "" },
		};
		this.graph = {};
	}

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

	getJunctions(allWalls: WallMetaData[]) {
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
