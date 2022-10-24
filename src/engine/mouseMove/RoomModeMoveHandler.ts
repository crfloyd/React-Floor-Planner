import { Point2D, RoomMetaData } from '../../models/models';
import { pointInPolygon } from '../../utils/svgTools';

export const handleMouseMoveRoomMode = (
	snap: Point2D,
	roomMetaData: RoomMetaData[],
	setRoomUnderCursor: (r: RoomMetaData | undefined) => void
) => {
	// if (binder) {
	// 	if (typeof binder['remove'] === 'function') {
	// 		binder.remove();
	// 	}
	// 	binder = setBinder(null);
	// }

	const roomTarget = getRoomOnPoint(snap, roomMetaData);
	setRoomUnderCursor(roomTarget);
	// if (!roomTarget) return;

	// const pathSurface = roomTarget.coords;
	// let pathCreate = 'M' + pathSurface[0].x + ',' + pathSurface[0].y;
	// for (let p = 1; p < pathSurface.length - 1; p++) {
	// 	pathCreate = pathCreate + ' ' + 'L' + pathSurface[p].x + ',' + pathSurface[p].y;
	// }
	// pathCreate = pathCreate + 'Z';

	// if (roomTarget.inside.length > 0) {
	// 	for (let ins = 0; ins < roomTarget.inside.length; ins++) {
	// 		const targetPolygon = roomPolygonData.polygons[roomTarget.inside[ins]];
	// 		const numCoords = targetPolygon.coords.length - 1;
	// 		pathCreate =
	// 			pathCreate +
	// 			' M' +
	// 			targetPolygon.coords[numCoords].x +
	// 			',' +
	// 			targetPolygon.coords[numCoords].y;
	// 		for (let free = targetPolygon.coords.length - 2; free > -1; free--) {
	// 			pathCreate =
	// 				pathCreate + ' L' + targetPolygon.coords[free].x + ',' + targetPolygon.coords[free].y;
	// 		}
	// 	}
	// }

	// console.log('creating room path:', pathCreate);
	// binder = setBinder(
	// 	createSvgElement('boxbind', 'path', {
	// 		id: 'roomSelected',
	// 		d: pathCreate,
	// 		fill: '#c9c14c',
	// 		'fill-opacity': 0.5,
	// 		stroke: '#c9c14c',
	// 		'fill-rule': 'evenodd',
	// 		'stroke-width': 3
	// 	})
	// );

	// binder.type = 'room';
	// binder.area = roomTarget.area;
	// binder.id = roomMetaData.indexOf(roomTarget);
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
