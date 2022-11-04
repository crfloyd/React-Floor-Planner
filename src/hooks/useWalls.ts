import { useCallback, useState } from 'react';

import { ObjectMetaData, Point2D, WallMetaData } from '../models';
import { Wall } from '../models/Wall';
import { distanceBetween, intersectionOfEquations } from '../utils/utils';

export const useWalls = () => {
	const [wallMetaData, setWallMetaData] = useState<WallMetaData[]>([]);

	const splitWall = useCallback(
		(wallToSplit: WallMetaData) => {
			const eqWall = wallToSplit.getEquation();
			const wallToSplitLength = distanceBetween(wallToSplit.start, wallToSplit.end);
			const newWalls: { distance: number; coords: Point2D }[] = [];

			wallMetaData.forEach((wall) => {
				const eq = wall.getEquation();
				const inter = intersectionOfEquations(eqWall, eq);
				if (
					inter &&
					wallToSplit.pointInsideWall(inter, true) &&
					wall.pointInsideWall(inter, true)
				) {
					const distance = distanceBetween(wallToSplit.start, inter);
					if (distance > 5 && distance < wallToSplitLength) {
						newWalls.push({ distance: distance, coords: inter });
					}
				}
			});

			newWalls.sort((a: { distance: number }, b: { distance: number }) => {
				return a.distance - b.distance;
			});

			let initCoords = wallToSplit.start;
			const initThick = wallToSplit.thick;

			// Clear the wall to split from its parents and children
			const otherWalls = wallMetaData.filter((w) => w.id !== wallToSplit.id);
			otherWalls.forEach((w) => {
				w.child = w.child === wallToSplit.id ? null : w.child;
				w.parent = w.parent === wallToSplit.id ? null : w.parent;
			});

			// Add each new wall created from the split
			newWalls.forEach((newWall) => {
				const wall = new Wall(initCoords, newWall.coords, 'normal', initThick);
				otherWalls.push(wall);
				wall.child = otherWalls[otherWalls.length - 1].id;
				initCoords = newWall.coords;
			});

			// Add the last wall
			const wall = new Wall(initCoords, wallToSplit.end, 'normal', initThick);
			otherWalls.push(wall);
			setWallMetaData(otherWalls);
			// save(wallMetaData, objectMetaData, roomMetaData);
		},
		[wallMetaData]
	);

	const deleteWall = useCallback(
		(wall: WallMetaData) => {
			const filteredWalls = [...wallMetaData.filter((w) => w.id !== wall.id)];
			filteredWalls.forEach((wall) => {
				if (wall.child === wall.id) wall.child = null;
				if (wall.parent === wall.id) {
					wall.parent = null;
				}
			});
			for (const k in filteredWalls) {
				if (filteredWalls[k].child === wall.id) filteredWalls[k].child = null;
				if (filteredWalls[k].parent === wall.id) {
					filteredWalls[k].parent = null;
				}
			}
			setWallMetaData(filteredWalls);
		},
		[wallMetaData]
	);

	const updateWallThickness = useCallback(
		(wall: WallMetaData, value: number, allObjects: ObjectMetaData[]) => {
			wall.thick = value;
			wall.type = 'normal';
			setWallMetaData([...wallMetaData]);

			const wallObjects = wall.getObjects(allObjects);
			wallObjects.forEach((o) => {
				o.thick = value;
			});
			return wallObjects;
		},
		[wallMetaData]
	);

	const makeWallInvisible = useCallback(
		(wall: WallMetaData, allObjects: ObjectMetaData[]) => {
			if (wall.getObjects(allObjects).length != 0) return false;
			wall.makeInvisible();
			setWallMetaData([...wallMetaData]);
			return true;
		},
		[wallMetaData]
	);

	const makeWallVisible = useCallback(
		(wall: WallMetaData) => {
			wall.makeVisible();
			setWallMetaData([...wallMetaData]);
		},
		[wallMetaData]
	);

	return {
		wallMetaData,
		setWallMetaData,
		splitWall,
		deleteWall,
		updateWallThickness,
		makeWallInvisible,
		makeWallVisible
	};
};