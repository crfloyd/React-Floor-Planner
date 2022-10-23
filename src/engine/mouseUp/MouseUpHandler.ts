import { constants } from '../../../constants';
import {
	CursorType,
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
import { getUpdatedObject, updateMeasurementText } from '../../utils/svgTools';
import { distanceBetween } from '../../utils/utils';
import { CanvasState } from '../';
import { handleMouseUpBindMode } from './BindModeMouseUpHandler';

export const handleMouseUp = (
	snap: SnapData,
	point: Point2D,
	setPoint: (p: Point2D) => void,
	canvasState: CanvasState,
	resetMode: () => string,
	showMeasurements: boolean,
	save: () => void,
	updateRoomDisplayData: (data: RoomDisplayData) => void,
	continuousWallMode: boolean,
	startModifyingOpening: (object: ObjectMetaData) => void,
	wallClicked: (wall: WallMetaData) => void,
	setCursor: (crsr: CursorType) => void,
	roomMetaData: RoomMetaData[],
	objectMetaData: ObjectMetaData[],
	setObjectMetaData: (o: ObjectMetaData[]) => void,
	wallMetaData: WallMetaData[],
	setWallMetaData: (w: WallMetaData[]) => void,
	clearWallHelperData: () => void,
	wallEndConstructionData: { start: Point2D; end: Point2D } | null,
	wallConstructionShouldEnd: boolean,
	startWallDrawing: (startPoint: Point2D) => void,
	selectedWallData: { wall: WallMetaData; before: Point2D } | null,
	objectBeingMoved: ObjectMetaData | null,
	setObjectBeingMoved: (o: ObjectMetaData | null) => void,
	setNodeBeingMoved: (n: NodeMoveData | undefined) => void
) => {
	if (showMeasurements) {
		$('#boxScale').show(200);
	}
	const {
		binder,
		setBinder,
		action,
		setAction,
		mode,
		setMode,
		setDrag,
		wallEquations,
		followerData
	} = canvasState;
	setDrag(false);
	setCursor('default');
	if (mode == Mode.Select) {
		if (binder) {
			binder.remove();
			setBinder(null);
			save();
		}
	}

	switch (mode) {
		case Mode.Object: {
			if (objectBeingMoved) {
				setObjectMetaData([...objectMetaData, objectBeingMoved]);
				setObjectBeingMoved(null);
			}
			// $(binder.graph).remove();
			// const targetBox = lastObject.class == 'energy' ? 'boxEnergy' : 'boxcarpentry';
			// $('#' + targetBox).append(lastObject.graph);
			setBinder(null);
			// setObjectMetaData(objData);
			$('#boxinfo').html('Object added');
			resetMode();
			save();
			break;
		}
		case Mode.Room: {
			if (binder == null) {
				break;
			}
			const area = binder.area / 3600;
			const svg = binder as SVGElement;
			svg.setAttribute('fill', 'none');
			svg.setAttribute('stroke', '#ddf00a');
			svg.setAttribute('stroke-width', '7');
			const room = roomMetaData[binder.id];
			updateRoomDisplayData({
				size: area.toFixed(2),
				roomIndex: binder.id,
				surface: room.surface ?? '',
				showSurface: room.showSurface,
				background: room.color,
				name: room.name,
				action: room.action
			});

			setMode(Mode.EditRoom);
			save();
			break;
		}
		case Mode.Node: {
			resetMode();
			if (!binder) break;
			// ALSO ON MOUSEUP WITH HAVE CIRCLEBINDER ON ADDPOINT
			const oldWall = binder.data;
			const newWall = new Wall(
				{ x: oldWall.x, y: oldWall.y },
				oldWall.wall.end,
				'normal',
				oldWall.wall.thick
			);
			const updatedWalls = [...wallMetaData, newWall];
			setWallMetaData(updatedWalls);
			oldWall.wall.end = { x: oldWall.x, y: oldWall.y };
			binder.remove();
			setBinder(null);
			save();
			break;
		}
		case Mode.Opening: {
			if (!objectBeingMoved) {
				$('#boxinfo').html('The plan currently contains no wall.');
				resetMode();
				break;
			}

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
			// const newObjBeingMoved = {
			// 	...objectBeingMoved,
			// 	width: newWidth,
			// 	height: newHeight,
			// 	renderData: newRenderData,
			// 	realBbox: newBbox
			// };
			const newObjectBeingMoved = getUpdatedObject(objectBeingMoved);
			// console.log('adding objectBeingMoved to meta: ', objectBeingMoved.realBbox);
			const updatedObjects = [...objectMetaData, newObjectBeingMoved];
			setObjectBeingMoved(null);
			// $(binder.graph).remove();
			// $('#boxcarpentry').append(updatedObjects[updatedObjects.length - 1].graph);
			setObjectMetaData(updatedObjects);
			setBinder(null);
			$('#boxinfo').html('Element added');
			resetMode();
			save();
			break;
		}
		case Mode.Line:
		case Mode.Partition: {
			// $("#linetemp").remove(); // DEL LINE HELP CONSTRUC 0 45 90
			clearWallHelperData();
			if (!wallEndConstructionData) return;
			let sizeWall = distanceBetween(wallEndConstructionData.end, point);
			sizeWall = sizeWall / constants.METER_SIZE;
			if (wallEndConstructionData && $('#line_construc').length && sizeWall > 0.3) {
				sizeWall = mode === Mode.Partition ? constants.PARTITION_SIZE : constants.WALL_SIZE;
				const wall = new Wall(
					wallEndConstructionData.start,
					wallEndConstructionData.end,
					'normal',
					sizeWall
				);
				const updatedWalls = [...wallMetaData, wall];
				setWallMetaData(updatedWalls);

				if (continuousWallMode && !wallConstructionShouldEnd) {
					setCursor('validation');
					setAction(true);
					startWallDrawing(wallEndConstructionData.end);
				} else setAction(false);
				$('#boxinfo').html(
					"Wall added <span style='font-size:0.6em'>approx. " +
						(distanceBetween(point, wallEndConstructionData.end) / 60).toFixed(2) +
						' m</span>'
				);
				if (wallConstructionShouldEnd) setAction(false);
				save();
			} else {
				setAction(false);
				$('#boxinfo').html('Select mode');
				resetMode();
				if (binder) {
					binder.remove();
					setBinder(null);
				}
				setPoint({ x: snap.x, y: snap.y });
			}
			break;
		}
		case Mode.Bind: {
			const { updatedMode, updatedBinder, updatedObjectMeta } = handleMouseUpBindMode(
				binder,
				objectMetaData,
				startModifyingOpening,
				selectedWallData,
				wallClicked,
				() => {
					wallEquations.equation1 = null;
					wallEquations.equation2 = null;
					wallEquations.equation3 = null;
					followerData.intersection = null;
				},
				objectBeingMoved,
				setObjectBeingMoved
			);
			setMode(updatedMode);
			setBinder(updatedBinder);
			setObjectMetaData(updatedObjectMeta);
			setNodeBeingMoved(undefined);
			save();
			break;
		}
		default:
			break;
	}

	if (mode != Mode.EditRoom) {
		// editor.showScaleBox(roomMetaData, wallMetaData);
		updateMeasurementText(wallMetaData);
	}
};
