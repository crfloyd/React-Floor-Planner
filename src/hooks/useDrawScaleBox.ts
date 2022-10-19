import { useEffect, useState } from 'react';
import { constants } from '../../constants';
import { Point2D, WallMetaData } from '../models/models';

interface ScaleBoxDisplayData {
	path: string;
	textItems: { position: Point2D; content: string; rotation: string }[];
}

export const useDrawScaleBox = (wallMetaData: WallMetaData[]) => {
	const [scaleBoxDisplayData, setScaleBoxDisplayData] = useState<ScaleBoxDisplayData | null>(null);

	useEffect(() => {
		let minX = 0,
			minY = 0,
			maxX = 0,
			maxY = 0;
		for (let i = 0; i < wallMetaData.length; i++) {
			const wall = wallMetaData[i];

			let px = wall.start.x;
			let py = wall.start.y;
			if (!i || px < minX) minX = px;
			if (!i || py < minY) minY = py;
			if (!i || px > maxX) maxX = px;
			if (!i || py > maxY) maxY = py;

			px = wall.end.x;
			py = wall.end.y;
			if (!i || px < minX) minX = px;
			if (!i || py < minY) minY = py;
			if (!i || px > maxX) maxX = px;
			if (!i || py > maxY) maxY = py;
		}
		const width = maxX - minX;
		const height = maxY - minY;

		const labelWidth = ((maxX - minX) / constants.METER_SIZE).toFixed(2);
		const labelHeight = ((maxY - minY) / constants.METER_SIZE).toFixed(2);

		let sideRight = 'm' + (maxX + 40) + ',' + minY;
		sideRight += ' l60,0 m-40,10 l10,-10 l10,10 m-10,-10';
		sideRight += ' l0,' + height;
		sideRight += ' m-30,0 l60,0 m-40,-10 l10,10 l10,-10';

		sideRight += 'M' + minX + ',' + (minY - 40);
		sideRight += ' l0,-60 m10,40 l-10,-10 l10,-10 m-10,10';
		sideRight += ' l' + width + ',0';
		sideRight += ' m0,30 l0,-60 m-10,40 l10,-10 l-10,-10';

		setScaleBoxDisplayData({
			path: sideRight,
			textItems: [
				{
					position: { x: maxX + 70, y: (maxY + minY) / 2 + 35 },
					content: labelHeight + ' m',
					rotation: 'rotate(270 ' + (maxX + 70) + ',' + (maxY + minY) / 2 + ')'
				},
				{
					position: { x: (maxX + minX) / 2, y: minY - 95 },
					content: labelWidth + ' m',
					rotation: ''
				}
			]
		});
	}, [wallMetaData]);

	return { scaleBoxDisplayData };
};
