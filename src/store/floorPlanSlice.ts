import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { CursorType, Mode } from '../models';

interface FloorPlanState {
	cursor: CursorType;
	mode: Mode;
	action: boolean;
}

const initialState: FloorPlanState = {
	cursor: 'default',
	mode: Mode.Select,
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
		setAction: (state, action: PayloadAction<boolean>) => {
			state.action = action.payload;
		}
	}
});

export const { setCursor, setMode, setAction } = floorPlanSlice.actions;

export default floorPlanSlice.reducer;
