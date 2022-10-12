import { qSVG } from "../../../qSVG";
import { NodeWallObjectData, ObjectMetaData, WallMetaData } from "../../models";
import { findById, isObjectsEquals } from "../../utils";

interface Props {
	x: number;
	y: number;
	wallMeta: WallMetaData[];
	objectMeta: ObjectMetaData[];
}

export const handleNodeClicked = ({ x, y, wallMeta, objectMeta }: Props) => {
	const nodeControl = { x, y };
	const nodeWallsMeta: WallMetaData[] = [];

	// Determine distance of opposed node on edge(s) and parent of this node
	for (var ee = wallMeta.length - 1; ee > -1; ee--) {
		// Search for youngest wall coords in node
		if (
			isObjectsEquals(wallMeta[ee].start, nodeControl) ||
			isObjectsEquals(wallMeta[ee].end, nodeControl)
		) {
			nodeWallsMeta.push(wallMeta[ee]);
			break;
		}
	}
	if (nodeWallsMeta[0].child != null) {
		const child = findById(nodeWallsMeta[0].child, wallMeta);
		if (
			child &&
			(isObjectsEquals(child.start, nodeControl) ||
				isObjectsEquals(child.end, nodeControl))
		)
			nodeWallsMeta.push(child);
	}
	if (nodeWallsMeta[0].parent != null) {
		const parent = findById(nodeWallsMeta[0].parent, wallMeta);
		if (
			parent &&
			(isObjectsEquals(parent.start, nodeControl) ||
				isObjectsEquals(parent.end, nodeControl))
		)
			nodeWallsMeta.push(parent);
	}

	const wallObjects: NodeWallObjectData[] = [];
	for (var k in nodeWallsMeta) {
		if (
			isObjectsEquals(nodeWallsMeta[k].start, nodeControl) ||
			isObjectsEquals(nodeWallsMeta[k].end, nodeControl)
		) {
			var nodeTarget = nodeWallsMeta[k].start;
			if (isObjectsEquals(nodeWallsMeta[k].start, nodeControl)) {
				nodeTarget = nodeWallsMeta[k].end;
			}
			const objWall = nodeWallsMeta[k].getObjects(objectMeta);
			const wall = nodeWallsMeta[k];
			for (var i = 0; i < objWall.length; i++) {
				var objTarget = objWall[i];
				var distance = qSVG.measure(objTarget, nodeTarget);
				wallObjects.push({
					wall: wall,
					from: nodeTarget,
					distance: distance,
					obj: objTarget,
					index: i,
				});
			}
		}
	}

	return { nodeWalls: nodeWallsMeta, nodeWallObjects: wallObjects };
};
