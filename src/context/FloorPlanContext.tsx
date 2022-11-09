import React, { createContext, PropsWithChildren, useState } from 'react';

import { ObjectMetaData, WallMetaData } from '../models';

interface Props {
	wallMetaData: WallMetaData[];
	setWallMetaData: React.Dispatch<React.SetStateAction<WallMetaData[]>>;
	wallUnderCursor: WallMetaData | undefined;
	setWallUnderCursor: React.Dispatch<React.SetStateAction<WallMetaData | undefined>>;
	objectMetaData: ObjectMetaData[];
	setObjectMetaData: React.Dispatch<React.SetStateAction<ObjectMetaData[]>>;
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
	}
});

export const FloorPlanContextProvider: React.FC<PropsWithChildren> = (props) => {
	const [wallUnderCursor, setWallUnderCursor] = useState<WallMetaData>();
	const [wallMetaData, setWallMetaData] = useState<WallMetaData[]>([]);
	const [objectMetaData, setObjectMetaData] = useState<ObjectMetaData[]>([]);
	return (
		<FloorPlanContext.Provider
			value={{
				wallMetaData,
				setWallMetaData,
				objectMetaData,
				setObjectMetaData,
				wallUnderCursor,
				setWallUnderCursor
			}}>
			{props.children}
		</FloorPlanContext.Provider>
	);
};
