import {
	CursorType,
	ObjectEquationData,
	ObjectMetaData,
	SnapData,
	WallMetaData
} from '../../models/models';
import { Object2D } from '../../models/Object2D';
import {
	calculateObjectRenderData,
	createWallGuideLine,
	findNearestWallInRange,
	getAngle,
	getUpdatedObject,
	pointInPolygon,
	setInWallMeasurementText,
	updateMeasurementText
} from '../../utils/svgTools';
import {
	computeLimit,
	distanceBetween,
	findById,
	getNearestWall,
	intersectionOfEquations,
	isObjectsEquals,
	perpendicularEquation,
	pointsAreEqual,
	vectorDeter,
	vectorXY
} from '../../utils/utils';
import { CanvasState } from '../';

export const handleMouseMoveBindMode = (
	snap: SnapData,
	resetObjectEquationData: () => ObjectEquationData[],
	setCursor: (crsr: CursorType) => void,
	canvasState: CanvasState,
	wallMeta: WallMetaData[],
	wallUnderCursor: WallMetaData | null,
	objectMeta: ObjectMetaData[],
	setObjectMeta: (o: ObjectMetaData[]) => void,
	setWallMeta: (w: WallMetaData[]) => void,
	objectBeingMoved: ObjectMetaData | null,
	setObjectBeingMoved: (o: ObjectMetaData | null) => void
) => {
	const {
		binder,
		action,
		currentNodeWalls,
		currentNodeWallObjectData,
		wallEquations,
		followerData,
		objectEquationData
	} = canvasState;

	const objTarget = objectMeta.find((o) => o.id === objectBeingMoved?.targetId);
	if (objectBeingMoved?.type == 'boundingBox' && action && objTarget?.params.move) {
		objectBeingMoved.x = snap.x;
		objectBeingMoved.y = snap.y;

		objTarget.x = snap.x;
		objTarget.y = snap.y;
		// objectBeingMoved.update();
		// const {
		// 	newWidth,
		// 	newHeight,
		// 	newRenderData,
		// 	newRealBbox: newBbox
		// } = calculateObjectRenderData(
		// 	objectBeingMoved.size,
		// 	objectBeingMoved.thick,
		// 	objectBeingMoved.angle,
		// 	objectBeingMoved.class,
		// 	objectBeingMoved.type,
		// 	{ x: objectBeingMoved.x, y: objectBeingMoved.y }
		// );
		// objTarget.update();
		// setObjectBeingMoved({
		// 	...objectBeingMoved,
		// 	width: newWidth,
		// 	height: newHeight,
		// 	renderData: newRenderData,
		// 	realBbox: newBbox
		// });
		setObjectBeingMoved(getUpdatedObject(objectBeingMoved));
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
					// objTarget.width = newWidth;
					// objTarget.height = newHeight;
					// objTarget.renderData = newRenderData;
					// objTarget.realBbox = newRealBbox;

					// const updatedTarget = new Object2D(
					// 	objTarget.family,
					// 	objTarget.class,
					// 	objTarget.type,
					// 	{ x: objTarget.x, y: objTarget.y },
					// 	objTarget.angle,
					// 	objTarget.angleSign,
					// 	objTarget.size,
					// 	objTarget.hinge,
					// 	objTarget.thick,
					// 	objTarget.value,
					// 	objTarget.viewbox,
					// 	objTarget
					// );
					// updatedTarget.id = objTarget.id;
					// objectMeta = [...objectMeta.filter((o) => o.id !== objTarget.id), objTarget];
					objectMeta = [...objectMeta.filter((o) => o.id !== objTarget.id), updatedTargetObject];
				}
				// console.log('target bbox - after:', objTarget?.realBbox);
			}
			setObjectBeingMoved(objectBeingMoved);
		}
	} else if (binder?.type == 'node') {
		const coords = snap;
		let magnetic: string | null = null;
		for (const k in currentNodeWalls) {
			if (pointsAreEqual(currentNodeWalls[k].end, binder.data)) {
				if (Math.abs(currentNodeWalls[k].start.x - snap.x) < 20) {
					coords.x = currentNodeWalls[k].start.x;
					magnetic = 'H';
				}
				if (Math.abs(currentNodeWalls[k].start.y - snap.y) < 20) {
					coords.y = currentNodeWalls[k].start.y;
					magnetic = 'V';
				}
			}
			if (pointsAreEqual(currentNodeWalls[k].start, binder.data)) {
				if (Math.abs(currentNodeWalls[k].end.x - snap.x) < 20) {
					coords.x = currentNodeWalls[k].end.x;
					magnetic = 'H';
				}
				if (Math.abs(currentNodeWalls[k].end.y - snap.y) < 20) {
					coords.y = currentNodeWalls[k].end.y;
					magnetic = 'V';
				}
			}
		}

		const nearestWallData = getNearestWall(snap, wallMeta, 15, currentNodeWalls);
		if (nearestWallData) {
			coords.x = nearestWallData.bestPoint.x;
			coords.y = nearestWallData.bestPoint.y;
			$('#circlebinder').attr({
				class: 'circleGum',
				cx: coords.x,
				cy: coords.y
			});
			setCursor('grab');
		} else {
			if (magnetic) {
				if (magnetic == 'H') snap.x = coords.x;
				else snap.y = coords.y;
			}
			const helpConstruc = createWallGuideLine(snap, wallMeta, 10, currentNodeWalls);
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
			$('#circlebinder').attr({
				class: 'circle_css',
				cx: coords.x,
				cy: coords.y
			});
		}
		for (const k in currentNodeWalls) {
			if (pointsAreEqual(currentNodeWalls[k].start, binder.data)) {
				currentNodeWalls[k].start.x = coords.x;
				currentNodeWalls[k].start.y = coords.y;
			}
			if (pointsAreEqual(currentNodeWalls[k].end, binder.data)) {
				currentNodeWalls[k].end.x = coords.x;
				currentNodeWalls[k].end.y = coords.y;
			}
		}
		binder.data = coords;

		// refreshWalls(wallMeta, wallEquations); // UPDATE FALSE
		// wallMeta.forEach((wall: WallMetaData) => {
		// 	wall.addToScene();
		// });

		// $("#boxRoom").empty();
		// $("#boxSurface").empty();
		// setWallMeta([...wallMeta]);

		for (const k in currentNodeWallObjectData) {
			const wall = currentNodeWallObjectData[k].wall;
			let objTarget: ObjectMetaData | null = currentNodeWallObjectData[k].obj;

			const angleWall = getAngle(wall.start, wall.end, 'deg').deg;
			const limits = computeLimit(
				wall.equations.base,
				2 * currentNodeWallObjectData[k].distance,
				currentNodeWallObjectData[k].from
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
				objTarget.graph.remove();
				objTarget = null;
				objectMeta.splice(objMetaIndex, 1);
				currentNodeWallObjectData.splice(+k, 1);
			}
		}
		// for (k in toClean)
		// $("#boxRoom").empty();
		// $("#boxSurface").empty();
		// const polygonData = polygonize(wallMeta);
		// setRoomPolygonData(polygonData);
		// renderRooms(polygonData, roomMeta, setRoomMeta);
	} else if (
		wallUnderCursor &&
		action &&
		wallEquations.equation1 &&
		wallEquations.equation2 &&
		wallEquations.equation3
	) {
		updateMeasurementText(wallMeta);

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

		// const graph = binder.graph as SVGElement;
		// const graphChildren = [...graph.childNodes].map((n) => {
		// 	return n as SVGElement;
		// });

		// graphChildren[0].setAttribute('x1', intersection1?.x?.toString() ?? '');
		// graphChildren[0].setAttribute('x2', intersection2?.x?.toString() ?? '');
		// graphChildren[0].setAttribute('y1', intersection1?.y?.toString() ?? '');
		// graphChildren[0].setAttribute('y2', intersection2?.y?.toString() ?? '');
		// graphChildren[1].setAttribute('cx', intersection1?.x?.toString() ?? '');
		// graphChildren[1].setAttribute('cy', intersection1?.y?.toString() ?? '');
		// graphChildren[2].setAttribute('cx', intersection2?.x?.toString() ?? '');
		// graphChildren[2].setAttribute('cy', intersection2?.y?.toString() ?? '');

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
				binder.wall.pointInsideWall(followerData.intersection, true)
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
		// WALL COMPUTING, BLOCK FAMILY OF BINDERWALL IF NULL (START OR END) !!!!!
		// refreshWalls(wallMeta, wallEquations, true);
		// wallMeta.forEach((wall: WallMetaData) => {
		// 	wall.addToScene();
		// });

		// $("#boxRoom").empty();
		// $("#boxSurface").empty();
		// setRoomPolygonData(polygonize(wallMeta));

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
					objTarget.graph.remove();
					const indexObj = objectMeta.indexOf(objTarget);
					objectMeta.splice(indexObj, 1);
				}
			}
		}

		const newEquationData = resetObjectEquationData(); // REINIT eqObj -> MAYBE ONE OR PLUS OF OBJDATA REMOVED !!!!
		const objWall = binder.wall.getObjects(objectMeta); // LIST OBJ ON EDGE
		for (let ob = 0; ob < objWall.length; ob++) {
			const objTarget = objWall[ob];
			newEquationData.push({
				obj: objTarget,
				wall: binder.wall,
				eq: perpendicularEquation(wallEquations.equation2, objTarget.x, objTarget.y)
			});
		}

		// $("#boxRoom").empty();
		// $("#boxSurface").empty();
		// renderRooms(roomPolygonData, roomMeta, setRoomMeta);
		setCursor('pointer');
	} else if (binder && binder.type != 'obj' && binder.type != 'segment') {
		updateMeasurementText(wallMeta);
	}

	setObjectMeta([...objectMeta]);
	setWallMeta([...wallMeta]);
};
