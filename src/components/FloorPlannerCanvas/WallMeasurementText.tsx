import { WallMeasurementRenderData } from '../../hooks/useWallMeasurements';

interface Props {
	data: WallMeasurementRenderData[];
	strokeWidth: string;
	fill: string;
	fontSize: (x: number) => string;
}

const WallMeasurementText = ({ data, strokeWidth, fill, fontSize }: Props) => {
	return (
		<>
			{data.map(({ start, shift, angle, content }) => (
				<text
					key={`${start.x}-${start.y}-measurement`}
					x={start.x}
					y={start.y + shift}
					transform={`rotate(${angle} ${start.x},${start.y})`}
					textAnchor="middle"
					stroke="#fff"
					strokeWidth={strokeWidth}
					fill={fill}
					fontSize={fontSize(content)}>
					{content.toFixed(2)}
				</text>
			))}
		</>
	);
};
export default WallMeasurementText;
