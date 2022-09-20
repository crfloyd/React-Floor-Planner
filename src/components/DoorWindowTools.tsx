import { useState } from "react";

interface Props {
	data: {
		minWidth: number;
		maxWidth: number;
		width: number;
	};
	onFlipOpeningClicked: () => void;
	onOpeningWidthChanged: (val: number) => void;
	onTrashClicked: () => void;
	onBackClicked: () => void;
}

const DoorWindowTools = ({
	data,
	onFlipOpeningClicked,
	onOpeningWidthChanged,
	onTrashClicked,
	onBackClicked,
}: Props) => {
	return (
		<>
			<h2>Modify door/window</h2>
			<hr />
			<ul className="list-unstyled">
				<br />
				<br />
				<li>
					<button
						className="btn btn-default fully"
						id="objToolsHinge"
						onClick={() => {
							onFlipOpeningClicked();
						}}
					>
						Flip Opening
					</button>
				</li>

				<p>
					Width [
					<span id="doorWindowWidthScale">{`${data.minWidth}-${data.maxWidth}`}</span>
					] : <span id="doorWindowWidthVal">{data.width}</span> cm
				</p>
				<input
					type="range"
					id="doorWindowWidth"
					step="1"
					min={data.minWidth}
					max={data.maxWidth}
					className="range"
					value={data.width}
					onChange={(e) => {
						onOpeningWidthChanged(+e.target.value);
					}}
				/>
				<br />
				<li>
					<button
						className="btn btn-danger fully objTrash"
						onClick={() => {
							onTrashClicked();
						}}
					>
						<i className="fa fa-2x fa-trash-o" aria-hidden="true"></i>
					</button>
				</li>
				<li>
					<button
						className="btn btn-info"
						style={{ marginTop: "100px" }}
						onClick={() => {
							onBackClicked();
							// applyMode(Mode.Select);
							// setBoxInfoText("Mode selection");
							// setShowConfigureObjectPanel(false);
							// setShowMainPanel(true);

							// binder.graph.remove();
							// rib(wallMeta);
						}}
					>
						<i className="fa fa-2x fa-backward" aria-hidden="true"></i>
					</button>
				</li>
			</ul>
		</>
	);
};
export default DoorWindowTools;
