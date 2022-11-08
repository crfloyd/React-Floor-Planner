import React from 'react';

import { constants } from '../../../constants';
import { SelectedWallData } from '../../components/FloorPlannerCanvas/FloorPlannerCanvas';
import {
	CursorType,
	DeviceMetaData,
	Mode,
	NodeMoveData,
	ObjectMetaData,
	Point2D,
	RoomDisplayData,
	RoomMetaData,
	SnapData,
	WallMetaData
} from '../../models/models';
import { Wall } from '../../models/Wall';
import { getUpdatedObject } from '../../utils/svgTools';
import { distanceBetween } from '../../utils/utils';
import { CanvasState } from '../';
import { handleMouseUpBindMode } from './BindModeMouseUpHandler';

export const handleMouseUp = (
	snap: SnapData,
	mode: Mode,
	setMode: (m: Mode) => void,
	setAction: (a: boolean) => void,
	point: Point2D,
	setPoint: (p: Point2D) => void,
	canvasState: CanvasState,
	save: () => void,
	roomClicked: (data: RoomDisplayData) => void,
	continuousWallMode: boolean,
	startModifyingOpening: (object: ObjectMetaData) => void,
	wallClicked: (wall: WallMetaData) => void,
	setCursor: (crsr: CursorType) => void,
	roomMetaData: RoomMetaData[],
	objectMetaData: ObjectMetaData[],
	setObjectMetaData: (o: ObjectMetaData[]) => void,
	wallMetaData: WallMetaData[],
	setWallMetaData: (w: WallMetaData[]) => void,
	wallEndConstructionData: { start: Point2D; end: Point2D } | null,
	wallConstructionShouldEnd: boolean,
	startWallDrawing: (startPoint: Point2D) => void,
	selectedWallData: SelectedWallData | undefined,
	objectBeingMoved: ObjectMetaData | null,
	setObjectBeingMoved: (o: ObjectMetaData | null) => void,
	setNodeBeingMoved: (n: NodeMoveData | undefined) => void,
	roomUnderCursor: RoomMetaData | undefined,
	selectRoomUnderCursor: () => void,
	clearWallHelperState: () => void,
	deviceBeingMoved: DeviceMetaData | undefined,
	setDevices: React.Dispatch<React.SetStateAction<DeviceMetaData[]>>
) => {
	const { followerData } = canvasState;
	setCursor('default');

	switch (mode) {
		case Mode.Device: {
			if (deviceBeingMoved) {
				setDevices((prev) => [
					...prev.filter((d) => d.id !== deviceBeingMoved.id),
					deviceBeingMoved
				]);
			}
			setMode(Mode.Select);
			save();
			break;
		}
		case Mode.Object: {
			if (objectBeingMoved) {
				setObjectMetaData([...objectMetaData, objectBeingMoved]);
				setObjectBeingMoved(null);
			}
			setMode(Mode.Select);
			save();
			break;
		}
		case Mode.Room: {
			if (roomUnderCursor == null) {
				break;
			}
			const area = roomUnderCursor.area / 3600;
			selectRoomUnderCursor();
			roomClicked({
				roomId: roomUnderCursor.id,
				size: area.toFixed(2),
				roomIndex: roomMetaData.indexOf(roomUnderCursor),
				surface: roomUnderCursor.surface,
				showSurface: roomUnderCursor.showSurface,
				background: roomUnderCursor.color,
				name: roomUnderCursor.name,
				action: roomUnderCursor.action
			});

			setMode(Mode.EditRoom);
			save();
			break;
		}
		case Mode.Opening: {
			if (!objectBeingMoved) {
				setMode(Mode.Select);
				break;
			}
			const newObjectBeingMoved = getUpdatedObject(objectBeingMoved);
			const updatedObjects = [...objectMetaData, newObjectBeingMoved];
			setObjectBeingMoved(null);
			setObjectMetaData(updatedObjects);
			// $('#boxinfo').html('Element added');
			setMode(Mode.Select);
			save();
			break;
		}
		case Mode.Line:
		case Mode.Partition: {
			clearWallHelperState();

			if (!wallEndConstructionData) {
				console.error('MouseUp in Line/Partition mode but no wallEndConstructionData set!');
				return;
			}

			let sizeWall = distanceBetween(wallEndConstructionData.end, point) / constants.METER_SIZE;
			if (wallEndConstructionData && sizeWall > 0.3) {
				sizeWall = mode === Mode.Partition ? constants.PARTITION_SIZE : constants.WALL_SIZE;
				const wall = new Wall(
					wallEndConstructionData.start,
					wallEndConstructionData.end,
					'normal',
					sizeWall
				);
				const updatedWalls = [...wallMetaData, wall];
				setWallMetaData(updatedWalls);

				const contiueCreatingWalls = continuousWallMode && !wallConstructionShouldEnd;
				if (contiueCreatingWalls) {
					setCursor('validation');
					setAction(true);
					startWallDrawing(wallEndConstructionData.end);
				} else {
					setAction(false);
				}
				save();
			} else {
				setAction(false);
				// $('#boxinfo').html('Select mode');
				setMode(Mode.Select);
				setPoint({ x: snap.x, y: snap.y });
			}
			break;
		}
		case Mode.Bind: {
			const { updatedMode, updatedObjectMeta } = handleMouseUpBindMode(
				objectMetaData,
				startModifyingOpening,
				selectedWallData,
				wallClicked,
				objectBeingMoved,
				setObjectBeingMoved,
				() => {
					if (selectedWallData) {
						selectedWallData.equationData.equation1 = null;
						selectedWallData.equationData.equation2 = null;
						selectedWallData.equationData.equation3 = null;
						followerData.intersection = null;
					}
				}
			);
			setMode(updatedMode);
			setObjectMetaData(updatedObjectMeta);
			setNodeBeingMoved(undefined);
			save();
			break;
		}
		default:
			break;
	}
};
