import { useEffect, useState } from 'react';

interface Props {
	data: {
		minWidth: number;
		maxWidth: number;
		width: number;
		minHeight: number;
		maxHeight: number;
		height: number;
		rotation: number;
		showStepCounter: boolean;
		stepCount: number;
	};
	onWidthChanged: (val: number) => void;
	onHeightChanged: (val: number) => void;
	onRotationChanged: (val: number) => void;
	onNumStepsChanged: (val: number) => void;
	onTrashClicked: () => void;
	onBackClicked: () => void;
}

const ObjectTools = ({
	data,
	onWidthChanged,
	onHeightChanged,
	onRotationChanged,
	onNumStepsChanged,
	onTrashClicked,
	onBackClicked
}: Props) => {
	const [boundObjectWidth, setBoundObjectWidth] = useState(5);
	const [boundObjectHeight, setBoundObjectHeight] = useState(5);
	const [boundObjectRotation, setBoundObjectRotation] = useState(0);
	const [numSteps, setNumSteps] = useState(15);

	useEffect(() => {
		setBoundObjectHeight(data.height);
		setBoundObjectWidth(data.width);
		setBoundObjectRotation(data.rotation);
	}, [data.height, data.width, data.rotation]);

	return (
		<div id="objBoundingBox" className="leftBox">
			<h2>Modify object</h2>
			<hr />
			<section id="objBoundingBoxScale">
				<p>
					Width [<span id="bboxWidthScale">{`${data.minWidth}-${data.maxWidth}`}</span>] :{' '}
					<span id="bboxWidthVal">{boundObjectWidth}</span> cm
				</p>
				<input
					type="range"
					id="bboxWidth"
					step="1"
					min={data.minWidth}
					max={data.maxWidth}
					className="range"
					value={boundObjectWidth}
					onChange={(e) => {
						const val = +e.target.value;
						setBoundObjectWidth(val);
						onWidthChanged(val);
					}}
				/>
				<p>
					Length [<span id="bboxHeightScale">{`${data.minHeight}-${data.maxHeight}`}</span>] :{' '}
					<span id="bboxHeightVal">{boundObjectHeight}</span> cm
				</p>
				<input
					type="range"
					id="bboxHeight"
					step="1"
					min={data.minHeight}
					max={data.maxHeight}
					className="range"
					value={boundObjectHeight}
					onChange={(e) => {
						const val = +e.target.value;
						setBoundObjectHeight(val);
						onHeightChanged(val);
					}}
				/>
			</section>

			<section id="objBoundingBoxRotation">
				<p>
					<i className="fa fa-compass" aria-hidden="true"></i> Rotation :{' '}
					<span id="bboxRotationVal">{boundObjectRotation}</span> °
				</p>
				<input
					type="range"
					id="bboxRotation"
					step="1"
					className="range"
					min="-180"
					max="180"
					value={boundObjectRotation}
					onChange={(e) => {
						const val = +e.target.value;
						setBoundObjectRotation(val);
						onRotationChanged(val);
					}}
				/>
			</section>

			{data.showStepCounter && (
				<div id="stepsCounter">
					<p>
						<span id="bboxSteps">
							Nb steps [2-15] : <span id="bboxStepsVal">{numSteps}</span>
						</span>
					</p>
					<button
						className="btn btn-info"
						id="bboxStepsAdd"
						onClick={() => {
							if (numSteps < 15) {
								const nextVal = numSteps + 1;
								setNumSteps(nextVal);
								onNumStepsChanged(nextVal);
							}
						}}>
						<i className="fa fa-plus" aria-hidden="true"></i>
					</button>
					<button
						className="btn btn-info"
						id="bboxStepsMinus"
						onClick={() => {
							if (numSteps > 2) {
								const nextVal = numSteps - 1;
								setNumSteps(nextVal);
								onNumStepsChanged(nextVal);
							}
						}}>
						<i className="fa fa-minus" aria-hidden="true"></i>
					</button>
				</div>
			)}

			{/* <div id="objBoundingBoxColor">
				<div
					className="color textEditorColor"
					data-type="gradientRed"
					style={{
						color: "#f55847",
						background: "linear-gradient(30deg, #f55847, #f00)",
					}}
				></div>
				<div
					className="color textEditorColor"
					data-type="gradientYellow"
					style={{
						color: "#e4c06e",
						background: "linear-gradient(30deg,#e4c06e, #ffb000)",
					}}
				></div>
				<div
					className="color textEditorColor"
					data-type="gradientGreen"
					style={{
						color: "#88cc6c",
						background: "linear-gradient(30deg,#88cc6c, #60c437)",
					}}
				></div>
				<div
					className="color textEditorColor"
					data-type="gradientSky"
					style={{
						color: "#77e1f4",
						background: "linear-gradient(30deg,#77e1f4, #00d9ff)",
					}}
				></div>
				<div
					className="color textEditorColor"
					data-type="gradientBlue"
					style={{
						color: "#4f72a6",
						background: "linear-gradient(30deg,#4f72a6, #284d7e)",
					}}
				></div>
				<div
					className="color textEditorColor"
					data-type="gradientGrey"
					style={{
						color: "#666666",
						background: "linear-gradient(30deg,#666666, #aaaaaa)",
					}}
				></div>
				<div
					className="color textEditorColor"
					data-type="gradientWhite"
					style={{
						color: "#fafafa",
						background: "linear-gradient(30deg,#fafafa, #eaeaea)",
					}}
				></div>
				<div
					className="color textEditorColor"
					data-type="gradientOrange"
					style={{
						color: "#f9ad67",
						background: "linear-gradient(30deg, #f9ad67, #f97f00)",
					}}
				></div>
				<div
					className="color textEditorColor"
					data-type="gradientPurple"
					style={{
						color: "#a784d9",
						background: "linear-gradient(30deg,#a784d9, #8951da)",
					}}
				></div>
				<div
					className="color textEditorColor"
					data-type="gradientPink"
					style={{
						color: "#df67bd",
						background: "linear-gradient(30deg,#df67bd, #e22aae)",
					}}
				></div>
				<div
					className="color textEditorColor"
					data-type="gradientBlack"
					style={{
						color: "#3c3b3b",
						background: "linear-gradient(30deg,#3c3b3b, #000000)",
					}}
				></div>
				<div
					className="color textEditorColor"
					data-type="gradientNeutral"
					style={{
						color: "#e2c695",
						background: "linear-gradient(30deg,#e2c695, #c69d56)",
					}}
				></div>
				<div style={{ clear: "both" }}></div>
			</div> */}

			<br />
			<br />
			<button
				className="btn btn-danger fully"
				id="bboxTrash"
				onClick={() => {
					onTrashClicked();
				}}>
				<i className="fa fa-2x fa-trash-o" aria-hidden="true"></i>
			</button>
			<button
				className="btn btn-info"
				style={{ marginTop: '100px' }}
				onClick={() => {
					onBackClicked();
				}}>
				<i className="fa fa-2x fa-backward" aria-hidden="true"></i>
			</button>
		</div>
	);
};
export default ObjectTools;
