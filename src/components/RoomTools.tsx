import { useEffect, useState } from "react";
import { constants } from "../../constants";

interface Props {
	roomSize: number;
	roomName: string;
	roomColor: string;
	onComplete: (size: number, name: string, color: string) => void;
	onCancel: () => void;
}
const RoomTools = ({
	roomSize,
	roomName,
	roomColor,
	onComplete,
	onCancel,
}: Props) => {
	const [size, setSize] = useState(roomSize);
	const [name, setName] = useState(roomName);
	const [color, setColor] = useState(roomColor);

	return (
		<>
			<span style={{ color: "#08d" }}>React Floor Planner</span> estimated a
			surface of :<br />
			<b>
				<span className="size">{`${roomSize} m²`}</span>
			</b>
			<br />
			<br />
			<p>If you know the actual area, you enter it here</p>
			<div className="input-group">
				<input
					type="text"
					className="form-control"
					id="roomSurface"
					placeholder="actual area"
					aria-describedby="basic-addon2"
					value={size}
					onChange={(e) => setSize(+e.target.value)}
				/>
				<span className="input-group-addon" id="basic-addon2">
					m²
				</span>
			</div>
			<br />
			<input type="hidden" id="roomName" value={name != "" ? name : ""} />
			Select Room Type :<br />
			<div className="btn-group">
				<button
					className="btn dropdown-toggle btn-default"
					data-toggle="dropdown"
					id="roomLabel"
				>
					{name != "" ? name : "None "}
				</button>
				<ul className="dropdown-menu">
					<li
						onClick={(e) => {
							setName("None");
						}}
					>
						<a href="#">None</a>
					</li>
					<li
						onClick={(e) => {
							setName("Living Room");
						}}
					>
						<a href="#">Living Room</a>
					</li>
					<li
						onClick={(e) => {
							setName("Kitchen");
						}}
					>
						<a href="#">Kitchen</a>
					</li>
					<li
						onClick={(e) => {
							setName("Bathroom");
						}}
					>
						<a href="#">Bathroom</a>
					</li>
					<li
						onClick={(e) => {
							setName("Bathroom 2");
						}}
					>
						<a href="#">Bathroom 2</a>
					</li>
					<li
						onClick={(e) => {
							setName("Bedroom 1");
						}}
					>
						<a href="#">Bedroom 1</a>
					</li>
					<li
						onClick={(e) => {
							setName("Bedroom 2");
						}}
					>
						<a href="#">Bedroom 2</a>
					</li>
					<li
						onClick={(e) => {
							setName("Bedroom 3");
						}}
					>
						<a href="#">Bedroom 3</a>
					</li>
					<li
						onClick={(e) => {
							setName("Bedroom 4");
						}}
					>
						<a href="#">Bedroom 4</a>
					</li>
					<li
						onClick={(e) => {
							setName("Bedroom 5");
						}}
					>
						<a href="#">Bedroom 5</a>
					</li>
					<li
						onClick={(e) => {
							setName("Closet");
						}}
					>
						<a href="#">Closet</a>
					</li>
					<li
						onClick={(e) => {
							setName("Office");
						}}
					>
						<a href="#">Office</a>
					</li>
					<li
						onClick={(e) => {
							setName("Hall");
						}}
					>
						<a href="#">Hall</a>
					</li>
					<li
						onClick={(e) => {
							setName("Foyer");
						}}
					>
						<a href="#">Foyer</a>
					</li>
					<li className="divider"></li>
					<li
						onClick={(e) => {
							setName("Balcony");
						}}
					>
						<a href="#">Balcony</a>
					</li>
					<li
						onClick={(e) => {
							setName("Terrace");
						}}
					>
						<a href="#">Terrace</a>
					</li>
					<li
						onClick={(e) => {
							setName("Garage");
						}}
					>
						<a href="#">Garage</a>
					</li>
				</ul>
			</div>
			<br />
			<hr />
			<p>Colors</p>
			<div
				className="roomColor"
				data-type="roomGradientRed"
				style={{
					background: `linear-gradient(30deg, ${constants.COLOR_ROOM_RED}, ${constants.COLOR_ROOM_RED})`,
				}}
				onClick={() => {
					setColor("roomGradientRed");
				}}
			></div>
			<div
				className="roomColor"
				data-type="roomGradientGreen"
				style={{
					background: `linear-gradient(30deg, ${constants.COLOR_ROOM_GREEN}, ${constants.COLOR_ROOM_GREEN})`,
				}}
				onClick={() => {
					setColor("roomGradientGreen");
				}}
			></div>
			<div
				className="roomColor"
				data-type="roomGradientOrange"
				style={{
					background: `linear-gradient(30deg, ${constants.COLOR_ROOM_ORANGE}, ${constants.COLOR_ROOM_ORANGE})`,
				}}
				onClick={() => {
					setColor("roomGradientOrange");
				}}
			></div>
			<div
				className="roomColor"
				data-type="roomGradientBlue"
				style={{
					background: `linear-gradient(30deg, ${constants.COLOR_ROOM_BLUE}, ${constants.COLOR_ROOM_BLUE})`,
				}}
				onClick={() => {
					setColor("roomGradientBlue");
				}}
			></div>
			<div
				className="roomColor"
				data-type="roomGradientGray"
				style={{
					background: `linear-gradient(30deg, ${constants.COLOR_ROOM_GRAY}, ${constants.COLOR_ROOM_GRAY})`,
				}}
				onClick={() => {
					setColor("roomGradientGray");
				}}
			></div>
			<div data-type="#ff008a" style={{ clear: "both" }}></div>
			<br />
			<br />
			<input type="hidden" id="roomBackground" value={roomColor} />
			<button
				type="button"
				className="btn btn-primary"
				id="applySurface"
				onClick={() => {
					onComplete(size, name, color);
				}}
			>
				Apply
			</button>
			<button
				type="button"
				className="btn btn-danger"
				id="resetRoomTools"
				onClick={() => {
					onCancel();
				}}
			>
				Cancel
			</button>
			<br />
		</>
	);
};
export default RoomTools;
