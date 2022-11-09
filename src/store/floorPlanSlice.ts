import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { type } from 'os';

import { CursorType, Mode, ObjectMetaData, WallMetaData } from '../models';

type DoorType = 'simple' | 'opening' | 'double' | 'fix';

interface FloorPlanState {
	cursor: CursorType;
	mode: Mode;
	doorType: DoorType;
	objectType: string;
	action: boolean;
}

const initialState: FloorPlanState = {
	cursor: 'default',
	mode: Mode.Select,
	doorType: 'simple',
	objectType: '',
	action: false
};

export const floorPlanSlice = createSlice({
	name: 'floorPlanState',
	initialState,
	reducers: {
		setCursor: (state, action: PayloadAction<CursorType>) => {
			state.cursor = action.payload;
		},
		setMode: (state, action: PayloadAction<Mode>) => {
			state.mode = action.payload;
		},
		setDoorType: (state, action: PayloadAction<DoorType>) => {
			state.doorType = action.payload;
		},
		setObjectType: (state, action: PayloadAction<string>) => {
			state.objectType = action.payload;
		},
		setAction: (state, action: PayloadAction<boolean>) => {
			state.action = action.payload;
		}
	}
});

export const { setCursor, setMode, setAction, setDoorType, setObjectType } = floorPlanSlice.actions;

export default floorPlanSlice.reducer;
