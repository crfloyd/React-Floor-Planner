import {
	ObjectMetaData,
	Point2D,
	WallEquation,
	WallEquationGroup,
	WallMetaData,
	WallSideEquations,
} from "./models";
import { v4 as uuid } from "uuid";
import { editor } from "../editor";
import { qSVG } from "../qSVG";
import { findById, intersectionOfEquations } from "./utils";
import { constants } from "../constants";

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

	inWallRib = (objectMeta: ObjectMetaData, option = false) => {
		if (!option) $("#boxRib").empty();
		const ribMaster: {
			wall: WallMetaData;
			crossObj?: any | null;
			side: string;
			coords: Point2D;
			distance: number;
		}[][] = [];
		ribMaster.push([]);
		ribMaster.push([]);
		var distance;
		var angleTextValue = this.angle * (180 / Math.PI);
		var objWall = editor.objFromWall(this, objectMeta); // LIST OBJ ON EDGE
		ribMaster[0].push({
			wall: this,
			crossObj: null,
			side: "up",
			coords: this.coords[0],
			distance: 0,
		});
		ribMaster[1].push({
			wall: this,
			crossObj: null,
			side: "down",
			coords: this.coords[1],
			distance: 0,
		});
		for (var ob in objWall) {
			var objTarget = objWall[ob];
			objTarget.up = [
				qSVG.nearPointOnEquation(this.equations.up, objTarget.limit[0]),
				qSVG.nearPointOnEquation(this.equations.up, objTarget.limit[1]),
			];
			objTarget.down = [
				qSVG.nearPointOnEquation(this.equations.down, objTarget.limit[0]),
				qSVG.nearPointOnEquation(this.equations.down, objTarget.limit[1]),
			];

			distance =
				qSVG.measure(this.coords[0], objTarget.up[0]) / constants.METER_SIZE;
			ribMaster[0].push({
				wall: objTarget,
				crossObj: ob,
				side: "up",
				coords: objTarget.up[0],
				distance: parseInt(distance.toFixed(2)),
			});
			distance =
				qSVG.measure(this.coords[0], objTarget.up[1]) / constants.METER_SIZE;
			ribMaster[0].push({
				wall: objTarget,
				crossObj: ob,
				side: "up",
				coords: objTarget.up[1],
				distance: parseInt(distance.toFixed(2)),
			});
			distance =
				qSVG.measure(this.coords[1], objTarget.down[0]) / constants.METER_SIZE;
			ribMaster[1].push({
				wall: objTarget,
				crossObj: ob,
				side: "down",
				coords: objTarget.down[0],
				distance: parseInt(distance.toFixed(2)),
			});
			distance =
				qSVG.measure(this.coords[1], objTarget.down[1]) / constants.METER_SIZE;
			ribMaster[1].push({
				wall: objTarget,
				crossObj: ob,
				side: "down",
				coords: objTarget.down[1],
				distance: parseInt(distance.toFixed(2)),
			});
		}
		distance =
			qSVG.measure(this.coords[0], this.coords[3]) / constants.METER_SIZE;
		ribMaster[0].push({
			wall: objTarget,
			crossObj: false,
			side: "up",
			coords: this.coords[3],
			distance: distance,
		});
		distance =
			qSVG.measure(this.coords[1], this.coords[2]) / constants.METER_SIZE;
		ribMaster[1].push({
			wall: objTarget,
			crossObj: false,
			side: "down",
			coords: this.coords[2],
			distance: distance,
		});
		ribMaster[0].sort((a, b) => {
			return parseInt((a.distance - b.distance).toFixed(2));
		});
		ribMaster[1].sort((a, b) => {
			return parseInt((a.distance - b.distance).toFixed(2));
		});
		const sizeText: SVGTextElement[] = [];
		for (var t in ribMaster) {
			for (var n = 1; n < ribMaster[t].length; n++) {
				var found = true;
				var shift = -5;
				var valueText = Math.abs(
					ribMaster[t][n - 1].distance - ribMaster[t][n].distance
				);
				var angleText = angleTextValue;
				if (found) {
					if (ribMaster[t][n - 1].side == "down") {
						shift = -shift + 10;
					}
					if (angleText > 89 || angleText < -89) {
						angleText -= 180;
						if (ribMaster[t][n - 1].side == "down") {
							shift = -5;
						} else shift = -shift + 10;
					}

					sizeText[n] = document.createElementNS(
						"http://www.w3.org/2000/svg",
						"text"
					);
					var startText = qSVG.middle(
						ribMaster[t][n - 1].coords.x,
						ribMaster[t][n - 1].coords.y,
						ribMaster[t][n].coords.x,
						ribMaster[t][n].coords.y
					);
					sizeText[n].setAttributeNS(null, "x", startText.x.toString());
					sizeText[n].setAttributeNS(
						null,
						"y",
						(startText.y + shift).toString()
					);
					sizeText[n].setAttributeNS(null, "text-anchor", "middle");
					sizeText[n].setAttributeNS(null, "font-family", "roboto");
					sizeText[n].setAttributeNS(null, "stroke", "#ffffff");
					sizeText[n].textContent = valueText.toFixed(2);
					if (valueText < 1) {
						sizeText[n].setAttributeNS(null, "font-size", "0.8em");
						sizeText[n].textContent =
							sizeText[n].textContent?.substring(
								1,
								sizeText[n].textContent?.length ?? 1
							) ?? null;
					} else sizeText[n].setAttributeNS(null, "font-size", "1em");
					sizeText[n].setAttributeNS(null, "stroke-width", "0.27px");
					sizeText[n].setAttributeNS(null, "fill", "#666666");
					sizeText[n].setAttribute(
						"transform",
						"rotate(" + angleText + " " + startText.x + "," + startText.y + ")"
					);

					$("#boxRib").append(sizeText[n]);
				}
			}
		}
	};

	getEquation = () => {
		return qSVG.createEquation(
			this.start.x,
			this.start.y,
			this.end.x,
			this.end.y
		);
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
}
