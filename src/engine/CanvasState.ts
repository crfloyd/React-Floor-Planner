import { useState } from 'react';

import {
	Mode,
	NodeWallObjectData,
	ObjectEquationData,
	Point2D,
	RoomMetaData,
	RoomPolygonData,
	WallEquation,
	WallEquationGroup,
	WallMetaData
} from '../models/models';

const useRoomState = () => {
	const [roomPolygonData, setRoomPolygonData] = useState<RoomPolygonData>({
		polygons: [],
		vertex: []
	});
	const [roomMetaData, setRoomMetaData] = useState<RoomMetaData[]>([]);

	return { roomPolygonData, setRoomPolygonData, roomMetaData, setRoomMetaData };
};

export class CanvasState {
	binder: any;
	setBinder = (val: any) => {
		this.binder = val;
		return this.binder;
	};

	mode = Mode.Select;
	setMode = (val: string) => {
		this.mode = val;
		return this.mode;
	};

	modeOption = '';
	setModeOption = (val: string) => {
		this.modeOption = val;
		return this.modeOption;
	};

	action = false;
	setAction = (a: boolean) => {
		this.action = a;
		return this.action;
	};

	wallStartConstruc = false;
	setWallStartConstruc = (val: boolean) => {
		this.wallStartConstruc = val;
		return this.wallStartConstruc;
	};
	wallEndConstruc = false;
	setWallEndConstruc = (val: boolean) => {
		this.wallEndConstruc = val;
		return this.wallEndConstruc;
	};

	currentNodeWallObjectData: NodeWallObjectData[] = [];
	setCurrentNodeWallObjects = (newData: NodeWallObjectData[]) => {
		this.currentNodeWallObjectData = newData;
		return this.currentNodeWallObjectData;
	};

	currentNodeWalls: WallMetaData[] = [];
	setCurrentNodeWalls = (newWalls: WallMetaData[]) => {
		this.currentNodeWalls = newWalls;
		return this.currentNodeWalls;
	};

	lineIntersectionP: any = null;
	setLineIntersectionP = (val: any) => {
		this.lineIntersectionP = val;
		return this.lineIntersectionP;
	};

	lengthTemp: any = null;
	setLengthTemp = (val: any) => {
		this.lengthTemp = val;
		return this.lengthTemp;
	};

	wallEquations: WallEquationGroup = {
		equation1: null,
		equation2: null,
		equation3: null
	};
	setWallEquations = (newEquations: WallEquationGroup) => {
		this.wallEquations = newEquations;
		return this.wallEquations;
	};

	objectEquationData: ObjectEquationData[] = [];
	setObjectEquationData = (newData: ObjectEquationData[]) => {
		this.objectEquationData = newData;
		return this.objectEquationData;
	};

	followerData: {
		equations: { wall: WallMetaData; eq: WallEquation; type: string }[];
		intersection: Point2D | null;
	} = { equations: [], intersection: null };

	cross: any = null;
	setCross = (val: any) => {
		this.cross = val;
		return this.cross;
	};

	labelMeasure: any = null;
	setLabelMeasure = (val: any) => {
		this.labelMeasure = val;
		return this.labelMeasure;
	};

	drag = false;
	setDrag = (doDrag: boolean) => {
		this.drag = doDrag;
		return this.drag;
	};
}
