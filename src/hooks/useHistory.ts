import { v4 as uuid } from 'uuid';

import {
	HistorySnapshot,
	ObjectMetaData,
	RoomMetaData,
	ViewboxData,
	WallMetaData
} from '../models/models';
import { Object2D } from '../models/Object2D';
import { Wall } from '../models/Wall';

export const useHistory = () => {
	// const [history, setHistory] = useState<HistorySnapshot[]>([]);
	let history: HistorySnapshot[] = [];
	// const [historyIndex, setHistoryIndex] = useState(0);
	let historyIndex = 0;

	const saveInternal = (
		objectMeta: ObjectMetaData[],
		wallMeta: WallMetaData[],
		roomMeta: RoomMetaData[],
		boot = false
	) => {
		if (boot) {
			localStorage.removeItem('history');
		}

		if (historyIndex < history.length) {
			history = history.slice(0, historyIndex);
		}
		// console.log(objectMeta);
		history = [
			...history,
			{
				objData: objectMeta,
				wallData: wallMeta,
				roomData: roomMeta
			}
		];
		try {
			localStorage.setItem('history', JSON.stringify(history));
			historyIndex++;
		} catch (error) {
			console.log('Error trying to save state', error);
		}
		return true;
	};

	const save = (
		wallMeta: WallMetaData[],
		objectMeta: ObjectMetaData[],
		roomMeta: RoomMetaData[],
		boot = false
	) => {
		return saveInternal(objectMeta, wallMeta, roomMeta, boot);
	};

	const load = (index: number, viewbox: ViewboxData) => {
		const historyData = history[index];
		const objects = historyData.objData?.map((objHistory) => {
			const obj = new Object2D(
				objHistory.family,
				objHistory.class,
				objHistory.type,
				{ x: objHistory.x, y: objHistory.y },
				objHistory.angle,
				objHistory.angleSign,
				objHistory.size,
				(objHistory.hinge = 'normal'),
				objHistory.thick,
				objHistory.value,
				viewbox
			);
			obj.limit = objHistory.limit;
			// obj.id = objHistory.id;
			obj.update();
			return obj;
		});

		const walls = historyData.wallData.map((a) => new Wall(a.start, a.end, a.type, a.thick));

		return { objects, walls, rooms: historyData.roomData };
	};

	const init = (
		type: string,
		viewbox: ViewboxData
	): {
		objects: ObjectMetaData[];
		walls: WallMetaData[];
		rooms: RoomMetaData[];
	} => {
		historyIndex = 0;
		const localHistory = localStorage.getItem('history');
		if (localHistory && type == 'recovery') {
			const historyTemp: HistorySnapshot[] = JSON.parse(localHistory);
			history = historyTemp;
			const { objects, walls, rooms } = load(historyTemp.length - 1, viewbox);
			saveInternal(objects, walls, rooms, true);
			return { objects, walls, rooms };
		}
		if (type == 'newSquare') {
			if (localStorage.getItem('history')) localStorage.removeItem('history');

			const ids = [uuid(), uuid(), uuid(), uuid()];
			const hist: HistorySnapshot = {
				objData: [],
				wallData: [
					new Wall({ x: 540, y: 194 }, { x: 540, y: 734 }, 'normal', 20, {
						id: ids[0],
						thick: 20,
						start: { x: 540, y: 194 },
						end: { x: 540, y: 734 },
						type: 'normal',
						parent: ids[3],
						child: ids[1],
						angle: 1.5707963267948966,
						equations: {
							up: { A: 'v', B: 550 },
							down: { A: 'v', B: 530 },
							base: { A: 'v', B: 540 }
						},
						coords: [
							{ x: 550, y: 204 },
							{ x: 530, y: 184 },
							{ x: 530, y: 744 },
							{ x: 550, y: 724 }
						],
						graph: { 0: {}, context: {}, length: 1 }
					}),
					new Wall({ x: 540, y: 734 }, { x: 1080, y: 734 }, 'normal', 20, {
						id: ids[1],
						thick: 20,
						start: { x: 540, y: 734 },
						end: { x: 1080, y: 734 },
						type: 'normal',
						parent: ids[0],
						child: ids[2],
						angle: 0,
						equations: {
							up: { A: 'h', B: 724 },
							down: { A: 'h', B: 744 },
							base: { A: 'h', B: 734 }
						},
						coords: [
							{ x: 550, y: 724 },
							{ x: 530, y: 744 },
							{ x: 1090, y: 744 },
							{ x: 1070, y: 724 }
						],
						graph: { 0: {}, context: {}, length: 1 }
					}),
					new Wall({ x: 1080, y: 734 }, { x: 1080, y: 194 }, 'normal', 20, {
						id: ids[2],
						thick: 20,
						start: { x: 1080, y: 734 },
						end: { x: 1080, y: 194 },
						type: 'normal',
						parent: ids[1],
						child: ids[3],
						angle: -1.5707963267948966,
						equations: {
							up: { A: 'v', B: 1070 },
							down: { A: 'v', B: 1090 },
							base: { A: 'v', B: 1080 }
						},
						coords: [
							{ x: 1070, y: 724 },
							{ x: 1090, y: 744 },
							{ x: 1090, y: 184 },
							{ x: 1070, y: 204 }
						],
						graph: { 0: {}, context: {}, length: 1 }
					}),
					new Wall({ x: 1080, y: 194 }, { x: 540, y: 194 }, 'normal', 20, {
						id: ids[3],
						thick: 20,
						start: { x: 1080, y: 194 },
						end: { x: 540, y: 194 },
						type: 'normal',
						parent: ids[2],
						child: ids[0],
						angle: 3.141592653589793,
						equations: {
							up: { A: 'h', B: 204 },
							down: { A: 'h', B: 184 },
							base: { A: 'h', B: 194 }
						},
						coords: [
							{ x: 1070, y: 204 },
							{ x: 1090, y: 184 },
							{ x: 530, y: 184 },
							{ x: 550, y: 204 }
						],
						graph: { 0: {}, context: {}, length: 1 }
					})
				],
				roomData: [
					{
						coords: [
							{ x: 540, y: 734 },
							{ x: 1080, y: 734 },
							{ x: 1080, y: 194 },
							{ x: 540, y: 194 },
							{ x: 540, y: 734 }
						],
						coordsOutside: [
							{ x: 1090, y: 744 },
							{ x: 1090, y: 184 },
							{ x: 530, y: 184 },
							{ x: 530, y: 744 },
							{ x: 1090, y: 744 }
						],
						coordsInside: [
							{ x: 1070, y: 724 },
							{ x: 1070, y: 204 },
							{ x: 550, y: 204 },
							{ x: 550, y: 724 },
							{ x: 1070, y: 724 }
						],
						inside: [],
						way: [0, 2, 3, 1, 0],
						area: 270400,
						surface: '',
						name: '',
						color: 'gradientWhite',
						showSurface: true,
						action: 'add'
					}
				]
			};
			history = [hist];
			localStorage.setItem('history', JSON.stringify(history));
			const { objects, walls, rooms } = load(0, viewbox);
			saveInternal(objects, walls, rooms);
			return { objects, walls, rooms };
		}
		if (type == 'newL') {
			if (localStorage.getItem('history')) localStorage.removeItem('history');

			const ids = [uuid(), uuid(), uuid(), uuid(), uuid(), uuid()];
			const hist: HistorySnapshot = {
				objData: [],
				wallData: [
					new Wall({ x: 447, y: 458 }, { x: 447, y: 744 }, 'normal', 20, {
						id: ids[0],
						thick: 20,
						start: { x: 447, y: 458 },
						end: { x: 447, y: 744 },
						type: 'normal',
						parent: ids[5],
						child: ids[1],
						angle: 1.5707963267948966,
						equations: {
							up: { A: 'v', B: 457 },
							down: { A: 'v', B: 437 },
							base: { A: 'v', B: 447 }
						},
						coords: [
							{ x: 457, y: 468 },
							{ x: 437, y: 448 },
							{ x: 437, y: 754 },
							{ x: 457, y: 734 }
						],
						graph: { 0: {}, context: {}, length: 1 }
					}),
					new Wall({ x: 447, y: 744 }, { x: 1347, y: 744 }, 'normal', 20, {
						id: ids[1],
						thick: 20,
						start: { x: 447, y: 744 },
						end: { x: 1347, y: 744 },
						type: 'normal',
						parent: ids[0],
						child: ids[2],
						angle: 0,
						equations: {
							up: { A: 'h', B: 734 },
							down: { A: 'h', B: 754 },
							base: { A: 'h', B: 744 }
						},
						coords: [
							{ x: 457, y: 734 },
							{ x: 437, y: 754 },
							{ x: 1357, y: 754 },
							{ x: 1337, y: 734 }
						],
						graph: { 0: {}, context: {}, length: 1 }
					}),
					new Wall({ x: 1347, y: 744 }, { x: 1347, y: 144 }, 'normal', 20, {
						id: ids[2],
						thick: 20,
						start: { x: 1347, y: 744 },
						end: { x: 1347, y: 144 },
						type: 'normal',
						parent: ids[1],
						child: ids[3],
						angle: -1.5707963267948966,
						equations: {
							up: { A: 'v', B: 1337 },
							down: { A: 'v', B: 1357 },
							base: { A: 'v', B: 1347 }
						},
						coords: [
							{ x: 1337, y: 734 },
							{ x: 1357, y: 754 },
							{ x: 1357, y: 134 },
							{ x: 1337, y: 154 }
						],
						graph: { 0: {}, context: {}, length: 1 }
					}),
					new Wall({ x: 1347, y: 144 }, { x: 1020, y: 144 }, 'normal', 20, {
						id: ids[3],
						thick: 20,
						start: { x: 1347, y: 144 },
						end: { x: 1020, y: 144 },
						type: 'normal',
						parent: ids[2],
						child: ids[4],
						angle: 3.141592653589793,
						equations: {
							up: { A: 'h', B: 154 },
							down: { A: 'h', B: 134 },
							base: { A: 'h', B: 144 }
						},
						coords: [
							{ x: 1337, y: 154 },
							{ x: 1357, y: 134 },
							{ x: 1010, y: 134 },
							{ x: 1030, y: 154 }
						],
						graph: { 0: {}, context: {}, length: 1 }
					}),
					new Wall({ x: 1020, y: 144 }, { x: 1020, y: 458 }, 'normal', 20, {
						id: ids[4],
						thick: 20,
						start: { x: 1020, y: 144 },
						end: { x: 1020, y: 458 },
						type: 'normal',
						parent: ids[3],
						child: ids[5],
						angle: 1.5707963267948966,
						equations: {
							up: { A: 'v', B: 1030 },
							down: { A: 'v', B: 1010 },
							base: { A: 'v', B: 1020 }
						},
						coords: [
							{ x: 1030, y: 154 },
							{ x: 1010, y: 134 },
							{ x: 1010, y: 448 },
							{ x: 1030, y: 468 }
						],
						graph: { 0: {}, context: {}, length: 1 }
					}),
					new Wall({ x: 1020, y: 458 }, { x: 447, y: 458 }, 'normal', 20, {
						id: ids[5],
						thick: 20,
						start: { x: 1020, y: 458 },
						end: { x: 447, y: 458 },
						type: 'normal',
						parent: ids[4],
						child: ids[0],
						angle: 3.141592653589793,
						equations: {
							up: { A: 'h', B: 468 },
							down: { A: 'h', B: 448 },
							base: { A: 'h', B: 458 }
						},
						coords: [
							{ x: 1030, y: 468 },
							{ x: 1010, y: 448 },
							{ x: 437, y: 448 },
							{ x: 457, y: 468 }
						],
						graph: { 0: {}, context: {}, length: 1 }
					})
				],
				roomData: [
					{
						coords: [
							{ x: 447, y: 744 },
							{ x: 1347, y: 744 },
							{ x: 1347, y: 144 },
							{ x: 1020, y: 144 },
							{ x: 1020, y: 458 },
							{ x: 447, y: 458 },
							{ x: 447, y: 744 }
						],
						coordsOutside: [
							{ x: 1357, y: 754 },
							{ x: 1357, y: 134 },
							{ x: 1010, y: 134 },
							{ x: 1010, y: 448 },
							{ x: 437, y: 448 },
							{ x: 437, y: 754 },
							{ x: 1357, y: 754 }
						],
						coordsInside: [
							{ x: 1337, y: 734 },
							{ x: 1337, y: 154 },
							{ x: 1030, y: 154 },
							{ x: 1030, y: 468 },
							{ x: 457, y: 468 },
							{ x: 457, y: 734 },
							{ x: 1337, y: 734 }
						],
						inside: [],
						way: [0, 2, 3, 4, 5, 1, 0],
						area: 330478,
						surface: '',
						name: '',
						color: 'gradientWhite',
						showSurface: true,
						action: 'add'
					}
				]
			};

			history = [hist];
			localStorage.setItem('history', JSON.stringify(history));
			const { objects, walls, rooms } = load(0, viewbox);
			saveInternal(objects, walls, rooms);
			return { objects, walls, rooms };
		}

		localStorage.removeItem('history');
		return { objects: [], walls: [], rooms: [] };
	};

	const undo = (viewbox: ViewboxData) => {
		historyIndex--;
		return load(historyIndex - 1, viewbox);
	};

	const redo = (viewbox: ViewboxData) => {
		const result = load(historyIndex, viewbox);
		historyIndex++;
		return result;
	};

	return { save, init, undo, redo, historyIndex };
};
