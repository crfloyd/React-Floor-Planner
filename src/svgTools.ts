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
} from "./models";
import { v4 as uuid } from "uuid";

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
