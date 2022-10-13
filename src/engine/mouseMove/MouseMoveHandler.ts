import React from "react";
import {
	CursorType,
	Mode,
	ObjectEquationData,
	ObjectMetaData,
	RoomMetaData,
	RoomPolygonData,
	SvgPathMetaData,
	ViewboxData,
	WallMetaData,
} from "../../models";
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
	viewbox: ViewboxData,
	wallMetaData: WallMetaData[],
	setWallMetaData: (w: WallMetaData[]) => void,
	roomMetaData: RoomMetaData[],
	setRoomMetaData: (r: RoomMetaData[]) => void,
	roomPolygonData: RoomPolygonData,
	setRoomPolygonData: (r: RoomPolygonData) => void,
	objectMetaData: ObjectMetaData[],
	handleCameraChange: (lens: string, xmove: number, xview: number) => void,
	resetObjectEquationData: () => ObjectEquationData[],
	setHelperLineSvgData: (l: SvgPathMetaData | null) => void,
	setCursor: (crsr: CursorType) => void
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

	const snap = calculateSnap(event, viewbox);

	switch (canvasState.mode) {
		case Mode.Object:
			handleMouseMoveOverObject(snap, canvasState, viewbox, wallMetaData);
			break;
		case Mode.Room:
			handleMouseMoveRoomMode(snap, canvasState, roomMetaData, roomPolygonData);
			break;
		case Mode.Opening:
			handleMouseMoveOpeningMode(snap, canvasState, viewbox, wallMetaData);
			break;
		case Mode.Select:
			handleMouseMoveSelectMode(
				event,
				snap,
				canvasState,
				viewbox,
				setCursor,
				handleCameraChange,
				wallMetaData,
				objectMetaData
			);
			break;
		case Mode.Line:
		case Mode.Partition:
			handleMouseMoveLineMode(
				snap,
				setHelperLineSvgData,
				continuousWallMode,
				setCursor,
				canvasState,
				wallMetaData
			);
			break;
		case Mode.Bind:
			handleMouseMoveBindMode(
				snap,
				resetObjectEquationData,
				setHelperLineSvgData,
				setCursor,
				canvasState,
				wallMetaData,
				objectMetaData,
				roomMetaData,
				setRoomMetaData,
				roomPolygonData,
				setRoomPolygonData,
				setWallMetaData
			);
			break;
		default:
			break;
	}
};
