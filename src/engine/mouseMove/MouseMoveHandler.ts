import React from "react";
import { Mode, ObjectEquationData, SvgPathMetaData } from "../../models";
import { calculateSnap } from "../../utils";
import { CanvasState } from "../CanvasState";
import { handleMouseMoveBindMode } from "./BindModeMouseMoveHandler";
import { handleMouseMoveLineMode } from "./LineModeMouseMoveHandler";
import { handleMouseMoveOverObject } from "./ObjectMouseMoveHandler";
import { handleMouseMoveOpeningMode } from "./OpeningMouseMoveHandler";
import { handleMouseMoveRoomMode } from "./RoomModeMoveHandler";
import { handleMouseMoveSelectMode } from "./SelectModeMouseMoveHandler";

export const handleMouseMove = (
	event: React.TouchEvent | React.MouseEvent,
	canvasState: CanvasState,
	continuousWallMode: boolean,
	handleCameraChange: (lens: string, xmove: number, xview: number) => void,
	resetObjectEquationData: () => ObjectEquationData[],
	setHelperLineSvgData: (l: SvgPathMetaData | null) => void
) => {
	event.preventDefault();

	if (
		![
			Mode.Object,
			Mode.Room,
			Mode.Opening,
			Mode.Select,
			Mode.Line,
			Mode.Partition,
			Mode.Bind,
		].includes(canvasState.mode)
	)
		return;

	const snap = calculateSnap(event, canvasState.viewbox);

	switch (canvasState.mode) {
		case Mode.Object:
			handleMouseMoveOverObject(snap, canvasState);
			break;
		case Mode.Room:
			handleMouseMoveRoomMode(snap, canvasState);
			break;
		case Mode.Opening:
			handleMouseMoveOpeningMode(snap, canvasState);
			break;
		case Mode.Select:
			handleMouseMoveSelectMode(event, snap, canvasState, handleCameraChange);
			break;
		case Mode.Line:
		case Mode.Partition:
			handleMouseMoveLineMode(
				snap,
				setHelperLineSvgData,
				continuousWallMode,
				canvasState
			);
			break;
		case Mode.Bind:
			handleMouseMoveBindMode(
				snap,
				resetObjectEquationData,
				setHelperLineSvgData,
				canvasState
			);
			break;
		default:
			break;
	}
};
