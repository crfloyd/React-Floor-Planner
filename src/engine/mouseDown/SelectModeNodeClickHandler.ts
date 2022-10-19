import { NodeWallObjectData, ObjectMetaData, WallMetaData } from '../../models/models';
import { distanceBetween, findById, pointsAreEqual } from '../../utils/utils';

interface Props {
	x: number;
	y: number;
	wallMeta: WallMetaData[];
	objectMeta: ObjectMetaData[];
}

export const handleSelectModeNodeClicked = ({ x, y, wallMeta, objectMeta }: Props) => {
	const nodeControl = { x, y };
	const nodeWallsMeta: WallMetaData[] = [];

	// Determine distance of opposed node on edge(s) and parent of this node
	for (let ee = wallMeta.length - 1; ee > -1; ee--) {
		// Search for youngest wall coords in node
		if (
			pointsAreEqual(wallMeta[ee].start, nodeControl) ||
			pointsAreEqual(wallMeta[ee].end, nodeControl)
		) {
			nodeWallsMeta.push(wallMeta[ee]);
			break;
		}
	}
	if (nodeWallsMeta[0].child != null) {
		const child = findById(nodeWallsMeta[0].child, wallMeta);
		if (
			child &&
			(pointsAreEqual(child.start, nodeControl) || pointsAreEqual(child.end, nodeControl))
		)
			nodeWallsMeta.push(child);
	}
	if (nodeWallsMeta[0].parent != null) {
		const parent = findById(nodeWallsMeta[0].parent, wallMeta);
		if (
			parent &&
			(pointsAreEqual(parent.start, nodeControl) || pointsAreEqual(parent.end, nodeControl))
		)
			nodeWallsMeta.push(parent);
	}

	const wallObjects: NodeWallObjectData[] = [];
	for (const k in nodeWallsMeta) {
		if (
			pointsAreEqual(nodeWallsMeta[k].start, nodeControl) ||
			pointsAreEqual(nodeWallsMeta[k].end, nodeControl)
		) {
			let nodeTarget = nodeWallsMeta[k].start;
			if (pointsAreEqual(nodeWallsMeta[k].start, nodeControl)) {
				nodeTarget = nodeWallsMeta[k].end;
			}
			const objWall = nodeWallsMeta[k].getObjects(objectMeta);
			const wall = nodeWallsMeta[k];
			for (let i = 0; i < objWall.length; i++) {
				const objTarget = objWall[i];
				const distance = distanceBetween(objTarget, nodeTarget);
				wallObjects.push({
					wall: wall,
					from: nodeTarget,
					distance: distance,
					obj: objTarget,
					index: i
				});
			}
		}
	}

	return { nodeWalls: nodeWallsMeta, nodeWallObjects: wallObjects };
};