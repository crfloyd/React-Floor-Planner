import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { constants } from '../../constants';
import {
	CursorType,
	Mode,
	Point2D,
	SnapData,
	SvgPathMetaData,
	WallMetaData
} from '../models/models';
import { setCursor } from '../store/floorPlanSlice';
import { angleBetweenPoints, createWallGuideLine, findNearestWallInRange } from '../utils/svgTools';
import { distanceBetween, getMidPoint, getNearestWallNode } from '../utils/utils';

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
export const useDrawWalls = (
	snapPosition: SnapData,
	wallMetaData: WallMetaData[],
	mode: Mode,
	continuousWallMode: boolean,
	updatePoint: (c: Point2D) => void
) => {
	const dispatch = useDispatch();
	const [wallHelperPathInfo, setWallHelperPathInfo] = useState<WallHelperPathData | null>(null);
	const [wallHelperTextData, setWallHelperTextData] = useState<WallHelperTextData | null>(null);
	const [wallHelperNodeCircle, setWallHelperNodeCircle] = useState<Point2D | null>();
	const [wallEndConstructionData, setWallEndConstructionData] =
		useState<WallEndConstructionData | null>(null);
	const [helperLineSvgData, setHelperLineSvgData] = useState<SvgPathMetaData | null>();

	const [wallEndPoint, setWallEndPoint] = useState<Point2D | null>(null);
	const [wallStartPoint, setWallStartPoint] = useState<Point2D | null>(null);
	const [shouldWallConstructionEnd, setShouldWallConstructionEnd] = useState(false);

	const clearWallHelperState = () => {
		// console.trace("Clearing Draw State", mode);
		setWallHelperPathInfo(null);
		setWallHelperTextData(null);
		setWallHelperNodeCircle(null);
		setWallEndConstructionData(null);
		setHelperLineSvgData(null);
		setWallStartPoint(null);
		setWallEndPoint(null);
		setShouldWallConstructionEnd(false);
	};

	const startWallDrawing = (startPoint: Point2D) => {
		setWallStartPoint(startPoint);
	};

	const setWallText = (startPoint: Point2D, endPoint: Point2D) => {
		const startText = getMidPoint(startPoint, endPoint);
		const angleText = angleBetweenPoints(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
		const valueText = (
			distanceBetween(
				{
					x: startPoint.x,
					y: startPoint.y
				},
				{
					x: endPoint.x,
					y: endPoint.y
				}
			) / 60
		).toFixed(2);

		setWallHelperTextData({
			x: startText.x,
			y: startText.y - 15,
			content: +valueText < 0.1 ? '' : valueText + ' m',
			angle: angleText.deg
		});
	};

	useEffect(() => {
		// Only run in Line or Partition modes
		if (mode !== Mode.Line && mode !== Mode.Partition) {
			clearWallHelperState();
			return;
		}

		// Find the node nearest the current mouse position;
		const nearestWallData = getNearestWallNode(snapPosition, wallMetaData, 20);

		// Guide positional data for nearest wall guide line
		const wallGuideLine = createWallGuideLine(snapPosition, wallMetaData, 10);

		// Wall construction not started. In line mode but have not clicked
		// yet to start wall creation. Just provide guide lines and helper icons,
		// Also determines closest node or wall and provides that point.
		if (!wallStartPoint) {
			let cursor: CursorType = 'grab';
			// let startPoint = { x: snapPosition.x, y: snapPosition.y };
			if (wallGuideLine) {
				// if (wallGuideLine.distance < 10) {
				// 	startPoint = { x: wallGuideLine.x, y: wallGuideLine.y };
				// }

				setHelperLineSvgData(wallGuideLine.svgData);
			} else {
				cursor = 'crosshair';
			}

			if (nearestWallData) {
				// startPoint = nearestWallData.bestPoint;
				cursor = 'grab';
				console.log('nearest wall', nearestWallData);
				setWallHelperNodeCircle(nearestWallData.bestPoint);
			} else {
				setWallHelperNodeCircle(null);
			}

			// updatePoint(startPoint);
			dispatch(setCursor(cursor));
			return;
		}

		// console.log("Drawing started");

		let startPoint = { ...wallStartPoint };
		let cursor: CursorType = 'crosshair';

		// If this is the first update since starting the wall,
		// update the start point to the nearest node if available
		if (wallHelperPathInfo == null && nearestWallData) {
			startPoint = nearestWallData.bestPoint;
			updatePoint(startPoint);
			cursor =
				nearestWallData.bestWallId == wallMetaData[wallMetaData.length - 1].id
					? 'validation'
					: 'grab';
		}

		let endPoint: Point2D = { ...snapPosition };

		// If the start and end position is too close to draw, just return
		const delta = Math.abs(startPoint.x - endPoint.x) + Math.abs(startPoint.y - endPoint.y);
		if (delta <= constants.GRID_SIZE) return;

		const pathData: WallHelperPathData = {
			x1: startPoint.x,
			x2: endPoint.x,
			y1: startPoint.y,
			y2: endPoint.y,
			constructOpacity: 0.7
		};

		// snap endpoint to guidline if one exists
		if (wallGuideLine) {
			endPoint = { x: wallGuideLine.x, y: wallGuideLine.y };
		}
		setHelperLineSvgData(wallGuideLine?.svgData);

		let shouldDrawingEnd = false;

		// If there is a nearby wall, flag drawing end true
		// and snap endpoint to it.
		const nearestPointOnWall = findNearestWallInRange(snapPosition, wallMetaData, 12);
		if (nearestPointOnWall) {
			// console.log("Wall Should End:", nearestPointOnWall);
			shouldDrawingEnd = true;
			// TO SNAP SEGMENT TO FINALIZE X2Y2
			endPoint = { x: nearestPointOnWall.x, y: nearestPointOnWall.y };
			cursor = 'grab';
		}

		// If there is a nearby node, snap endpoint to it and flag
		// it for highlighting
		let addHelperCircle = false;
		if (nearestWallData) {
			addHelperCircle = true;
			endPoint = nearestWallData.bestPoint;
			shouldDrawingEnd = true;
			setHelperLineSvgData(null);
			if (
				nearestWallData.bestWallId == wallMetaData[wallMetaData.length - 1].id &&
				continuousWallMode
			) {
				cursor = 'validation';
			} else {
				cursor = 'grab';
			}
		} else {
			if (!shouldDrawingEnd) cursor = 'crosshair';
		}

		const angleData = angleBetweenPoints(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
		const wallAngleDegrees = Math.abs(angleData.deg);
		const coeff = angleData.deg / wallAngleDegrees; // -45 -> -1     45 -> 1
		const phi = startPoint.y - coeff * startPoint.x;
		const xDiag = (endPoint.y - phi) / coeff;

		// TODO: Why is this check here? Maybe check for wallHelperPathInfo null?
		// if (binder == null) {
		if (!nearestWallData) {
			let found = false;
			let x = endPoint.x;
			let y = endPoint.y;

			// HELP FOR H LINE
			if (wallAngleDegrees < 15 && Math.abs(startPoint.y - endPoint.y) < 25) {
				y = startPoint.y;
				found = true;
			}
			// HELP FOR V LINE
			if (wallAngleDegrees > 75 && Math.abs(startPoint.x - endPoint.x) < 25) {
				x = startPoint.x;
				found = true;
			}
			// HELP FOR DIAG LINE
			if (wallAngleDegrees < 55 && wallAngleDegrees > 35 && Math.abs(xDiag - endPoint.x) < 20) {
				x = xDiag;
				// x = Xdiag;
				found = true;
			}

			endPoint = { x, y };
			if (found) {
				pathData.constructOpacity = 1;
			}
		}

		pathData.x2 = endPoint.x;
		pathData.y2 = endPoint.y;
		setWallHelperPathInfo(pathData);
		if (addHelperCircle) {
			setWallHelperNodeCircle(endPoint);
		}
		setWallStartPoint(startPoint);
		setWallEndPoint(endPoint);
		setShouldWallConstructionEnd(shouldDrawingEnd);
		dispatch(setCursor(cursor));
		// canvasState.setWallEndConstruc(shouldEndWall);

		setWallEndConstructionData({
			start: startPoint,
			end: endPoint
		});

		setWallText(startPoint, endPoint);
	}, [snapPosition, continuousWallMode, mode]);

	return {
		startWallDrawing,
		wallHelperTextData,
		wallHelperNodeCircle,
		wallHelperPathInfo,
		wallEndConstructionData,
		helperLineSvgData,
		shouldWallConstructionEnd,
		clearWallHelperState
	};
};
