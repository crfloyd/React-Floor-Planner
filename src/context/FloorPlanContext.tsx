import React, { PropsWithChildren, useState } from 'react';

import { DeviceMetaData, ObjectMetaData, RoomMetaData, WallMetaData } from '../models';

interface Props {
	wallMetaData: WallMetaData[];
	setWallMetaData: React.Dispatch<React.SetStateAction<WallMetaData[]>>;
	wallUnderCursor: WallMetaData | undefined;
	setWallUnderCursor: React.Dispatch<React.SetStateAction<WallMetaData | undefined>>;
	objectMetaData: ObjectMetaData[];
	setObjectMetaData: React.Dispatch<React.SetStateAction<ObjectMetaData[]>>;
	roomMetaData: RoomMetaData[];
	setRoomMetaData: React.Dispatch<React.SetStateAction<RoomMetaData[]>>;
	deviceMetaData: DeviceMetaData[];
	setDeviceMetaData: React.Dispatch<React.SetStateAction<DeviceMetaData[]>>;
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
	},
	deviceMetaData: [],
	setDeviceMetaData: () => {
		return;
	}
});

export const FloorPlanContextProvider: React.FC<PropsWithChildren> = (props) => {
	const [wallUnderCursor, setWallUnderCursor] = useState<WallMetaData>();
	const [wallMetaData, setWallMetaData] = useState<WallMetaData[]>([]);
	const [objectMetaData, setObjectMetaData] = useState<ObjectMetaData[]>([]);
	const [roomMetaData, setRoomMetaData] = useState<RoomMetaData[]>([]);
	const [deviceMetaData, setDeviceMetaData] = useState<DeviceMetaData[]>([]);
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
				setRoomMetaData,
				deviceMetaData,
				setDeviceMetaData
			}}>
			{props.children}
		</FloorPlanContext.Provider>
	);
};
