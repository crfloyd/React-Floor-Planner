export interface Point2D {
	x: number;
	y: number;
}

export interface PointDistance {
	x: number;
	y: number;
	distance: number;
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
	Opening: "door_mode",
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
	inside: number[];
	way: number[];
	area: number;
	surface: string;
	name: string;
	color: string;
	showSurface: boolean;
	action: string;
}

export interface RoomDisplayData {
	size: string;
	roomIndex: number;
	surface: string;
	showSurface: boolean;
	background: string;
	name: string;
	action: string;
}

export interface RoomPolygonData {
	polygons: Polygon[];
	vertex: WallVertex[];
}

export interface WallEquation {
	A: number | "h" | "v";
	B: number;
	follow?: WallMetaData | null;
	backup?: WallMetaData | null;
}

export interface WallSideEquations {
	up: WallEquation;
	down: WallEquation;
	base: WallEquation;
}

export interface WallJunction {
	segment: number;
	child: number;
	values: number[];
	type: "natural" | "intersection";
}

export interface WallVertex {
	x: number;
	y: number;
	segment: number[];
	bypass: number;
	type: string;
	child?: { id: number; angle: number }[];
	removed?: number[];
}

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
	parent: string | null;
	child: string | null;
	dPath: string | null;
	backUp: any;

	update: (
		allWalls: WallMetaData[],
		wallEquations: WallEquationGroup,
		moveAction: boolean
	) => void;
	getEquation: () => WallEquation;
	pointInsideWall: (point: Point2D, round: boolean) => boolean;
	pointBetweenCoords: (
		point: Point2D,
		coordSet: 1 | 2,
		round: boolean
	) => boolean;
	getJunctions(allWalls: WallMetaData[]): WallJunction[];
	getObjects(objectMeta: ObjectMetaData[]): ObjectMetaData[];
	makeVisible(): void;
}

export interface NodeWallObjectData {
	wall: WallMetaData;
	from: Point2D;
	distance: number;
	obj: ObjectMetaData;
	index: number;
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
	origin: Point2D;
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
	// up: PointDistance[];
	// down: PointDistance[];
	params: SVGCreationData;

	update: () => void;
}

export interface HistorySnapshot {
	objData: ObjectMetaData[];
	wallData: WallMetaData[];
	roomData: RoomMetaData[];
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

export interface SvgPathMetaData {
	p1: Point2D;
	p2: Point2D;
	p3: Point2D;
	stroke: string;
}

export interface Polygon {
	way: number[];
	coords: Point2D[];
	coordsOutside: Point2D[];
	coordsInside?: Point2D[];
	area: number;
	outsideArea: number;
	realArea: number;
	inside?: number[];
}

export interface LayerSettings {
	showSurfaces: boolean;
	showMeasurements: boolean;
	showTexture: boolean;
	showDevices: boolean;
}

export interface SnapData {
	x: number;
	y: number;
	xMouse: number;
	yMouse: number;
}

export type CursorType =
	| "crosshair"
	| "move"
	| "pointer"
	| "validation"
	| "default"
	| "trash"
	| "scissor"
	| "grab";
