import React from 'react';

import { constants } from '../../constants';
import { Point2D, RoomMetaData } from '../../models/models';

interface Props {
	room: RoomMetaData;
	centerPoint: Point2D;
	textColor: string | undefined;
}

const RoomAreaText = ({ room, centerPoint, textColor }: Props) => {
	return (
		<>
			<text
				x={centerPoint.x}
				y={centerPoint.y}
				style={{
					fill:
						room.color == 'gradientBlack' || room.color == 'gradientBlue'
							? 'white'
							: textColor ?? '#343938'
				}}
				textAnchor="middle">
				{room.name}
			</text>
			<text
				x={centerPoint.x}
				y={room.name ? centerPoint.y + 20 : centerPoint.y}
				style={{
					fill:
						room.color == 'gradientBlack' || room.color == 'gradientBlue'
							? 'white'
							: textColor ?? '#343938'
				}}
				fontSize="12.5px"
				fontWeight={room.surface ? 'normal' : 'bold'}
				textAnchor="middle">
				{room.surface
					? room.surface + ' m²'
					: (room.area / (constants.METER_SIZE * constants.METER_SIZE)).toFixed(2) + ' m²'}
			</text>
		</>
	);
};
export default RoomAreaText;
