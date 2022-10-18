import React, { createRef, useEffect, useMemo, useState } from "react";
import { constants } from "../../../constants";
import { qSVG } from "../../../qSVG";
import { calculateSnap } from "../../utils/utils";
import { CanvasState } from "../../engine/CanvasState";
import { handleMouseDown } from "../../engine/mouseDown/MouseDownHandler";
import { handleMouseMove } from "../../engine/mouseMove/MouseMoveHandler";
import { handleMouseUp } from "../../engine/mouseUp/MouseUpHandler";
import { useHistory } from "../../hooks/useHistory";
import {
	Mode,
	LayerSettings,
	RoomDisplayData,
	CursorType,
	ViewboxData,
	RoomPolygonData,
	RoomMetaData,
	ObjectMetaData,
	WallMetaData,
	Point2D,
	SnapData,
} from "../../models/models";
import { polygonize, refreshWalls, renderRooms } from "../../utils/svgTools";
import { GradientData } from "./GradientData";
import LinearGradient from "./LinearGradient";
import Patterns from "./Patterns";
import { useDrawWalls } from "../../hooks/useDrawWalls";
import { useDrawScaleBox } from "../../hooks/useDrawScaleBox";

let shouldUpdateMouseMove = true;

interface Props {
	layerSettings: LayerSettings;
	canvasState: CanvasState;
	continuousWallMode: boolean;
	showBoxScale: boolean;
	applyMode: (mode: string, option: string) => void;
	updateRoomDisplayData: (roomData: RoomDisplayData) => void;
	onMouseMove: () => void;
	showObjectTools: () => void;
	showOpeningTools: (min: number, max: number, value: number) => void;
	wallClicked: (wall: WallMetaData) => void;
	handleCameraChange: (lens: string, xmove: number, xview: number) => void;
	cursor: CursorType;
	setCursor: (crsr: CursorType) => void;
	onCanvasDimensionsChanged: (width: number, height: number) => void;
	viewbox: ViewboxData;
	roomPolygonData: RoomPolygonData;
	setRoomPolygonData: (r: RoomPolygonData) => void;
	roomMetaData: RoomMetaData[];
	setRoomMetaData: (r: RoomMetaData[]) => void;
	objectMetaData: ObjectMetaData[];
	setObjectMetaData: (o: ObjectMetaData[]) => void;
	wallMetaData: WallMetaData[];
	setWallMetaData: (w: WallMetaData[]) => void;
}

interface RoomPathData {
	room: RoomMetaData;
	path: string;
	centerPoint: Point2D;
}

interface WallHelperPathData {
	x1: number;
	x2: number;
	y1: number;
	y2: number;
	constructOpacity: number;
}

interface WallHelperTextData {
	x: number;
	y: number;
	content: string;
	angle: number;
}

interface WallEndConstructionData {
	start: Point2D;
	end: Point2D;
}

const FloorPlannerCanvas: React.FC<Props> = ({
	layerSettings,
	canvasState,
	continuousWallMode,
	showBoxScale,
	applyMode,
	updateRoomDisplayData,
	showObjectTools,
	showOpeningTools,
	wallClicked,
	handleCameraChange,
	onMouseMove,
	cursor,
	setCursor,
	onCanvasDimensionsChanged,
	viewbox,
	roomPolygonData,
	setRoomPolygonData,
	roomMetaData,
	setRoomMetaData,
	objectMetaData,
	setObjectMetaData,
	wallMetaData,
	setWallMetaData,
}) => {
	const [cursorImg, setCursorImg] = useState("default");
	const [roomPathInfo, setRoomPathInfo] = useState<RoomPathData[]>([]);
	const [renderWalls, setRenderWalls] = useState<WallMetaData[]>([]);
	const [snapPosition, setSnapPosition] = useState<SnapData>({
		x: 0,
		y: 0,
		xMouse: 0,
		yMouse: 0,
	});
	const [point, setPoint] = useState<Point2D>({ x: 0, y: 0 });
	const [selectedWallData, setSelectedWallData] = useState<{
		wall: WallMetaData;
		before: Point2D;
	} | null>(null);
	const [wallUnderCursor, setWallUnderCursor] = useState<WallMetaData | null>(
		null
	);

	const gradientData = useMemo<
		{ id: string; color1: string; color2: string }[]
	>(() => GradientData, []);

	const canvasRef = createRef<SVGSVGElement>();

	const {
		startWallDrawing,
		clearWallHelperState,
		wallHelperTextData,
		wallHelperNodeCircle,
		wallHelperPathInfo,
		wallEndConstructionData,
		helperLineSvgData,
		shouldWallConstructionEnd,
	} = useDrawWalls(
		snapPosition,
		wallMetaData,
		canvasState.mode,
		continuousWallMode,
		setCursor,
		(newPoint: Point2D) => setPoint(newPoint)
	);

	const { scaleBoxDisplayData } = useDrawScaleBox(wallMetaData);

	const { save } = useHistory();

	// useEffect(() => {
	// 	console.log("Binder updated: ", canvasState.binder);
	// }, [canvasState.binder]);

	// useEffect(() => {
	// 	console.log("wallUnderCursor updated: ", wallUnderCursor);
	// }, [wallUnderCursor]);

	// useEffect(() => {
	// 	console.log("selectedWall updated: ", selectedWallData);
	// }, [selectedWallData]);

	useEffect(() => {
		switch (cursor) {
			case "grab":
				setCursorImg(constants.GRAB_CURSOR);
				break;
			case "scissor":
				setCursorImg(constants.SCISSOR_CURSOR);
				break;
			case "trash":
				setCursorImg(constants.TRASH_CURSOR);
				break;
			case "validation":
				// setCursorImg(constants.VALIDATION_CURSOR);
				setCursorImg(constants.GRAB_CURSOR);
				break;
			default:
				setCursorImg(cursor);
				break;
		}
	}, [cursor]);

	useEffect(() => {
		// setHelperLineSvgData(null);
		if (canvasState.mode !== Mode.Line || canvasState.mode !== Mode.Partition) {
			clearWallHelperState();
		}
	}, [canvasState.mode]);

	useEffect(() => {
		// console.log("walls updated", wallMetaData.length);
		// console.log("Rendering all walls");
		refreshWalls(wallMetaData, canvasState.wallEquations);
		setRenderWalls(wallMetaData);

		const updatedPolygons = polygonize(wallMetaData);
		setRoomPolygonData(updatedPolygons);

		renderRooms(updatedPolygons, roomMetaData, setRoomMetaData);
	}, [wallMetaData]);

	useEffect(() => {
		let globalArea = 0;
		const pathData: RoomPathData[] = [];
		roomMetaData.forEach((room) => {
			if (room.action == "add") globalArea = globalArea + room.area;
			var pathSurface = room.coords;
			// var pathCreate = "M" + pathSurface[0].x + "," + pathSurface[0].y;
			const data: RoomPathData = {
				room: room,
				path: "M" + pathSurface[0].x + "," + pathSurface[0].y,
				centerPoint: qSVG.polygonVisualCenter(room, roomMetaData),
			};
			pathData.push(data);
			for (var p = 1; p < pathSurface.length; p++) {
				data.path =
					data.path + " " + "L" + pathSurface[p].x + "," + pathSurface[p].y;
			}
			if (room.inside.length > 0) {
				for (var ins = 0; ins < room.inside.length; ins++) {
					data.path =
						data.path +
						" M" +
						roomPolygonData.polygons[room.inside[ins]].coords[
							roomPolygonData.polygons[room.inside[ins]].coords.length - 1
						].x +
						"," +
						roomPolygonData.polygons[room.inside[ins]].coords[
							roomPolygonData.polygons[room.inside[ins]].coords.length - 1
						].y;
					for (
						var free =
							roomPolygonData.polygons[room.inside[ins]].coords.length - 2;
						free > -1;
						free--
					) {
						data.path =
							data.path +
							" L" +
							roomPolygonData.polygons[room.inside[ins]].coords[free].x +
							"," +
							roomPolygonData.polygons[room.inside[ins]].coords[free].y;
					}
				}
			}
		});
		setRoomPathInfo(pathData);
	}, [roomMetaData]);

	useEffect(() => {
		const { width, height } = getCanvasDimensions();
		onCanvasDimensionsChanged(width, height);
	}, [canvasRef.current?.width, canvasRef.current?.height]);

	// useEffect(() => {
	// 	const snap = calculateSnap(e, viewbox);
	// 	setSnapPosition(snap);
	// }, []);

	const getCanvasDimensions = (): { width: number; height: number } => {
		let width = 0;
		let height = 0;
		if (canvasRef.current) {
			width = canvasRef.current.width.baseVal.value;
			height = canvasRef.current.height.baseVal.value;
		}
		return { width, height };
	};

	const onMouseWheel = (deltaY: number) => {
		// e.preventDefault();
		if (deltaY > 0) {
			handleCameraChange("zoomin", 100, 0);
		} else {
			handleCameraChange("zoomout", 100, 0);
		}
	};

	return (
		<svg
			id="lin"
			// viewBox="0 0 1100 700"
			viewBox={`${viewbox.originX} ${viewbox.originY} ${viewbox.width} ${viewbox.height}`}
			preserveAspectRatio="xMidYMin slice"
			xmlns="http://www.w3.org/2000/svg"
			onWheel={(e) => {
				e.preventDefault();
				onMouseWheel(e.deltaY);
			}}
			ref={canvasRef}
			onClick={(e) => e.preventDefault()}
			onMouseDown={(e) =>
				handleMouseDown({
					event: e,
					canvasState,
					setCursor,
					viewbox,
					wallMetaData,
					setWallMetaData,
					objectMetaData,
					startWallDrawing,
					setSelectedWallData,
					setPoint,
				})
			}
			onMouseUp={(e) => {
				handleMouseUp(
					snapPosition,
					point,
					setPoint,
					canvasState,
					() => {
						applyMode(Mode.Select, "");
						return canvasState.mode;
					},
					layerSettings.showMeasurements,
					() => save(wallMetaData, objectMetaData, roomMetaData),
					updateRoomDisplayData,
					continuousWallMode,
					showObjectTools,
					showOpeningTools,
					wallClicked,
					setCursor,
					roomMetaData,
					objectMetaData,
					setObjectMetaData,
					wallMetaData,
					setWallMetaData,
					clearWallHelperState,
					wallEndConstructionData,
					shouldWallConstructionEnd,
					startWallDrawing,
					selectedWallData
				);
			}}
			onMouseMove={(e) => {
				const throttleMs = 17; // ~60fps
				if (!shouldUpdateMouseMove) {
					// console.log("Not Ready:");
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
					snap,
					point,
					e.target,
					canvasState,
					viewbox,
					wallMetaData,
					setWallMetaData,
					roomMetaData,
					roomPolygonData,
					objectMetaData,
					handleCameraChange,
					() => canvasState.setObjectEquationData([]),
					setCursor,
					setWallUnderCursor
				);
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
			cursor={cursorImg}
		>
			<defs>
				{gradientData.map((data) => (
					<LinearGradient
						key={data.id}
						id={data.id}
						color1={data.color1}
						color2={data.color2}
					/>
				))}
				<Patterns />
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
							className="room"
						></path>
					))}
			</g>
			<g
				id="boxRoom"
				visibility={layerSettings.showTexture ? "visible" : "hidden"}
			>
				{roomPathInfo &&
					roomPathInfo.map((data, i) => (
						<path
							key={i}
							d={data.path}
							fill={`url(#${data.room.color})`}
							fillOpacity="1"
							stroke="none"
							fillRule="evenodd"
							className="room"
						></path>
					))}
			</g>
			<g id="boxwall">
				{renderWalls &&
					renderWalls.map((wall, i) => (
						<path
							key={wall.id + i}
							d={wall.dPath ?? ""}
							stroke="none"
							fill={constants.COLOR_WALL}
							strokeWidth={1}
							strokeLinecap="butt"
							strokeLinejoin="miter"
							strokeMiterlimit={4}
							fillRule="nonzero"
						></path>
					))}
			</g>
			<g id="boxcarpentry"></g>
			<g
				id="boxEnergy"
				visibility={layerSettings.showDevices ? "visible" : "hidden"}
			></g>
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
				{wallHelperPathInfo && (
					<>
						<line
							id="line_construc"
							x1={wallHelperPathInfo.x1}
							y1={wallHelperPathInfo.y1}
							x2={wallHelperPathInfo.x2}
							y2={wallHelperPathInfo.y2}
							stroke="#9fb2e2"
							strokeWidth={canvasState.mode == Mode.Partition ? 10 : 20}
							strokeLinecap="butt"
							strokeOpacity={wallHelperPathInfo.constructOpacity}
						></line>
						<line
							id="linetemp"
							x1={wallHelperPathInfo.x1}
							y1={wallHelperPathInfo.y1}
							x2={wallHelperPathInfo.x2}
							y2={wallHelperPathInfo.y2}
							stroke="#transparent"
							strokeWidth={0.5}
							strokeOpacity={0.9}
						></line>
					</>
				)}
				{wallHelperNodeCircle && (
					<circle
						id="circlebinder"
						className="circle_css_2"
						cx={wallHelperNodeCircle.x}
						cy={wallHelperNodeCircle.y}
					></circle>
				)}
			</g>
			<g
				id="boxArea"
				visibility={layerSettings.showSurfaces ? "visible" : "hidden"}
			>
				{roomPathInfo &&
					roomPathInfo
						.filter((d) => d.centerPoint)
						.map((data, i) => (
							<React.Fragment key={i + "room-name"}>
								<text
									x={data.centerPoint.x}
									y={data.centerPoint.y}
									style={{
										fill:
											data.room.color == "gradientBlack" ||
											data.room.color == "gradientBlue"
												? "white"
												: "#343938",
									}}
									textAnchor="middle"
								>
									{data.room.name}
								</text>
								<text
									x={data.centerPoint.x}
									y={
										data.room.name
											? data.centerPoint.y + 20
											: data.centerPoint.y
									}
									style={{
										fill:
											data.room.color == "gradientBlack" ||
											data.room.color == "gradientBlue"
												? "white"
												: "#343938",
									}}
									fontSize="12.5px"
									fontWeight={data.room.surface ? "normal" : "bold"}
									textAnchor="middle"
								>
									{data.room.surface
										? data.room.surface + " m²"
										: (
												data.room.area /
												(constants.METER_SIZE * constants.METER_SIZE)
										  ).toFixed(2) + " m²"}
								</text>
							</React.Fragment>
						))}
			</g>
			<g
				id="boxRib"
				visibility={layerSettings.showMeasurements ? "visible" : "hidden"}
			></g>
			<g id="boxScale" visibility={showBoxScale ? "visible" : "hidden"}>
				{showBoxScale && scaleBoxDisplayData && wallMetaData.length > 2 && (
					<path
						d={scaleBoxDisplayData.path}
						stroke="#555"
						fill="none"
						strokeWidth={0.3}
						strokeLinecap="butt"
						strokeLinejoin="miter"
						strokeMiterlimit={4}
						fillRule="nonzero"
					></path>
				)}
				{showBoxScale &&
					scaleBoxDisplayData?.textItems.map((displayData) => (
						<text
							key={`${displayData.position.x}-${displayData.position.y}-scale-text`}
							x={displayData.position.x}
							y={displayData.position.y}
							transform={displayData.rotation}
							fill="#555"
							textAnchor="middle"
						>
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
