import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { SelectedWallData } from '../components/FloorPlannerCanvas/FloorPlannerCanvas';
import { DeviceMetaData, ObjectMetaData, ViewboxData, WallMetaData } from '../models';
import {
	Mode,
	NodeMoveData,
	NodeWallObjectData,
	Point2D,
	WallEquation,
	WallEquationGroup
} from '../models/models';
import { Wall } from '../models/Wall';
import { setAction, setCursor, setMode } from '../store/floorPlanSlice';
import { RootState } from '../store/store';
import { angleBetweenEquations, findNearestWallInRange, pointInPolygon } from '../utils/svgTools';
import {
	calculateSnap,
	distanceBetween,
	findById,
	isObjectsEquals,
	perpendicularEquation,
	pointArraysAreEqual,
	pointsAreEqual
} from '../utils/utils';

interface Props {
	setPoint: (p: Point2D) => void;
	viewbox: ViewboxData;
	wallMetaData: WallMetaData[];
	setWallMetaData: (w: WallMetaData[]) => void;
	wallUnderCursor: WallMetaData | null;
	objectMetaData: ObjectMetaData[];
	startWallDrawing: (startPoint: Point2D) => void;
	setSelectedWallData: (data: SelectedWallData) => void;
	setObjectBeingMoved: (o: ObjectMetaData | null) => void;
	nodeUnderCursor: Point2D | undefined;
	setNodeBeingMoved: (n: NodeMoveData | undefined) => void;
	setDragging: (d: boolean) => void;
	objectUnderCursor: ObjectMetaData | undefined;
	deviceUnderCursor: DeviceMetaData | undefined;
	followerData: {
		equations: { wall: WallMetaData; eq: WallEquation; type: string }[];
		intersection: Point2D | null;
	};
}

export const useHandleMouseDown = ({
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
	setDragging,
	objectUnderCursor,
	setObjectBeingMoved,
	deviceUnderCursor,
	followerData
}: Props) => {
	const dispatch = useDispatch();
	const mode = useSelector((state: RootState) => state.floorPlan.mode);
	const action = useSelector((state: RootState) => state.floorPlan.action);

	const handleSelectModeNodeClicked = useCallback(
		(point: Point2D) => {
			if (!nodeUnderCursor) return;
			const nodeControl = { ...point };
			const nodeWallsMeta: WallMetaData[] = [];

			// Determine distance of opposed node on edge(s) and parent of this node
			for (let i = wallMetaData.length - 1; i > -1; i--) {
				// Search for youngest wall coords in node
				if (
					pointsAreEqual(wallMetaData[i].start, nodeControl) ||
					pointsAreEqual(wallMetaData[i].end, nodeControl)
				) {
					nodeWallsMeta.push(wallMetaData[i]);
					break;
				}
			}
			if (nodeWallsMeta[0].child != null) {
				const child = findById(nodeWallsMeta[0].child, wallMetaData);
				if (
					child &&
					(pointsAreEqual(child.start, nodeControl) || pointsAreEqual(child.end, nodeControl))
				)
					nodeWallsMeta.push(child);
			}
			if (nodeWallsMeta[0].parent != null) {
				const parent = findById(nodeWallsMeta[0].parent, wallMetaData);
				if (
					parent &&
					(pointsAreEqual(parent.start, nodeControl) || pointsAreEqual(parent.end, nodeControl))
				)
					nodeWallsMeta.push(parent);
			}

			const wallObjects: NodeWallObjectData[] = [];
			nodeWallsMeta.forEach((nodeWall) => {
				if (
					pointsAreEqual(nodeWall.start, nodeControl) ||
					pointsAreEqual(nodeWall.end, nodeControl)
				) {
					let nodeTarget = nodeWall.start;
					if (pointsAreEqual(nodeWall.start, nodeControl)) {
						nodeTarget = nodeWall.end;
					}
					const objWall = nodeWall.getObjects(objectMetaData);
					objWall.forEach((wallObject, idx) => {
						const distance = distanceBetween(wallObject, nodeTarget);
						wallObjects.push({
							wall: nodeWall,
							from: nodeTarget,
							distance: distance,
							obj: wallObject,
							index: idx
						});
					});
				}
			});

			setNodeBeingMoved({
				node: nodeUnderCursor,
				connectedWalls: nodeWallsMeta,
				connectedObjects: wallObjects
			});
		},
		[nodeUnderCursor, objectMetaData, setNodeBeingMoved, wallMetaData]
	);

	const handleSelectModeSegmentClicked = useCallback(
		(wallMeta: WallMetaData[]) => {
			if (!wallUnderCursor) return;
			const wall = Wall.fromWall(wallUnderCursor);
			let selectedWallData = {
				wall: wallUnderCursor,
				before: wallUnderCursor.start
			};
			const wallEquations: WallEquationGroup = {
				equation1: null,
				equation2: null,
				equation3: null
			};
			wallEquations.equation2 = wall.getEquation();
			if (wall.parent != null) {
				const parent = findById(wall.parent, wallMeta);
				wallEquations.equation1 = parent?.getEquation() ?? null;
				const angle12 = angleBetweenEquations(
					wallEquations.equation1?.A ?? 0,
					wallEquations.equation2?.A
				);
				if (angle12 < 20 || angle12 > 160) {
					let found = false;
					wallMeta.forEach((comparisonWall) => {
						if (
							comparisonWall.id !== parent?.id &&
							pointInPolygon(wall.start, comparisonWall.coords) &&
							// !isObjectsEquals(comparisonWall, wall.parent) &&
							!isObjectsEquals(comparisonWall, wall)
						) {
							const parentOfParent = findById(parent?.parent ?? '', wallMeta);
							if (parent && parentOfParent && parentOfParent.id === wall.id) {
								parent.parent = null;
							}

							const childOfParent = findById(parent?.child ?? '', wallMeta);
							if (
								parent &&
								childOfParent &&
								childOfParent.id === wall.id
								// isObjectsEquals(wall, wall.parent.child)
							) {
								parent.child = null;
							}
							wall.parent = null;
							found = true;
							selectedWallData = { ...selectedWallData, wall: wall };
							return;
						}
					});
					if (!found) {
						const parent = findById(wall.parent ?? '', wallMeta);
						if (parent && parent.end === wall.start) {
							// if (isObjectsEquals(wall.parent.end, wall.start, "1")) {
							const newWall = new Wall(parent.end, wall.start, 'normal', wall.thick);
							newWall.parent = wall.parent;
							newWall.child = wall.id;
							// WALLS.push(newWall);
							wallMeta = [...wallMeta, newWall];
							parent.child = newWall.id;
							wall.parent = newWall.id;
							if (wallEquations.equation2) {
								wallEquations.equation1 =
									perpendicularEquation(wallEquations.equation2, wall.start.x, wall.start.y) ??
									null;
							}
						} else if (parent && parent.start === wall.start) {
							// } else if (isObjectsEquals(parent.start, wall.start, "2")) {
							const newWall = new Wall(parent.start, wall.start, 'normal', wall.thick);
							newWall.parent = wall.parent;
							newWall.child = wall.id;
							wallMeta = [...wallMeta, newWall];
							// WALLS.push(newWall);
							parent.parent = newWall.id;
							wall.parent = newWall.id;
							if (wallEquations.equation2) {
								wallEquations.equation1 = perpendicularEquation(
									wallEquations.equation2,
									wall.start.x,
									wall.start.y
								);
							}
						}
					}
				}
			}

			if (wall.parent == null) {
				let foundEq = false;
				for (const k in wallMeta) {
					if (
						wallEquations.equation2 &&
						pointInPolygon(wall.start, wallMeta[k].coords) &&
						!pointArraysAreEqual(wallMeta[k].coords, wall.coords)
					) {
						const angleFollow = angleBetweenEquations(
							wallMeta[k].equations.base.A,
							wallEquations.equation2.A
						);
						if (angleFollow < 20 || angleFollow > 160) break;
						wallEquations.equation1 = wallMeta[k].getEquation();
						wallEquations.equation1.follow = wallMeta[k];
						wallEquations.equation1.backup = wallMeta[k];
						foundEq = true;
						break;
					}
				}
				if (!foundEq && wallEquations.equation2)
					wallEquations.equation1 = perpendicularEquation(
						wallEquations.equation2,
						wall.start.x,
						wall.start.y
					);
			}

			if (wall.child != null) {
				const child = findById(wall.child, wallMeta);
				wallEquations.equation3 = child?.getEquation() ?? null;
				const angle23 = angleBetweenEquations(
					wallEquations?.equation3?.A ?? 0,
					wallEquations?.equation2?.A
				);
				if (angle23 < 20 || angle23 > 160) {
					let found = true;
					for (const k in wallMeta) {
						if (
							pointInPolygon(wall.end, wallMeta[k].coords) &&
							wallMeta[k].id !== wall.child &&
							// !isObjectsEquals(wallMetaData[k], wall.child) &&
							!isObjectsEquals(wallMeta[k], wall)
						) {
							if (child?.parent != null && wall.id === child.parent) {
								child.parent = null;
							}

							const childOfChild = findById(child?.child ?? '', wallMeta);
							if (
								child &&
								childOfChild &&
								wall.id === childOfChild.id
								// isObjectsEquals(wall, wall.child.child)
							) {
								// wall.child.child = null;
								child.child = null;
							}

							wall.child = null;
							found = false;
							break;
						}
					}
					if (found) {
						const child = findById(wall.child ?? '', wallMeta);
						if (child && pointsAreEqual(child.start, wall.end)) {
							const newWall = new Wall(wall.end, child.start, 'new', wall.thick);
							newWall.parent = wall.id;
							newWall.child = wall.child;
							wallMeta = [...wallMeta, newWall];
							// WALLS.push(newWall);
							child.parent = newWall.id;
							wall.child = newWall.id;
							if (wallEquations.equation2) {
								wallEquations.equation3 = perpendicularEquation(
									wallEquations.equation2,
									wall.end.x,
									wall.end.y
								);
							}
						} else if (child && pointsAreEqual(child.end, wall.end)) {
							const newWall = new Wall(wall.end, child.end, 'normal', wall.thick);
							newWall.parent = wall.id;
							newWall.child = child.id;
							wallMeta = [...wallMeta, newWall];
							// WALLS.push(newWall);
							child.child = newWall.id;
							wall.child = newWall.id;
							if (wallEquations.equation2) {
								wallEquations.equation3 = perpendicularEquation(
									wallEquations.equation2,
									wall.end.x,
									wall.end.y
								);
							}
						}
					}
				}
			}
			if (wall.child == null) {
				let foundEq = false;
				for (const k in wallMeta) {
					if (
						wallEquations.equation2 &&
						pointInPolygon(wall.end, wallMeta[k].coords) &&
						!pointArraysAreEqual(wallMeta[k].coords, wall.coords)
					) {
						const angleFollow = angleBetweenEquations(
							wallMeta[k].equations.base.A,
							wallEquations.equation2.A
						);
						if (angleFollow < 20 || angleFollow > 160) break;
						wallEquations.equation3 = wallMeta[k].getEquation();
						wallEquations.equation3.follow = wallMeta[k];
						wallEquations.equation3.backup = wallMeta[k];
						foundEq = true;
						break;
					}
				}
				if (!foundEq && wallEquations.equation2) {
					wallEquations.equation3 = perpendicularEquation(
						wallEquations.equation2,
						wall.end.x,
						wall.end.y
					);
				}
			}

			followerData.equations = [];
			for (const k in wallMeta) {
				if (
					wallMeta[k].child == null &&
					pointInPolygon(wallMeta[k].end, wall.coords) &&
					!isObjectsEquals(wall, wallMeta[k])
				) {
					followerData.equations.push({
						wall: wallMeta[k],
						eq: wallMeta[k].getEquation(),
						type: 'end'
					});
				}
				if (
					wallMeta[k].parent == null &&
					pointInPolygon(wallMeta[k].start, wall.coords) &&
					!isObjectsEquals(wall, wallMeta[k])
				) {
					followerData.equations.push({
						wall: wallMeta[k],
						eq: wallMeta[k].getEquation(),
						type: 'start'
					});
				}
			}
			setWallMetaData(wallMeta);
			setSelectedWallData({
				wall: selectedWallData.wall,
				before: selectedWallData.before,
				equationData: wallEquations
			});
		},
		[followerData, setSelectedWallData, setWallMetaData, wallUnderCursor]
	);

	const handleMouseDown = useCallback(
		(event: React.TouchEvent | React.MouseEvent) => {
			const enterBindMode = () => {
				dispatch(setMode(Mode.Bind));
				dispatch(setAction(true));
			};
			event.preventDefault();

			switch (mode) {
				case Mode.Line:
				case Mode.Partition: {
					if (action) break;
					const snap = calculateSnap(event, viewbox);
					const nearestWallData = findNearestWallInRange(snap, wallMetaData, 12);
					if (nearestWallData) {
						const nearestPoint = { x: nearestWallData.x, y: nearestWallData.y };
						setPoint(nearestPoint);
						startWallDrawing(nearestPoint);
					} else {
						const nearestPoint = { x: snap.x, y: snap.y };
						setPoint(nearestPoint);
						startWallDrawing(nearestPoint);
					}
					dispatch(setAction(true));
					break;
				}
				case Mode.EditDoor: {
					dispatch(setAction(true));
					dispatch(setCursor('pointer'));
					break;
				}
				case Mode.Select: {
					if (deviceUnderCursor) {
						enterBindMode();
						return;
					}

					if (nodeUnderCursor) {
						enterBindMode();
						setPoint({ ...nodeUnderCursor });

						handleSelectModeNodeClicked(nodeUnderCursor);
						return;
					}

					if (wallUnderCursor) {
						enterBindMode();
						handleSelectModeSegmentClicked(wallMetaData);
						return;
					}

					if (objectUnderCursor) {
						setObjectBeingMoved(objectUnderCursor);
						enterBindMode();
						return;
					}

					dispatch(setAction(false));
					setDragging(true);
					const snap = calculateSnap(event, viewbox);
					setPoint({ x: snap.xMouse, y: snap.yMouse });
				}
			}
		},
		[
			action,
			deviceUnderCursor,
			dispatch,
			handleSelectModeNodeClicked,
			handleSelectModeSegmentClicked,
			mode,
			nodeUnderCursor,
			objectUnderCursor,
			setDragging,
			setObjectBeingMoved,
			setPoint,
			startWallDrawing,
			viewbox,
			wallMetaData,
			wallUnderCursor
		]
	);

	return handleMouseDown;
};
