import { SelectedWallData } from '../../components/FloorPlannerCanvas/FloorPlannerCanvas';
import { Mode, ObjectMetaData, WallMetaData } from '../../models/models';

export const handleMouseUpBindMode = (
	objectMetaData: ObjectMetaData[],
	startModifyingOpening: (object: ObjectMetaData) => void,
	selectedWallData: SelectedWallData | undefined,
	wallClicked: (wall: WallMetaData) => void,
	objectBeingMoved: ObjectMetaData | null,
	setObjectBeingMoved: (o: ObjectMetaData | null) => void,
	resetEquationData: () => void
): {
	updatedMode: Mode;
	updatedObjectMeta: ObjectMetaData[];
} => {
	let mode = Mode.Select;

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

	return {
		updatedMode: mode,
		updatedObjectMeta: objectMetaData
	};
};
