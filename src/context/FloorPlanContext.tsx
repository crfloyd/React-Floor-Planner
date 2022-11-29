import React, { createContext, PropsWithChildren, useState } from 'react';

import { ObjectMetaData, RoomMetaData, WallMetaData } from '../models';

interface Props {
	wallMetaData: WallMetaData[];
	setWallMetaData: React.Dispatch<React.SetStateAction<WallMetaData[]>>;
	wallUnderCursor: WallMetaData | undefined;
	setWallUnderCursor: React.Dispatch<React.SetStateAction<WallMetaData | undefined>>;
	objectMetaData: ObjectMetaData[];
	setObjectMetaData: React.Dispatch<React.SetStateAction<ObjectMetaData[]>>;
	roomMetaData: RoomMetaData[];
	setRoomMetaData: React.Dispatch<React.SetStateAction<RoomMetaData[]>>;
}

export const FloorPlanContext = React.createContext<Props>({
	wallMetaData: [],
	objectMetaData: [],
	wallUnderCursor: undefined,
	setObjectMetaData: () => {
		return;
	},
	setWallMetaData: () => {
		return;
	},
	setWallUnderCursor: () => {
		return;
	},
	roomMetaData: [],
	setRoomMetaData: () => {
		return;
	}
});

export const FloorPlanContextProvider: React.FC<PropsWithChildren> = (props) => {
	const [wallUnderCursor, setWallUnderCursor] = useState<WallMetaData>();
	const [wallMetaData, setWallMetaData] = useState<WallMetaData[]>([]);
	const [objectMetaData, setObjectMetaData] = useState<ObjectMetaData[]>([]);
	const [roomMetaData, setRoomMetaData] = useState<RoomMetaData[]>([]);
	return (
		<FloorPlanContext.Provider
			value={{
				wallMetaData,
				setWallMetaData,
				objectMetaData,
				setObjectMetaData,
				wallUnderCursor,
				setWallUnderCursor,
				roomMetaData,
				setRoomMetaData
			}}>
			{props.children}
		</FloorPlanContext.Provider>
	);
};
