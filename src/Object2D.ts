import {
	ObjectMetaData,
	Point2D,
	PointDistance,
	SVGCreationData,
	SVGData,
	ViewboxData,
} from "./models";
import { v4 as uuid } from "uuid";
import { qSVG } from "../qSVG";
import { constants } from "../constants";
import { getCanvasOffset } from "../func";
import { carpentryCalc, createSvgElement } from "./svgTools";

export class Object2D implements ObjectMetaData {
	id = uuid();
	graph = qSVG.create("none", "g");
	scale = { x: 1, y: 1 };
	height: number;
	width: number;
	bbox: any;
	realBbox;
	x: number;
	y: number;
	params: SVGCreationData;
	limit: Point2D[];
	class: string;
	up: PointDistance[] = [];
	down: PointDistance[] = [];

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
