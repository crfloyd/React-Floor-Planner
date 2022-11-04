import { Point2D, RoomMetaData } from '../../models/models';
import { pointInPolygon } from '../../utils/svgTools';

export const handleMouseMoveRoomMode = (
	snap: Point2D,
	roomMetaData: RoomMetaData[],
	setRoomUnderCursor: (r: RoomMetaData | undefined) => void
) => {
	const roomTarget = getRoomOnPoint(snap, roomMetaData);
	setRoomUnderCursor(roomTarget);
};

const getRoomOnPoint = (point: Point2D, roomMeta: RoomMetaData[]): RoomMetaData | undefined => {
	let targetRoom: RoomMetaData | undefined = undefined;
	roomMeta.forEach((room) => {
		if (
			pointInPolygon(point, room.coords) &&
			(targetRoom == null || targetRoom.area >= room.area)
		) {
			targetRoom = room;
		}
	});
	return targetRoom;
};
