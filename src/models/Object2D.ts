import { v4 as uuid } from 'uuid';

import { constants } from '../../constants';
import { calculateObjectRenderData, carpentryCalc, createSvgElement } from '../utils/svgTools';
import { BoundingBox, ObjectMetaData, Point2D, SVGCreationData, ViewboxData } from './models';

// export enum ObjectType {
// 	Unknown,
// 	Bay,
// 	Dimmer,
// 	Double,
// 	Fix,
// 	Flap,
// 	Gtl,
// 	Opening,
// 	Pocket,
// 	Simple,
// 	SimpleStair,
// 	Switch,
// 	DoubleSwitch,
// 	Twin,
// }

export class Object2D implements ObjectMetaData {
	id = uuid();
	graph: SVGElement = createSvgElement('none', 'g');
	scale = { x: 1, y: 1 };
	height: number;
	width: number;
	bbox: BoundingBox;
	realBbox: Point2D[];
	x: number;
	y: number;
	params: SVGCreationData;
	limit: Point2D[];
	class: string;
	renderData: SVGCreationData;
	oldXY = { x: 0, y: 0 };
	targetId: string | null;
	// up: PointDistance[] = [];
	// down: PointDistance[] = [];

	constructor(
		public readonly family: string,
		classe: string,
		public type: string,
		public pos: Point2D,
		public angle: number,
		public angleSign: boolean,
		public size: number,
		public hinge = 'normal',
		public thick: number,
		public value: any,
		public viewbox: ViewboxData,
		init?: Partial<Object2D>
	) {
		this.height = this.thick / constants.METER_SIZE;
		this.width = this.size / constants.METER_SIZE;
		this.x = pos.x;
		this.y = pos.y;
		this.limit = [];
		this.class = classe;
		this.targetId = null;

		const svgData = carpentryCalc(classe, type, size, thick, value);
		this.renderData = svgData;
		// const cc = svgData.construc;
		this.family = svgData.family ?? this.family;
		this.width = svgData.width ?? this.width;
		this.height = svgData.height ?? this.height;
		// for (let i = 0; i < cc.length; i++) {
		// 	const item = cc[i];
		// 	if (item.path) {
		// 		// const s: SVGPathElement = document.createElementNS(
		// 		// 	"http://www.w3.org/2000/svg",
		// 		// 	"path"
		// 		// );
		// 		const blank = createSvgElement('none', 'path', {
		// 			d: item.path,
		// 			'stroke-width': 1,
		// 			fill: item.fill,
		// 			stroke: item.stroke,
		// 			'stroke-dasharray': item.strokeDashArray
		// 		});
		// 		this.graph.appendChild(blank);
		// 	} else if (item.text) {
		// 		const blank = createSvgElement('none', 'text', {
		// 			x: item.x,
		// 			y: item.y,
		// 			'font-size': item.fontSize,
		// 			stroke: item.stroke,
		// 			'stroke-width': item.strokeWidth,
		// 			'font-family': 'roboto',
		// 			'text-anchor': 'middle',
		// 			fill: item.fill
		// 		});
		// 		blank.textContent = item.text;
		// 		this.graph.appendChild(blank);
		// 	}
		// }

		const bbox = this.graph.getBoundingClientRect();
		const offset = $('#lin').offset() ?? { left: 0, top: 0 };

		bbox.x = bbox.x * viewbox.zoomFactor - offset.left * viewbox.zoomFactor + viewbox.originX;
		bbox.y = bbox.y * viewbox.zoomFactor - offset.top * viewbox.zoomFactor + viewbox.originY;

		// bbox.x = this.x;
		// bbox.y = this.y;
		this.bbox = {
			...bbox,
			id: '',
			origin: { x: this.x, y: this.y }
		};
		this.realBbox = [
			{ x: -this.size / 2, y: -this.thick / 2 },
			{ x: this.size / 2, y: -this.thick / 2 },
			{ x: this.size / 2, y: this.thick / 2 },
			{ x: -this.size / 2, y: this.thick / 2 }
		];
		// if (family == "byObject") this.family = cc.family;
		// this.params = cc.params; // (bindBox, move, resize, rotate)
		this.params = svgData;
		svgData.width ? (this.size = svgData.width) : (this.size = size);
		svgData.height ? (this.thick = svgData.height) : (this.thick = thick);

		Object.assign(this, init);
	}

	update = () => {
		const before = [...this.realBbox];
		const { newHeight, newWidth, newRealBbox, newRenderData } = calculateObjectRenderData(
			this.size,
			this.thick,
			this.angle,
			this.class,
			this.type,
			this.pos
		);
		this.width = newWidth;
		this.height = newHeight;
		this.realBbox = newRealBbox;
		this.renderData = newRenderData;

		console.log(
			'Object2D - update(): from ',
			before[0],
			before[3],
			'to: ',
			newRealBbox[0],
			newRealBbox[3]
		);
	};
}
