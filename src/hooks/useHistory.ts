import { useCallback, useState } from 'react';

import { HistorySnapshot, ObjectMetaData, RoomMetaData, WallMetaData } from '../models';
import { Wall } from '../models/Wall';

const DefaultState: HistorySnapshot = {
	objData: [],
	wallData: [],
	roomData: []
};

export const useHistory = () => {
	const [history, setHistory] = useState<HistorySnapshot[]>([]);
	const [historyIndex, setHistoryIndex] = useState(-1);

	const createSnapshot = useCallback(
		(wallMeta: WallMetaData[], objectMeta: ObjectMetaData[], roomMeta: RoomMetaData[]) => {
			const nextItem = {
				objData: objectMeta,
				wallData: wallMeta.map((w) => Wall.fromWall(w)), // create copy of walls
				roomData: roomMeta
			};

			setHistory([...history.slice(0, historyIndex + 1), nextItem]);

			setHistoryIndex((prev) => prev + 1);
		},
		[history, historyIndex]
	);

	const undo = useCallback((): HistorySnapshot => {
		if (historyIndex < 0) {
			console.log('No history to undo!');
			return DefaultState;
		}
		if (historyIndex === 0) {
			setHistoryIndex(-1);
			return DefaultState;
		}

		const newHistoryIndex = historyIndex - 1;
		const historyItem = history[newHistoryIndex];
		setHistoryIndex(newHistoryIndex);
		return historyItem;
	}, [history, historyIndex]);

	const redo = useCallback((): HistorySnapshot => {
		if (historyIndex === history.length - 1) {
			console.log('No history to redo!');
			return history[historyIndex];
		}

		const newHistoryIndex = historyIndex + 1;
		const historyItem = history[newHistoryIndex];
		setHistoryIndex(newHistoryIndex);
		return historyItem;
	}, [history, historyIndex]);

	return { createSnapshot, undo, redo };
};
