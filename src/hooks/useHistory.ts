import { useLocalStorage } from '@mantine/hooks';
import { useCallback, useEffect, useState } from 'react';

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
	const [lastSnapshot, setLastSnapshot] = useLocalStorage<HistorySnapshot>({
		key: 'last-floor-plan-snapshot',
		defaultValue: { objData: [], wallData: [], roomData: [] }
	});

	const createSnapshot = useCallback(
		(wallMeta: WallMetaData[], objectMeta: ObjectMetaData[], roomMeta: RoomMetaData[]) => {
			const nextItem = {
				objData: objectMeta,
				wallData: wallMeta.map((w) => Wall.fromWall(w)), // create copy of walls
				roomData: roomMeta
			};

			setHistory([...history.slice(0, historyIndex + 1), nextItem]);
			setLastSnapshot(nextItem);

			setHistoryIndex((prev) => prev + 1);
		},
		[history, historyIndex, setLastSnapshot]
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
		setLastSnapshot(historyItem);
		return historyItem;
	}, [history, historyIndex, setLastSnapshot]);

	const redo = useCallback((): HistorySnapshot => {
		if (historyIndex === history.length - 1) {
			console.log('No history to redo!');
			return history[historyIndex];
		}

		const newHistoryIndex = historyIndex + 1;
		const historyItem = history[newHistoryIndex];
		setHistoryIndex(newHistoryIndex);
		setLastSnapshot(historyItem);
		return historyItem;
	}, [history, historyIndex, setLastSnapshot]);

	const restore = useCallback((): HistorySnapshot => {
		console.log('Restoring last snapshot...', lastSnapshot);
		setHistoryIndex(0);
		const history = [lastSnapshot];
		setHistory(history);
		return {
			objData: lastSnapshot.objData,
			wallData: lastSnapshot.wallData.map((w) => Wall.fromWall(w)),
			roomData: lastSnapshot.roomData
		};
	}, [lastSnapshot]);

	const reset = useCallback(() => {
		console.log('RESET HISTORY');
		setHistory([]);
		setHistoryIndex(-1);
		setLastSnapshot(DefaultState);
	}, [setHistory, setHistoryIndex, setLastSnapshot]);

	return { createSnapshot, undo, redo, restore, reset };
};
