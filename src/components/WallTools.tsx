import { useEffect, useState } from "react";
import { WallMetaData } from "../models/models";

interface Props {
	wall?: WallMetaData | null;
	onWallWidthChanged: (value: number) => void;
	onSplitClicked: () => void;
	onSeparationClicked: () => void;
	onTransformToWallClicked: () => void;
	onWallTrashClicked: () => void;
	onGoBackClicked: () => void;
}

const WallTools = ({
	wall,
	onWallWidthChanged,
	onSplitClicked,
	onSeparationClicked,
	onTransformToWallClicked,
	onWallTrashClicked,
	onGoBackClicked,
}: Props) => {
	const [wallWidth, setWallWidth] = useState(7);

	const isSeparationWall = wall?.type === "separate";

	return (
		<div id="wallTools" className="leftBox">
			<h2 id="titleWallTools">{`Modify the ${
				isSeparationWall ? "separation" : "wall"
			}`}</h2>
			<hr />
			{!isSeparationWall && (
				<section id="rangeThick">
					<p>
						Width [<span id="wallWidthScale">7-50</span>]
						<span id="wallWidthVal">{wallWidth}</span> cm
					</p>
					<input
						type="range"
						id="wallWidth"
						step="0.1"
						className="range"
						min={7}
						max={50}
						value={wallWidth}
						onChange={(e) => {
							setWallWidth(+e.target.value);
							onWallWidthChanged(+e.target.value);
						}}
					/>
				</section>
			)}
			<ul className="list-unstyled">
				{!isSeparationWall && (
					<section id="cutWall">
						<p>
							Cut the wall :<br />
							<small>A cut will be made at each wall encountered.</small>
						</p>
						<li>
							<button
								className="btn btn-default fully"
								onClick={() => {
									onSplitClicked();
								}}
							>
								<i className="fa fa-2x fa-scissors" aria-hidden="true"></i>
							</button>
						</li>
					</section>
				)}
				<br />

				{!isSeparationWall && (
					<section id="separate">
						<p>
							Separation wall :<br />
							<small>Transform the wall into simple separation line.</small>
						</p>
						<li>
							<button
								className="btn btn-default fully"
								onClick={() => {
									onSeparationClicked();
								}}
								id="wallInvisible"
							>
								<i className="fa fa-2x fa-crop" aria-hidden="true"></i>
							</button>
						</li>
					</section>
				)}

				{isSeparationWall && (
					<section id="recombine">
						<p>
							Transform to wall :<br />
							<small>The thickness will be identical to the last known.</small>
						</p>
						<li>
							<button
								className="btn btn-default fully"
								onClick={() => {
									onTransformToWallClicked();
								}}
								id="wallVisible"
							>
								<i className="fa fa-2x fa-crop" aria-hidden="true"></i>
							</button>
						</li>
					</section>
				)}
				<br />
				<li>
					<button
						className="btn btn-danger fully"
						id="wallTrash"
						onClick={() => {
							onWallTrashClicked();
						}}
					>
						<i className="fa fa-2x fa-trash-o" aria-hidden="true"></i>
					</button>
				</li>
				<li>
					<button
						className="btn btn-info fully"
						style={{ marginTop: "50px" }}
						onClick={() => {
							onGoBackClicked();
						}}
					>
						<i className="fa fa-2x fa-backward" aria-hidden="true"></i>
					</button>
				</li>
			</ul>
		</div>
	);
};
export default WallTools;
