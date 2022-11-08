import { useEffect, useState } from 'react';

import { Point2D, RoomDisplayData, RoomPolygonData, WallMetaData } from '../models/models';
import { polygonize } from '../utils/svgTools';

interface RoomPathData {
	displayData: RoomDisplayData;
	path: string;
	centerPoint: Point2D;
}

export const useRooms = (walls: WallMetaData[]) => {
	// const [roomMetaData, setRoomMetaData] = useState<RoomMetaData[]>([]);
	const [roomPolygonData, setRoomPolygonData] = useState<RoomPolygonData>({
		polygons: [],
		vertex: []
	});
	const [allRoomsDispalyData, setAllRoomsDisplayData] = useState<RoomDisplayData[]>([]);
	const [selectedRoom, setSelectedRoom] = useState<RoomDisplayData>();

	return { roomPolygonData, selectedRoom, setSelectedRoom };
};
