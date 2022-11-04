import { Mode, Point2D, WallEquation, WallMetaData } from '../models/models';

export default class CanvasState {
	// mode = Mode.Select;
	// setMode = (val: Mode) => {
	// 	this.mode = val;
	// 	return this.mode;
	// };

	// modeOption = '';
	// setModeOption = (val: string) => {
	// 	this.modeOption = val;
	// 	return this.modeOption;
	// };

	// action = false;
	// setAction = (a: boolean) => {
	// 	this.action = a;
	// 	return this.action;
	// };

	followerData: {
		equations: { wall: WallMetaData; eq: WallEquation; type: string }[];
		intersection: Point2D | null;
	} = { equations: [], intersection: null };
}
