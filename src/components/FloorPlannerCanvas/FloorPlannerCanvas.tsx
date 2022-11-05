import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { constants } from '../../../constants';
import { CanvasState } from '../../engine';
import { handleMouseMove } from '../../engine/mouseMove/MouseMoveHandler';
import { handleMouseUp } from '../../engine/mouseUp/MouseUpHandler';
import { useDevices } from '../../hooks/useDevices';
import { useDrawScaleBox } from '../../hooks/useDrawScaleBox';
import { useDrawWalls } from '../../hooks/useDrawWalls';
import { useHandleMouseDown } from '../../hooks/useHandleMouseDown';
import { useHistory } from '../../hooks/useHistory';
import { useWallMeasurements } from '../../hooks/useWallMeasurements';
import {
	CursorType,
	DeviceMetaData,
	LayerSettings,
	Mode,
	NodeMoveData,
	ObjectEquationData,
	ObjectMetaData,
	Point2D,
	RoomDisplayData,
	RoomMetaData,
	RoomPolygonData,
	SnapData,
	ViewboxData,
	WallEquationGroup,
	WallMetaData
} from '../../models/models';
import { setAction, setCursor, setMode } from '../../store/floorPlanSlice';
import { RootState } from '../../store/store';
import {
	calculateObjectRenderData,
	getPolygonVisualCenter,
	getUpdatedObject,
	pointInPolygon,
	polygonize,
	refreshWalls,
	renderRooms
} from '../../utils/svgTools';
import {
	calculateSnap,
	computeLimit,
	getWallsOnPoint,
	perpendicularEquation
} from '../../utils/utils';
import { GradientData } from './GradientData';
import LinearGradient from './LinearGradient';
import Patterns from './Patterns';

let shouldUpdateMouseMove = true;

interface Props {
	layerSettings: LayerSettings;
	canvasState: CanvasState;
	continuousWallMode: boolean;
	updateRoomDisplayData: (roomData: RoomDisplayData) => void;
	onMouseMove: () => void;
	startModifyingOpening: (object: ObjectMetaData) => void;
	wallClicked: (wall: WallMetaData) => void;
	cursor: CursorType;
	setCanvasDimensions: (d: { width: number; height: number }) => void;
	viewbox: ViewboxData;
	roomPolygonData: RoomPolygonData;
	setRoomPolygonData: (r: RoomPolygonData) => void;
	roomMetaData: RoomMetaData[];
	setRoomMetaData: (r: RoomMetaData[]) => void;
	objectMetaData: ObjectMetaData[];
	setObjectMetaData: React.Dispatch<React.SetStateAction<ObjectMetaData[]>>;
	wallMetaData: WallMetaData[];
	setWallMetaData: (w: WallMetaData[]) => void;
	openingWidth: number | null;
	openingIdBeingEdited: string | undefined;
	selectedRoomColor: string | undefined;
	deviceBeingMoved: DeviceMetaData | undefined;
	setDeviceBeingMoved: React.Dispatch<React.SetStateAction<DeviceMetaData | undefined>>;
	zoomCameraIn: () => void;
	zoomCameraOut: () => void;
	dragCamera: (distX: number, distY: number) => void;
	defaultRoomColor: string;
	textColor?: string | undefined;
	wallColor?: string | undefined;
}

interface RoomPathData {
	room: RoomMetaData;
	path: string;
	centerPoint: Point2D;
}

const FloorPlannerCanvas: React.FC<Props> = ({
	layerSettings,
	canvasState,
	continuousWallMode,
	updateRoomDisplayData,
	startModifyingOpening,
	wallClicked,
	onMouseMove,
	setCanvasDimensions,
	viewbox,
	roomPolygonData,
	setRoomPolygonData,
	roomMetaData,
	setRoomMetaData,
	objectMetaData,
	setObjectMetaData,
	wallMetaData,
	setWallMetaData,
	openingWidth,
	openingIdBeingEdited,
	selectedRoomColor,
	deviceBeingMoved,
	setDeviceBeingMoved,
	zoomCameraIn,
	zoomCameraOut,
	dragCamera,
	defaultRoomColor,
	textColor,
	wallColor
}) => {
	const dispatch = useDispatch();
	const cursor = useSelector((state: RootState) => state.floorPlan.cursor);
	const action = useSelector((state: RootState) => state.floorPlan.action);
	const openingType = useSelector((state: RootState) => state.floorPlan.doorType);
	const objectType = useSelector((state: RootState) => state.floorPlan.objectType);

	const [dragging, setDragging] = useState(false);
	const [cursorImg, setCursorImg] = useState('default');
	const [roomPathInfo, setRoomPathInfo] = useState<RoomPathData[]>([]);
	const [renderWalls, setRenderWalls] = useState<WallMetaData[]>([]);
	const [objectsToRender, setObjectsToRender] = useState<ObjectMetaData[]>([]);
	const [snapPosition, setSnapPosition] = useState<SnapData>({
		x: 0,
		y: 0,
		xMouse: 0,
		yMouse: 0
	});
	const [point, setPoint] = useState<Point2D>({ x: 0, y: 0 });
	const [selectedWallData, setSelectedWallData] = useState<{
		wall: WallMetaData;
		before: Point2D;
	} | null>(null);
	const [wallUnderCursor, setWallUnderCursor] = useState<WallMetaData | null>(null);
	const [nodeUnderCursor, setNodeUnderCursor] = useState<Point2D | undefined>();
	const [objectUnderCursor, setObjectUnderCursor] = useState<ObjectMetaData | undefined>();
	const [nodeBeingMoved, setNodeBeingMoved] = useState<NodeMoveData | undefined>();
	const [objectBeingMoved, setObjectBeingMoved] = useState<ObjectMetaData | null>(null);
	const [roomUnderCursor, setRoomUnderCursor] = useState<RoomMetaData | undefined>();
	const [selectedRoomRenderData, setSelectedRoomRenderData] = useState<
		{ path: string; selected: boolean; selectedColor: string | undefined } | undefined
	>();
	const [objectEquationData, setObjectEquationData] = useState<ObjectEquationData[]>([]);
	const [wallEquationData, setWallEquationData] = useState<WallEquationGroup>({
		equation1: null,
		equation2: null,
		equation3: null
	});

	const gradientData = useMemo<{ id: string; color1: string; color2: string }[]>(
		() => GradientData,
		[]
	);

	const canvasRef = useRef<SVGSVGElement>(null);

	const { devices, setDevices, deviceUnderCursor } = useDevices(
		snapPosition,
		deviceBeingMoved,
		setDeviceBeingMoved
	);

	const mode = useSelector((state: RootState) => state.floorPlan.mode);

	const {
		startWallDrawing,
		wallHelperTextData,
		wallHelperNodeCircle,
		wallHelperPathInfo,
		wallEndConstructionData,
		helperLineSvgData,
		shouldWallConstructionEnd,
		clearWallHelperState
	} = useDrawWalls(snapPosition, wallMetaData, mode, continuousWallMode, (newPoint: Point2D) =>
		setPoint(newPoint)
	);

	useEffect(() => {
		if (objectBeingMoved) {
			setObjectMetaData((prev) => [...prev]);
		}
	}, [objectBeingMoved, setObjectMetaData]);

	useEffect(() => {
		if (deviceBeingMoved) {
			dispatch(setMode(Mode.Device));
		} else {
			if (mode !== Mode.Room) {
				setRoomUnderCursor(undefined);
				setSelectedRoomRenderData(undefined);
			}
			return;
		}

		let targetRoom: RoomMetaData | undefined = undefined;
		roomMetaData.forEach((room: RoomMetaData) => {
			if (
				pointInPolygon({ x: deviceBeingMoved.x, y: deviceBeingMoved.y }, room.coords) &&
				(targetRoom == null || targetRoom.area >= room.area)
			) {
				targetRoom = room;
			}
		});
		setRoomUnderCursor(targetRoom);
	}, [canvasState, deviceBeingMoved, snapPosition, roomMetaData]);

	useEffect(() => {
		if (!wallUnderCursor) return;
		const objectsOnWall = wallUnderCursor.getObjects(objectMetaData);
		const newEqData = objectsOnWall.map((objTarget) => ({
			obj: objTarget,
			wall: wallUnderCursor,
			eq: perpendicularEquation(
				wallEquationData.equation2 ?? { A: 0, B: 0 },
				objTarget.x,
				objTarget.y
			)
		}));
		setObjectEquationData(newEqData);
	}, [wallUnderCursor, objectMetaData, wallEquationData]);

	const { inWallMeasurementRenderData, measurementRenderData, setInWallMeasurementText } =
		useWallMeasurements(wallMetaData, objectBeingMoved);

	const { scaleBoxDisplayData } = useDrawScaleBox(wallMetaData);

	const { save } = useHistory();

	useEffect(() => {
		switch (cursor) {
			case 'grab':
				setCursorImg(constants.GRAB_CURSOR);
				break;
			case 'scissor':
				setCursorImg(constants.SCISSOR_CURSOR);
				break;
			case 'trash':
				setCursorImg(constants.TRASH_CURSOR);
				break;
			case 'validation':
				// setCursorImg(constants.VALIDATION_CURSOR);
				setCursorImg(constants.GRAB_CURSOR);
				break;
			default:
				setCursorImg(cursor);
				break;
		}
	}, [cursor]);

	useEffect(() => {
		if (mode === Mode.Line) {
			dispatch(setAction(false));
		} else if (mode == Mode.Room) {
			dispatch(setCursor('default'));
		} else if (mode !== Mode.EditRoom) {
			setSelectedRoomRenderData(undefined);
		}
	}, [dispatch, mode]);

	useEffect(() => {
		refreshWalls(wallMetaData, wallEquationData);
		setRenderWalls(wallMetaData);

		const updatedPolygons = polygonize(wallMetaData);
		setRoomPolygonData(updatedPolygons);

		renderRooms(updatedPolygons, roomMetaData, setRoomMetaData);
	}, [wallMetaData, wallEquationData]);

	useEffect(() => {
		let globalArea = 0;
		const pathData: RoomPathData[] = [];
		roomMetaData.forEach((room) => {
			if (room.action == 'add') globalArea = globalArea + room.area;
			const pathSurface = room.coords;
			// var pathCreate = "M" + pathSurface[0].x + "," + pathSurface[0].y;
			const data: RoomPathData = {
				room: room,
				path: 'M' + pathSurface[0].x + ',' + pathSurface[0].y,
				centerPoint: getPolygonVisualCenter(room, roomMetaData)
			};
			pathData.push(data);
			for (let p = 1; p < pathSurface.length; p++) {
				data.path = data.path + ' ' + 'L' + pathSurface[p].x + ',' + pathSurface[p].y;
			}
			if (room.inside.length > 0) {
				for (let ins = 0; ins < room.inside.length; ins++) {
					data.path =
						data.path +
						' M' +
						roomPolygonData.polygons[room.inside[ins]].coords[
							roomPolygonData.polygons[room.inside[ins]].coords.length - 1
						].x +
						',' +
						roomPolygonData.polygons[room.inside[ins]].coords[
							roomPolygonData.polygons[room.inside[ins]].coords.length - 1
						].y;
					for (
						let free = roomPolygonData.polygons[room.inside[ins]].coords.length - 2;
						free > -1;
						free--
					) {
						data.path =
							data.path +
							' L' +
							roomPolygonData.polygons[room.inside[ins]].coords[free].x +
							',' +
							roomPolygonData.polygons[room.inside[ins]].coords[free].y;
					}
				}
			}
		});
		setRoomPathInfo(pathData);
	}, [roomMetaData]);

	// when the room under cursor changes (in ROOM mode), calculate
	// the path for the highlight box and set to state
	useEffect(() => {
		if (mode !== Mode.Room && !deviceBeingMoved) return;

		if (!roomUnderCursor) {
			setSelectedRoomRenderData(undefined);
			return;
		}

		const pathSurface = roomUnderCursor.coords;
		let highlightPath = 'M' + pathSurface[0].x + ',' + pathSurface[0].y;
		for (let p = 1; p < pathSurface.length - 1; p++) {
			highlightPath = highlightPath + ' ' + 'L' + pathSurface[p].x + ',' + pathSurface[p].y;
		}
		highlightPath = highlightPath + 'Z';
		if (roomUnderCursor.inside.length > 0) {
			for (let ins = 0; ins < roomUnderCursor.inside.length; ins++) {
				const targetPolygon = roomPolygonData.polygons[roomUnderCursor.inside[ins]];
				const numCoords = targetPolygon.coords.length - 1;
				highlightPath =
					highlightPath +
					' M' +
					targetPolygon.coords[numCoords].x +
					',' +
					targetPolygon.coords[numCoords].y;
				for (let free = targetPolygon.coords.length - 2; free > -1; free--) {
					highlightPath =
						highlightPath +
						' L' +
						targetPolygon.coords[free].x +
						',' +
						targetPolygon.coords[free].y;
				}
			}
		}
		setSelectedRoomRenderData({
			path: highlightPath,
			selected: false,
			selectedColor: 'none'
		});
	}, [roomPolygonData.polygons, roomUnderCursor, mode, deviceBeingMoved]);

	useEffect(() => {
		if (selectedRoomColor) {
			setSelectedRoomRenderData((prev) =>
				prev ? { ...prev, selectedColor: selectedRoomColor } : undefined
			);
		} else {
			setSelectedRoomRenderData(undefined);
		}
	}, [selectedRoomColor]);

	useEffect(() => {
		setObjectsToRender(objectMetaData);
	}, [objectMetaData, objectBeingMoved]);

	useEffect(() => {
		const width = canvasRef.current?.width.baseVal.value ?? 0;
		const height = canvasRef.current?.height.baseVal.value ?? 0;

		setCanvasDimensions({ width, height });
	}, [
		canvasRef.current?.width.baseVal.value,
		canvasRef.current?.height.baseVal.value,
		setCanvasDimensions
	]);

	const onMouseWheel = (deltaY: number) => {
		// e.preventDefault();
		if (deltaY > 0) {
			zoomCameraIn();
		} else {
			zoomCameraOut();
		}
	};

	useEffect(() => {
		const onOpeningWidthChanged = (val: number) => {
			const objTarget = objectMetaData.find((o) => o.id === openingIdBeingEdited);
			if (!objTarget) return;
			const wallBind = getWallsOnPoint({ x: objTarget.x, y: objTarget.y }, wallMetaData);
			const wallUnderOpening = wallBind[wallBind.length - 1];
			const limits = computeLimit(wallUnderOpening.equations.base, val, objTarget);
			if (
				wallUnderOpening.pointInsideWall(limits[0], false) &&
				wallUnderOpening.pointInsideWall(limits[1], false)
			) {
				objTarget.size = val;
				objTarget.limit = limits;
				const updatedTarget = getUpdatedObject(objTarget);
				const newObjMetaData = [
					...objectMetaData.filter((o) => o.id !== objTarget.id),
					updatedTarget
				];
				setObjectMetaData(newObjMetaData);
			}
			// wallUnderOpening.inWallRib(objectMeta);
			setInWallMeasurementText(wallUnderOpening, objectMetaData);
		};
		if (openingWidth) {
			onOpeningWidthChanged(openingWidth);
		}
	}, [openingWidth]);

	// Refresh object render data any time the objects change
	useEffect(() => {
		objectMetaData.forEach((o) => {
			const { newRenderData, newHeight, newWidth, newRealBbox } = calculateObjectRenderData(
				o.size,
				o.thick,
				o.angle,
				o.class,
				o.type,
				{ x: o.x, y: o.y }
			);
			o.renderData = newRenderData;
			o.height = newHeight;
			o.width = newWidth;
			o.realBbox = newRealBbox;
		});
	}, [objectMetaData]);

	const circleRadius = constants.CIRCLE_BINDER_RADIUS / 1.8;

	const updateCursor = (c: CursorType) => {
		dispatch(setCursor(c));
		return;
	};

	const handleMouseDown = useHandleMouseDown({
		setPoint,
		viewbox,
		wallMetaData,
		setWallMetaData,
		objectMetaData,
		startWallDrawing,
		setSelectedWallData,
		nodeUnderCursor,
		setNodeBeingMoved,
		wallUnderCursor,
		setWallEquationData,
		setDragging,
		objectUnderCursor,
		setObjectBeingMoved,
		deviceUnderCursor,
		followerData: canvasState.followerData
	});

	useEffect(() => {
		if (dragging) {
			setCursor('move');
			const distX = snapPosition.xMouse - point.x;
			const distY = snapPosition.yMouse - point.y;
			dragCamera(distX, distY);
			return;
		}
	}, [dragCamera, dragging, point, snapPosition]);

	return (
		<svg
			ref={canvasRef}
			id="lin"
			// viewBox="0 0 1100 700"
			viewBox={`${viewbox.originX} ${viewbox.originY} ${viewbox.width} ${viewbox.height}`}
			preserveAspectRatio="xMidYMin slice"
			xmlns="http://www.w3.org/2000/svg"
			style={{
				zIndex: 2,
				margin: 0,
				padding: 0,
				width: '100vw',
				height: '100vh',
				position: 'absolute',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0
			}}
			cursor={cursorImg}
			onWheel={(e) => {
				// e.preventDefault();
				onMouseWheel(e.deltaY);
			}}
			onClick={(e) => e.preventDefault()}
			onMouseDown={(event) => {
				handleMouseDown(event);
			}}
			onMouseUp={() => {
				setDragging(false);
				handleMouseUp(
					snapPosition,
					mode,
					(m: Mode) => dispatch(setMode(m)),
					(a: boolean) => dispatch(setAction(a)),
					point,
					setPoint,
					canvasState,
					() => save(wallMetaData, objectMetaData, roomMetaData),
					updateRoomDisplayData,
					continuousWallMode,
					startModifyingOpening,
					wallClicked,
					updateCursor,
					roomMetaData,
					objectMetaData,
					setObjectMetaData,
					wallMetaData,
					setWallMetaData,
					wallEndConstructionData,
					shouldWallConstructionEnd,
					startWallDrawing,
					selectedWallData,
					objectBeingMoved,
					setObjectBeingMoved,
					setNodeBeingMoved,
					roomUnderCursor,
					() => {
						setSelectedRoomRenderData((prev) => {
							return prev ? { ...prev, selected: true } : undefined;
						});
					},
					clearWallHelperState,
					wallEquationData,
					deviceBeingMoved,
					setDeviceBeingMoved,
					setDevices
				);
			}}
			onMouseMove={(e) => {
				const throttleMs = 17;
				if (!shouldUpdateMouseMove) {
					return;
				}

				shouldUpdateMouseMove = false;
				setTimeout(() => {
					shouldUpdateMouseMove = true;
				}, throttleMs);

				e.preventDefault();

				onMouseMove();

				const snap = calculateSnap(e, viewbox);
				setSnapPosition(snap);
				handleMouseMove(
					mode,
					action,
					snap,
					canvasState,
					openingType,
					objectType,
					viewbox,
					wallMetaData,
					wallUnderCursor,
					setWallMetaData,
					roomMetaData,
					objectMetaData,
					setObjectMetaData,
					updateCursor,
					setWallUnderCursor,
					setObjectUnderCursor,
					objectBeingMoved,
					setObjectBeingMoved,
					setNodeUnderCursor,
					nodeBeingMoved,
					setNodeBeingMoved,
					setRoomUnderCursor,
					setInWallMeasurementText,
					objectEquationData,
					wallEquationData,
					deviceBeingMoved,
					deviceUnderCursor
				);
			}}>
			<defs>
				{gradientData.map((data) => (
					<LinearGradient key={data.id} id={data.id} color1={data.color1} color2={data.color2} />
				))}
				<Patterns />
			</defs>
			<g id="boxgrid">
				<rect width="8000" height="5000" x="-3500" y="-2000" fill="url(#grid)" />
			</g>
			{/* <g id="boxpath"></g> */}
			<g id="boxSurface">
				{roomPathInfo &&
					roomPathInfo.map((data, i) => (
						<path
							key={i}
							d={data.path}
							fill="#fff"
							fillOpacity="1"
							stroke="none"
							fillRule="evenodd"
							className="room"></path>
					))}
			</g>
			<g id="boxRoom" visibility={layerSettings.showTexture ? 'visible' : 'hidden'}>
				{roomPathInfo &&
					roomPathInfo.map((data, i) => (
						<path
							key={i}
							d={data.path}
							fill={data.room.color ? `${data.room.color}` : defaultRoomColor}
							fillOpacity="1"
							stroke="none"
							fillRule="evenodd"
							className="room"></path>
					))}
			</g>
			<g id="boxwall">
				{renderWalls &&
					renderWalls.map((wall, i) => (
						<path
							key={wall.id + i}
							d={wall.dPath ?? ''}
							stroke="none"
							fill={wallColor ?? constants.COLOR_WALL}
							strokeWidth={1}
							strokeLinecap="butt"
							strokeLinejoin="miter"
							strokeMiterlimit={4}
							fillRule="nonzero"></path>
					))}
			</g>
			<g id="boxcarpentry">
				{objectsToRender &&
					objectsToRender.concat(objectBeingMoved ? [objectBeingMoved] : []).map((obj) => (
						<g key={obj.id}>
							{obj.renderData.construc.map((data) => {
								if (data.path) {
									return (
										<path
											key={data.path + '-path'}
											d={data.path}
											transform={
												obj.hinge
													? `translate(${obj.x}, ${obj.y}) rotate(${obj.angle}, 0,0) scale(${
															obj.hinge === 'normal' ? 1 : -1
													  }, 1)`
													: ''
											}
											strokeWidth={1}
											strokeDasharray={data.strokeDashArray ?? ''}
											fill={data.fill ?? ''}
											stroke={data.stroke ?? ''}></path>
										// <image
										// 	key={data.path + '-path'}
										// 	href={MyImage}
										// 	width={40}
										// 	height={40}
										// 	transform={
										// 		obj.hinge
										// 			? `translate(${obj.x}, ${obj.y}) rotate(${obj.angle}, 0,0) scale(${
										// 					obj.hinge === 'normal' ? 1 : -1
										// 			  }, 1)`
										// 			: ''
										// 	}></image>
									);
								} else if (data.text) {
									return (
										<text
											key={obj.id + data.x + data.y + '-text'}
											x={data.x ?? 0}
											y={data.y ?? 0}
											fontSize={data.fontSize ?? ''}
											stroke={data.stroke ?? ''}
											strokeWidth={data.strokeWidth ?? 1}
											fontFamily="roboto"
											textAnchor="middle"
											fill={data.fill ?? ''}>
											{data.text}
										</text>
									);
								}
							})}
						</g>
					))}
			</g>
			<g id="boxEnergy" visibility={layerSettings.showDevices ? 'visible' : 'hidden'}>
				{deviceBeingMoved && (
					<image
						key={deviceBeingMoved.id + '-device-moving'}
						href={deviceBeingMoved.image}
						width={40}
						height={40}
						x={deviceBeingMoved.x}
						y={deviceBeingMoved.y}></image>
				)}
				{devices &&
					devices
						.filter((d) => d.id !== deviceBeingMoved?.id)
						.map((device, idx) => (
							<g key={device.id + '-device' + idx}>
								<text
									x={device.x - device.width / 2}
									y={device.y - device.height / 2}
									className="device-name"
									style={{ fill: textColor ?? '' }}
									display={deviceUnderCursor?.id === device.id ? 'block' : 'none'}>
									{device.name}
								</text>
								<rect
									x={device.x - device.width / 4}
									y={device.y - device.height / 4}
									stroke={textColor ?? '#333'}
									fillOpacity={0}
									display={deviceUnderCursor?.id === device.id ? 'block' : 'none'}
									width={device.width + device.width / 2}
									height={device.height + device.height / 2}></rect>
								<image href={device.image} width={40} height={40} x={device.x} y={device.y}></image>
							</g>
						))}
			</g>
			<g id="boxbind">
				{nodeUnderCursor && (
					<circle
						className="circle_css_2"
						cx={nodeUnderCursor.x}
						cy={nodeUnderCursor.y}
						r={constants.CIRCLE_BINDER_RADIUS}></circle>
				)}
				{nodeBeingMoved && (
					<circle
						className="circle_css"
						cx={nodeBeingMoved.node.x}
						cy={nodeBeingMoved.node.y}
						r={constants.CIRCLE_BINDER_RADIUS}></circle>
				)}
				{wallUnderCursor && (
					<g>
						<line
							x1={wallUnderCursor.start.x}
							y1={wallUnderCursor.start.y}
							x2={wallUnderCursor.end.x}
							y2={wallUnderCursor.end.y}
							strokeWidth={5}
							stroke="#5cba79"></line>
						<circle
							className="circle_css"
							cx={wallUnderCursor.start.x}
							cy={wallUnderCursor.start.y}
							r={circleRadius}></circle>
						<circle
							className="circle_css"
							cx={wallUnderCursor.end.x}
							cy={wallUnderCursor.end.y}
							r={circleRadius}></circle>
					</g>
				)}
				{helperLineSvgData && (
					<path
						stroke={helperLineSvgData.stroke}
						d={`M${helperLineSvgData.p1.x},${helperLineSvgData.p1.y} L${helperLineSvgData.p2.x},${helperLineSvgData.p2.y} L${helperLineSvgData.p3.x},${helperLineSvgData.p3.y}`}
						strokeWidth="0.75"
						strokeOpacity="1"
						fill="none"></path>
				)}
				{wallHelperTextData && (
					<text
						x={wallHelperTextData.x}
						y={wallHelperTextData.y}
						textAnchor="middle"
						stroke="none"
						fill="#777"
						transform={`rotate(${wallHelperTextData.angle} ${wallHelperTextData.x} ${
							wallHelperTextData.y + 15
						})`}>
						{wallHelperTextData.content}
					</text>
				)}
				{wallHelperPathInfo && (
					<>
						<line
							id="line_construc"
							x1={wallHelperPathInfo.x1}
							y1={wallHelperPathInfo.y1}
							x2={wallHelperPathInfo.x2}
							y2={wallHelperPathInfo.y2}
							stroke="#9fb2e2"
							strokeWidth={mode == Mode.Partition ? 10 : 20}
							strokeLinecap="butt"
							strokeOpacity={wallHelperPathInfo.constructOpacity}></line>
						<line
							id="linetemp"
							x1={wallHelperPathInfo.x1}
							y1={wallHelperPathInfo.y1}
							x2={wallHelperPathInfo.x2}
							y2={wallHelperPathInfo.y2}
							stroke="#transparent"
							strokeWidth={0.5}
							strokeOpacity={0.9}></line>
					</>
				)}
				{wallHelperNodeCircle && (
					<circle
						id="circlebinder"
						className="circle_css_2"
						cx={wallHelperNodeCircle.x}
						cy={wallHelperNodeCircle.y}
						r={constants.CIRCLE_BINDER_RADIUS}></circle>
				)}
				{selectedRoomRenderData && (
					<path
						id="roomSelected"
						d={selectedRoomRenderData.path}
						fill={selectedRoomRenderData.selectedColor}
						stroke={selectedRoomRenderData.selected ? '#ddf00a' : '#c9c14c'}
						fillOpacity={0.5}
						fillRule="evenodd"
						strokeWidth={selectedRoomRenderData.selected ? 7 : 3}></path>
				)}
			</g>
			<g id="boxArea" visibility={layerSettings.showSurfaces ? 'visible' : 'hidden'}>
				{roomPathInfo &&
					roomPathInfo
						.filter((d) => d.centerPoint)
						.map((data, i) => (
							<React.Fragment key={i + 'room-name'}>
								<text
									x={data.centerPoint.x}
									y={data.centerPoint.y}
									style={{
										fill:
											data.room.color == 'gradientBlack' || data.room.color == 'gradientBlue'
												? 'white'
												: textColor ?? '#343938'
									}}
									textAnchor="middle">
									{data.room.name}
								</text>
								<text
									x={data.centerPoint.x}
									y={data.room.name ? data.centerPoint.y + 20 : data.centerPoint.y}
									style={{
										fill:
											data.room.color == 'gradientBlack' || data.room.color == 'gradientBlue'
												? 'white'
												: textColor ?? '#343938'
									}}
									fontSize="12.5px"
									fontWeight={data.room.surface ? 'normal' : 'bold'}
									textAnchor="middle">
									{data.room.surface
										? data.room.surface + ' m²'
										: (data.room.area / (constants.METER_SIZE * constants.METER_SIZE)).toFixed(2) +
										  ' m²'}
								</text>
							</React.Fragment>
						))}
			</g>
			<g id="boxRib" visibility={layerSettings.showMeasurements ? 'visible' : 'hidden'}>
				{!wallUnderCursor &&
					measurementRenderData &&
					measurementRenderData.map(({ start, shift, angle, content }) => (
						<text
							key={`${start.x}-${start.y}-measurement-outside`}
							x={start.x}
							y={start.y + shift}
							transform={`rotate(${angle} ${start.x},${start.y})`}
							textAnchor="middle"
							stroke="#fff"
							strokeWidth="0.2px"
							fill={textColor ?? '#555'}
							fontSize={content < 1 ? '0.73em' : '0.9em'}>
							{content.toFixed(2)}
						</text>
					))}
				{wallUnderCursor &&
					inWallMeasurementRenderData &&
					inWallMeasurementRenderData.map(({ start, shift, angle, content }) => (
						<text
							key={`${start.x}-${start.y}-measurement-inside`}
							x={start.x}
							y={start.y + shift}
							transform={`rotate(${angle} ${start.x},${start.y})`}
							textAnchor="middle"
							stroke="#fff"
							strokeWidth="0.27px"
							fill="#666"
							fontSize={content < 1 ? '0.8em' : '1em'}>
							{content.toFixed(2)}
						</text>
					))}
			</g>
			<g id="boxScale" visibility={layerSettings.showMeasurements ? 'visible' : 'hidden'}>
				{layerSettings.showMeasurements && scaleBoxDisplayData && wallMetaData.length > 2 && (
					<path
						d={scaleBoxDisplayData.path}
						stroke="#555"
						fill="none"
						strokeWidth={0.3}
						strokeLinecap="butt"
						strokeLinejoin="miter"
						strokeMiterlimit={4}
						fillRule="nonzero"></path>
				)}
				{layerSettings.showMeasurements &&
					wallMetaData.length > 2 &&
					scaleBoxDisplayData?.textItems.map((displayData) => (
						<text
							key={`${displayData.position.x}-${displayData.position.y}-scale-text`}
							x={displayData.position.x}
							y={displayData.position.y}
							transform={displayData.rotation}
							fill="#555"
							textAnchor="middle">
							{displayData.content}
						</text>
					))}
			</g>
			<g id="boxText"></g>
			<g id="boxDebug"></g>
		</svg>
	);
};
export default FloorPlannerCanvas;
