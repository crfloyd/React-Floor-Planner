interface Props {
	id: string;
	color1: string;
	color2: string;
}

const LinearGradient: React.FC<Props> = ({ id, color1, color2 }: Props) => {
	return (
		<>
			<linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%" spreadMethod="pad">
				<stop offset="0%" stopColor={color1} stopOpacity="1" />
				<stop offset="100%" stopColor={color2} stopOpacity="1" />
			</linearGradient>
		</>
	);
};
export default LinearGradient;
