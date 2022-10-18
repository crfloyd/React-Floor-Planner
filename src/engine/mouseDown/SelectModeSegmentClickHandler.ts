import {
	ObjectMetaData,
	Point2D,
	WallEquation,
	WallEquationGroup,
	WallMetaData,
} from "../../models/models";
import { angleBetweenEquations, pointInPolygon } from "../../utils/svgTools";
import {
	findById,
	isObjectsEquals,
	perpendicularEquation,
	pointArraysAreEqual,
	pointsAreEqual,
} from "../../utils/utils";
import { Wall } from "../../models/Wall";

export const handleSelectModeSegmentClicked = (
	selectedWallData: { wall: WallMetaData; before: Point2D },
	wallMeta: WallMetaData[],
	objectMeta: ObjectMetaData[],
	wallEquations: WallEquationGroup,
	followerData: {
		equations: { wall: WallMetaData; eq: WallEquation; type: string }[];
		intersection: Point2D | null;
	}
) => {
	const wall = Wall.fromWall(selectedWallData.wall);
	selectedWallData = {
		...selectedWallData,
		before: selectedWallData.wall.start,
	};
	wallEquations.equation2 = wall.getEquation();
	if (wall.parent != null) {
		const parent = findById(wall.parent, wallMeta);
		wallEquations.equation1 = parent?.getEquation() ?? null;
		var angle12 = angleBetweenEquations(
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
					const parentOfParent = findById(parent?.parent ?? "", wallMeta);
					if (parent && parentOfParent && parentOfParent.id === wall.id) {
						parent.parent = null;
					}

					const childOfParent = findById(parent?.child ?? "", wallMeta);
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
				const parent = findById(wall.parent ?? "", wallMeta);
				if (parent && parent.end === wall.start) {
					// if (isObjectsEquals(wall.parent.end, wall.start, "1")) {
					const newWall = new Wall(
						parent.end,
						wall.start,
						"normal",
						wall.thick
					);
					newWall.parent = wall.parent;
					newWall.child = wall.id;
					// WALLS.push(newWall);
					wallMeta = [...wallMeta, newWall];
					parent.child = newWall.id;
					wall.parent = newWall.id;
					if (wallEquations.equation2) {
						wallEquations.equation1 =
							perpendicularEquation(
								wallEquations.equation2,
								wall.start.x,
								wall.start.y
							) ?? null;
					}
				} else if (parent && parent.start === wall.start) {
					// } else if (isObjectsEquals(parent.start, wall.start, "2")) {
					const newWall = new Wall(
						parent.start,
						wall.start,
						"normal",
						wall.thick
					);
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
		var foundEq = false;
		for (var k in wallMeta) {
			if (
				wallEquations.equation2 &&
				pointInPolygon(wall.start, wallMeta[k].coords) &&
				!pointArraysAreEqual(wallMeta[k].coords, wall.coords)
			) {
				var angleFollow = angleBetweenEquations(
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
		var angle23 = angleBetweenEquations(
			wallEquations?.equation3?.A ?? 0,
			wallEquations?.equation2?.A
		);
		if (angle23 < 20 || angle23 > 160) {
			var found = true;
			for (var k in wallMeta) {
				if (
					pointInPolygon(wall.end, wallMeta[k].coords) &&
					wallMeta[k].id !== wall.child &&
					// !isObjectsEquals(wallMeta[k], wall.child) &&
					!isObjectsEquals(wallMeta[k], wall)
				) {
					if (child?.parent != null && wall.id === child.parent) {
						child.parent = null;
					}

					const childOfChild = findById(child?.child ?? "", wallMeta);
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
				const child = findById(wall.child ?? "", wallMeta);
				if (child && pointsAreEqual(child.start, wall.end)) {
					var newWall = new Wall(wall.end, child.start, "new", wall.thick);
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
					var newWall = new Wall(wall.end, child.end, "normal", wall.thick);
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
		var foundEq = false;
		for (var k in wallMeta) {
			if (
				wallEquations.equation2 &&
				pointInPolygon(wall.end, wallMeta[k].coords) &&
				!pointArraysAreEqual(wallMeta[k].coords, wall.coords)
			) {
				var angleFollow = angleBetweenEquations(
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
	for (var k in wallMeta) {
		if (
			wallMeta[k].child == null &&
			pointInPolygon(wallMeta[k].end, wall.coords) &&
			!isObjectsEquals(wall, wallMeta[k])
		) {
			followerData.equations.push({
				wall: wallMeta[k],
				eq: wallMeta[k].getEquation(),
				type: "end",
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
				type: "start",
			});
		}
	}

	const objectsOnWall = wall.getObjects(objectMeta);
	const objectEquationData = objectsOnWall.map((objTarget) => ({
		obj: objTarget,
		wall: wall,
		eq: perpendicularEquation(
			wallEquations.equation2 ?? { A: 0, B: 0 },
			objTarget.x,
			objTarget.y
		),
	}));

	return { selectedWallData, wallMeta, objectEquationData, wallEquations };
};
