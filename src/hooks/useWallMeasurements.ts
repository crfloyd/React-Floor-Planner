import { useCallback, useEffect, useState } from 'react';

import { constants } from '../../constants';
import { WallMetaData } from '../models';
import { ObjectMetaData, Point2D } from '../models/models';
import { nearPointOnEquation, pointInPolygon } from '../utils/svgTools';
import { distanceBetween, getMidPoint, intersectionOfSideEquations } from '../utils/utils';

type WallMeasurementData = {
	wallIndex?: number;
	crossEdge?: number;
	side: string;
	coords: Point2D;
	distance: number;
};

export interface WallMeasurementRenderData {
	start: Point2D;
	shift: number;
	angle: number;
	content: number;
	insideWall: boolean;
}

export const useWallMeasurements = (walls: WallMetaData[]) => {
	const [measurementRenderData, setMeasurementRenderData] = useState<WallMeasurementRenderData[]>(
		[]
	);
	const [inWallMeasurementRenderData, setInWallMeasurementRenderData] = useState<
		WallMeasurementRenderData[] | undefined
	>([]);

	const buildWallMeasurementData = useCallback(
		(wallMeta: WallMetaData[]): WallMeasurementRenderData[] => {
			const upWalls: WallMeasurementData[][] = [];
			const downWalls: WallMeasurementData[][] = [];
			for (const i in wallMeta.filter((w) => w.coords.length == 4)) {
				const wall = wallMeta[i];
				if (!wall.equations.base) continue;

				const upDataArray: WallMeasurementData[] = [];
				upDataArray.push({
					wallIndex: +i,
					crossEdge: +i,
					side: 'up',
					coords: wall.coords[0],
					distance: 0
				});

				const downDataArray: WallMeasurementData[] = [];
				downDataArray.push({
					wallIndex: +i,
					crossEdge: +i,
					side: 'down',
					coords: wall.coords[1],
					distance: 0
				});
				for (const p in wallMeta) {
					if (i === p) continue;

					const comparisonWall = wallMeta[p];
					if (!comparisonWall.equations.base) continue;

					const cross = intersectionOfSideEquations(
						wall.equations.base,
						comparisonWall.equations.base
					);
					if (!cross || !wall.pointInsideWall(cross, true)) continue;

					let inter = intersectionOfSideEquations(wall.equations.up, comparisonWall.equations.up);
					if (
						inter &&
						wall.pointBetweenCoords(inter, 1, true) &&
						comparisonWall.pointBetweenCoords(inter, 1, true)
					) {
						const distance = distanceBetween(wall.coords[0], inter) / constants.METER_SIZE;
						upDataArray.push({
							wallIndex: +i,
							crossEdge: +p,
							side: 'up',
							coords: inter,
							distance: +distance.toFixed(2)
						});
					}

					inter = intersectionOfSideEquations(wall.equations.up, comparisonWall.equations.down);
					if (
						inter &&
						wall.pointBetweenCoords(inter, 1, true) &&
						comparisonWall.pointBetweenCoords(inter, 2, true)
					) {
						const distance = distanceBetween(wall.coords[0], inter) / constants.METER_SIZE;
						upDataArray.push({
							wallIndex: +i,
							crossEdge: +p,
							side: 'up',
							coords: inter,
							distance: +distance.toFixed(2)
						});
					}

					inter = intersectionOfSideEquations(wall.equations.down, comparisonWall.equations.up);
					if (
						inter &&
						wall.pointBetweenCoords(inter, 2, true) &&
						comparisonWall.pointBetweenCoords(inter, 1, true)
					) {
						const distance = distanceBetween(wall.coords[1], inter) / constants.METER_SIZE;
						downDataArray.push({
							wallIndex: +i,
							crossEdge: +p,
							side: 'down',
							coords: inter,
							distance: +distance.toFixed(2)
						});
					}

					inter = intersectionOfSideEquations(wall.equations.down, comparisonWall.equations.down);
					if (
						inter &&
						wall.pointBetweenCoords(inter, 2, true) &&
						comparisonWall.pointBetweenCoords(inter, 2, true)
					) {
						const distance = distanceBetween(wall.coords[1], inter) / constants.METER_SIZE;
						downDataArray.push({
							wallIndex: +i,
							crossEdge: +p,
							side: 'down',
							coords: inter,
							distance: +distance.toFixed(2)
						});
					}
				}
				const distance = distanceBetween(wall.coords[0], wall.coords[3]) / constants.METER_SIZE;
				upDataArray.push({
					wallIndex: +i,
					crossEdge: +i,
					side: 'up',
					coords: wall.coords[3],
					distance: +distance.toFixed(2)
				});
				const distance2 = distanceBetween(wall.coords[1], wall.coords[2]) / constants.METER_SIZE;
				downDataArray.push({
					wallIndex: +i,
					crossEdge: +i,
					side: 'down',
					coords: wall.coords[2],
					distance: +distance2.toFixed(2)
				});

				upWalls.push(upDataArray);
				downWalls.push(downDataArray);
			}

			// Sort by distance
			for (const a in upWalls) {
				upWalls[a].sort(function (a, b) {
					return +(a.distance - b.distance).toFixed(2);
				});
			}
			for (const a in downWalls) {
				downWalls[a].sort(function (a, b) {
					return +(a.distance - b.distance).toFixed(2);
				});
			}

			const renderData: WallMeasurementRenderData[] = [];

			upWalls.forEach((upWallArray) => {
				const result = createWallRenderData(upWallArray, wallMeta, 5);
				if (result) renderData.push(result);
			});
			downWalls.forEach((downWallArray) => {
				const result = createWallRenderData(downWallArray, wallMeta, 5);
				if (result) renderData.push(result);
			});

			return renderData;
			// return { upWalls, downWalls };
		},
		[]
	);

	useEffect(() => {
		setInWallMeasurementRenderData(undefined);
		setMeasurementRenderData(buildWallMeasurementData(walls));
	}, [walls, buildWallMeasurementData]);

	const createWallRenderData = (
		measureData: WallMeasurementData[],
		wallMeta: WallMetaData[],
		shift: number
	): WallMeasurementRenderData | undefined => {
		for (let n = 1; n < measureData.length; n++) {
			const current = measureData[n];
			const previous = measureData[n - 1];
			const edge = current.wallIndex ?? 0;
			const crossEdge = current.crossEdge ?? 0;
			const prevCrossEdge = previous.crossEdge ?? 0;
			if (previous.wallIndex == edge) {
				const valueText = Math.abs(previous.distance - current.distance);

				if (valueText < 0.15) continue;

				if (prevCrossEdge == crossEdge && crossEdge != edge) continue;

				if (measureData.length > 2) {
					const polygon = [];
					if (n == 1) {
						for (let pp = 0; pp < 4; pp++) {
							polygon.push({
								x: wallMeta[crossEdge].coords[pp].x,
								y: wallMeta[crossEdge].coords[pp].y
							});
						}
						if (pointInPolygon(measureData[0].coords, polygon)) {
							continue;
						}
					} else if (n == measureData.length - 1) {
						for (let pp = 0; pp < 4; pp++) {
							polygon.push({
								x: wallMeta[prevCrossEdge].coords[pp].x,
								y: wallMeta[prevCrossEdge].coords[pp].y
							});
						}
						if (pointInPolygon(measureData[measureData.length - 1].coords, polygon)) {
							continue;
						}
					}
				}

				let angle = wallMeta[edge].angle * (180 / Math.PI);
				let shiftValue = -shift;
				if (previous.side == 'down') {
					shiftValue = -shiftValue + 10;
				}
				if (angle > 90 || angle < -89) {
					angle -= 180;
					shiftValue = -shift;
					if (previous.side !== 'down') {
						shiftValue = -shiftValue + 10;
					}
				}

				return {
					start: getMidPoint(previous.coords, current.coords),
					shift: shiftValue,
					angle: angle,
					content: valueText,
					insideWall: false
				};
				// addSizeTextToScene(current, previous, valueText, angle, shiftValue);
			}
		}
	};

	const setInWallMeasurementText = (wall: WallMetaData, objectMetas: ObjectMetaData[]) => {
		const upWalls: WallMeasurementData[] = [];
		const downWalls: WallMeasurementData[] = [];
		upWalls.push({
			side: 'up',
			coords: wall.coords[0],
			distance: 0
		});
		downWalls.push({
			side: 'down',
			coords: wall.coords[1],
			distance: 0
		});

		const addMeasureData = (
			p1: { x: number; y: number },
			p2: { x: number; y: number },
			objSide: 'up' | 'down'
		) => {
			const mesureArray = objSide === 'up' ? upWalls : downWalls;
			const distance = distanceBetween(p1, p2) / constants.METER_SIZE;
			mesureArray.push({
				side: objSide,
				coords: p2,
				distance: distance
			});
		};

		const objectsOnWall = wall.getObjects(objectMetas);
		for (const ob in objectsOnWall) {
			const objTarget = objectsOnWall[ob];
			const upPoints = [
				nearPointOnEquation(wall.equations.up, objTarget.limit[0]),
				nearPointOnEquation(wall.equations.up, objTarget.limit[1])
			];
			const downPoints = [
				nearPointOnEquation(wall.equations.down, objTarget.limit[0]),
				nearPointOnEquation(wall.equations.down, objTarget.limit[1])
			];
			addMeasureData(wall.coords[0], upPoints[0], 'up');
			addMeasureData(wall.coords[0], upPoints[1], 'up');
			addMeasureData(wall.coords[1], downPoints[0], 'down');
			addMeasureData(wall.coords[1], downPoints[1], 'down');
		}

		addMeasureData(wall.coords[0], wall.coords[3], 'up');
		addMeasureData(wall.coords[1], wall.coords[2], 'down');

		upWalls.sort((a, b) => {
			return parseInt((a.distance - b.distance).toFixed(2));
		});
		downWalls.sort((a, b) => {
			return parseInt((a.distance - b.distance).toFixed(2));
		});

		const renderData = createInWallRenderData(upWalls, wall).concat(
			createInWallRenderData(downWalls, wall)
		);
		setInWallMeasurementRenderData(renderData);
	};

	const createInWallRenderData = (
		measureData: WallMeasurementData[],
		wall: WallMetaData
	): WallMeasurementRenderData[] => {
		const renderData: WallMeasurementRenderData[] = [];
		for (let i = 1; i < measureData.length; i++) {
			let angleTextValue = wall.angle * (180 / Math.PI);
			const current = measureData[i];
			const previous = measureData[i - 1];
			const valueText = Math.abs(previous.distance - current.distance);

			let shift = -5;
			if (previous.side === 'down') {
				shift = -shift + 10;
			}
			if (angleTextValue > 89 || angleTextValue < -89) {
				angleTextValue -= 180;
				if (previous.side === 'down') {
					shift = -5;
				} else {
					shift = -shift + 10;
				}
			}

			renderData.push({
				start: getMidPoint(previous.coords, current.coords),
				shift: shift,
				angle: angleTextValue,
				content: valueText,
				insideWall: true
			});
			// addSizeTextToScene(current, previous, valueText, angleTextValue, shift, true);
		}
		return renderData;
	};

	return { measurementRenderData, inWallMeasurementRenderData, setInWallMeasurementText };
};
