import { gsap } from 'gsap';
import React, {
	useCallback,
	useContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { constants } from '../../constants';
import { FloorPlanContext } from '../../context/FloorPlanContext';
import { CanvasState } from '../../engine';
import {
	useDevices,
	useDrawScaleBox,
	useDrawWalls,
	useRooms,
	useWallMeasurements
} from '../../hooks';
import { useHandleCanvasInput } from '../../hooks/useHandleCanvasInput';
import {
	DeviceDisplayData,
	DeviceMetaData,
	Mode,
	NodeMoveData,
	ObjectEquationData,
	ObjectMetaData,
	Point2D,
	RoomDisplayData,
	RoomMetaData,
	SelectedWallData,
	SnapData,
	ViewboxData,
	WallMetaData
} from '../../models/models';
import { setAction, setCursor } from '../../store/floorPlanSlice';
import { RootState } from '../../store/store';
import {
	calculateObjectRenderData,
	getUpdatedObject,
	polygonize,
	refreshWalls
} from '../../utils/svgTools';
import {
	calculateSnap,
	computeLimit,
	findById,
	getWallsOnPoint,
	perpendicularEquation
} from '../../utils/utils';
import Patterns from './Patterns';
import RoomAreaText from './RoomAreaText';
import WallMeasurementText from './WallMeasurementText';

let shouldUpdateMouseMove = true;

interface Props {
	canvasState: CanvasState;
	continuousWallMode: boolean;
	roomClicked: (roomData: RoomDisplayData) => void;
	selectedRoomData: RoomDisplayData | undefined;
	onMouseMove: (p: Point2D) => void;
	startModifyingOpening: (object: ObjectMetaData) => void;
	wallClicked: (wall: WallMetaData) => void;
	setCanvasDimensions: (d: { width: number; height: number; top: number; left: number }) => void;
	setCanvasRef: React.Dispatch<React.SetStateAction<SVGSVGElement | undefined>>;
	viewbox: ViewboxData;
	openingWidth: number | null;
	openingIdBeingEdited: string | undefined;
	selectedRoomColor: string | undefined;
	deviceDisplayData: DeviceDisplayData[];
	deviceBeingMoved: DeviceMetaData | undefined;
	setDeviceBeingMoved: React.Dispatch<React.SetStateAction<DeviceMetaData | undefined>>;
	zoomCameraIn: (delta: number, point: Point2D) => void;
	zoomCameraOut: (delta: number, point: Point2D) => void;
	dragCamera: (distX: number, distY: number) => void;
	defaultRoomColor: string;
	textColor?: string | undefined;
	wallColor?: string | undefined;
	showDebugData?: boolean | undefined;
	createSnapshot: (
		wallMeta: WallMetaData[],
		objectMeta: ObjectMetaData[],
		roomMeta: RoomMetaData[]
	) => void;
}

const FloorPlannerCanvas: React.FC<Props> = ({
	canvasState,
	continuousWallMode,
	roomClicked,
	startModifyingOpening,
	wallClicked,
	onMouseMove,
	setCanvasDimensions,
	setCanvasRef,
	viewbox,
	selectedRoomData,
	openingWidth,
	openingIdBeingEdited,
	selectedRoomColor,
	deviceDisplayData,
	deviceBeingMoved,
	setDeviceBeingMoved,
	zoomCameraIn,
	zoomCameraOut,
	dragCamera,
	defaultRoomColor,
	textColor,
	wallColor,
	showDebugData,
	createSnapshot
}) => {
	const dispatch = useDispatch();
	const cursor = useSelector((state: RootState) => state.floorPlan.cursor);
	const openingType = useSelector((state: RootState) => state.floorPlan.doorType);
	const objectType = useSelector((state: RootState) => state.floorPlan.objectType);
	const layerSettings = useSelector((state: RootState) => state.floorPlan.layerSettings);

	const { wallMetaData, objectMetaData, setObjectMetaData, wallUnderCursor } =
		useContext(FloorPlanContext);

	const [dragging, setDragging] = useState(false);
	const [cursorImg, setCursorImg] = useState('default');
	const [renderWalls, setRenderWalls] = useState<WallMetaData[]>([]);
	const [objectsToRender, setObjectsToRender] = useState<ObjectMetaData[]>([]);
	const [snapPosition, setSnapPosition] = useState<SnapData>({
		x: 0,
		y: 0,
		xMouse: 0,
		yMouse: 0
	});
	const [point, setPoint] = useState<Point2D>({ x: 0, y: 0 });
	const [selectedWallData, setSelectedWallData] = useState<SelectedWallData>();
	const [nodeUnderCursor, setNodeUnderCursor] = useState<Point2D | undefined>();
	const [objectUnderCursor, setObjectUnderCursor] = useState<ObjectMetaData | undefined>();
	const [nodeBeingMoved, setNodeBeingMoved] = useState<NodeMoveData | undefined>();
	const [objectBeingMoved, setObjectBeingMoved] = useState<ObjectMetaData | null>(null);
	const [objectEquationData, setObjectEquationData] = useState<ObjectEquationData[]>([]);

	const [saveWallsOnNextRender, setSaveWallsOnNextRender] = useState(false);

	const canvasRef = useRef<SVGSVGElement>(null);
	useEffect(() => {
		if (canvasRef.current) {
			setCanvasRef(canvasRef.current);
		}
	}, [setCanvasRef, canvasRef]);

	useLayoutEffect(() => {
		if (!canvasRef.current) return;
		// const ctx = gsap.context(() => {});
		gsap.to(canvasRef.current, {
			duration: 0.3,
			attr: {
				viewBox: `${viewbox.originX} ${viewbox.originY} ${viewbox.width} ${viewbox.height}`
			},
			ease: 'sine.easeInOut'
		});
	}, [canvasRef, viewbox]);

	const mode = useSelector((state: RootState) => state.floorPlan.mode);

	const { devices, setDevices, deviceUnderCursor } = useDevices(
		snapPosition,
		deviceDisplayData,
		deviceBeingMoved,
		setDeviceBeingMoved
	);

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

	const { inWallMeasurementRenderData, measurementRenderData, setInWallMeasurementText } =
		useWallMeasurements(wallMetaData, objectBeingMoved);

	const { scaleBoxDisplayData } = useDrawScaleBox(wallMetaData);

	/**
	 * If there is an objectBeingMoved, refresh the
	 * objectMetaData state to trigger render
	 */
	useEffect(() => {
		if (objectBeingMoved) {
			setObjectMetaData((prev) => [...prev]);
		}
	}, [objectBeingMoved, setObjectMetaData]);

	const saveRooms = useCallback(
		(roomMetaData: RoomMetaData[]) => {
			createSnapshot(wallMetaData, objectMetaData, roomMetaData);
		},
		[objectMetaData, createSnapshot, wallMetaData]
	);

	const {
		roomsToRender,
		roomPathData,
		setRoomPolygonData,
		setSelectedRoomRenderData,
		selectedRoomRenderData,
		roomUnderCursor,
		setRoomUnderCursor
	} = useRooms(selectedRoomData, selectedRoomColor, deviceBeingMoved, snapPosition, saveRooms);

	/**
	 * If there is a wall under the cursor and that wall has
	 * objects (doors, windows) then calculate the equation
	 * data for those objects and set to state
	 */
	useEffect(() => {
		if (!wallUnderCursor) return;
		const objectsOnWall = wallUnderCursor.getObjects(objectMetaData);
		const newEqData = objectsOnWall.map((objTarget) => ({
			obj: objTarget,
			wall: wallUnderCursor,
			eq: perpendicularEquation(
				selectedWallData?.equationData.equation2 ?? { A: 0, B: 0 },
				objTarget.x,
				objTarget.y
			)
		}));
		setObjectEquationData(newEqData);
	}, [wallUnderCursor, objectMetaData, selectedWallData?.equationData.equation2]);

	/**
	 * Update the cursor image whenever the cursor type changes
	 */
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
	}, [dispatch, mode, setSelectedRoomRenderData]);

	/**
	 * When the wall data or the selected wall's equation data changes,
	 * refresh all the wall coordinates and re-render the walls
	 */
	useEffect(() => {
		const equationData = selectedWallData?.equationData ?? {
			equation1: null,
			equation2: null,
			equation3: null
		};
		refreshWalls(wallMetaData, equationData);
		setRenderWalls(wallMetaData);
		if (saveWallsOnNextRender) {
			setSaveWallsOnNextRender(false);
			createSnapshot(wallMetaData, objectMetaData, roomsToRender.roomData);
		}
		// console.log('RENDERING');
	}, [
		objectMetaData,
		roomsToRender.roomData,
		createSnapshot,
		saveWallsOnNextRender,
		selectedWallData?.equationData,
		wallMetaData
	]);

	/**
	 * Whenever the walls change, convert them to
	 * polygons and update room polygon data
	 */
	useEffect(() => {
		const updatedPolygons = polygonize(wallMetaData);
		setRoomPolygonData(updatedPolygons);
	}, [wallMetaData, setRoomPolygonData]);

	useEffect(() => {
		setObjectsToRender(objectMetaData);
	}, [objectMetaData, objectBeingMoved]);

	useEffect(() => {
		const width = canvasRef.current?.width.baseVal.value ?? 0;
		const height = canvasRef.current?.height.baseVal.value ?? 0;
		const top = canvasRef.current?.clientTop ?? 0;
		const left = canvasRef.current?.clientLeft ?? 0;

		setCanvasDimensions({ width, height, top, left });
	}, [
		canvasRef.current?.width.baseVal.value,
		canvasRef.current?.height.baseVal.value,
		setCanvasDimensions
	]);

	const onMouseWheel = (deltaY: number, point: Point2D) => {
		// e.preventDefault();
		if (deltaY > 0) {
			zoomCameraIn(deltaY, point);
		} else {
			zoomCameraOut(deltaY, point);
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
	}, [openingWidth, dispatch]);

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

	const { handleMouseDown, handleMouseUp, handleMouseMove } = useHandleCanvasInput({
		point,
		setPoint,
		snapPosition,
		viewbox,
		startWallDrawing,
		setSelectedWallData,
		nodeUnderCursor,
		setNodeBeingMoved,
		setDragging,
		objectUnderCursor,
		setObjectBeingMoved,
		deviceUnderCursor,
		followerData: canvasState.followerData,
		clearWallHelperState,
		continuousWallMode,
		deviceBeingMoved,
		objectBeingMoved,
		nodeBeingMoved,
		roomClicked,
		wallClicked,
		startModifyingOpening,
		roomMetaData: roomsToRender.roomData,
		roomUnderCursor,
		save: () => createSnapshot(wallMetaData, objectMetaData, roomsToRender.roomData),
		saveWalls: () => setSaveWallsOnNextRender(true),
		saveObjects: (objects: ObjectMetaData[]) =>
			createSnapshot(wallMetaData, objects, roomsToRender.roomData),
		selectedWallData,
		wallEndConstructionData,
		selectRoomUnderCursor: () => {
			setSelectedRoomRenderData((prev) => {
				return prev ? { ...prev, selected: true } : undefined;
			});
		},
		setDevices,
		wallConstructionShouldEnd: shouldWallConstructionEnd,
		openingType,
		objectType,
		setObjectUnderCursor,
		setNodeUnderCursor,
		setRoomUnderCursor,
		setInWallMeasurementText,
		objectEquationData
	});

	const PatternsComponent = useMemo(() => <Patterns />, []);

	useEffect(() => {
		if (dragging) {
			// dispatch(setCursor('move'));
			const distX = snapPosition.xMouse - point.x;
			const distY = snapPosition.yMouse - point.y;
			dragCamera(distX, distY);
			return;
		}
	}, [dragCamera, dragging, point, snapPosition, dispatch]);

	return (
		<svg
			ref={canvasRef}
			id="lin"
			// viewBox="0 0 1100 700"
			// viewBox={`${viewbox.originX} ${viewbox.originY} ${viewbox.width} ${viewbox.height}`}
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
				onMouseWheel(e.deltaY || e.detail || 0, { x: e.clientX, y: e.clientY });
			}}
			onClick={(e) => e.preventDefault()}
			onMouseDown={(event) => {
				handleMouseDown(event);
			}}
			onMouseUp={() => {
				setDragging(false);
				handleMouseUp();
			}}
			onMouseMove={(e) => {
				const throttleMs = 0;
				if (!shouldUpdateMouseMove) {
					return;
				}

				shouldUpdateMouseMove = false;
				setTimeout(() => {
					shouldUpdateMouseMove = true;
				}, throttleMs);

				e.preventDefault();

				const snap = calculateSnap(e, viewbox);
				setSnapPosition(snap);
				onMouseMove(snap);
				handleMouseMove();
			}}>
			<defs>
				{/* {gradientData.map((data) => (
					<LinearGradient key={data.id} id={data.id} color1={data.color1} color2={data.color2} />
				))} */}
				{/* <Patterns /> */}
				{PatternsComponent}
			</defs>
			<g id="boxgrid">
				{layerSettings.showGrid && (
					<rect width="8000" height="5000" x="-3500" y="-2000" fill="url(#grid)" />
				)}
			</g>
			{/* <g id="boxpath"></g> */}
			<g id="boxSurface">
				{roomPathData &&
					layerSettings.showSurfaces &&
					roomPathData.map((data, i) => (
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
				{roomPathData &&
					layerSettings.showSurfaces &&
					roomPathData.map((data, i) => (
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
						<g key={wall.id + i} className="canvas-wall">
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
						</g>
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
					<g>
						<rect
							x={deviceBeingMoved.x - deviceBeingMoved.width / 4}
							y={deviceBeingMoved.y - deviceBeingMoved.height / 4}
							stroke={textColor ?? '#333'}
							fillOpacity={0}
							display={'block'}
							width={deviceBeingMoved.width + deviceBeingMoved.width / 2}
							height={deviceBeingMoved.height + deviceBeingMoved.height / 2}></rect>
						<image
							key={deviceBeingMoved.id + '-device-moving'}
							href={deviceBeingMoved.image}
							width={40}
							height={40}
							x={deviceBeingMoved.x}
							y={deviceBeingMoved.y}></image>
					</g>
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
									{device.name + `-${device.state}`}
								</text>
								<circle
									cx={device.x + device.width / 2 - 20}
									cy={device.y + device.height / 2}
									r={device.width / 8}
									fill={device.state === 'on' ? '#04cf44' : '#e61d07'}
									stroke={device.state === 'on' ? '#04cf44' : '#e61d07'}
									// fillOpacity={0}
								/>
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
						{showDebugData &&
							wallUnderCursor.parent &&
							[findById(wallUnderCursor.parent, wallMetaData)].map((w) =>
								w ? (
									<line
										key={'wallUnderCursor-parent'}
										x1={w.start.x}
										y1={w.start.y}
										x2={w.end.x}
										y2={w.end.y}
										strokeWidth={5}
										stroke="#b856d6"></line>
								) : (
									<></>
								)
							)}
						{showDebugData &&
							wallUnderCursor.child &&
							[findById(wallUnderCursor.child, wallMetaData)].map((w) =>
								w ? (
									<line
										key={'wallUnderCursor-child'}
										x1={w.start.x}
										y1={w.start.y}
										x2={w.end.x}
										y2={w.end.y}
										strokeWidth={5}
										stroke="#30a6d9"></line>
								) : (
									<></>
								)
							)}
						<line
							x1={wallUnderCursor.start.x}
							y1={wallUnderCursor.start.y}
							x2={wallUnderCursor.end.x}
							y2={wallUnderCursor.end.y}
							strokeWidth={5}
							stroke="#5cba79"></line>
						<circle
							className="circle_css"
							fill={showDebugData ? '#228524' : '#5cba79'}
							cx={wallUnderCursor.start.x}
							cy={wallUnderCursor.start.y}
							r={circleRadius}></circle>
						<circle
							className="circle_css"
							fill={showDebugData ? '#c72b26' : '#5cba79'}
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
			<g id="boxArea" visibility={layerSettings.showMeasurements ? 'visible' : 'hidden'}>
				{!nodeBeingMoved &&
					roomPathData &&
					roomPathData
						.filter((d) => d.centerPoint)
						.map((data, i) => (
							<React.Fragment key={`${data.room.id}-room-area`}>
								<RoomAreaText
									room={data.room}
									centerPoint={data.centerPoint}
									textColor={textColor}
								/>
							</React.Fragment>
						))}
			</g>
			<g id="boxRib" visibility={layerSettings.showMeasurements ? 'visible' : 'hidden'}>
				{!wallUnderCursor && measurementRenderData && (
					<WallMeasurementText
						data={measurementRenderData}
						fill={textColor ?? '#555'}
						fontSize={(content) => (content < 1 ? '0.73em' : '0.9em')}
						strokeWidth="0.2px"
					/>
				)}
				{wallUnderCursor && inWallMeasurementRenderData && (
					<WallMeasurementText
						data={inWallMeasurementRenderData}
						fill="#666"
						fontSize={(content) => (content < 1 ? '0.8em' : '1em')}
						strokeWidth="0.27px"
					/>
				)}
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
							textAnchor="middle"
							style={{ userSelect: 'none' }}>
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
