import {
	CursorType,
	DeviceMetaData,
	NodeMoveData,
	ObjectEquationData,
	ObjectMetaData,
	Point2D,
	SnapData,
	WallEquationGroup,
	WallMetaData
} from '../../models/models';
import {
	calculateObjectRenderData,
	createWallGuideLine,
	findNearestWallInRange,
	getAngle,
	getUpdatedObject,
	pointInPolygon
} from '../../utils/svgTools';
import {
	computeLimit,
	distanceBetween,
	findById,
	getNearestWallNode,
	intersectionOfEquations,
	isObjectsEquals,
	pointsAreEqual,
	vectorDeter,
	vectorXY
} from '../../utils/utils';
import { CanvasState } from '../';

export const handleMouseMoveBindMode = (
	snap: SnapData,
	action: boolean,
	setCursor: (crsr: CursorType) => void,
	canvasState: CanvasState,
	wallMeta: WallMetaData[],
	wallUnderCursor: WallMetaData | null,
	objectMeta: ObjectMetaData[],
	setObjectMeta: (o: ObjectMetaData[]) => void,
	setWallMeta: (w: WallMetaData[]) => void,
	objectBeingMoved: ObjectMetaData | null,
	setObjectBeingMoved: (o: ObjectMetaData | null) => void,
	nodeBeingMoved: NodeMoveData | undefined,
	setNodeBeingMoved: (n: NodeMoveData | undefined) => void,
	setInWallMeasurementText: (wall: WallMetaData, objects: ObjectMetaData[]) => void,
	objectEquationData: ObjectEquationData[],
	wallEquations: WallEquationGroup,
	deviceUnderCursor: DeviceMetaData | undefined
) => {
	const { followerData } = canvasState;

	if (deviceUnderCursor) {
		return;
	}

	const objTarget = objectMeta.find((o) => o.id === objectBeingMoved?.targetId);
	if (objectBeingMoved?.type == 'boundingBox' && action) {
		objectBeingMoved.x = snap.x;
		objectBeingMoved.y = snap.y;

		if (objTarget) {
			const { newHeight, newWidth, newRealBbox, newRenderData } = calculateObjectRenderData(
				objTarget.size,
				objTarget.thick,
				objTarget.angle,
				objTarget.class,
				objTarget.type,
				{ x: snap.x, y: snap.y }
			);
			objTarget.x = snap.x;
			objTarget.y = snap.y;
			objTarget.height = newHeight;
			objTarget.width = newWidth;
			objTarget.realBbox = newRealBbox;
			objTarget.renderData = newRenderData;
		}
		objectBeingMoved.update();
		objectMeta = [...objectMeta];
		// setObjectMeta(objectMeta);
		// setObjectBeingMoved(objectBeingMoved);
	} else if (objectBeingMoved && action) {
		const nearestWallData = findNearestWallInRange(snap, wallMeta, Infinity, false);
		if (nearestWallData && nearestWallData.wall.type !== 'separate') {
			// wallSelect.wall.inWallRib(objectMeta);
			setInWallMeasurementText(nearestWallData.wall, objectMeta);
			const objTarget = objectMeta.find((o) => o.id === objectBeingMoved.targetId);
			const wall = nearestWallData.wall;
			let angleWall = getAngle(wall.start, wall.end, 'both').deg;
			const v1 = vectorXY({ x: wall.start.x, y: wall.start.y }, { x: wall.end.x, y: wall.end.y });
			const v2 = vectorXY({ x: wall.end.x, y: wall.end.y }, snap);
			const newAngle = vectorDeter(v1, v2);
			objectBeingMoved.angleSign = false;
			if (objTarget) objTarget.angleSign = false;
			if (Math.sign(newAngle) == 1) {
				angleWall += 180;
				objectBeingMoved.angleSign = true;
				if (objTarget) objTarget.angleSign = true;
			}
			const limits = computeLimit(wall.equations.base, objectBeingMoved.size, nearestWallData);
			if (wall.pointInsideWall(limits[0], false) && wall.pointInsideWall(limits[1], false)) {
				objectBeingMoved.x = nearestWallData.x;
				objectBeingMoved.y = nearestWallData.y;
				objectBeingMoved.angle = angleWall;
				objectBeingMoved.thick = wall.thick;
				if (objTarget) {
					objTarget.x = nearestWallData.x;
					objTarget.y = nearestWallData.y;
					objTarget.angle = angleWall;
					objTarget.thick = wall.thick;
					objTarget.limit = limits;
					// objTarget.update();
				}
				// objectBeingMoved.update();
			}

			if (
				(nearestWallData.x == wall.start.x && nearestWallData.y == wall.start.y) ||
				(nearestWallData.x == wall.end.x && nearestWallData.y == wall.end.y)
			) {
				if (wall.pointInsideWall(limits[0], false)) {
					objectBeingMoved.x = limits[0].x;
					objectBeingMoved.y = limits[0].y;
					if (objTarget) {
						objTarget.x = limits[0].x;
						objTarget.y = limits[0].y;
						objTarget.limit = limits;
					}
				}
				if (wall.pointInsideWall(limits[1], false)) {
					objectBeingMoved.x = limits[1].x;
					objectBeingMoved.y = limits[1].y;
					if (objTarget) {
						objTarget.x = limits[1].x;
						objTarget.y = limits[1].y;
						objTarget.limit = limits;
					}
				}
				objectBeingMoved.angle = angleWall;
				objectBeingMoved.thick = wall.thick;
				if (objTarget) {
					objTarget.angle = angleWall;
					objTarget.thick = wall.thick;
					// objTarget.update();
				}
				// binder.update();
			}
			if (objTarget) {
				const updatedTargetObject = getUpdatedObject(objTarget);
				if (
					updatedTargetObject.width !== objTarget.width ||
					updatedTargetObject.height !== objTarget.height ||
					!isObjectsEquals(updatedTargetObject.renderData, objTarget.renderData) ||
					!isObjectsEquals(updatedTargetObject.realBbox, objTarget.realBbox)
				) {
					objectMeta = [...objectMeta.filter((o) => o.id !== objTarget.id), updatedTargetObject];
				}
			}
			setObjectBeingMoved(objectBeingMoved);
		}
	} else if (nodeBeingMoved) {
		const { connectedWalls, connectedObjects, node } = nodeBeingMoved;
		const coords: Point2D = snap;
		let magnetic: string | null = null;
		connectedWalls.forEach((wall) => {
			if (pointsAreEqual(wall.end, node)) {
				if (Math.abs(wall.start.x - snap.x) < 20) {
					coords.x = wall.start.x;
					magnetic = 'H';
				}
				if (Math.abs(wall.start.y - snap.y) < 20) {
					coords.y = wall.start.y;
					magnetic = 'V';
				}
			} else if (pointsAreEqual(wall.start, node)) {
				if (Math.abs(wall.end.x - snap.x) < 20) {
					coords.x = wall.end.x;
					magnetic = 'H';
				}
				if (Math.abs(wall.end.y - snap.y) < 20) {
					coords.y = wall.end.y;
					magnetic = 'V';
				}
			}
		});

		const nearestWallData = getNearestWallNode(snap, wallMeta, 15, connectedWalls);
		if (nearestWallData) {
			coords.x = nearestWallData.bestPoint.x;
			coords.y = nearestWallData.bestPoint.y;
			setCursor('grab');
		} else {
			if (magnetic) {
				if (magnetic == 'H') snap.x = coords.x;
				else snap.y = coords.y;
			}
			const helpConstruc = createWallGuideLine(snap, wallMeta, 10, connectedWalls);
			if (helpConstruc) {
				coords.x = helpConstruc.x;
				coords.y = helpConstruc.y;
				snap.x = helpConstruc.x;
				snap.y = helpConstruc.y;
				if (magnetic) {
					if (magnetic == 'H') snap.x = coords.x;
					else snap.y = coords.y;
				}
				setCursor('grab');
			} else {
				setCursor('move');
			}
		}
		for (const k in connectedWalls) {
			if (pointsAreEqual(connectedWalls[k].start, node)) {
				connectedWalls[k].start.x = coords.x;
				connectedWalls[k].start.y = coords.y;
			}
			if (pointsAreEqual(connectedWalls[k].end, node)) {
				connectedWalls[k].end.x = coords.x;
				connectedWalls[k].end.y = coords.y;
			}
		}

		for (const k in connectedObjects) {
			const wall = connectedObjects[k].wall;
			let objTarget: ObjectMetaData | null = connectedObjects[k].obj;

			const angleWall = getAngle(wall.start, wall.end, 'deg').deg;
			const limits = computeLimit(
				wall.equations.base,
				2 * connectedObjects[k].distance,
				connectedObjects[k].from
			); // COORDS OBJ AFTER ROTATION
			let indexLimits = 0;
			if (wall.pointInsideWall(limits[1], false)) indexLimits = 1;
			// NEW COORDS OBJDATA[obj]
			objTarget.x = limits[indexLimits].x;
			objTarget.y = limits[indexLimits].y;
			objTarget.angle = angleWall;
			if (objTarget.angleSign) objTarget.angle = angleWall + 180;

			const limitBtwn = computeLimit(wall.equations.base, objTarget.size, objTarget); // OBJ SIZE OK BTWN xy1/xy2

			if (wall.pointInsideWall(limitBtwn[0], false) && wall.pointInsideWall(limitBtwn[1], false)) {
				objTarget.limit = limitBtwn;
				// objTarget.update();
			} else {
				const objMetaIndex = objectMeta.indexOf(objTarget);
				objTarget = null;
				objectMeta.splice(objMetaIndex, 1);
				connectedObjects.splice(+k, 1);
			}
		}
		setNodeBeingMoved({ node: coords, connectedWalls, connectedObjects });
	} else if (
		wallUnderCursor &&
		action &&
		wallEquations.equation1 &&
		wallEquations.equation2 &&
		wallEquations.equation3
	) {
		// updateMeasurementText(wallMeta);

		if (wallEquations.equation2.A == 'v') {
			wallEquations.equation2.B = snap.x;
		} else if (wallEquations.equation2.A == 'h') {
			wallEquations.equation2.B = snap.y;
		} else {
			wallEquations.equation2.B = snap.y - snap.x * wallEquations.equation2.A;
		}

		const intersection1 = intersectionOfEquations(wallEquations.equation1, wallEquations.equation2);
		const intersection2 = intersectionOfEquations(wallEquations.equation2, wallEquations.equation3);
		// var intersection3 = intersectionOfEquations(
		// 	wallEquations.equation1,
		// 	wallEquations.equation3
		// );

		if (wallUnderCursor.parent != null) {
			const parent = findById(wallUnderCursor.parent, wallMeta);
			if (parent && intersection1) {
				if (pointsAreEqual(parent.end, wallUnderCursor.start)) parent.end = intersection1;
				else if (pointsAreEqual(parent.start, wallUnderCursor.start)) parent.start = intersection1;
				else parent.end = intersection1;
			}
		}

		if (wallUnderCursor.child != null) {
			const child = findById(wallUnderCursor.child, wallMeta);
			if (child && intersection2) {
				if (pointsAreEqual(child.start, wallUnderCursor.end)) child.start = intersection2;
				else if (pointsAreEqual(child.end, wallUnderCursor.end)) child.end = intersection2;
				else child.start = intersection2;
			}
		}

		wallUnderCursor.start = intersection1 ?? wallUnderCursor.start;
		wallUnderCursor.end = intersection2 ?? wallUnderCursor.end;

		// THE EQ FOLLOWED BY eq (PARENT EQ1 --- CHILD EQ3)
		if (wallEquations.equation1.follow != undefined) {
			const backup = wallEquations.equation1.backup;
			const follow = wallEquations.equation1.follow;
			if (backup && intersection1 && !pointInPolygon(intersection1, backup.coords)) {
				// IF OUT OF WALL FOLLOWED
				const distanceFromStart = distanceBetween(backup.start, intersection1);
				const distanceFromEnd = distanceBetween(backup.end, intersection1);
				if (distanceFromStart > distanceFromEnd) {
					// NEAR FROM End
					follow.end = intersection1;
				} else {
					follow.start = intersection1;
				}
			} else {
				follow.end = backup?.end ?? follow.end;
				follow.start = backup?.start ?? follow.start;
			}
		}
		if (wallEquations.equation3.follow != undefined) {
			const backup = wallEquations.equation3.backup;
			const follow = wallEquations.equation3.follow;
			if (intersection2 && backup && !pointInPolygon(intersection2, backup.coords)) {
				// IF OUT OF WALL FOLLOWED
				const distanceFromStart = distanceBetween(backup.start, intersection2);
				const distanceFromEnd = distanceBetween(backup.end, intersection2);
				if (distanceFromStart > distanceFromEnd) {
					follow.end = intersection2;
				} else {
					follow.start = intersection2;
				}
			} else {
				follow.end = backup?.end ?? follow.end;
				follow.start = backup?.start ?? follow.start;
			}
		}

		// EQ FOLLOWERS WALL MOVING
		for (let i = 0; i < followerData.equations.length; i++) {
			const equation = followerData.equations[i];
			followerData.intersection = intersectionOfEquations(equation.eq, wallEquations.equation2);
			if (
				followerData.intersection &&
				wallUnderCursor.pointInsideWall(followerData.intersection, true)
			) {
				const size = distanceBetween(equation.wall.start, equation.wall.end);
				if (equation.type == 'start') {
					equation.wall.start = followerData.intersection;
					if (size < 5) {
						if (equation.wall.child == null) {
							wallMeta.splice(wallMeta.indexOf(equation.wall), 1);
							followerData.equations.splice(i, 1);
						}
					}
				}
				if (equation.type == 'end') {
					equation.wall.end = followerData.intersection;
					if (size < 5) {
						if (equation.wall.parent == null) {
							wallMeta.splice(wallMeta.indexOf(equation.wall), 1);
							followerData.equations.splice(i, 1);
						}
					}
				}
			}
		}

		// OBJDATA(s) FOLLOW 90° EDGE SELECTED
		for (let rp = 0; rp < objectEquationData.length; rp++) {
			const objTarget = objectEquationData[rp].obj;
			const intersectionObj = intersectionOfEquations(
				objectEquationData[rp].eq,
				wallEquations.equation2
			);
			// NEW COORDS OBJDATA[o]
			objTarget.x = intersectionObj?.x ?? objTarget.x;
			objTarget.y = intersectionObj?.y ?? objTarget.y;
			const limits = computeLimit(wallEquations.equation2, objTarget.size, objTarget);
			if (
				wallUnderCursor?.pointInsideWall(limits[0], false) &&
				wallUnderCursor?.pointInsideWall(limits[1], false)
			) {
				objTarget.limit = limits;
				objTarget.update();
			}
		}
		// DELETING ALL OBJECT "INWALL" OVERSIZED INTO ITS EDGE (EDGE BY EDGE CONTROL)
		for (const k in wallMeta) {
			const objWall = wallMeta[k].getObjects(objectMeta); // LIST OBJ ON EDGE
			for (const ob in objWall) {
				const objTarget = objWall[ob];
				const eq = wallMeta[k].getEquation();
				const limits = computeLimit(eq, objTarget.size, objTarget);
				if (
					!wallMeta[k].pointInsideWall(limits[0], false) ||
					!wallMeta[k].pointInsideWall(limits[1], false)
				) {
					const indexObj = objectMeta.indexOf(objTarget);
					objectMeta.splice(indexObj, 1);
				}
			}
		}
		setCursor('pointer');
	}

	setObjectMeta([...objectMeta]);
	setWallMeta([...wallMeta]);
};
