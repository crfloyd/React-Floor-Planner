import { constants } from "../constants";
import { getCanvasOffset } from "../func";
import { qSVG } from "../qSVG";
import {
	MeasurementRange,
	Point2D,
	SVGCreationData,
	SVGData,
	ViewboxData,
	ObjectMetaData,
	WallMetaData,
	WallEquationGroup,
	WallEquation,
} from "./models";
import { v4 as uuid } from "uuid";
import {
	findById,
	intersectionOfEquations,
	isObjectsEquals,
	perpendicularEquation,
} from "./utils";

export const createSvgElement = (id: string, shape: string, attrs: any) => {
	var svg: SVGElement = document.createElementNS(
		"http://www.w3.org/2000/svg",
		shape
	);
	for (var k in attrs) {
		const v = attrs[k];
		if (v) {
			svg.setAttribute(k, v);
		}
		// s.attr(k, attrs[k]);
	}
	if (id != "none") {
		$("#" + id).append(svg);
	}
	return svg;
};

export class Object2D implements ObjectMetaData {
	public id = uuid();
	public graph = qSVG.create("none", "g");
	public scale = { x: 1, y: 1 };
	public height: number;
	public width: number;
	public bbox: any;
	public realBbox;
	public x: number;
	public y: number;
	public params: SVGCreationData;
	public limit: Point2D[];
	public class: string;

	constructor(
		public readonly family: string,
		classe: string,
		public type: string,
		public pos: Point2D,
		public angle: number,
		public angleSign: boolean,
		public size: number,
		public hinge = "normal",
		public thick: number,
		public value: number,
		private viewbox: ViewboxData
	) {
		this.height = this.thick / constants.METER_SIZE;
		this.width = this.size / constants.METER_SIZE;
		this.x = pos.x;
		this.y = pos.y;
		this.limit = [];
		this.class = classe;

		const svgData = carpentryCalc(classe, type, size, thick, value);
		const cc = svgData.construc;
		var blank;
		for (var i = 0; i < cc.length; i++) {
			const item = cc[i];
			if (item.path) {
				// const s: SVGPathElement = document.createElementNS(
				// 	"http://www.w3.org/2000/svg",
				// 	"path"
				// );
				blank = createSvgElement("none", "path", {
					d: item.path,
					"stroke-width": 1,
					fill: item.fill,
					stroke: item.stroke,
					"stroke-dasharray": item.strokeDashArray,
				});
			} else if (item.text) {
				blank = qSVG.create("none", "text", {
					x: item.x,
					y: item.y,
					"font-size": item.fontSize,
					stroke: item.stroke,
					"stroke-width": item.strokeWidth,
					"font-family": "roboto",
					"text-anchor": "middle",
					fill: item.fill,
				});
				blank.context.textContent = item.text;
			}
			this.graph.append(blank);
		}

		const bbox = this.graph.get(0).getBoundingClientRect();
		const offset = getCanvasOffset() ?? { left: 0, top: 0 };

		bbox.x =
			bbox.x * viewbox.zoomFactor -
			offset.left * viewbox.zoomFactor +
			viewbox.originX;
		bbox.y =
			bbox.y * viewbox.zoomFactor -
			offset.top * viewbox.zoomFactor +
			viewbox.originY;
		bbox.origin = { x: this.x, y: this.y };
		this.bbox = bbox;
		this.realBbox = [
			{ x: -this.size / 2, y: -this.thick / 2 },
			{ x: this.size / 2, y: -this.thick / 2 },
			{ x: this.size / 2, y: this.thick / 2 },
			{ x: -this.size / 2, y: this.thick / 2 },
		];
		// if (family == "byObject") this.family = cc.family;
		// this.params = cc.params; // (bindBox, move, resize, rotate)
		this.params = svgData;
		svgData.width ? (this.size = svgData.width) : (this.size = size);
		svgData.height ? (this.thick = svgData.height) : (this.thick = thick);
	}

	update = () => {
		this.width = this.size / constants.METER_SIZE;
		this.height = this.thick / constants.METER_SIZE;
		const cc = carpentryCalc(
			this.class,
			this.type,
			this.size,
			this.thick,
			this.value
		);
		// setConstructs(cc);
		for (var tt = 0; tt < cc.construc.length; tt++) {
			if (cc.construc[tt].path) {
				this.graph.find("path")[tt].setAttribute("d", cc.construc[tt].path);
			} else {
				// this.graph.find('text').context.textContent = cc[tt].text;
			}
		}
		var hingeStatus = this.hinge; // normal - reverse
		var hingeUpdate;
		if (hingeStatus == "normal") hingeUpdate = 1;
		else hingeUpdate = -1;
		this.graph.attr({
			transform:
				"translate(" +
				this.x +
				"," +
				this.y +
				") rotate(" +
				this.angle +
				",0,0) scale(" +
				hingeUpdate +
				", 1)",
		});
		var bbox = this.graph.get(0).getBoundingClientRect();
		const offset = getCanvasOffset() ?? { left: 0, top: 0 };
		bbox.x =
			bbox.x * this.viewbox.zoomFactor -
			offset.left * this.viewbox.zoomFactor +
			this.viewbox.originX;
		bbox.y =
			bbox.y * this.viewbox.zoomFactor -
			offset.top * this.viewbox.zoomFactor +
			this.viewbox.originY;
		bbox.origin = { x: this.x, y: this.y };
		this.bbox = bbox;

		if (this.class == "text" && this.angle == 0) {
			this.realBbox = [
				{ x: this.bbox.x, y: this.bbox.y },
				{ x: this.bbox.x + this.bbox.width, y: this.bbox.y },
				{
					x: this.bbox.x + this.bbox.width,
					y: this.bbox.y + this.bbox.height,
				},
				{ x: this.bbox.x, y: this.bbox.y + this.bbox.height },
			];
			this.size = this.bbox.width;
			this.thick = this.bbox.height;
		}

		var angleRadian = -this.angle * (Math.PI / 180);
		this.realBbox = [
			{ x: -this.size / 2, y: -this.thick / 2 },
			{ x: this.size / 2, y: -this.thick / 2 },
			{ x: this.size / 2, y: this.thick / 2 },
			{ x: -this.size / 2, y: this.thick / 2 },
		];
		var newRealBbox = [
			{ x: 0, y: 0 },
			{ x: 0, y: 0 },
			{ x: 0, y: 0 },
			{ x: 0, y: 0 },
		];
		newRealBbox[0].x =
			this.realBbox[0].y * Math.sin(angleRadian) +
			this.realBbox[0].x * Math.cos(angleRadian) +
			this.x;
		newRealBbox[1].x =
			this.realBbox[1].y * Math.sin(angleRadian) +
			this.realBbox[1].x * Math.cos(angleRadian) +
			this.x;
		newRealBbox[2].x =
			this.realBbox[2].y * Math.sin(angleRadian) +
			this.realBbox[2].x * Math.cos(angleRadian) +
			this.x;
		newRealBbox[3].x =
			this.realBbox[3].y * Math.sin(angleRadian) +
			this.realBbox[3].x * Math.cos(angleRadian) +
			this.x;
		newRealBbox[0].y =
			this.realBbox[0].y * Math.cos(angleRadian) -
			this.realBbox[0].x * Math.sin(angleRadian) +
			this.y;
		newRealBbox[1].y =
			this.realBbox[1].y * Math.cos(angleRadian) -
			this.realBbox[1].x * Math.sin(angleRadian) +
			this.y;
		newRealBbox[2].y =
			this.realBbox[2].y * Math.cos(angleRadian) -
			this.realBbox[2].x * Math.sin(angleRadian) +
			this.y;
		newRealBbox[3].y =
			this.realBbox[3].y * Math.cos(angleRadian) -
			this.realBbox[3].x * Math.sin(angleRadian) +
			this.y;
		this.realBbox = newRealBbox;
		return true;
	};
}

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
			height: { min: 0, max: 0 },
		},
		rotate: false,
	};

	const objClass = constants.OBJECT_CLASSES;

	if (classType == objClass.HOVER_BOX) {
		construc.push({
			path:
				"M " +
				-size / 2 +
				"," +
				-thickness / 2 +
				" L " +
				-size / 2 +
				"," +
				thickness / 2 +
				" L " +
				size / 2 +
				"," +
				thickness / 2 +
				" L " +
				size / 2 +
				"," +
				-thickness / 2 +
				" Z",
			fill: "#5cba79",
			stroke: "#5cba79",
			strokeDashArray: "",
		});
	}

	if (classType == objClass.DOOR_WINDOW) {
		if (type == "simple") {
			construc.push({
				path:
					"M " +
					-size / 2 +
					"," +
					-thickness / 2 +
					" L " +
					-size / 2 +
					"," +
					thickness / 2 +
					" L " +
					size / 2 +
					"," +
					thickness / 2 +
					" L " +
					size / 2 +
					"," +
					-thickness / 2 +
					" Z",
				fill: "#ccc",
				stroke: "none",
				strokeDashArray: "",
			});
			construc.push({
				path:
					"M " +
					-size / 2 +
					"," +
					-thickness / 2 +
					" L " +
					-size / 2 +
					"," +
					(-size - thickness / 2) +
					"  A" +
					size +
					"," +
					size +
					" 0 0,1 " +
					size / 2 +
					"," +
					-thickness / 2,
				fill: "none",
				stroke: constants.COLOR_WALL,
				strokeDashArray: "",
			});
			result.resize = true;
			result.resizeLimit.width = { min: 40, max: 120 };
		}
		if (type == "double") {
			construc.push({
				path:
					"M " +
					-size / 2 +
					"," +
					-thickness / 2 +
					" L " +
					-size / 2 +
					"," +
					thickness / 2 +
					" L " +
					size / 2 +
					"," +
					thickness / 2 +
					" L " +
					size / 2 +
					"," +
					-thickness / 2 +
					" Z",
				fill: "#ccc",
				stroke: "none",
				strokeDashArray: "",
			});
			construc.push({
				path:
					"M " +
					-size / 2 +
					"," +
					-thickness / 2 +
					" L " +
					-size / 2 +
					"," +
					(-size / 2 - thickness / 2) +
					"  A" +
					size / 2 +
					"," +
					size / 2 +
					" 0 0,1 0," +
					-thickness / 2,
				fill: "none",
				stroke: constants.COLOR_WALL,
				strokeDashArray: "",
			});
			construc.push({
				path:
					"M " +
					size / 2 +
					"," +
					-thickness / 2 +
					" L " +
					size / 2 +
					"," +
					(-size / 2 - thickness / 2) +
					"  A" +
					size / 2 +
					"," +
					size / 2 +
					" 0 0,0 0," +
					-thickness / 2,
				fill: "none",
				stroke: constants.COLOR_WALL,
				strokeDashArray: "",
			});
			result.resize = true;
			result.resizeLimit.width = { min: 40, max: 160 };
		}
		if (type == "pocket") {
			construc.push({
				path:
					"M " +
					-size / 2 +
					"," +
					(-(thickness / 2) - 4) +
					" L " +
					-size / 2 +
					"," +
					thickness / 2 +
					" L " +
					size / 2 +
					"," +
					thickness / 2 +
					" L " +
					size / 2 +
					"," +
					(-(thickness / 2) - 4) +
					" Z",
				fill: "#ccc",
				stroke: "none",
				strokeDashArray: "none",
			});
			construc.push({
				path:
					"M " +
					-size / 2 +
					"," +
					-thickness / 2 +
					" L " +
					-size / 2 +
					"," +
					thickness / 2 +
					" M " +
					size / 2 +
					"," +
					thickness / 2 +
					" L " +
					size / 2 +
					"," +
					-thickness / 2,
				fill: "none",
				stroke: "#494646",
				strokeDashArray: "5 5",
			});
			construc.push({
				path:
					"M " +
					-size / 2 +
					"," +
					-thickness / 2 +
					" L " +
					-size / 2 +
					"," +
					(-thickness / 2 - 5) +
					" L " +
					+size / 2 +
					"," +
					(-thickness / 2 - 5) +
					" L " +
					+size / 2 +
					"," +
					-thickness / 2 +
					" Z",
				fill: "url(#hatch)",
				stroke: "#494646",
				strokeDashArray: "",
			});
			result.resize = true;
			result.resizeLimit.width = { min: 60, max: 200 };
		}
		if (type == "opening") {
			construc.push({
				path:
					"M " +
					-size / 2 +
					"," +
					-thickness / 2 +
					" L " +
					-size / 2 +
					"," +
					thickness / 2 +
					" L " +
					size / 2 +
					"," +
					thickness / 2 +
					" L " +
					size / 2 +
					"," +
					-thickness / 2 +
					" Z",
				fill: "#ccc",
				stroke: "#494646",
				strokeDashArray: "5,5",
			});
			construc.push({
				path:
					"M " +
					-size / 2 +
					"," +
					-(thickness / 2) +
					" L " +
					-size / 2 +
					"," +
					thickness / 2 +
					" L " +
					(-size / 2 + 5) +
					"," +
					thickness / 2 +
					" L " +
					(-size / 2 + 5) +
					"," +
					-(thickness / 2) +
					" Z",
				fill: "none",
				stroke: "#494646",
				strokeDashArray: "none",
			});
			construc.push({
				path:
					"M " +
					(size / 2 - 5) +
					"," +
					-(thickness / 2) +
					" L " +
					(size / 2 - 5) +
					"," +
					thickness / 2 +
					" L " +
					size / 2 +
					"," +
					thickness / 2 +
					" L " +
					size / 2 +
					"," +
					-(thickness / 2) +
					" Z",
				fill: "none",
				stroke: "#494646",
				strokeDashArray: "none",
			});
			result.resize = true;
			result.resizeLimit.width = { min: 40, max: 500 };
		}
		if (type == "fix") {
			construc.push({
				path:
					"M " +
					-size / 2 +
					",-2 L " +
					-size / 2 +
					",2 L " +
					size / 2 +
					",2 L " +
					size / 2 +
					",-2 Z",
				fill: "#ccc",
				stroke: "none",
				strokeDashArray: "",
			});
			construc.push({
				path:
					"M " +
					-size / 2 +
					"," +
					-thickness / 2 +
					" L " +
					-size / 2 +
					"," +
					thickness / 2 +
					" M " +
					size / 2 +
					"," +
					thickness / 2 +
					" L " +
					size / 2 +
					"," +
					-thickness / 2,
				fill: "none",
				stroke: "#ccc",
				strokeDashArray: "",
			});
			result.resize = true;
			result.resizeLimit.width = { min: 30, max: 300 };
		}
		if (type == "flap") {
			construc.push({
				path:
					"M " +
					-size / 2 +
					",-2 L " +
					-size / 2 +
					",2 L " +
					size / 2 +
					",2 L " +
					size / 2 +
					",-2 Z",
				fill: "#ccc",
				stroke: "none",
				strokeDashArray: "",
			});
			construc.push({
				path:
					"M " +
					-size / 2 +
					"," +
					-thickness / 2 +
					" L " +
					-size / 2 +
					"," +
					thickness / 2 +
					" M " +
					size / 2 +
					"," +
					thickness / 2 +
					" L " +
					size / 2 +
					"," +
					-thickness / 2,
				fill: "none",
				stroke: "#ccc",
				strokeDashArray: "",
			});
			construc.push({
				path:
					"M " +
					-size / 2 +
					"," +
					-thickness / 2 +
					" L " +
					(-size / 2 + size * 0.866) +
					"," +
					(-size / 2 - thickness / 2) +
					"  A" +
					size +
					"," +
					size +
					" 0 0,1 " +
					size / 2 +
					"," +
					-thickness / 2,
				fill: "none",
				stroke: constants.COLOR_WALL,
				strokeDashArray: "",
			});
			result.resize = true;
			result.resizeLimit.width = { min: 20, max: 100 };
		}
		if (type == "twin") {
			construc.push({
				path:
					"M " +
					-size / 2 +
					",-2 L " +
					-size / 2 +
					",2 L " +
					size / 2 +
					",2 L " +
					size / 2 +
					",-2 Z",
				fill: "#ccc",
				stroke: "none",
				strokeDashArray: "",
			});
			construc.push({
				path:
					"M " +
					-size / 2 +
					"," +
					-thickness / 2 +
					" L " +
					-size / 2 +
					"," +
					thickness / 2 +
					" M " +
					size / 2 +
					"," +
					thickness / 2 +
					" L " +
					size / 2 +
					"," +
					-thickness / 2,
				fill: "none",
				stroke: "#ccc",
				strokeDashArray: "",
			});
			construc.push({
				path:
					"M " +
					-size / 2 +
					"," +
					-thickness / 2 +
					" L " +
					(-size / 2 + (size / 2) * 0.866) +
					"," +
					(-size / 4 - thickness / 2) +
					"  A" +
					size / 2 +
					"," +
					size / 2 +
					" 0 0,1 0," +
					-thickness / 2,
				fill: "none",
				stroke: constants.COLOR_WALL,
				strokeDashArray: "",
			});
			construc.push({
				path:
					"M " +
					size / 2 +
					"," +
					-thickness / 2 +
					" L " +
					(size / 2 + (-size / 2) * 0.866) +
					"," +
					(-size / 4 - thickness / 2) +
					"  A" +
					size / 2 +
					"," +
					size / 2 +
					" 0 0,0 0," +
					-thickness / 2,
				fill: "none",
				stroke: constants.COLOR_WALL,
				strokeDashArray: "",
			});
			result.resize = true;
			result.resizeLimit.width = { min: 40, max: 200 };
		}
		if (type == "bay") {
			construc.push({
				path:
					"M " +
					-size / 2 +
					"," +
					-thickness / 2 +
					" L " +
					-size / 2 +
					"," +
					thickness / 2 +
					" M " +
					size / 2 +
					"," +
					thickness / 2 +
					" L " +
					size / 2 +
					"," +
					-thickness / 2,
				fill: "none",
				stroke: "#ccc",
				strokeDashArray: "",
			});
			construc.push({
				path:
					"M " +
					-size / 2 +
					",-2 L " +
					-size / 2 +
					",0 L 2,0 L 2,2 L 3,2 L 3,-2 Z",
				fill: "#ccc",
				stroke: "none",
				strokeDashArray: "",
			});
			construc.push({
				path:
					"M -2,1 L -2,3 L " +
					size / 2 +
					",3 L " +
					size / 2 +
					",1 L -1,1 L -1,-1 L -2,-1 Z",
				fill: "#ccc",
				stroke: "none",
				strokeDashArray: "",
			});
			result.resize = true;
			result.resizeLimit.width = { min: 60, max: 300 };
		}
	}

	if (classType == objClass.MEASURE) {
		result.bindBox = true;
		construc.push({
			path:
				"M-" +
				size / 2 +
				",0 l10,-10 l0,8 l" +
				(size - 20) +
				",0 l0,-8 l10,10 l-10,10 l0,-8 l-" +
				(size - 20) +
				",0 l0,8 Z",
			fill: "#729eeb",
			stroke: "none",
			strokeDashArray: "",
		});
		let s = construc[0];
	}

	if (classType == objClass.BOUNDING_BOX) {
		construc.push({
			path:
				"M" +
				(-size / 2 - 10) +
				"," +
				(-thickness / 2 - 10) +
				" L" +
				(size / 2 + 10) +
				"," +
				(-thickness / 2 - 10) +
				" L" +
				(size / 2 + 10) +
				"," +
				(thickness / 2 + 10) +
				" L" +
				(-size / 2 - 10) +
				"," +
				(thickness / 2 + 10) +
				" Z",
			fill: "none",
			stroke: "#aaa",
			strokeDashArray: "",
		});

		// construc.push({'path':"M"+dividerObj[0].x+","+dividerObj[0].y+" L"+dividerObj[1].x+","+dividerObj[1].y+" L"+dividerObj[2].x+","+dividerObj[2].y+" L"+dividerObj[3].x+","+dividerObj[3].y+" Z", 'fill':'none', 'stroke':"#000", 'strokeDashArray': ''});
	}

	if (classType == objClass.TEXT) {
		result.bindBox = true;
		result.move = true;
		result.rotate = true;
		construc.push({
			text: divider.text,
			x: "0",
			y: "0",
			fill: type,
			stroke: type,
			fontSize: divider.size + "px",
			strokeWidth: "0px",
		});
	}

	if (classType == objClass.STAIR) {
		result.bindBox = true;
		result.move = true;
		result.resize = true;
		result.rotate = true;
		result.width = 60;
		result.height = 180;
		if (type == "simpleStair") {
			construc.push({
				path:
					"M " +
					-size / 2 +
					"," +
					-thickness / 2 +
					" L " +
					-size / 2 +
					"," +
					thickness / 2 +
					" L " +
					size / 2 +
					"," +
					thickness / 2 +
					" L " +
					size / 2 +
					"," +
					-thickness / 2 +
					" Z",
				fill: "#fff",
				stroke: "#000",
				strokeDashArray: "",
			});

			var heightStep = thickness / divider;
			for (var i = 1; i < divider + 1; i++) {
				construc.push({
					path:
						"M " +
						-size / 2 +
						"," +
						(-thickness / 2 + i * heightStep) +
						" L " +
						size / 2 +
						"," +
						(-thickness / 2 + i * heightStep),
					fill: "none",
					stroke: "#000",
					strokeDashArray: "none",
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
		if (type == "gtl") {
			construc.push({
				path: "m -20,-20 l 40,0 l0,40 l-40,0 Z",
				fill: "#fff",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				text: "GTL",
				x: "0",
				y: "5",
				fill: "#333333",
				stroke: "none",
				fontSize: "0.9em",
				strokeWidth: "0.4px",
			});
			result.width = 40;
			result.height = 40;
			result.family = "stick";
		}
		if (type == "switch") {
			construc.push({
				path: qSVG.circlePath(0, 0, 16),
				fill: "#fff",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: qSVG.circlePath(-2, 4, 5),
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "m 0,0 5,-9",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			result.width = 36;
			result.height = 36;
			result.family = "stick";
		}
		if (type == "doubleSwitch") {
			construc.push({
				path: qSVG.circlePath(0, 0, 16),
				fill: "#fff",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: qSVG.circlePath(0, 0, 4),
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "m 2,-3 5,-8 3,2",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "m -2,3 -5,8 -3,-2",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			result.width = 36;
			result.height = 36;
			result.family = "stick";
		}
		if (type == "dimmer") {
			construc.push({
				path: qSVG.circlePath(0, 0, 16),
				fill: "#fff",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: qSVG.circlePath(-2, 4, 5),
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "m 0,0 5,-9",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "M -2,-6 L 10,-4 L-2,-2 Z",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			result.width = 36;
			result.height = 36;
			result.family = "stick";
		}
		if (type == "plug") {
			construc.push({
				path: qSVG.circlePath(0, 0, 16),
				fill: "#fff",
				stroke: "#000",
				strokeDashArray: "",
			});
			construc.push({
				path: "M 10,-6 a 10,10 0 0 1 -5,8 10,10 0 0 1 -10,0 10,10 0 0 1 -5,-8",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "m 0,3 v 7",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "m -10,4 h 20",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			result.width = 36;
			result.height = 36;
			result.family = "stick";
		}
		if (type == "plug20") {
			construc.push({
				path: qSVG.circlePath(0, 0, 16),
				fill: "#fff",
				stroke: "#000",
				strokeDashArray: "",
			});
			construc.push({
				path: "M 10,-6 a 10,10 0 0 1 -5,8 10,10 0 0 1 -10,0 10,10 0 0 1 -5,-8",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "m 0,3 v 7",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "m -10,4 h 20",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				text: "20A",
				x: "0",
				y: "-5",
				fill: "#333333",
				stroke: "none",
				fontSize: "0.65em",
				strokeWidth: "0.4px",
			});
			result.width = 36;
			result.height = 36;
			result.family = "stick";
		}
		if (type == "plug32") {
			construc.push({
				path: qSVG.circlePath(0, 0, 16),
				fill: "#fff",
				stroke: "#000",
				strokeDashArray: "",
			});
			construc.push({
				path: "M 10,-6 a 10,10 0 0 1 -5,8 10,10 0 0 1 -10,0 10,10 0 0 1 -5,-8",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "m 0,3 v 7",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "m -10,4 h 20",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				text: "32A",
				x: "0",
				y: "-5",
				fill: "#333333",
				stroke: "none",
				fontSize: "0.65em",
				strokeWidth: "0.4px",
			});
			result.width = 36;
			result.height = 36;
			result.family = "stick";
		}
		if (type == "roofLight") {
			construc.push({
				path: qSVG.circlePath(0, 0, 16),
				fill: "#fff",
				stroke: "#000",
				strokeDashArray: "",
			});
			construc.push({
				path: "M -8,-8 L 8,8 M -8,8 L 8,-8",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			result.width = 36;
			result.height = 36;
			result.family = "free";
		}
		if (type == "wallLight") {
			construc.push({
				path: qSVG.circlePath(0, 0, 16),
				fill: "#fff",
				stroke: "#000",
				strokeDashArray: "",
			});
			construc.push({
				path: "M -8,-8 L 8,8 M -8,8 L 8,-8",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "M -10,10 L 10,10",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			result.width = 36;
			result.height = 36;
			result.family = "stick";
		}
		if (type == "www") {
			construc.push({
				path: "m -20,-20 l 40,0 l0,40 l-40,0 Z",
				fill: "#fff",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				text: "@",
				x: "0",
				y: "4",
				fill: "#333333",
				stroke: "none",
				fontSize: "1.2em",
				strokeWidth: "0.4px",
			});
			result.width = 40;
			result.height = 40;
			result.family = "free";
		}
		if (type == "rj45") {
			construc.push({
				path: qSVG.circlePath(0, 0, 16),
				fill: "#fff",
				stroke: "#000",
				strokeDashArray: "",
			});
			construc.push({
				path: "m-10,5 l0,-10 m20,0 l0,10",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "m 0,5 v 7",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "m -10,5 h 20",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				text: "RJ45",
				x: "0",
				y: "-5",
				fill: "#333333",
				stroke: "none",
				fontSize: "0.5em",
				strokeWidth: "0.4px",
			});
			result.width = 36;
			result.height = 36;
			result.family = "stick";
		}
		if (type == "tv") {
			construc.push({
				path: qSVG.circlePath(0, 0, 16),
				fill: "#fff",
				stroke: "#000",
				strokeDashArray: "",
			});
			construc.push({
				path: "m-10,5 l0-10 m20,0 l0,10",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "m-7,-5 l0,7 l14,0 l0,-7",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "m 0,5 v 7",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "m -10,5 h 20",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				text: "TV",
				x: "0",
				y: "-5",
				fill: "#333333",
				stroke: "none",
				fontSize: "0.5em",
				strokeWidth: "0.4px",
			});
			result.width = 36;
			result.height = 36;
			result.family = "stick";
		}

		if (type == "heater") {
			construc.push({
				path: qSVG.circlePath(0, 0, 16),
				fill: "#fff",
				stroke: "#000",
				strokeDashArray: "",
			});
			construc.push({
				path: "m-15,-4 l30,0",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "m-14,-8 l28,0",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "m-11,-12 l22,0",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "m-16,0 l32,0",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "m-15,4 l30,0",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "m-14,8 l28,0",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "m-11,12 l22,0",
				fill: "none",
				stroke: "#333",
				strokeDashArray: "",
			});
			result.width = 36;
			result.height = 36;
			result.family = "stick";
		}
		if (type == "radiator") {
			construc.push({
				path: "m -20,-10 l 40,0 l0,20 l-40,0 Z",
				fill: "#fff",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "M -15,-10 L -15,10",
				fill: "#fff",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "M -10,-10 L -10,10",
				fill: "#fff",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "M -5,-10 L -5,10",
				fill: "#fff",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "M -0,-10 L -0,10",
				fill: "#fff",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "M 5,-10 L 5,10",
				fill: "#fff",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "M 10,-10 L 10,10",
				fill: "#fff",
				stroke: "#333",
				strokeDashArray: "",
			});
			construc.push({
				path: "M 15,-10 L 15,10",
				fill: "#fff",
				stroke: "#333",
				strokeDashArray: "",
			});
			result.width = 40;
			result.height = 20;
			result.family = "stick";
		}
	}

	if (classType == objClass.FURNITURE) {
		result.bindBox = true;
		result.move = true;
		result.resize = true;
		result.rotate = true;
	}

	return result;
};

export const getWallNodes = (
	coords: Point2D,
	wallMeta: WallMetaData[],
	except: WallMetaData | null = null
) => {
	var nodes = [];
	for (var k in wallMeta) {
		if (except && isObjectsEquals(wallMeta[k], except)) continue;

		if (isObjectsEquals(wallMeta[k].start, coords)) {
			nodes.push({ wall: wallMeta[k], type: "start" });
		}
		if (isObjectsEquals(wallMeta[k].end, coords)) {
			nodes.push({ wall: wallMeta[k], type: "end" });
		}
	}
	return nodes;
};

const clearParentsAndChildren = (wallMeta: WallMetaData[]) => {
	for (var vertice = 0; vertice < wallMeta.length; vertice++) {
		const wall = wallMeta[vertice];
		if (wall.parent != null) {
			const parent = findById(wall.parent, wallMeta);
			if (
				!parent ||
				(!isObjectsEquals(parent.start, wall.start) &&
					!isObjectsEquals(parent.end, wall.start))
			) {
				wall.parent = null;
			}
		}

		const child = findById(wall.child ?? "", wallMeta);
		if (
			!child ||
			// (child.start !== wall.end && child.end !== wall.end)
			(!isObjectsEquals(child.start, wall.end) &&
				!isObjectsEquals(child.end, wall.end))
		) {
			wall.child = null;
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
	const perpEquation = perpendicularEquation(
		upEquation,
		refPoint.x,
		refPoint.y
	);
	if (refRelative == null) {
		const interUp = intersectionOfEquations(upEquation, perpEquation);
		const interDw = intersectionOfEquations(downEquation, perpEquation);

		let newPath = "";
		if (fromParent && interUp && interDw) {
			wall.coords = [interUp, interDw];
			newPath =
				"M" +
				interUp.x +
				"," +
				interUp.y +
				" L" +
				interDw.x +
				"," +
				interDw.y +
				" ";
		} else {
			if (interDw && interUp) {
				wall.coords.push(interDw, interUp);
				newPath =
					dWay +
					"L" +
					interDw.x +
					"," +
					interDw.y +
					" L" +
					interUp.x +
					"," +
					interUp.y +
					" Z";
			}
		}

		return newPath;
	}

	const comparisonAngle = Math.atan2(
		comparePointEnd.y - comparePointStart.y,
		comparePointEnd.x - comparePointStart.x
	);
	const halfThick = thickness / 2;
	const compareThickX = halfThick * Math.sin(comparisonAngle);
	const compareThickY = halfThick * Math.cos(comparisonAngle);

	const comparisonUpEq = qSVG.createEquation(
		comparePointStart.x + compareThickX,
		comparePointStart.y - compareThickY,
		comparePointEnd.x + compareThickX,
		comparePointEnd.y - compareThickY
	);
	const comparisonDownEq = qSVG.createEquation(
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
				y: refPoint.y - wallThickY,
			};
			interDw = {
				x: refPoint.x - wallThickX,
				y: refPoint.y + wallThickY,
			};
		}

		const miterPoint = fromParent ? comparePointEnd : comparePointStart;
		const miter = qSVG.gap(interUp, {
			x: miterPoint.x,
			y: miterPoint.y,
		});
		if (miter > 1000) {
			const eqAUp = fromParent ? perpEquation : upEquation;
			const eqADown = fromParent ? perpEquation : downEquation;
			const eqBUp = fromParent ? upEquation : perpEquation;
			const eqBDown = fromParent ? downEquation : perpEquation;
			interUp = intersectionOfEquations(eqAUp, eqBUp);
			interDw = intersectionOfEquations(eqADown, eqBDown);
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
		return (
			"M" +
			interUp.x +
			"," +
			interUp.y +
			" L" +
			interDw.x +
			"," +
			interDw.y +
			" "
		);
	} else {
		if (interUp && interDw) {
			wall.coords.push(interDw, interUp);
			return (
				dWay +
				"L" +
				interDw.x +
				"," +
				interDw.y +
				" L" +
				interUp.x +
				"," +
				interUp.y +
				" Z"
			);
		}
	}
};

export const wallsComputing = (
	wallMeta: WallMetaData[],
	wallEquations: WallEquationGroup,
	moveAction = false
) => {
	$("#boxwall").empty();
	$("#boxArea").empty();

	clearParentsAndChildren(wallMeta);

	let previousWall = null;
	let previousWallStart: Point2D = { x: 0, y: 0 };
	let previousWallEnd: Point2D = { x: 0, y: 0 };
	for (var vertice = 0; vertice < wallMeta.length; vertice++) {
		var wall = wallMeta[vertice];
		if (wall.parent != null) {
			const parent = findById(wall.parent, wallMeta);
			if (parent) {
				if (isObjectsEquals(parent.start, wall.start)) {
					previousWall = parent;
					previousWallStart = previousWall.end;
					previousWallEnd = previousWall.start;
				} else if (isObjectsEquals(parent.end, wall.start)) {
					previousWall = parent;
					previousWallStart = previousWall.start;
					previousWallEnd = previousWall.end;
				}
			}
		} else {
			var nearestNodesToStart = getWallNodes(wall.start, wallMeta, wall);
			for (var k in nearestNodesToStart) {
				const nearest = nearestNodesToStart[k];
				const eqInter = qSVG.createEquation(
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
					wall.parent = nearest.wall.id;
					nearest.wall.parent = wall.id;

					previousWall = findById(wall.parent, wallMeta);
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
					wall.parent = nearest.wall.id;
					nearest.wall.child = wall.id;
					previousWall = findById(wall.parent, wallMeta);
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

		if (wall.child != null) {
			const child = findById(wall.child, wallMeta);
			if (child) {
				thickness = child.thick;
				if (isObjectsEquals(child.end, wall.end)) {
					nextWallStart = child.end;
					nextWallEnd = child.start;
				} else {
					nextWallStart = child.start;
					nextWallEnd = child.end;
				}
			}
		} else {
			var nearestNodesToEnd = getWallNodes(wall.end, wallMeta, wall);
			for (var k in nearestNodesToEnd) {
				const nearest = nearestNodesToEnd[k];
				var eqInter = qSVG.createEquation(
					nearest.wall.start.x,
					nearest.wall.start.y,
					nearest.wall.end.x,
					nearest.wall.end.y
				);
				var angleInter = moveAction
					? qSVG.angleBetweenEquations(eqInter.A, wallEquations.equation2?.A)
					: 90;

				if (angleInter <= 20 || angleInter >= 160) {
					continue;
				}

				if (nearest.type == "end" && nearest.wall.child == null) {
					wall.child = nearest.wall.id;
					nearest.wall.child = wall.id;
					const nextWall = findById(wall.child, wallMeta);
					if (nextWall) {
						nextWallStart = nextWall.end;
						nextWallEnd = nextWall.start;
						thickness = nextWall.thick;
					}
				}
				if (nearest.type == "start" && nearest.wall.parent == null) {
					wall.child = nearest.wall.id;
					nearest.wall.parent = wall.id;
					const nextWall = findById(wall.child, wallMeta);
					if (nextWall) {
						nextWallStart = nextWall.start;
						nextWallEnd = nextWall.end;
						thickness = nextWall.thick;
					}
				}
			}
		}

		const angleWall = Math.atan2(
			wall.end.y - wall.start.y,
			wall.end.x - wall.start.x
		);

		wall.angle = angleWall;
		const wallThickX = (wall.thick / 2) * Math.sin(angleWall);
		const wallThickY = (wall.thick / 2) * Math.cos(angleWall);
		const eqWallUp = qSVG.createEquation(
			wall.start.x + wallThickX,
			wall.start.y - wallThickY,
			wall.end.x + wallThickX,
			wall.end.y - wallThickY
		);
		const eqWallDw = qSVG.createEquation(
			wall.start.x - wallThickX,
			wall.start.y + wallThickY,
			wall.end.x - wallThickX,
			wall.end.y + wallThickY
		);
		const eqWallBase = qSVG.createEquation(
			wall.start.x,
			wall.start.y,
			wall.end.x,
			wall.end.y
		);
		wall.equations = {
			up: { A: eqWallUp.A as string, B: eqWallUp.B },
			down: { A: eqWallDw.A as string, B: eqWallDw.B },
			base: { A: eqWallBase.A as string, B: eqWallBase.B },
		};

		let dWay = calculateDPath(
			wall,
			angleWall,
			previousWallStart,
			previousWallEnd,
			true,
			eqWallUp,
			eqWallDw,
			previousWall?.thick ?? 0,
			""
		);

		wall.dPath = calculateDPath(
			wall,
			angleWall,
			nextWallStart,
			nextWallEnd,
			false,
			eqWallUp,
			eqWallDw,
			thickness,
			dWay ?? ""
		);
	}
};
