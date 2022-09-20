import { Object2D } from "./svgTools";

export interface Point2D {
	x: number;
	y: number;
}

export const Mode = {
	Select: "select_mode",
	Text: "text_mode",
	EditText: "edit_text_mode",
	EditRoom: "edit_room_mode",
	Object: "object_mode",
	Distance: "distance_mode",
	Room: "room_mode",
	Node: "node_mode",
	Door: "door_mode",
	Line: "line_mode",
	Partition: "partition_mode",
	EditWall: "edit_wall_mode",
	EditDoor: "edit_door_mode",
	EditBoundingBox: "edit_boundingBox_mode",
	Bind: "bind_mode",
};

export interface RoomMetaData {
	coords: Point2D[];
	coordsOutside: Point2D[];
	coordsInside: Point2D[];
	inside: Point2D[];
	way: string[];
	area: number;
	surface: string;
	name: string;
	color: string;
	showSurface: boolean;
	action: string;
}

export interface WallSideEquationParams {
	A: string;
	B: string | number;
}

export interface WallSideEquations {
	up: WallSideEquationParams;
	down: WallSideEquationParams;
	base: WallSideEquationParams;
}

// export interface GraphData {
// 	0: {};
// 	context: {};
// 	length: number;
// }

// export interface WallMetaBase {
// }

// export interface WallMetaHistoryData extends WallMetaBase {
// 	parent?: number;
// 	child?: number;
// }

export interface WallMetaData {
	id: string;
	thick: number;
	start: Point2D;
	end: Point2D;
	type: string;
	angle: number;
	equations: WallSideEquations;
	coords: Point2D[];
	graph: any;
	parent?: string | null;
	child?: string | null;
}

export interface BoundingBox {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	top: number;
	right: number;
	bottom: number;
	left: number;
}

export interface ObjectMetaData {
	family: string;
	class: string;
	type: string;
	x: number;
	y: number;
	angle: number;
	angleSign: boolean;
	limit: Point2D[];
	hinge: string;
	graph: any;
	scale: Point2D;
	size: number;
	thick: number;
	value: number;
	width: number;
	height: number;
	bbox: BoundingBox;
	realBbox: Point2D[];
	// params: {
	// 	bindBox: boolean;
	// 	move: boolean;
	// 	resize: boolean;
	// 	resizeLimit: {
	// 		width: { min: number; max: number };
	// 		height: { min: boolean; max: boolean };
	// 	};
	// 	rotate: boolean;
	// };
	params: SVGCreationData;
}

export interface HistorySnapshot {
	objData: ObjectMetaData[];
	wallData: WallMetaData[];
	roomData: RoomMetaData[];
}

export interface WallEquation {
	A: number | string;
	B: number;
	follow?: WallMetaData | null;
	backup?: WallMetaData | null;
}

export interface ObjectEquationData {
	obj: ObjectMetaData;
	wall: WallMetaData;
	eq: WallEquation;
}

export interface WallEquationGroup {
	equation1: WallEquation | null;
	equation2: WallEquation | null;
	equation3: WallEquation | null;
}

export interface ViewboxData {
	width: number;
	height: number;
	originX: number;
	originY: number;
	zoomFactor: number;
	zoomLevel: number;
}

export interface SVGData {
	path?: string | null;
	fill?: string | null;
	stroke?: string | null;
	strokeWidth?: string | null;
	strokeDashArray?: string | null;
	x?: string | null;
	y?: string | null;
	text?: string | null;
	family?: string | null;
	fontSize?: string | null;
}

export interface SVGCreationData {
	construc: SVGData[];
	bindBox: boolean;
	move: boolean;
	resize: boolean;
	resizeLimit: { width: MeasurementRange; height: MeasurementRange };
	rotate: boolean;
	family?: string;
	width?: number;
	height?: number;
}

export interface MeasurementRange {
	min: number;
	max: number;
}
