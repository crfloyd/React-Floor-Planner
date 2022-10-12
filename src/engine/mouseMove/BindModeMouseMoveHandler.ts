import { editor } from "../../../editor";
import { qSVG } from "../../../qSVG";
import {
	NodeWallObjectData,
	ObjectEquationData,
	ObjectMetaData,
	Point2D,
	RoomMetaData,
	RoomPolygonData,
	SvgPathMetaData,
	WallEquationGroup,
	WallMetaData,
} from "../../models";
import {
	createWallGuideLine,
	getAngle,
	pointInPolygon,
	polygonize,
	refreshWalls,
	setInWallMeasurementText,
	updateMeasurementText,
} from "../../svgTools";
import {
	computeLimit,
	findById,
	intersectionOfEquations,
	isObjectsEquals,
	perpendicularEquation,
} from "../../utils";
import { CanvasState } from "../CanvasState";

export const handleMouseMoveBindMode = (
	snap: Point2D,
	resetObjectEquationData: () => ObjectEquationData[],
	setHelperLineSvgData: (l: SvgPathMetaData | null) => void,
	canvasState: CanvasState
) => {
	const {
		binder,
		action,
		currentNodeWalls,
		currentNodeWallObjectData,
		wallMeta,
		objectMeta,
		roomMeta,
		setRoomMeta,
		wallEquations,
		setCursor,
		roomPolygonData,
		setRoomPolygonData,
		followerData,
		objectEquationData,
	} = canvasState;
	if (binder.type == "node") {
		var coords = snap;
		var magnetic: string | null = null;
		for (var k in currentNodeWalls) {
			if (isObjectsEquals(currentNodeWalls[k].end, binder.data)) {
				if (Math.abs(currentNodeWalls[k].start.x - snap.x) < 20) {
					coords.x = currentNodeWalls[k].start.x;
					magnetic = "H";
				}
				if (Math.abs(currentNodeWalls[k].start.y - snap.y) < 20) {
					coords.y = currentNodeWalls[k].start.y;
					magnetic = "V";
				}
			}
			if (isObjectsEquals(currentNodeWalls[k].start, binder.data)) {
				if (Math.abs(currentNodeWalls[k].end.x - snap.x) < 20) {
					coords.x = currentNodeWalls[k].end.x;
					magnetic = "H";
				}
				if (Math.abs(currentNodeWalls[k].end.y - snap.y) < 20) {
					coords.y = currentNodeWalls[k].end.y;
					magnetic = "V";
				}
			}
		}

		const nodeMove = editor.nearWallNode(snap, wallMeta, 15, currentNodeWalls);
		if (nodeMove) {
			coords.x = nodeMove.x;
			coords.y = nodeMove.y;
			$("#circlebinder").attr({
				class: "circleGum",
				cx: coords.x,
				cy: coords.y,
			});
			setCursor("grab");
		} else {
			if (magnetic) {
				if (magnetic == "H") snap.x = coords.x;
				else snap.y = coords.y;
			}
			const helpConstruc = createWallGuideLine(
				snap,
				wallMeta,
				10,
				setHelperLineSvgData,
				currentNodeWalls
			);
			if (helpConstruc) {
				coords.x = helpConstruc.x;
				coords.y = helpConstruc.y;
				snap.x = helpConstruc.x;
				snap.y = helpConstruc.y;
				if (magnetic) {
					if (magnetic == "H") snap.x = coords.x;
					else snap.y = coords.y;
				}
				setCursor("grab");
			} else {
				setCursor("move");
			}
			$("#circlebinder").attr({
				class: "circle_css",
				cx: coords.x,
				cy: coords.y,
			});
		}
		for (var k in currentNodeWalls) {
			if (isObjectsEquals(currentNodeWalls[k].start, binder.data)) {
				currentNodeWalls[k].start.x = coords.x;
				currentNodeWalls[k].start.y = coords.y;
			}
			if (isObjectsEquals(currentNodeWalls[k].end, binder.data)) {
				currentNodeWalls[k].end.x = coords.x;
				currentNodeWalls[k].end.y = coords.y;
			}
		}
		binder.data = coords;

		refreshWalls(wallMeta, wallEquations); // UPDATE FALSE
		wallMeta.forEach((wall) => {
			wall.addToScene();
		});

		for (var k in currentNodeWallObjectData) {
			const wall = currentNodeWallObjectData[k].wall;
			let objTarget: ObjectMetaData | null = currentNodeWallObjectData[k].obj;

			const angleWall = getAngle(wall.start, wall.end, "deg").deg;
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

			var limitBtwn = computeLimit(
				wall.equations.base,
				objTarget.size,
				objTarget
			); // OBJ SIZE OK BTWN xy1/xy2

			if (
				wall.pointInsideWall(limitBtwn[0], false) &&
				wall.pointInsideWall(limitBtwn[1], false)
			) {
				objTarget.limit = limitBtwn;
				objTarget.update();
			} else {
				const objMetaIndex = objectMeta.indexOf(objTarget);
				objTarget.graph.remove();
				objTarget = null;
				objectMeta.splice(objMetaIndex, 1);
				currentNodeWallObjectData.splice(+k, 1);
			}
		}
		// for (k in toClean)
		$("#boxRoom").empty();
		$("#boxSurface").empty();
		const polygonData = polygonize(wallMeta);
		setRoomPolygonData(polygonData);
		editor.roomMaker(polygonData, roomMeta, setRoomMeta);
	}

	// WALL MOVING ----BINDER TYPE SEGMENT-------- FUNCTION FOR H,V and Calculate Vectorial Translation

	if (
		binder.type == "segment" &&
		action &&
		wallEquations.equation1 &&
		wallEquations.equation2 &&
		wallEquations.equation3
	) {
		updateMeasurementText(wallMeta);

		if (wallEquations.equation2.A == "v") {
			wallEquations.equation2.B = snap.x;
		} else if (wallEquations.equation2.A == "h") {
			wallEquations.equation2.B = snap.y;
		} else {
			wallEquations.equation2.B = snap.y - snap.x * wallEquations.equation2.A;
		}

		var intersection1 = intersectionOfEquations(
			wallEquations.equation1,
			wallEquations.equation2
		);
		var intersection2 = intersectionOfEquations(
			wallEquations.equation2,
			wallEquations.equation3
		);
		// var intersection3 = intersectionOfEquations(
		// 	wallEquations.equation1,
		// 	wallEquations.equation3
		// );

		if (binder.wall.parent != null) {
			const parent = findById(binder.wall.parent, wallMeta);
			if (parent && intersection1) {
				if (isObjectsEquals(parent.end, binder.wall.start))
					parent.end = intersection1;
				else if (isObjectsEquals(parent.start, binder.wall.start))
					parent.start = intersection1;
				else parent.end = intersection1;
			}
		}

		if (binder.wall.child != null) {
			const child = findById(binder.wall.child, wallMeta);
			if (child && intersection2) {
				if (isObjectsEquals(child.start, binder.wall.end))
					child.start = intersection2;
				else if (isObjectsEquals(child.end, binder.wall.end))
					child.end = intersection2;
				else child.start = intersection2;
			}
		}

		binder.wall.start = intersection1;
		binder.wall.end = intersection2;

		binder.graph[0].children[0].setAttribute("x1", intersection1?.x);
		binder.graph[0].children[0].setAttribute("x2", intersection2?.x);
		binder.graph[0].children[0].setAttribute("y1", intersection1?.y);
		binder.graph[0].children[0].setAttribute("y2", intersection2?.y);
		binder.graph[0].children[1].setAttribute("cx", intersection1?.x);
		binder.graph[0].children[1].setAttribute("cy", intersection1?.y);
		binder.graph[0].children[2].setAttribute("cx", intersection2?.x);
		binder.graph[0].children[2].setAttribute("cy", intersection2?.y);

		// THE EQ FOLLOWED BY eq (PARENT EQ1 --- CHILD EQ3)
		if (wallEquations.equation1.follow != undefined) {
			const backup = wallEquations.equation1.backup;
			const follow = wallEquations.equation1.follow;
			if (
				backup &&
				intersection1 &&
				!pointInPolygon(intersection1, backup.coords)
			) {
				// IF OUT OF WALL FOLLOWED
				var distanceFromStart = qSVG.gap(backup.start, intersection1);
				var distanceFromEnd = qSVG.gap(backup.end, intersection1);
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
			if (
				intersection2 &&
				backup &&
				!pointInPolygon(intersection2, backup.coords)
			) {
				// IF OUT OF WALL FOLLOWED
				var distanceFromStart = qSVG.gap(backup.start, intersection2);
				var distanceFromEnd = qSVG.gap(backup.end, intersection2);
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
		for (var i = 0; i < followerData.equations.length; i++) {
			const equation = followerData.equations[i];
			followerData.intersection = intersectionOfEquations(
				equation.eq,
				wallEquations.equation2
			);
			if (
				followerData.intersection &&
				binder.wall.pointInsideWall(followerData.intersection, true)
			) {
				var size = qSVG.measure(equation.wall.start, equation.wall.end);
				if (equation.type == "start") {
					equation.wall.start = followerData.intersection;
					if (size < 5) {
						if (equation.wall.child == null) {
							wallMeta.splice(wallMeta.indexOf(equation.wall), 1);
							followerData.equations.splice(i, 1);
						}
					}
				}
				if (equation.type == "end") {
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
		refreshWalls(wallMeta, wallEquations, true);
		wallMeta.forEach((wall) => {
			wall.addToScene();
		});
		setRoomPolygonData(polygonize(wallMeta));

		// OBJDATA(s) FOLLOW 90° EDGE SELECTED
		for (var rp = 0; rp < objectEquationData.length; rp++) {
			const objTarget = objectEquationData[rp].obj;
			const intersectionObj = intersectionOfEquations(
				objectEquationData[rp].eq,
				wallEquations.equation2
			);
			// NEW COORDS OBJDATA[o]
			objTarget.x = intersectionObj?.x ?? objTarget.x;
			objTarget.y = intersectionObj?.y ?? objTarget.y;
			var limits = computeLimit(
				wallEquations.equation2,
				objTarget.size,
				objTarget
			);
			if (
				binder.wall.pointInsideWall(limits[0]) &&
				binder.wall.pointInsideWall(limits[1])
			) {
				objTarget.limit = limits;
				objTarget.update();
			}
		}
		// DELETING ALL OBJECT "INWALL" OVERSIZED INTO ITS EDGE (EDGE BY EDGE CONTROL)
		for (let k in wallMeta) {
			let objWall = wallMeta[k].getObjects(objectMeta); // LIST OBJ ON EDGE
			for (let ob in objWall) {
				let objTarget = objWall[ob];
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
		let objWall = binder.wall.getObjects(objectMeta); // LIST OBJ ON EDGE
		for (let ob = 0; ob < objWall.length; ob++) {
			const objTarget = objWall[ob];
			newEquationData.push({
				obj: objTarget,
				wall: binder.wall,
				eq: perpendicularEquation(
					wallEquations.equation2,
					objTarget.x,
					objTarget.y
				),
			});
		}

		$("#boxRoom").empty();
		$("#boxSurface").empty();
		editor.roomMaker(roomPolygonData, roomMeta, setRoomMeta);
		setCursor("pointer");
	}

	// **********************************************************************
	// ----------------------  BOUNDING BOX ------------------------------
	// **********************************************************************
	// binder.obj.params.move ---> FOR MEASURE DONT MOVE
	if (binder.type == "boundingBox" && action && binder.obj.params.move) {
		binder.x = snap.x;
		binder.y = snap.y;
		binder.obj.x = snap.x;
		binder.obj.y = snap.y;
		binder.obj.update();
		binder.update();
	}

	// **********************************************************************
	// OBJ MOVING
	// **********************************************************************
	if (binder.type == "obj" && action) {
		const wallSelect = editor.nearWall(snap, wallMeta) as {
			wall: WallMetaData;
			x: number;
			y: number;
			distance: number;
		};
		if (wallSelect) {
			if (wallSelect.wall.type != "separate") {
				// wallSelect.wall.inWallRib(objectMeta);
				setInWallMeasurementText(wallSelect.wall, objectMeta);
				var objTarget = binder.obj;
				var wall = wallSelect.wall;
				let angleWall = getAngle(wall.start, wall.end, "both").deg;
				var v1 = qSVG.vectorXY(
					{ x: wall.start.x, y: wall.start.y },
					{ x: wall.end.x, y: wall.end.y }
				);
				var v2 = qSVG.vectorXY({ x: wall.end.x, y: wall.end.y }, snap);
				var newAngle = qSVG.vectorDeter(v1, v2);
				binder.angleSign = 0;
				objTarget.angleSign = 0;
				if (Math.sign(newAngle) == 1) {
					angleWall += 180;
					binder.angleSign = 1;
					objTarget.angleSign = 1;
				}
				var limits = computeLimit(wall.equations.base, binder.size, wallSelect);
				if (
					wall.pointInsideWall(limits[0], false) &&
					wall.pointInsideWall(limits[1], false)
				) {
					binder.x = wallSelect.x;
					binder.y = wallSelect.y;
					binder.angle = angleWall;
					binder.thick = wall.thick;
					objTarget.x = wallSelect.x;
					objTarget.y = wallSelect.y;
					objTarget.angle = angleWall;
					objTarget.thick = wall.thick;
					objTarget.limit = limits;
					binder.update();
					objTarget.update();
				}

				if (
					(wallSelect.x == wall.start.x && wallSelect.y == wall.start.y) ||
					(wallSelect.x == wall.end.x && wallSelect.y == wall.end.y)
				) {
					if (wall.pointInsideWall(limits[0], false)) {
						binder.x = limits[0].x;
						binder.y = limits[0].y;
						objTarget.x = limits[0].x;
						objTarget.y = limits[0].y;
						objTarget.limit = limits;
					}
					if (wall.pointInsideWall(limits[1], false)) {
						binder.x = limits[1].x;
						binder.y = limits[1].y;
						objTarget.x = limits[1].x;
						objTarget.y = limits[1].y;
						objTarget.limit = limits;
					}
					binder.angle = angleWall;
					binder.thick = wall.thick;
					objTarget.angle = angleWall;
					objTarget.thick = wall.thick;
					binder.update();
					objTarget.update();
				}
			}
		}
	} // END OBJ MOVE
	if (binder.type != "obj" && binder.type != "segment") {
		updateMeasurementText(wallMeta);
	}
};
