import { v4 as uuid } from 'uuid';

import { Wall } from '../models/Wall';

export const square = () => {
	const ids = [uuid(), uuid(), uuid(), uuid()];
	return {
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
				]
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
				]
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
				]
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
				]
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
				color: '',
				showSurface: true,
				action: 'add',
				id: uuid()
			}
		],
		way: [0, 2, 3, 1, 0],
		area: 270400
	};
};

export const l_shaped = () => {
	const ids = [uuid(), uuid(), uuid(), uuid(), uuid(), uuid()];
	return {
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
				]
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
				]
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
				]
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
				]
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
				]
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
				]
			})
		],
		roomData: [
			{
				id: uuid(),
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
				way: [0, 2, 3, 4, 5, 1, 0],
				area: 330478
			}
		]
	};
};
