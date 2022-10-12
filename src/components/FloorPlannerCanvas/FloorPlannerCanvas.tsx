import { useEffect, useMemo, useState } from "react";
import { constants } from "../../../constants";
import { CanvasState } from "../../engine/CanvasState";
import { handleMouseDown } from "../../engine/mouseDown/MouseDownHandler";
import { handleMouseMove } from "../../engine/mouseMove/MouseMoveHandler";
import { handleMouseUp } from "../../engine/mouseUp/MouseUpHandler";
import { useHistory } from "../../hooks/useHistory";
import {
	Mode,
	LayerSettings,
	RoomDisplayData,
	SvgPathMetaData,
	CursorType,
} from "../../models";
import { GradientData } from "./GradientData";
import LinearGradient from "./LinearGradient";
import Patterns from "./Patterns";

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
	showWallTools: (separation: boolean) => void;
	handleCameraChange: (lens: string, xmove: number, xview: number) => void;
	cursor: string;
	setCursor: (crsr: CursorType) => void;
}

export const getCanvasDimensions = () => {
	return { w: $("#lin").width() || 0, h: $("#lin").height() || 0 };
};

const FloorPlannerCanvas: React.FC<Props> = ({
	layerSettings,
	canvasState,
	continuousWallMode,
	showBoxScale,
	applyMode,
	updateRoomDisplayData,
	showObjectTools,
	showOpeningTools,
	showWallTools,
	handleCameraChange,
	onMouseMove,
	cursor,
	setCursor,
}) => {
	const [cursorImg, setCursorImg] = useState("default");
	const [helperLineSvgData, setHelperLineSvgData] =
		useState<SvgPathMetaData | null>();

	const gradientData = useMemo<
		{ id: string; color1: string; color2: string }[]
	>(() => GradientData, []);

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
				setCursorImg(constants.VALIDATION_CURSOR);
				break;
			default:
				setCursorImg(cursor);
				break;
		}
	}, [cursor]);

	useEffect(() => {
		setHelperLineSvgData(null);
	}, [canvasState.mode]);

	const { save } = useHistory();

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
			viewBox="0 0 1100 700"
			preserveAspectRatio="xMidYMin slice"
			xmlns="http://www.w3.org/2000/svg"
			onWheel={(e) => {
				e.preventDefault();
				onMouseWheel(e.deltaY);
			}}
			onClick={(e) => e.preventDefault()}
			onMouseDown={(e) =>
				handleMouseDown({
					event: e,
					canvasState,
					setCursor,
				})
			}
			onMouseUp={(e) => {
				handleMouseUp({
					event: e,
					canvasState,
					resetMode: () => {
						applyMode(Mode.Select, "");
						return canvasState.mode;
					},
					showMeasurements: layerSettings.showMeasurements,
					save: () => save(canvasState),
					updateRoomDisplayData,
					setHelperLineSvgData,
					continuousWallMode,
					showObjectTools,
					showOpeningTools,
					showWallTools,
					setCursor,
				});
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

				onMouseMove();

				handleMouseMove(
					e,
					canvasState,
					continuousWallMode,
					handleCameraChange,
					() => canvasState.setObjectEquationData([]),
					setHelperLineSvgData,
					setCursor
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
			<g id="boxpath"></g>
			<g id="boxSurface"></g>
			<g
				id="boxRoom"
				visibility={layerSettings.showTexture ? "visible" : "hidden"}
			></g>
			<g id="boxwall"></g>
			<g id="boxcarpentry"></g>
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
	);
};
export default FloorPlannerCanvas;
