import { v4 as uuid } from 'uuid';

import { constants } from '../../constants';
import { calculateObjectRenderData, carpentryCalc } from '../utils/svgTools';
import { BoundingBox, ObjectMetaData, Point2D, SVGCreationData, ViewboxData } from './models';

export class Object2D implements ObjectMetaData {
	id = uuid();
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
		public value: number,
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
		this.family = svgData.family ?? this.family;
		this.width = svgData.width ?? this.width;
		this.height = svgData.height ?? this.height;
		this.bbox = {
			id: '',
			origin: { x: this.x, y: this.y },
			bottom: 0,
			top: 0,
			height: 0,
			left: 0,
			right: 0,
			width: 0,
			x: this.x,
			y: this.y
		};
		this.realBbox = [
			{ x: -this.size / 2, y: -this.thick / 2 },
			{ x: this.size / 2, y: -this.thick / 2 },
			{ x: this.size / 2, y: this.thick / 2 },
			{ x: -this.size / 2, y: this.thick / 2 }
		];
		this.params = svgData;
		svgData.width ? (this.size = svgData.width) : (this.size = size);
		svgData.height ? (this.thick = svgData.height) : (this.thick = thick);

		Object.assign(this, init);
	}

	update = () => {
		// const before = [...this.realBbox];
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

		// console.trace(
		// 	'Object2D - update(): from ',
		// 	before[0],
		// 	before[3],
		// 	'to: ',
		// 	newRealBbox[0],
		// 	newRealBbox[3]
		// );
	};
}
