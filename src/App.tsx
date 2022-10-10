import React, { useEffect, useRef, useState } from "react";

import {
	onWindowLoad,
	flush_button,
	onRoomColorClicked,
	onApplySurfaceClicked,
	modalToggle,
	getCanvasDimensions,
	setViewboxContent,
	appendObjects,
} from "../func";
import * as engine from "../engine";
import { qSVG } from "../qSVG";
import { editor } from "../editor";
import { computeLimit, intersectionOfEquations } from "./utils";

import "./App.css";
import {
	HistorySnapshot,
	Mode,
	ObjectEquationData,
	ObjectMetaData,
	Point2D,
	RoomMetaData,
	WallEquation,
	WallEquationGroup,
	WallMetaData,
	ViewboxData,
	SvgPathMetaData,
	NodeWallObjectData,
} from "./models";
import { constants } from "../constants";
import { setInWallMeasurementText, updateMeasurementText } from "./svgTools";
import { Wall } from "./wall";
import { useHistory } from "./hooks/useHistory";
import WallTools from "./components/WallTools";
import ObjectTools from "./components/ObjectTools";
import DoorWindowTools from "./components/DoorWindowTools";

interface LayerSettings {
	showSurfaces: boolean;
	showMeasurements: boolean;
	showTexture: boolean;
	showEnergy: boolean;
}

let mode = Mode.Select;
const setMode = (m: string) => {
	mode = m;
	return mode;
};
let modeOption = "";
let wallMeta: WallMetaData[] = [];

const setWallMeta = (w: WallMetaData[]) => {
	// console.trace("setting wallMeta: ", w);
	wallMeta = w;
	return wallMeta;
};

let rooms: any = {};
const setRooms = (val: any) => {
	// console.log("Rooms set to: ", val);
	rooms = val;
	return rooms;
};

let roomMeta: RoomMetaData[] = [];
const setRoomMeta = (r: RoomMetaData[]) => {
	// console.log("setting roomMeta: ", r);
	roomMeta = r;
	return roomMeta;
};
let objectMeta: ObjectMetaData[] = [];
const setObjectMeta = (o: ObjectMetaData[]) => {
	objectMeta = o;
	return objectMeta;
};

let point: Point2D = { x: 0, y: 0 };
const setPoint = (p: Point2D) => {
	point = p;
	return point;
};
let x = 0;
const setX = (val: number) => {
	x = val;
	return x;
};
let y = 0;
const setY = (val: number) => {
	y = val;
	return y;
};
let action = false;
const setAction = (a: boolean) => {
	action = a;
	return action;
};

let wallStartConstruc = false;
const setWallStartConstruc = (val: boolean) => {
	wallStartConstruc = val;
	return wallStartConstruc;
};
let wallEndConstruc = false;
const setWallEndConstruc = (val: boolean) => {
	wallEndConstruc = val;
	return wallEndConstruc;
};

let currentNodeWallObjectData: NodeWallObjectData[] = [];
const setCurrentNodeWallObjectData = (newData: NodeWallObjectData[]) => {
	currentNodeWallObjectData = newData;
};

let currentNodeWalls: WallMetaData[] = [];
const setCurrentNodeWalls = (newWalls: WallMetaData[]) => {
	currentNodeWalls = newWalls;
};

let binder: any;
const setBinder = (val: any) => {
	// if (val == null) {
	// 	console.trace("binder set to null");
	// }
	binder = val;
	return binder;
};
let lineIntersectionP: any = null;
const setLineIntersectionP = (val: any) => {
	lineIntersectionP = val;
	return lineIntersectionP;
};
let lengthTemp: any = null;
let wallEquations: WallEquationGroup = {
	equation1: null,
	equation2: null,
	equation3: null,
};
const setWallEquations = (newEquations: WallEquationGroup) => {
	wallEquations = newEquations;
};
let objectEquationData: ObjectEquationData[] = [];
const setObjectEquationData = (newData: ObjectEquationData[]) => {
	objectEquationData = newData;
	return objectEquationData;
};

const followerData: {
	equations: { wall: WallMetaData; eq: WallEquation; type: string }[];
	intersection: Point2D | null;
} = { equations: [], intersection: null };

let viewbox: ViewboxData = {
	width: 0,
	height: 0,
	originX: 0,
	originY: 0,
	zoomFactor: 1,
	zoomLevel: 1,
};

let cross: any = null;
const setCross = (val: any) => {
	cross = val;
	return cross;
};

let labelMeasure: any = null;
const setLabelMeasure = (val: any) => {
	labelMeasure = val;
	return labelMeasure;
};

function App() {
	const [cursor, setCursor] = useState("default");
	const [showSurface, setShowSurface] = useState(true);
	const [addSurface, setAddSurface] = useState(true);
	const [ignoreSurface, setIgnoreSurface] = useState(false);
	const [layerSettings, setLayerSettings] = useState<LayerSettings>({
		showSurfaces: true,
		showEnergy: true,
		showMeasurements: true,
		showTexture: true,
	});

	// const [wallWidth, setWallWidth] = useState(7);

	const [selectedObject, setSelectedObject] = useState({
		minWidth: 0,
		maxWidth: 0,
		width: 0,
		minHeight: 0,
		maxHeight: 0,
		height: 0,
		rotation: 0,
		showStepCounter: false,
		stepCount: 0,
	});

	const [selectedOpening, setSelectedOpening] = useState({
		minWidth: 0,
		maxWidth: 0,
		width: 0,
	});

	const [enableUndo, setEnableUndo] = useState(false);
	const [enableRedo, setEnableRedo] = useState(false);

	const [helperLineSvgData, setHelperLineSvgData] =
		useState<SvgPathMetaData | null>();

	const [showMainPanel, setShowMainPanel] = useState(true);
	const [showBoxScale, setShowBoxScale] = useState(true);
	const [showWallTools, setShowWallTools] = useState(false);
	const [wallToolsSeparation, setWallToolsSeparation] = useState(false);
	const [showWallToolsSeparateSlider, setShowWallToolsSeparateSlider] =
		useState(true);
	const [showConfigureDoorWindowPanel, setShowConfigureDoorWindowPanel] =
		useState(false);
	const [showObjectTools, setShowConfigureObjectPanel] = useState(false);
	const [showReportTools, setShowReportTools] = useState(false);
	const [showRoomTools, setShowRoomTools] = useState(false);
	const [selectedRoomData, setSelectedRoomData] = useState({
		size: "",
		roomIndex: 0,
		surface: "",
		showSurface: true,
		seesArea: "",
		background: "",
		name: "",
		action: "",
	});
	const [scaleValue, setScaleValue] = useState(1);
	const [showSub, setShowSub] = useState(false);
	const [showMyModal, setShowMyModal] = useState(true);
	const [multiChecked, setMultiChecked] = useState(true);
	const [roomColor, setRoomColor] = useState("gradientNeutral");
	const [roomType, setRoomType] = useState("None");
	const [boxInfoText, setBoxInfoText] = useState("");
	const [showDoorList, setShowDoorList] = useState(false);
	const [showWindowList, setShowWindowList] = useState(false);
	const [showEnergyList, setShowEnergyList] = useState(false);
	const [showLayerList, setShowLayerList] = useState(false);
	const [drag, setDrag] = useState(false);
	const [boxCarpentryItems, setBoxCarpentryItems] = useState<any[]>([]);

	const { save, init, undo, redo, historyIndex } = useHistory();

	const resetViewbox = () => {
		const { w, h } = getCanvasDimensions();
		viewbox.width = w || 0;
		viewbox.height = h || 0;
	};

	const onKeyPress = (e: KeyboardEvent) => {
		// console.log(e);
		switch (e.key) {
			case "Escape":
			case "s":
				cancelWallCreation();
				enterSelectMode();
				break;
			case "w":
				onWallModeClicked();
				break;

			default:
				break;
		}
	};

	useEffect(() => {
		resetViewbox();
		onWindowLoad(viewbox);
		setShowMyModal(true);
		const onResize = () => {
			console.log("Window resize deteced. Resetting view box");
			resetViewbox();
			engine.onWindowResize(viewbox);
		};
		document.addEventListener("keydown", onKeyPress);
		window.addEventListener("resize", onResize);
		return () => {
			window.removeEventListener("resize", onResize);
			document.removeEventListener("keydown", onKeyPress);
		};
	}, []);

	const onUndoClicked = () => {
		if (historyIndex - 1 > 0) {
			const { objects, walls, rooms } = undo(viewbox);
			apply(objects, walls, rooms);
			setEnableRedo(true);
		}
		if (historyIndex == 1) {
			setEnableUndo(false);
		}
	};

	const onRedoClicked = () => {
		if (historyIndex < history.length) {
			const { objects, walls, rooms } = redo(viewbox);
			apply(objects, walls, rooms);
			setEnableUndo(true);
			if (historyIndex == history.length) {
				setEnableRedo(false);
			}
		}
	};

	const onDoorTypeClicked = (type: string) => {
		setCursor("crosshair");
		setBoxInfoText("Add a door");
		applyMode(Mode.Door, type);
	};

	const onWindowTypeClicked = (type: string) => {
		setCursor("crosshair");
		setBoxInfoText("Add a window");
		setShowDoorList(false);
		setShowWindowList(false);
		applyMode(Mode.Door, type);
	};

	const onObjectTypeClicked = (type: string) => {
		setShowSub(false);
		setShowDoorList(false);
		setCursor("move");
		setBoxInfoText("Add an object");
		applyMode(Mode.Object, type);
	};

	const applyMode = (mode: string, option = "") => {
		save(objectMeta, wallMeta, roomMeta);
		setShowSub(false);
		flush_button();
		setMode(mode);
		modeOption = option;

		setHelperLineSvgData(null);
	};

	const createInvisibleWall = (wall: any) => {
		var objWall = editor.objFromWall(binder.wall, objectMeta);
		if (objWall.length != 0) return false;
		wall.type = "separate";
		wall.backUp = wall.thick;
		wall.thick = 0.07;
		editor.architect(wallMeta, setRooms, roomMeta, setRoomMeta, wallEquations);
		save(objectMeta, wallMeta, roomMeta);
		return true;
	};

	const makeWallVisible = (wall: Wall) => {
		wall.makeVisible();
		editor.architect(wallMeta, setRooms, roomMeta, setRoomMeta, wallEquations);
		save(objectMeta, wallMeta, roomMeta);
	};

	const handleCameraChange = (lens: string, xmove: number, xview = 0) => {
		const { w: canvasWidth, h: canvasHeight } = getCanvasDimensions();
		if (lens == "zoomout" && viewbox.zoomLevel > 1 && viewbox.zoomLevel < 17) {
			viewbox.zoomLevel--;
			viewbox.width += xmove;
			var ratioWidthZoom = canvasWidth / viewbox.width;
			const ratio_viewbox = viewbox.height / viewbox.width;
			viewbox.height = viewbox.width * ratio_viewbox;
			setScaleValue(ratioWidthZoom);
			viewbox.originX = viewbox.originX - xmove / 2;
			viewbox.originY = viewbox.originY - (xmove / 2) * ratio_viewbox;
		}
		if (lens == "zoomin" && viewbox.zoomLevel < 14 && viewbox.zoomLevel > 0) {
			viewbox.zoomLevel++;
			viewbox.width -= xmove;
			var ratioWidthZoom = canvasWidth / viewbox.width;
			const ratio_viewbox = viewbox.height / viewbox.width;
			viewbox.height = viewbox.width * ratio_viewbox;
			setScaleValue(ratioWidthZoom);
			viewbox.originX = viewbox.originX + xmove / 2;
			viewbox.originY = viewbox.originY + (xmove / 2) * ratio_viewbox;
		}
		viewbox.zoomFactor = viewbox.width / canvasWidth;
		if (lens == "zoomreset") {
			viewbox.originX = 0;
			viewbox.originY = 0;
			viewbox.width = canvasWidth;
			viewbox.height = canvasHeight;
			viewbox.zoomFactor = 1;
		}
		if (lens == "zoomright") {
			viewbox.originX += xview;
		}
		if (lens == "zoomleft") {
			viewbox.originX -= xview;
		}
		if (lens == "zoomtop") {
			viewbox.originY -= xview;
		}
		if (lens == "zoombottom") {
			viewbox.originY += xview;
		}
		if (lens == "zoomdrag") {
			viewbox.originX -= xmove;
			viewbox.originY -= xview;
		}
		setViewboxContent(viewbox);
	};

	const initHistory = (type: string) => {
		const { objects, walls, rooms } = init(type, viewbox);
		apply(objects, walls, rooms);
	};

	const apply = (
		objectData: ObjectMetaData[],
		wallData: WallMetaData[],
		roomData: RoomMetaData[]
	) => {
		setObjectMeta(objectData);
		if (objectData.length > 0) {
			appendObjects(objectData);
		}

		setWallMeta(wallData);
		setRoomMeta(roomData);
		editor.architect(wallData, setRooms, roomData, setRoomMeta, wallEquations);

		editor.showScaleBox(roomData, wallData);
		updateMeasurementText(wallMeta);
	};

	// Wall Tools
	const onWallWidthChanged = (value: number) => {
		binder.wall.thick = value;
		binder.wall.type = "normal";
		editor.architect(wallMeta, setRooms, roomMeta, setRoomMeta, wallEquations);
		var objWall = editor.objFromWall(binder.wall, objectMeta);
		for (var w = 0; w < objWall.length; w++) {
			objWall[w].thick = value;
			objWall[w].update();
		}
		updateMeasurementText(wallMeta);
	};

	const onWallSplitClicked = () => {
		splitWall(binder.wall);
		setMode(Mode.Select);
		setShowMainPanel(true);
	};

	const onWallSeparationClicked = () => {
		if (createInvisibleWall(binder.wall)) {
			setMode(Mode.Select);
			setShowMainPanel(true);
		} else {
			setBoxInfoText("Walls containing doors or windows cannot be separated!");
		}
	};

	const onTransformToWallClicked = () => {
		makeWallVisible(binder.wall);
		setMode(Mode.Select);
		setShowMainPanel(true);
	};

	const onWallTrashClicked = () => {
		const wall = binder.wall;
		for (var k in wallMeta) {
			if (wallMeta[k].child === wall.id) wallMeta[k].child = null;
			if (wallMeta[k].parent === wall.id) {
				wallMeta[k].parent = null;
			}
		}
		wallMeta.splice(wallMeta.indexOf(wall), 1);
		setShowWallTools(false);
		wall.graph.remove();
		binder.graph.remove();
		editor.architect(wallMeta, setRooms, roomMeta, setRoomMeta, wallEquations);
		updateMeasurementText(wallMeta);
		setMode(Mode.Select);
		setShowMainPanel(true);
	};

	// Object Tools
	const onObjectWidthChanged = (val: number) => {
		var objTarget = binder.obj;
		objTarget.size = (val / 100) * constants.METER_SIZE;
		objTarget.update();
		binder.size = (val / 100) * constants.METER_SIZE;
		binder.update();
	};

	const onConfigureObjectBackClicked = () => {
		applyMode(Mode.Select);
		setBoxInfoText("Mode selection");
		setShowConfigureObjectPanel(false);
		setShowMainPanel(true);
		binder.graph.remove();
		binder = null;
	};

	const onObjectHeightChanged = (val: number) => {
		var objTarget = binder.obj;
		objTarget.thick = (val / 100) * constants.METER_SIZE;
		objTarget.update();
		binder.thick = (val / 100) * constants.METER_SIZE;
		binder.update();
	};

	const onObjectNumStepsChanged = (val: number) => {
		binder.obj.value = val;
		binder.obj.update();
	};

	const onObjectRotationChanged = (val: number) => {
		var objTarget = binder.obj;
		objTarget.angle = val;
		objTarget.update();
		binder.angle = val;
		binder.update();
	};

	const onObjectTrashClicked = () => {
		setBoxInfoText("Object removed");
		setShowConfigureObjectPanel(false);
		setShowMainPanel(true);
		applyMode(Mode.Select);

		var obj = binder.obj;
		obj.graph.remove();
		setObjectMeta([...objectMeta.filter((o) => o != obj)]);
		binder.graph.remove();
		setBinder(null);
		updateMeasurementText(wallMeta);
	};

	// Door/Window Tools
	const onFlipOpeningClicked = () => {
		console.log("on flip clicked");
		var target = binder.obj;
		var hingeStatus = target.hinge; // normal - reverse
		target.hinge = hingeStatus == "normal" ? "reverse" : "normal";
		target.update();
	};

	const onOpeningWidthChanged = (val: number) => {
		var objTarget = binder.obj;
		let wallBind = editor.rayCastingWall(objTarget, wallMeta);
		if (wallBind.length > 1) {
			wallBind = wallBind[wallBind.length - 1];
		}
		var limits = computeLimit(wallBind.equations.base, val, objTarget);
		if (
			wallBind.pointInsideWall(limits[0]) &&
			wallBind.pointInsideWall(limits[1])
		) {
			objTarget.size = val;
			objTarget.limit = limits;
			objTarget.update();
			binder.size = val;
			binder.limit = limits;
			binder.update();
		}
		// wallBind.inWallRib(objectMeta);
		setInWallMeasurementText(wallBind, objectMeta);
	};

	const onWallModeClicked = () => {
		setCursor("crosshair");
		setBoxInfoText("Wall creation");
		setAction(false);
		applyMode(Mode.Line);
	};

	const splitWall = (wallToSplit: WallMetaData) => {
		var eqWall = wallToSplit.getEquation();
		var wallToSplitLength = qSVG.gap(wallToSplit.start, wallToSplit.end);
		var newWalls: { distance: number; coords: Point2D }[] = [];

		wallMeta.forEach((wall) => {
			var eq = wall.getEquation();
			var inter = intersectionOfEquations(eqWall, eq);
			if (
				inter &&
				binder.wall.pointInsideWall(inter, true) &&
				wall.pointInsideWall(inter, true)
			) {
				var distance = qSVG.gap(wallToSplit.start, inter);
				if (distance > 5 && distance < wallToSplitLength) {
					newWalls.push({ distance: distance, coords: inter });
				}
			}
		});

		newWalls.sort((a: { distance: number }, b: { distance: number }) => {
			return a.distance - b.distance;
		});

		var initCoords = wallToSplit.start;
		var initThick = wallToSplit.thick;

		// Clear the wall to split from its parents and children
		wallMeta.forEach((wall) => {
			if (wall.child === wallToSplit.id) {
				wall.child = null;
			} else if (wall.parent === wallToSplit.id) {
				wall.parent = null;
			}
		});

		// Remove the wall to split from the list of walls
		wallMeta = setWallMeta([...wallMeta.filter((w) => w.id != wallToSplit.id)]);

		newWalls.forEach((newWall) => {
			const wall = new Wall(initCoords, newWall.coords, "normal", initThick);
			wall.child = wallMeta[wallMeta.length - 1].id;
			initCoords = newWall.coords;
			wallMeta = setWallMeta([...wallMeta, wall]);
		});

		// LAST WALL ->
		const wall = new Wall(initCoords, wallToSplit.end, "normal", initThick);
		wallMeta = setWallMeta([...wallMeta, wall]);
		console.log("Split into: ", wallMeta);
		editor.architect(wallMeta, setRooms, roomMeta, setRoomMeta, wallEquations);
		save(objectMeta, wallMeta, roomMeta);
		return true;
	};

	const enterSelectMode = () => {
		setBoxInfoText("Selection mode");
		binder = null;
		setCursor("default");
		applyMode(Mode.Select);
	};

	const onMouseWheel = (e: React.WheelEvent<SVGSVGElement>) => {
		// e.preventDefault();
		if (e.deltaY > 0) {
			handleCameraChange("zoomin", 100);
		} else {
			handleCameraChange("zoomout", 100);
		}
	};

	const cancelWallCreation = () => {
		if ((mode == Mode.Line || mode == Mode.Partition) && action) {
			setAction(false);
			engine.resetWallCreation(binder, lengthTemp);
			binder = null;
			lengthTemp = null;
		}
	};

	const getCursorImg = (str: string) => {
		switch (str) {
			case "grab":
				return constants.GRAB_CURSOR;
			case "scissor":
				return constants.SCISSOR_CURSOR;
			case "trash":
				return constants.TRASH_CURSOR;
			case "validation":
				return constants.VALIDATION_CURSOR;
			default:
				return str;
		}
	};

	const addSvgPath = (data: SvgPathMetaData) => {};

	return (
		<>
			<header>React Floor Planner Ver.0.1</header>

			<svg
				id="lin"
				viewBox="0 0 1100 700"
				preserveAspectRatio="xMidYMin slice"
				xmlns="http://www.w3.org/2000/svg"
				onWheel={(e) => {
					e.preventDefault();
					onMouseWheel(e);
				}}
				onClick={(e) => e.preventDefault()}
				onMouseDown={(e) =>
					engine._MOUSEDOWN(
						e,
						mode.toString(),
						setMode,
						setPoint,
						editor,
						wallMeta,
						setWallMeta,
						objectMeta,
						action,
						setAction,
						setDrag,
						binder,
						setBinder,
						setCurrentNodeWallObjectData,
						wallEquations,
						setWallEquations,
						setObjectEquationData,
						followerData,
						setCurrentNodeWalls,
						setCursor,
						viewbox
					)
				}
				onMouseUp={(e) =>
					engine._MOUSEUP(
						e,
						mode.toString(),
						setMode,
						multiChecked,
						() => {
							applyMode(Mode.Select);
							return Mode.Select.toString();
						},
						setCursor,
						editor,
						setRooms,
						roomMeta,
						setRoomMeta,
						wallMeta,
						setWallMeta,
						objectMeta,
						setObjectMeta,
						action,
						setAction,
						setDrag,
						binder,
						setBinder,
						viewbox,
						lineIntersectionP,
						lengthTemp,
						(val: any) => (lengthTemp = val),
						point,
						setPoint,
						x,
						y,
						wallEndConstruc,
						setWallEndConstruc,
						() => {
							save(objectMeta, wallMeta, roomMeta);
						},
						wallEquations,
						followerData,
						(value: number, separation: boolean) => {
							// setWallWidth(value);
							setWallToolsSeparation(separation);
							// setShowWallToolsSeparateSlider(wallLength > 0 && !separation);
							setBoxInfoText(
								`Modify the ${wallToolsSeparation ? "separation" : "wall"}`
							);
							setShowMainPanel(false);
							setShowWallTools(true);
						},
						() => {
							setShowMainPanel(false);
							setShowConfigureObjectPanel(true);
							const objTarget = binder.obj;
							const limit = objTarget.params.resizeLimit;
							console.log(objTarget.class);
							setSelectedObject({
								minWidth: +limit.width.min,
								maxWidth: +limit.width.max,
								width: +objTarget.width * 100,
								minHeight: +limit.height.min,
								maxHeight: +limit.height.max,
								height: +objTarget.height * 100,
								rotation: +objTarget.angle,
								showStepCounter: objTarget.class === "stair",
								stepCount: +objTarget.value,
							});
							setBoxInfoText("Modify the object");
						},
						(min: number, max: number, value: number) => {
							setSelectedOpening({
								minWidth: min,
								maxWidth: max,
								width: value,
							});
							setCursor("default");
							setBoxInfoText("Configure the door/window");
							setShowMainPanel(false);
							setShowConfigureDoorWindowPanel(true);
						},
						(roomData: {
							size: string;
							roomIndex: number;
							surface: string;
							showSurface: boolean;
							seesArea: string;
							background: string;
							name: string;
							action: string;
						}) => {
							setSelectedRoomData(roomData);
							if (roomData.background) {
								setRoomColor(roomData.background);
							}
							setShowMainPanel(false);
							setShowRoomTools(true);
							setCursor("default");
							setBoxInfoText("Configure the room");
						},
						cross,
						setCross,
						labelMeasure,
						setLabelMeasure,
						layerSettings.showMeasurements,
						setHelperLineSvgData
					)
				}
				onMouseMove={(e) => {
					//throttle(function (e: React.MouseEvent) {
					setShowSub(false);
					engine._MOUSEMOVE(
						e,
						mode.toString(),
						modeOption,
						point,
						setPoint,
						x,
						setX,
						y,
						setY,
						multiChecked,
						setCursor,
						editor,
						rooms,
						setRooms,
						roomMeta,
						setRoomMeta,
						wallMeta,
						setWallMeta,
						objectMeta,
						setObjectMeta,
						action,
						drag,
						binder,
						setBinder,
						viewbox,
						handleCameraChange,
						lineIntersectionP,
						setLineIntersectionP,
						lengthTemp,
						(val: any) => (lengthTemp = val),
						setWallStartConstruc,
						wallEndConstruc,
						setWallEndConstruc,
						currentNodeWallObjectData,
						wallEquations,
						followerData,
						objectEquationData,
						(): ObjectEquationData[] => setObjectEquationData([]),
						currentNodeWalls,
						cross,
						setCross,
						labelMeasure,
						setLabelMeasure,
						setHelperLineSvgData
					);
					//}, 30);
				}}
				style={{
					zIndex: 2,
					margin: 0,
					padding: 0,
					width: "100vw",
					height: "100vh",
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
				}}
				cursor={getCursorImg(cursor)}
			>
				<defs>
					<linearGradient
						id="roomGradientRed"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
						spreadMethod="pad"
					>
						<stop
							offset="0%"
							stopColor={constants.COLOR_ROOM_RED}
							stopOpacity="1"
						/>
						<stop
							offset="100%"
							stopColor={constants.COLOR_ROOM_RED}
							stopOpacity="1"
						/>
					</linearGradient>
					<linearGradient
						id="roomGradientOrange"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
						spreadMethod="pad"
					>
						<stop
							offset="0%"
							stopColor={constants.COLOR_ROOM_ORANGE}
							stopOpacity="1"
						/>
						<stop
							offset="100%"
							stopColor={constants.COLOR_ROOM_ORANGE}
							stopOpacity="1"
						/>
					</linearGradient>
					<linearGradient
						id="roomGradientBlue"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
						spreadMethod="pad"
					>
						<stop
							offset="0%"
							stopColor={constants.COLOR_ROOM_BLUE}
							stopOpacity="1"
						/>
						<stop
							offset="100%"
							stopColor={constants.COLOR_ROOM_BLUE}
							stopOpacity="1"
						/>
					</linearGradient>
					<linearGradient
						id="roomGradientGreen"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
						spreadMethod="pad"
					>
						<stop
							offset="0%"
							stopColor={constants.COLOR_ROOM_GREEN}
							stopOpacity="1"
						/>
						<stop
							offset="100%"
							stopColor={constants.COLOR_ROOM_GREEN}
							stopOpacity="1"
						/>
					</linearGradient>
					<linearGradient
						id="roomGradientGray"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
						spreadMethod="pad"
					>
						<stop
							offset="0%"
							stopColor={constants.COLOR_ROOM_GRAY}
							stopOpacity="1"
						/>
						<stop
							offset="100%"
							stopColor={constants.COLOR_ROOM_GRAY}
							stopOpacity="1"
						/>
					</linearGradient>
					<linearGradient
						id="roomGradientBlack"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
						spreadMethod="pad"
					>
						<stop
							offset="0%"
							stopColor={constants.COLOR_ROOM_BLACK}
							stopOpacity="1"
						/>
						<stop
							offset="100%"
							stopColor={constants.COLOR_ROOM_BLACK}
							stopOpacity="1"
						/>
					</linearGradient>
					<linearGradient
						id="gradientRed"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
						spreadMethod="pad"
					>
						<stop offset="0%" stopColor="#e65d5e" stopOpacity="1" />
						<stop offset="100%" stopColor="#e33b3c" stopOpacity="1" />
					</linearGradient>
					<linearGradient
						id="gradientYellow"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
						spreadMethod="pad"
					>
						<stop offset="0%" stopColor="#FDEB71" stopOpacity="1" />
						<stop offset="100%" stopColor="#F8D800" stopOpacity="1" />
					</linearGradient>
					<linearGradient
						id="gradientGreen"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
						spreadMethod="pad"
					>
						<stop offset="0%" stopColor="#c0f7d9" stopOpacity="1" />
						<stop offset="100%" stopColor="#6ce8a3" stopOpacity="1" />
					</linearGradient>
					<linearGradient
						id="gradientSky"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
						spreadMethod="pad"
					>
						<stop offset="0%" stopColor="#c4e0f4" stopOpacity="1" />
						<stop offset="100%" stopColor="#87c8f7" stopOpacity="1" />
					</linearGradient>
					<linearGradient
						id="gradientOrange"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
						spreadMethod="pad"
					>
						<stop offset="0%" stopColor="#f9ad67" stopOpacity="1" />
						<stop offset="100%" stopColor="#f97f00" stopOpacity="1" />
					</linearGradient>
					<linearGradient
						id="gradientWhite"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
						spreadMethod="pad"
					>
						<stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
						<stop offset="100%" stopColor="#f0f0f0" stopOpacity="1" />
					</linearGradient>
					<linearGradient
						id="gradientGrey"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
						spreadMethod="pad"
					>
						<stop offset="0%" stopColor="#666" stopOpacity="1" />
						<stop offset="100%" stopColor="#aaa" stopOpacity="1" />
					</linearGradient>
					<linearGradient
						id="gradientBlue"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
						spreadMethod="pad"
					>
						<stop offset="0%" stopColor="#4f72a6" stopOpacity="1" />
						<stop offset="100%" stopColor="#365987" stopOpacity="1" />
					</linearGradient>
					<linearGradient
						id="gradientPurple"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
						spreadMethod="pad"
					>
						<stop offset="0%" stopColor="#E2B0FF" stopOpacity="1" />
						<stop offset="100%" stopColor="#9F44D3" stopOpacity="1" />
					</linearGradient>
					<linearGradient
						id="gradientPink"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
						spreadMethod="pad"
					>
						<stop offset="0%" stopColor="#f6c4dd" stopOpacity="1" />
						<stop offset="100%" stopColor="#f699c7" stopOpacity="1" />
					</linearGradient>
					<linearGradient
						id="gradientBlack"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
						spreadMethod="pad"
					>
						<stop offset="0%" stopColor="#3c3b3b" stopOpacity="1" />
						<stop offset="100%" stopColor="#000000" stopOpacity="1" />
					</linearGradient>
					<linearGradient
						id="gradientNeutral"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
						spreadMethod="pad"
					>
						<stop offset="0%" stopColor="#dbc6a0" stopOpacity="1" />
						<stop offset="100%" stopColor="#c69d56" stopOpacity="1" />
					</linearGradient>

					<pattern
						id="grass"
						patternUnits="userSpaceOnUse"
						width="256"
						height="256"
					>
						<image
							xlinkHref="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWh5nEP_Trwo96CJjev6lnKe0_dRdA63RJFaoc3-msedgxveJd"
							x="0"
							y="0"
							width="256"
							height="256"
						/>
					</pattern>
					<pattern
						id="wood"
						patternUnits="userSpaceOnUse"
						width="32"
						height="256"
					>
						<image
							xlinkHref="https://orig00.deviantart.net/e1f2/f/2015/164/8/b/old_oak_planks___seamless_texture_by_rls0812-d8x6htl.jpg"
							x="0"
							y="0"
							width="256"
							height="256"
						/>
					</pattern>
					<pattern
						id="tiles"
						patternUnits="userSpaceOnUse"
						width="25"
						height="25"
					>
						<image
							xlinkHref="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrkoI2Eiw8ya3J_swhfpZdi_ug2sONsI6TxEd1xN5af3DX9J3R"
							x="0"
							y="0"
							width="256"
							height="256"
						/>
					</pattern>
					<pattern
						id="granite"
						patternUnits="userSpaceOnUse"
						width="256"
						height="256"
					>
						<image
							xlinkHref="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9_nEMhnWVV47lxEn5T_HWxvFwkujFTuw6Ff26dRTl4rDaE8AdEQ"
							x="0"
							y="0"
							width="256"
							height="256"
						/>
					</pattern>
					<pattern
						id="smallGrid"
						width="60"
						height="60"
						patternUnits="userSpaceOnUse"
					>
						<path
							d="M 60 0 L 0 0 0 60"
							fill="none"
							stroke="#777"
							strokeWidth="0.25"
						/>
					</pattern>
					<pattern
						id="grid"
						width="180"
						height="180"
						patternUnits="userSpaceOnUse"
					>
						<rect width="180" height="180" fill="url(#smallGrid)" />
						<path
							d="M 200 10 L 200 0 L 190 0 M 0 10 L 0 0 L 10 0 M 0 190 L 0 200 L 10 200 M 190 200 L 200 200 L 200 190"
							fill="none"
							stroke="#999"
							strokeWidth="0.8"
						/>
					</pattern>
					<pattern
						id="hatch"
						width="5"
						height="5"
						patternTransform="rotate(50 0 0)"
						patternUnits="userSpaceOnUse"
					>
						<path
							d="M 0 0 L 0 5 M 10 0 L 10 10 Z"
							style={{ stroke: "#666", strokeWidth: 5 }}
						/>
					</pattern>
				</defs>
				<g id="boxgrid">
					<rect
						width="8000"
						height="5000"
						x="-3500"
						y="-2000"
						fill="url(#grid)"
					/>
				</g>
				<g id="boxpath"></g>
				<g id="boxSurface"></g>
				<g
					id="boxRoom"
					visibility={layerSettings.showTexture ? "visible" : "hidden"}
				></g>
				<g id="boxwall"></g>
				<g id="boxcarpentry">{boxCarpentryItems}</g>
				<g
					id="boxEnergy"
					visibility={layerSettings.showEnergy ? "visible" : "hidden"}
				></g>
				<g id="boxFurniture"></g>
				<g id="boxbind">
					{helperLineSvgData && (
						<path
							stroke={helperLineSvgData.stroke}
							d={`M${helperLineSvgData.p1.x},${helperLineSvgData.p1.y} L${helperLineSvgData.p2.x},${helperLineSvgData.p2.y} L${helperLineSvgData.p3.x},${helperLineSvgData.p3.y}`}
							strokeWidth="0.75"
							strokeOpacity="1"
							fill="none"
						></path>
					)}
				</g>
				<g
					id="boxArea"
					visibility={layerSettings.showSurfaces ? "visible" : "hidden"}
				></g>
				<g
					id="boxRib"
					visibility={layerSettings.showMeasurements ? "visible" : "hidden"}
				></g>
				<g id="boxScale" visibility={showBoxScale ? "visible" : "hidden"}></g>
				<g id="boxText"></g>
				<g id="boxDebug"></g>
			</svg>

			<div id="areaValue"></div>

			{showWallTools && (
				<WallTools
					binder={binder}
					onWallWidthChanged={onWallWidthChanged}
					onSeparationClicked={onWallSeparationClicked}
					onSplitClicked={onWallSplitClicked}
					onWallTrashClicked={onWallTrashClicked}
					onTransformToWallClicked={onTransformToWallClicked}
					showSeparationSlider={showWallToolsSeparateSlider}
					onGoBackClicked={() => {
						applyMode(Mode.Select);
						setBoxInfoText("Select Mode");
						setShowWallTools(false);
						setShowMainPanel(true);
					}}
				/>
			)}

			{showObjectTools && (
				<ObjectTools
					data={selectedObject}
					onHeightChanged={onObjectHeightChanged}
					onWidthChanged={onObjectWidthChanged}
					onNumStepsChanged={onObjectNumStepsChanged}
					onRotationChanged={onObjectRotationChanged}
					onBackClicked={onConfigureObjectBackClicked}
					onTrashClicked={onObjectTrashClicked}
				/>
			)}

			{showConfigureDoorWindowPanel && (
				<div id="objTools" className="leftBox">
					<DoorWindowTools
						data={selectedOpening}
						onFlipOpeningClicked={() => onFlipOpeningClicked()}
						onOpeningWidthChanged={(val: number) => onOpeningWidthChanged(val)}
						onTrashClicked={() => onObjectTrashClicked()}
						onBackClicked={() => {
							applyMode(Mode.Select);
							setBoxInfoText("Mode selection");
							setShowConfigureObjectPanel(false);
							setShowMainPanel(true);

							binder.graph.remove();
							updateMeasurementText(wallMeta);
						}}
					/>
				</div>
			)}

			{showRoomTools && (
				<div id="roomTools" className="leftBox">
					<span style={{ color: "#08d" }}>React Floor Planner</span> estimated a
					surface of :<br />
					<b>
						<span className="size">{`${selectedRoomData.size} m²`}</span>
					</b>
					<br />
					<br />
					<p>If you know the actual area, you enter it here</p>
					<div className="input-group">
						<input
							type="text"
							className="form-control"
							id="roomSurface"
							placeholder="actual area"
							aria-describedby="basic-addon2"
							value={selectedRoomData.surface}
							onChange={(e) =>
								setSelectedRoomData((prev) => ({
									...prev,
									surface: e.target.value,
								}))
							}
						/>
						<span className="input-group-addon" id="basic-addon2">
							m²
						</span>
					</div>
					<br />
					<input
						type="hidden"
						id="roomName"
						value={selectedRoomData.name != "" ? selectedRoomData.name : ""}
					/>
					Select Room Type :<br />
					<div className="btn-group">
						<button
							className="btn dropdown-toggle btn-default"
							data-toggle="dropdown"
							id="roomLabel"
						>
							{selectedRoomData.name != "" ? selectedRoomData.name : "None "}
							{/* <span className="caret">{roomType}</span> */}
						</button>
						<ul className="dropdown-menu">
							<li
								onClick={(e) => {
									setSelectedRoomData({ ...selectedRoomData, name: "None" });
								}}
							>
								<a href="#">None</a>
							</li>
							<li
								onClick={(e) => {
									setSelectedRoomData({
										...selectedRoomData,
										name: "Living Room",
									});
								}}
							>
								<a href="#">Living Room</a>
							</li>
							<li
								onClick={(e) => {
									setSelectedRoomData({ ...selectedRoomData, name: "Kitchen" });
								}}
							>
								<a href="#">Kitchen</a>
							</li>
							<li
								onClick={(e) => {
									setSelectedRoomData({
										...selectedRoomData,
										name: "Bathroom",
									});
								}}
							>
								<a href="#">Bathroom</a>
							</li>
							<li
								onClick={(e) => {
									setSelectedRoomData({
										...selectedRoomData,
										name: "Bathroom 2",
									});
								}}
							>
								<a href="#">Bathroom 2</a>
							</li>
							<li
								onClick={(e) => {
									setSelectedRoomData({
										...selectedRoomData,
										name: "Bedroom 1",
									});
								}}
							>
								<a href="#">Bedroom 1</a>
							</li>
							<li
								onClick={(e) => {
									setSelectedRoomData({
										...selectedRoomData,
										name: "Bedroom 2",
									});
								}}
							>
								<a href="#">Bedroom 2</a>
							</li>
							<li
								onClick={(e) => {
									setSelectedRoomData({
										...selectedRoomData,
										name: "Bedroom 3",
									});
								}}
							>
								<a href="#">Bedroom 3</a>
							</li>
							<li
								onClick={(e) => {
									setSelectedRoomData({
										...selectedRoomData,
										name: "Bedroom 4",
									});
								}}
							>
								<a href="#">Bedroom 4</a>
							</li>
							<li
								onClick={(e) => {
									setSelectedRoomData({
										...selectedRoomData,
										name: "Bedroom 5",
									});
								}}
							>
								<a href="#">Bedroom 5</a>
							</li>
							<li
								onClick={(e) => {
									setSelectedRoomData({
										...selectedRoomData,
										name: "Closet",
									});
								}}
							>
								<a href="#">Closet</a>
							</li>
							<li
								onClick={(e) => {
									setSelectedRoomData({
										...selectedRoomData,
										name: "Office",
									});
								}}
							>
								<a href="#">Office</a>
							</li>
							<li
								onClick={(e) => {
									setSelectedRoomData({
										...selectedRoomData,
										name: "Hall",
									});
								}}
							>
								<a href="#">Hall</a>
							</li>
							<li
								onClick={(e) => {
									setSelectedRoomData({
										...selectedRoomData,
										name: "Foyer",
									});
								}}
							>
								<a href="#">Foyer</a>
							</li>
							<li className="divider"></li>
							<li
								onClick={(e) => {
									setSelectedRoomData({
										...selectedRoomData,
										name: "Balcony",
									});
								}}
							>
								<a href="#">Balcony</a>
							</li>
							<li
								onClick={(e) => {
									setSelectedRoomData({
										...selectedRoomData,
										name: "Terrace",
									});
								}}
							>
								<a href="#">Terrace</a>
							</li>
							<li
								onClick={(e) => {
									setSelectedRoomData({
										...selectedRoomData,
										name: "Garage",
									});
								}}
							>
								<a href="#">Garage</a>
							</li>
							<li
								onClick={(e) => {
									setSelectedRoomData({
										...selectedRoomData,
										name: "Clearance",
									});
								}}
							>
								<a href="#">clearance</a>
							</li>
						</ul>
					</div>
					<br />
					<br />
					Meter :
					<div className="funkyradio">
						<div className="funkyradio-success">
							<input
								type="checkbox"
								name="roomShow"
								value="showSurface"
								id="seeArea"
								checked={showSurface}
								onChange={() => setShowSurface(!showSurface)}
							/>
							<label htmlFor="seeArea">Show the surface</label>
						</div>
					</div>
					<div className="funkyradio">
						<div className="funkyradio-success">
							<input
								type="radio"
								name="roomAction"
								id="addAction"
								value="add"
								checked={selectedRoomData.action == "add" || addSurface}
								onChange={() => setAddSurface(!addSurface)}
							/>
							<label htmlFor="addAction">Add the surface</label>
						</div>
						<div className="funkyradio-warning">
							<input
								type="radio"
								name="roomAction"
								id="passAction"
								value="pass"
								checked={selectedRoomData.action == "pass" || ignoreSurface}
								onChange={() => setIgnoreSurface(!ignoreSurface)}
							/>
							<label htmlFor="passAction">Ignore the surface</label>
						</div>
					</div>
					<hr />
					<p>Colors</p>
					<div
						className="roomColor"
						data-type="roomGradientRed"
						style={{
							background: `linear-gradient(30deg, ${constants.COLOR_ROOM_RED}, ${constants.COLOR_ROOM_RED})`,
						}}
						onClick={() => {
							setRoomColor("roomGradientRed");
							onRoomColorClicked("roomGradientRed", binder);
						}}
					></div>
					<div
						className="roomColor"
						data-type="roomGradientGreen"
						style={{
							background: `linear-gradient(30deg, ${constants.COLOR_ROOM_GREEN}, ${constants.COLOR_ROOM_GREEN})`,
						}}
						onClick={() => {
							setRoomColor("roomGradientGreen");
							onRoomColorClicked("roomGradientGreen", binder);
						}}
					></div>
					<div
						className="roomColor"
						data-type="roomGradientOrange"
						style={{
							background: `linear-gradient(30deg, ${constants.COLOR_ROOM_ORANGE}, ${constants.COLOR_ROOM_ORANGE})`,
						}}
						onClick={() => {
							setRoomColor("roomGradientOrange");
							onRoomColorClicked("roomGradientOrange", binder);
						}}
					></div>
					<div
						className="roomColor"
						data-type="roomGradientBlue"
						style={{
							background: `linear-gradient(30deg, ${constants.COLOR_ROOM_BLUE}, ${constants.COLOR_ROOM_BLUE})`,
						}}
						onClick={() => {
							setRoomColor("roomGradientBlue");
							onRoomColorClicked("roomGradientBlue", binder);
						}}
					></div>
					<div
						className="roomColor"
						data-type="roomGradientGray"
						style={{
							background: `linear-gradient(30deg, ${constants.COLOR_ROOM_GRAY}, ${constants.COLOR_ROOM_GRAY})`,
						}}
						onClick={() => {
							setRoomColor("roomGradientGray");
							onRoomColorClicked("roomGradientGray", binder);
						}}
					></div>
					{/* <div
						className="roomColor"
						data-type="roomGradientBlack"
						style={{
							background: `linear-gradient(30deg, ${constants.COLOR_ROOM_BLACK}, ${constants.COLOR_ROOM_BLACK})`,
						}}
						onClick={() => {
							setRoomColor("roomGradientBlack");
							onRoomColorClicked("roomGradientBlack", binder);
						}}
					></div> */}
					{/* <div
						className="roomColor"
						data-type="gradientYellow"
						style={{ background: "linear-gradient(30deg,#e4c06e, #ffb000)" }}
						onClick={() => {
							setRoomColor("gradientYellow");
							onRoomColorClicked("gradientYellow", binder);
						}}
					></div>
					<div
						className="roomColor"
						data-type="gradientGreen"
						style={{ background: "linear-gradient(30deg,#88cc6c, #60c437)" }}
						onClick={() => {
							setRoomColor("gradientGreen");
							onRoomColorClicked("gradientGreen", binder);
						}}
					></div>
					<div
						className="roomColor"
						data-type="gradientSky"
						style={{ background: "linear-gradient(30deg,#77e1f4, #00d9ff)" }}
						onClick={() => {
							setRoomColor("gradientSky");
							onRoomColorClicked("gradientSky", binder);
						}}
					></div>
					<div
						className="roomColor"
						data-type="gradientBlue"
						style={{ background: "linear-gradient(30deg,#4f72a6, #284d7e)" }}
						onClick={() => {
							setRoomColor("gradientBlue");
							onRoomColorClicked("gradientBlue", binder);
						}}
					></div>
					<div
						className="roomColor"
						data-type="gradientGrey"
						style={{ background: "linear-gradient(30deg,#666666, #aaaaaa)" }}
						onClick={() => {
							setRoomColor("gradientGrey");
							onRoomColorClicked("gradientGrey", binder);
						}}
					></div>
					<div
						className="roomColor"
						data-type="gradientWhite"
						style={{ background: "linear-gradient(30deg,#fafafa, #eaeaea)" }}
						onClick={() => {
							setRoomColor("gradientWhite");
							onRoomColorClicked("gradientWhite", binder);
						}}
					></div>
					<div
						className="roomColor"
						data-type="gradientOrange"
						style={{ background: "linear-gradient(30deg, #f9ad67, #f97f00)" }}
						onClick={() => {
							setRoomColor("gradientOrange");
							onRoomColorClicked("gradientOrange", binder);
						}}
					></div>
					<div
						className="roomColor"
						data-type="gradientPurple"
						style={{ background: "linear-gradient(30deg,#a784d9, #8951da)" }}
						onClick={() => {
							setRoomColor("gradientPurple");
							onRoomColorClicked("gradientPurple", binder);
						}}
					></div>
					<div
						className="roomColor"
						data-type="gradientPink"
						style={{ background: "linear-gradient(30deg,#df67bd, #e22aae)" }}
						onClick={() => {
							setRoomColor("gradientPink");
							onRoomColorClicked("gradientPink", binder);
						}}
					></div>
					<div
						className="roomColor"
						data-type="gradientBlack"
						style={{ background: "linear-gradient(30deg,#3c3b3b, #000000)" }}
						onClick={() => {
							setRoomColor("gradientBlack");
							onRoomColorClicked("gradientBlack", binder);
						}}
					></div>
					<div
						className="roomColor"
						data-type="gradientNeutral"
						style={{ background: "linear-gradient(30deg,#e2c695, #c69d56)" }}
						onClick={() => {
							setRoomColor("gradientNeutral");
							onRoomColorClicked("gradientNeutral", binder);
						}}
					></div> */}
					<br />
					<br />
					{/* <p>Matérials</p>
					<div
						className="roomColor"
						data-type="wood"
						style={{
							background:
								"url('https://orig00.deviantart.net/e1f2/f/2015/164/8/b/old_oak_planks___seamless_texture_by_rls0812-d8x6htl.jpg')",
						}}
						onClick={() => {
							setRoomColor("wood");
							onRoomColorClicked("wood", binder);
						}}
					></div>
					<div
						className="roomColor"
						data-type="tiles"
						style={{
							background:
								"url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrkoI2Eiw8ya3J_swhfpZdi_ug2sONsI6TxEd1xN5af3DX9J3R')",
						}}
						onClick={() => {
							setRoomColor("tiles");
							onRoomColorClicked("tiles", binder);
						}}
					></div>
					<div
						className="roomColor"
						data-type="granite"
						style={{
							background:
								"url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9_nEMhnWVV47lxEn5T_HWxvFwkujFTuw6Ff26dRTl4rDaE8AdEQ')",
						}}
						onClick={() => {
							setRoomColor("granite");
							onRoomColorClicked("granite", binder);
						}}
					></div>
					<div
						className="roomColor"
						data-type="grass"
						style={{
							background:
								"url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWh5nEP_Trwo96CJjev6lnKe0_dRdA63RJFaoc3-msedgxveJd')",
						}}
						onClick={() => {
							setRoomColor("grass");
							onRoomColorClicked("grass", binder);
						}}
					></div> */}
					<div data-type="#ff008a" style={{ clear: "both" }}></div>
					<br />
					<br />
					<input type="hidden" id="roomBackground" value={roomColor} />
					<input
						type="hidden"
						id="roomIndex"
						value={selectedRoomData.roomIndex}
					/>
					<button
						type="button"
						className="btn btn-primary"
						id="applySurface"
						onClick={() => {
							setShowRoomTools(false);
							setShowMainPanel(true);
							onApplySurfaceClicked(
								editor,
								rooms,
								roomMeta,
								setRoomMeta,
								binder,
								setBinder
							);
							setBoxInfoText("Room modified");
							applyMode(Mode.Select);
						}}
					>
						Apply
					</button>
					<button
						type="button"
						className="btn btn-danger"
						id="resetRoomTools"
						onClick={() => {
							setShowRoomTools(false);
							setShowMainPanel(true);
							setBoxInfoText("Room modified");
							applyMode(Mode.Select);
							if (binder && binder.remove) {
								binder.remove();
							}
							// onResetRoomToolsClicked(binder, setBinder);
						}}
					>
						Cancel
					</button>
					<br />
				</div>
			)}

			{showMainPanel && (
				<div
					id="panel"
					className="leftBox"
					onMouseMove={() => {
						cancelWallCreation();
					}}
				>
					<ul className="list-unstyled">
						<li>
							<button
								className={`btn ${enableUndo ? "" : "disabled"} halfy`}
								id="undo"
								title="undo"
								onClick={() => {
									onUndoClicked();
								}}
							>
								<i className="fa fa-chevron-circle-left" aria-hidden="true"></i>
							</button>
							<button
								className={`btn ${
									enableRedo ? "" : "disabled"
								} halfy pull-right`}
								id="redo"
								title="redo"
								onClick={() => {
									onRedoClicked();
								}}
							>
								<i
									className="fa fa-chevron-circle-right"
									aria-hidden="true"
								></i>
							</button>
						</li>
						<br />

						<li>
							<button
								className="btn btn-success fully "
								id="select_mode"
								style={{ boxShadow: "2px 2px 3px #ccc" }}
								onClick={() => {
									enterSelectMode();
								}}
							>
								<i className="fa fa-2x fa-mouse-pointer" aria-hidden="true"></i>
							</button>
						</li>
						<br />

						<li>
							<button
								className="btn btn-default fully "
								style={{
									marginBottom: "5px",
									outline: "none",
									boxShadow: "none !important",
								}}
								id="line_mode"
								data-toggle="tooltip"
								data-placement="right"
								title="Make walls"
								onMouseDown={() => onWallModeClicked()}
							>
								WALL
							</button>
							{/* <button
								className="btn btn-default fully "
								style={{ marginBottom: "8px" }}
								id="partition_mode"
								data-toggle="tooltip"
								data-placement="right"
								title="Make partitions wall"
								onClick={() => {
									setCursor("crosshair");
									setBoxInfoText("Partition creation");
									applyMode(Mode.Partition);
								}}
							>
								PARTITION
							</button> */}
							<div className="funkyradio" style={{ fontSize: "1em" }}>
								<div className="funkyradio-success">
									<input
										type="checkbox"
										id="multi"
										checked={multiChecked}
										onChange={() => setMultiChecked((prev) => !prev)}
									/>
									<label htmlFor="multi">Continuous</label>
								</div>
							</div>
						</li>
						<br />

						<li>
							<button
								className="btn btn-default fully "
								id="room_mode"
								onClick={() => {
									setBoxInfoText("Configure rooms");
									setCursor("pointer");
									setShowRoomTools(true);
									applyMode(Mode.Room);
								}}
							>
								Configure Rooms
							</button>
						</li>
						<br />
						{showDoorList && !showSub && (
							<div
								id="door_list"
								className="list-unstyled sub"
								style={{
									boxShadow: "2px 2px 3px #ccc",
									// background: "#fff",
									borderRadius: "0 5px 5px 0",
									padding: "10px",
									position: "absolute",
									left: "200px",
									width: "150px",
								}}
								onMouseLeave={() => setShowDoorList(false)}
							>
								<button
									className="btn btn-default fully door"
									id="opening"
									onClick={() => {
										onDoorTypeClicked("opening");
									}}
								>
									Opening
								</button>
								<button
									className="btn btn-default fully door"
									id="simple"
									onClick={() => {
										onDoorTypeClicked("simple");
									}}
								>
									Simple
								</button>
								<button
									className="btn btn-default fully door"
									id="double"
									onClick={() => {
										onDoorTypeClicked("double");
									}}
								>
									Double
								</button>
								{/* <button
									className="btn btn-default fully door"
									id="pocket"
									onClick={() => {
										onDoorTypeClicked("pocket");
									}}
								>
									Pocket
								</button> */}
							</div>
						)}
						<li>
							<button
								className="btn btn-default fully "
								id="door_mode"
								onClick={() => {
									setShowSub(false);
									// $(".sub").hide();

									setShowDoorList(!showDoorList);
									setShowWindowList(false);
									// $("#door_list").toggle(200);
									// $("#window_list").hide();
								}}
							>
								DOOR
							</button>
						</li>

						{showWindowList && !showSub && (
							<div
								id="window_list"
								className="list-unstyled sub"
								style={{
									boxShadow: "2px 2px 3px #ccc",
									// background: "#fff",
									borderRadius: "0 5px 5px 0",
									padding: "10px",
									position: "absolute",
									left: "200px",
									width: "150px",
								}}
								onMouseLeave={() => setShowWindowList(false)}
							>
								<button
									className="btn btn-default fully window"
									id="fix"
									onClick={() => {
										onWindowTypeClicked("fix");
									}}
								>
									Fix
								</button>
								<button
									className="btn btn-default fully window"
									id="flap"
									onClick={() => {
										onWindowTypeClicked("flap");
									}}
								>
									Simple
								</button>
								<button
									className="btn btn-default fully window"
									id="twin"
									onClick={() => {
										onWindowTypeClicked("twin");
									}}
								>
									Double
								</button>
								{/* <button
									className="btn btn-default fully window"
									id="bay"
									onClick={() => {
										onWindowTypeClicked("bay");
									}}
								>
									Slide
								</button> */}
							</div>
						)}
						<li>
							<button
								className="btn btn-default fully "
								id="window_mode"
								onClick={() => {
									setShowSub(false);
									setShowWindowList(!showWindowList);
									setShowDoorList(false);
									setShowEnergyList(false);
									// $(".sub").hide();
									// $("#window_list").toggle(200);
									// $("#door_list").hide();
								}}
							>
								WINDOW
							</button>
						</li>
						<li>
							<button
								className="btn btn-default fully object"
								id="stair_mode"
								onClick={() => {
									onDoorTypeClicked("stair_mode");
									setCursor("move");
									setBoxInfoText("Add a staircase");
									applyMode(Mode.Object, "simpleStair");
								}}
							>
								STAIR
							</button>
						</li>
						<br />
						{showEnergyList && !showSub && (
							<div
								id="energy_list"
								className="list-unstyled sub"
								style={{
									boxShadow: "2px 2px 3px #ccc",
									// background: "#fff",
									borderRadius: "0 5px 5px 0",
									padding: "10px",
									position: "absolute",
									left: "200px",
									bottom: "40px",
									// width: "400px",
								}}
								onMouseLeave={() => setShowEnergyList(false)}
							>
								<div
									style={{
										width: "150px",
										// float: "left",
										padding: "10px",
										display: "flex",
										justifyContent: "center",
									}}
								>
									{/* <p>Energy</p> */}
									<div
										style={{
											// float: "left",
											padding: "10px",
											margin: "5px",
											border: "1px solid #ddd",
											borderRadius: "5px",
										}}
									>
										{/* <p>Strong Current</p> */}
										<div style={{ width: "120px", padding: "2px" }}>
											<button
												className="btn btn-default fully object"
												id="switch"
												onClick={() => {
													onObjectTypeClicked("switch");
												}}
											>
												Switch
											</button>
											<button
												className="btn btn-default fully object"
												id="doubleSwitch"
												onClick={() => {
													onObjectTypeClicked("doubleSwitch");
												}}
											>
												Double switch
											</button>
											<button
												className="btn btn-default fully object"
												id="dimmer"
												onClick={() => {
													onObjectTypeClicked("dimmer");
												}}
											>
												Dimmer
											</button>
										</div>
										<div
											style={{ width: "120px", float: "left", padding: "2px" }}
										>
											<button
												className="btn btn-default fully object"
												id="plug"
												onClick={() => {
													onObjectTypeClicked("plug");
												}}
											>
												Outlet
											</button>
											<button
												className="btn btn-default fully object"
												id="roofLight"
												onClick={() => {
													onObjectTypeClicked("roofLight");
												}}
											>
												Ceiling light
											</button>
											<button
												className="btn btn-default fully object"
												id="wallLight"
												onClick={() => {
													onObjectTypeClicked("wallLight");
												}}
											>
												Wall light
											</button>
										</div>
									</div>
									{/* <div
										style={{
											width: "130px",
											float: "left",
											padding: "10px",
											margin: "5px",
											border: "1px solid #ddd",
											borderRadius: "5px",
										}}
									>
										<p>Low Current</p>
										<button
											className="btn btn-default fully object"
											id="www"
											onClick={() => {
												onObjectTypeClicked("www");
											}}
										>
											Internet access
										</button>
										<button
											className="btn btn-default fully object"
											id="rj45"
											onClick={() => {
												onObjectTypeClicked("rj45");
											}}
										>
											RJ45 Socket
										</button>
										<button
											className="btn btn-default fully object"
											id="tv"
											onClick={() => {
												onObjectTypeClicked("tv");
											}}
										>
											TV Antenne
										</button>
									</div>

									<div
										style={{
											width: "130px",
											float: "left",
											padding: "10px",
											margin: "5px",
											border: "1px solid #ddd",
											borderRadius: "5px",
										}}
									>
										<p>Thermal</p>
										<button
											className="btn btn-default fully object"
											id="boiler"
											onClick={() => {
												onObjectTypeClicked("boiler");
											}}
										>
											Hot water heater
										</button>
										<button
											className="btn btn-default fully object"
											id="heater"
											onClick={() => {
												onObjectTypeClicked("heater");
											}}
										>
											Heater
										</button>
										<button
											className="btn btn-default fully object"
											id="radiator"
											onClick={() => {
												onObjectTypeClicked("radiator");
											}}
										>
											Radiator
										</button>
									</div> */}
								</div>
							</div>
						)}
						<li>
							<button
								className="btn btn-default fully "
								id="object_mode"
								onClick={() => {
									setShowSub(false);
									setShowEnergyList(!showEnergyList);
									setShowDoorList(false);
									setShowWindowList(false);
								}}
							>
								DEVICES
							</button>
						</li>
						{/* <!-- <li><button className="btn btn-default fully " id="object_mode" onClick={() => { $('.sub').hide();$('#object_list').toggle(200); }}>FURNITURE</button></li> --> */}
						<br />

						<li>
							<button
								className="btn btn-default fully "
								id="layer_mode"
								onClick={() => {
									setShowSub(false);
									setShowLayerList(!showLayerList);
									// $(".sub").hide();
									// $("#layer_list").toggle(200);
								}}
							>
								Layers
							</button>
						</li>

						{showLayerList && !showSub && (
							<div
								id="layer_list"
								className="list-unstyled sub"
								style={{
									boxShadow: "2px 2px 3px #ccc",
									// display: "none",
									background: "#fff",
									borderRadius: "0 5px 5px 0",
									padding: "10px",
									position: "absolute",
									left: "200px",
									bottom: "100px",
									width: "200px",
								}}
							>
								<div className="funkyradio" style={{ fontSize: "0.8em" }}>
									<div className="funkyradio-info">
										<input
											type="checkbox"
											id="showRib"
											checked={layerSettings.showMeasurements}
											onChange={() => {
												const nextVal = !layerSettings.showMeasurements;
												setLayerSettings((prev) => ({
													...prev,
													showMeasurements: nextVal,
												}));
												setShowBoxScale(nextVal);
												// onShowRibClicked();
											}}
										/>
										<label htmlFor="showRib">Measurement</label>
									</div>
								</div>
								<div className="funkyradio" style={{ fontSize: "0.8em" }}>
									<div className="funkyradio-info">
										<input
											type="checkbox"
											id="showArea"
											checked={layerSettings.showSurfaces}
											onChange={() => {
												setLayerSettings((prev) => ({
													...prev,
													showSurfaces: !prev.showSurfaces,
												}));
											}}
										/>
										<label htmlFor="showArea">Surface</label>
									</div>
								</div>
								<div className="funkyradio" style={{ fontSize: "0.8em" }}>
									<div className="funkyradio-info">
										<input
											type="checkbox"
											id="showLayerRoom"
											checked={layerSettings.showTexture}
											onChange={() =>
												setLayerSettings((prev) => ({
													...prev,
													showTexture: !prev.showTexture,
												}))
											}
										/>
										<label htmlFor="showLayerRoom">Texture</label>
									</div>
								</div>
								<div className="funkyradio" style={{ fontSize: "0.8em" }}>
									<div className="funkyradio-info">
										<input
											type="checkbox"
											id="showLayerEnergy"
											checked={layerSettings.showEnergy}
											onChange={() =>
												setLayerSettings((prev) => ({
													...prev,
													showEnergy: !prev.showEnergy,
												}))
											}
										/>
										<label htmlFor="showLayerEnergy">Energy</label>
									</div>
								</div>
							</div>
						)}

						{/* <li>
						<button
							className="btn btn-default halfy "
							id="report_mode"
							title="Show report"
							onClick={() => func.onShowReportModeClicked()}
						>
							<i className="fa fa-calculator" aria-hidden="true"></i>
						</button>
						<button
							className="btn btn-default halfy pull-right"
							onClick={() => {
								fullscreen();
								this.style.display = "none";
								$("#nofull_mode").show();
							}}
							id="full_mode"
							title="Full screen"
						>
							<i className="fa fa-expand" aria-hidden="true"></i>
						</button>
						<button
							className="btn btn-default halfy pull-right"
							style={{ display: "none" }}
							onClick={() => {
								outFullscreen();
								this.style.display = "none";
								$("#full_mode").show();
							}}
							id="nofull_mode"
							data-toggle="tooltip"
							data-placement="right"
							title="Full screen"
						>
							<i className="fa fa-compress" aria-hidden="true"></i>
						</button>
					</li> */}

						<div style={{ clear: "both" }}></div>
					</ul>
				</div>
			)}

			<div
				className="modal modal-open fade col-xs-9 col-md-12"
				id="myModal"
				tabIndex={-1}
				role="dialog"
				aria-labelledby="myModalLabel"
				// style={{ display: "block" }}
			>
				<div className="modal-dialog" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<button
								type="button"
								className="close"
								data-dismiss="modal"
								aria-label="Close"
							>
								<span aria-hidden="true">&times;</span>
							</button>
							<h4 className="modal-title" id="myModalLabel">
								React Floor Plan v0.1
							</h4>
						</div>
						<div className="modal-body">
							<div id="recover">
								<p>
									A plan already exists in history, would you like recover it?
								</p>
								<button
									className="btn btn-default"
									onClick={() => {
										initHistory("recovery");
										modalToggle();
										setShowMyModal((prev) => !prev);
										// $("#myModal").modal("toggle");
									}}
								>
									Yes
								</button>
								<hr />
								<p>Or would you prefer to start a new plan?</p>
							</div>
							<div className="row">
								<div
									className="col-md-3 col-xs-3 boxMouseOver"
									style={{
										minHeight: "140px",
										margin: "15px",
										background: "url('newPlanEmpty.jpg')",
									}}
								>
									<img
										src="newPlanEmpty.jpg"
										className="img-responsive"
										onClick={() => {
											initHistory("");
											modalToggle();
											setShowMyModal((prev) => !prev);
											// $("#myModal").modal("toggle");
										}}
									/>
								</div>
								<div
									className="col-md-3 col-xs-3 boxMouseOver"
									style={{
										minHeight: "140px",
										margin: "15px",
										background: "url('newPlanEmpty.jpg')",
									}}
								>
									<img
										src="newPlanSquare.jpg"
										className="img-responsive"
										style={{ marginTop: "10px" }}
										onClick={() => {
											initHistory("newSquare");
											modalToggle();
											setShowMyModal((prev) => !prev);
											// $("#myModal").modal("toggle");
										}}
									/>
								</div>
								<div
									className="col-md-3 col-xs-3 boxMouseOver"
									style={{
										minHeight: "140px",
										margin: "15px",
										background: "url('newPlanEmpty.jpg')",
									}}
								>
									<img
										src="newPlanL.jpg"
										className="img-responsive"
										style={{ marginTop: "20px" }}
										onClick={() => {
											initHistory("newL");
											modalToggle();
											setShowMyModal((prev) => !prev);
											// $("#myModal").modal("toggle");
										}}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div
				style={{
					position: "absolute",
					bottom: "10px",
					left: "210px",
					fontSize: "1.5em",
					color: "#08d",
				}}
				id="boxinfo"
			>
				{boxInfoText}
			</div>

			<div
				id="moveBox"
				style={{
					position: "absolute",
					right: "15px",
					top: "15px",
					color: "#08d",
					background: "transparent",
					zIndex: "2",
					textAlign: "center",
					transitionDuration: "0.2s",
					transitionTimingFunction: "ease-in",
				}}
			>
				<p style={{ margin: "0px 0 0 0", fontSize: "11px" }}>
					<img
						src="https://cdn4.iconfinder.com/data/icons/mathematics-doodle-3/48/102-128.png"
						width="20px"
					/>{" "}
					React Floor Plan
				</p>
				<div className="pull-right" style={{ margin: "10px" }}>
					<p style={{ margin: 0 }}>
						<button
							className="btn btn-xs btn-info zoom"
							data-zoom="zoomtop"
							style={{ boxShadow: "2px 2px 3px #ccc" }}
							onClick={() => handleCameraChange("zoomtop", 200, 50)}
						>
							<i className="fa fa-arrow-up" aria-hidden="true"></i>
						</button>
					</p>
					<p style={{ margin: 0 }}>
						<button
							className="btn btn-xs btn-info zoom"
							data-zoom="zoomleft"
							style={{ boxShadow: "2px 2px 3px #ccc" }}
							onClick={() => handleCameraChange("zoomleft", 200, 50)}
						>
							<i className="fa fa-arrow-left" aria-hidden="true"></i>
						</button>
						<button
							className="btn btn-xs btn-default zoom"
							data-zoom="zoomreset"
							style={{ boxShadow: "2px 2px 3px #ccc" }}
							onClick={() => handleCameraChange("zoomreset", 200, 50)}
						>
							<i className="fa fa-bullseye" aria-hidden="true"></i>
						</button>
						<button
							className="btn btn-xs btn-info zoom"
							data-zoom="zoomright"
							style={{ boxShadow: "2px 2px 3px #ccc" }}
							onClick={() => handleCameraChange("zoomright", 200, 50)}
						>
							<i className="fa fa-arrow-right" aria-hidden="true"></i>
						</button>
					</p>
					<p style={{ margin: 0 }}>
						<button
							className="btn btn-xs btn-info zoom"
							data-zoom="zoombottom"
							style={{ boxShadow: "2px 2px 3px #ccc" }}
							onClick={() => handleCameraChange("zoombottom", 200, 50)}
						>
							<i className="fa fa-arrow-down" aria-hidden="true"></i>
						</button>
					</p>
				</div>
			</div>

			<div
				id="zoomBox"
				style={{
					position: "absolute",
					zIndex: "100",
					right: "15px",
					bottom: "20px",
					textAlign: "center",
					background: "transparent",
					padding: "0px",
					color: "#fff",
					transitionDuration: "0.2s",
					transitionTimingFunction: "ease-in",
				}}
			>
				<div className="pull-right" style={{ marginRight: "10px" }}>
					<button
						className="btn btn btn-default zoom"
						data-zoom="zoomin"
						style={{ boxShadow: "2px 2px 3px #ccc" }}
						onClick={() => handleCameraChange("zoomin", 200, 50)}
					>
						<i className="fa fa-plus" aria-hidden="true"></i>
					</button>
					<button
						className="btn btn btn-default zoom"
						data-zoom="zoomout"
						style={{ boxShadow: "2px 2px 3px #ccc" }}
						onClick={() => handleCameraChange("zoomout", 200, 50)}
					>
						<i className="fa fa-minus" aria-hidden="true"></i>
					</button>
				</div>
				<div style={{ clear: "both" }}></div>
				<div
					id="scaleVal"
					className="pull-right"
					style={{
						boxShadow: "2px 2px 3px #ccc",
						width: 60 * scaleValue + "px",
						height: "20px",
						background: "#4b79aa",
						borderRadius: "4px",
						marginRight: "10px",
					}}
				>
					1m
				</div>

				<div style={{ clear: "both" }}></div>
			</div>
		</>
	);
}

export default App;
