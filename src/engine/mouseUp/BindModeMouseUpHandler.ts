import {
	Mode,
	ObjectMetaData,
	Point2D,
	WallEquationGroup,
	WallMetaData
} from '../../models/models';

export const handleMouseUpBindMode = (
	objectMetaData: ObjectMetaData[],
	startModifyingOpening: (object: ObjectMetaData) => void,
	selectedWallData: { wall: WallMetaData; before: Point2D } | null,
	wallClicked: (wall: WallMetaData) => void,
	resetEquationData: () => void,
	objectBeingMoved: ObjectMetaData | null,
	setObjectBeingMoved: (o: ObjectMetaData | null) => void
): {
	updatedMode: string;
	updatedObjectMeta: ObjectMetaData[];
} => {
	let mode = Mode.Select;

	console.log('MouseUp: ', objectBeingMoved, objectBeingMoved?.type);
	if (objectBeingMoved?.type === 'boundingBox') {
		const moveObj =
			Math.abs(objectBeingMoved.oldXY.x - objectBeingMoved.x) +
			Math.abs(objectBeingMoved.oldXY.y - objectBeingMoved.y);
		const objTarget = objectMetaData.find((o) => o.id === objectBeingMoved.targetId);
		if (!objTarget?.params.move) {
			objectMetaData = objectMetaData.filter((o) => o !== objTarget);
		}
		if (moveObj < 1 && objTarget?.params.move) {
			mode = Mode.EditBoundingBox;
		} else {
			mode = Mode.Select;
			setObjectBeingMoved(null);
		}
	} else if (objectBeingMoved) {
		const objTarget = objectMetaData.find((o) => o.id === objectBeingMoved.targetId);
		const moveDistance =
			Math.abs(objectBeingMoved.oldXY.x - objectBeingMoved.x) +
			Math.abs(objectBeingMoved.oldXY.y - objectBeingMoved.y);
		if (moveDistance < 1 && objTarget) {
			setObjectBeingMoved(null);
			startModifyingOpening(objTarget);
			mode = Mode.EditDoor;
		} else {
			mode = Mode.Select;
			setObjectBeingMoved(null);
		}
	} else if (selectedWallData) {
		if (selectedWallData.wall.start == selectedWallData.before) {
			wallClicked(selectedWallData.wall);
			// mode = Mode.EditWall;
		}

		resetEquationData();
	}

	// if (!binder)
	// 	return {
	// 		updatedBinder: binder,
	// 		updatedMode: mode,
	// 		updatedObjectMeta: objectMetaData
	// 	};

	// if (mode == Mode.Bind) {
	// 	binder = null;
	// }

	return {
		updatedMode: mode,
		updatedObjectMeta: objectMetaData
	};
};
