import { constants } from "../../../constants";
import { editor } from "../../../editor";
import { qSVG } from "../../../qSVG";
import {
	CursorType,
	Mode,
	Point2D,
	SvgPathMetaData,
	WallMetaData,
} from "../../models";
import { angleBetweenPoints, createWallGuideLine } from "../../svgTools";
import { CanvasState } from "../CanvasState";

export const handleMouseMoveLineMode = (
	snap: Point2D,
	setHelperLineSvgData: (l: SvgPathMetaData | null) => void,
	continuousWallMode: boolean,
	setCursor: (crsr: CursorType) => void,
	canvasState: CanvasState,
	wallMetaData: WallMetaData[]
) => {
	if (canvasState.action) {
		onActionTrue(
			snap,
			continuousWallMode,
			setHelperLineSvgData,
			setCursor,
			canvasState,
			wallMetaData
		);
	} else {
		onActionFalse(
			canvasState,
			setCursor,
			snap,
			setHelperLineSvgData,
			wallMetaData
		);
	}
};

export const onActionTrue = (
	snap: Point2D,
	continuousWallMode: boolean,
	setHelperLineSvgData: (l: SvgPathMetaData | null) => void,
	setCursor: (crsr: CursorType) => void,
	{
		binder,
		setBinder,
		point,
		setPoint,
		lengthTemp,
		setLengthTemp,
		mode,
		wallEndConstruc,
		setWallEndConstruc,
		setWallDrawPoint,
	}: CanvasState,
	wallMetaData: WallMetaData[]
) => {
	let wallDrawPoint = setWallDrawPoint(snap);
	if (!$("#line_construc").length) {
		const wallNode = editor.nearWallNode(snap, wallMetaData, 20);
		if (wallNode) {
			point = setPoint({ x: wallNode.x, y: wallNode.y });
			if (wallNode.bestWall == wallMetaData.length - 1) {
				setCursor("validation");
			} else {
				setCursor("grab");
			}
		} else {
			setCursor("crosshair");
		}
	}

	const starter = Math.abs(point.x - snap.x) + Math.abs(point.y - snap.y);
	if (starter > constants.GRID_SIZE) {
		if (!$("#line_construc").length) {
			let ws = 20;
			if (mode == Mode.Partition) ws = 10;
			const lineconstruc = qSVG.create("boxbind", "line", {
				id: "line_construc",
				x1: point.x,
				y1: point.y,
				x2: wallDrawPoint.x,
				y2: wallDrawPoint.y,
				"stroke-width": ws,
				"stroke-linecap": "butt",
				"stroke-opacity": 0.7,
				stroke: "#9fb2e2",
			});

			const svgadd = qSVG.create("boxbind", "line", {
				// ORANGE TEMP LINE FOR ANGLE 0 90 45 -+
				id: "linetemp",
				x1: point.x,
				y1: point.y,
				x2: wallDrawPoint.x,
				y2: wallDrawPoint.y,
				stroke: "transparent",
				"stroke-width": 0.5,
				"stroke-opacity": "0.9",
			});
		} else {
			// THE LINES AND BINDER ARE CREATED

			$("#linetemp").attr({
				x2: wallDrawPoint.x,
				y2: wallDrawPoint.y,
			});

			const helpConstrucEnd = createWallGuideLine(
				snap,
				wallMetaData,
				10,
				setHelperLineSvgData
			);
			if (helpConstrucEnd) {
				// x = setX(helpConstrucEnd.x);
				// y = setY(helpConstrucEnd.y);
				wallDrawPoint = setWallDrawPoint({
					x: helpConstrucEnd.x,
					y: helpConstrucEnd.y,
				});
			}

			const nearestWall = editor.nearWall(snap, wallMetaData, 12) as Point2D;
			if (nearestWall) {
				wallEndConstruc = setWallEndConstruc(true);
				// TO SNAP SEGMENT TO FINALIZE X2Y2
				wallDrawPoint = setWallDrawPoint({
					x: nearestWall.x,
					y: nearestWall.y,
				});
				// x = setX(wallEndConstruc.x);
				// y = setY(wallEndConstruc.y);
				setCursor("grab");
			} else {
				setCursor("crosshair");
			}

			// nearNode helped to attach the end of the construc line
			const wallNode = editor.nearWallNode(snap, wallMetaData, 20);
			if (wallNode) {
				if (binder == null) {
					binder = setBinder(
						qSVG.create("boxbind", "circle", {
							id: "circlebinder",
							class: "circle_css_2",
							cx: wallNode.x,
							cy: wallNode.y,
							r: constants.CIRCLE_BINDER_RADIUS / 1.5,
						})
					);
				}
				$("#line_construc").attr({
					x2: wallNode.x,
					y2: wallNode.y,
				});
				wallDrawPoint = setWallDrawPoint({ x: wallNode.x, y: wallNode.y });
				// x = setX(wallNode.x);
				// y = setY(wallNode.y);
				// x = wallNode.x;
				// y = wallNode.y;
				wallEndConstruc = setWallEndConstruc(true);
				setHelperLineSvgData(null);
				if (
					wallNode.bestWall == wallMetaData.length - 1 &&
					continuousWallMode
				) {
					setCursor("validation");
				} else {
					setCursor("grab");
				}
			} else {
				if (binder) {
					binder.remove();
					binder = setBinder(null);
				}
				if (wallEndConstruc === false) setCursor("crosshair");
			}
			// LINETEMP AND LITLLE SNAPPING FOR HELP TO CONSTRUC ANGLE 0 90 45 *****************************************
			var fltt = angleBetweenPoints(
				point.x,
				point.y,
				wallDrawPoint.x,
				wallDrawPoint.y
			);
			var flt = Math.abs(fltt.deg);
			var coeff = fltt.deg / flt; // -45 -> -1     45 -> 1
			var phi = point.y - coeff * point.x;
			var Xdiag = (wallDrawPoint.y - phi) / coeff;
			if (binder == null) {
				// HELP FOR H LINE
				var found = false;
				let x = wallDrawPoint.x;
				let y = wallDrawPoint.y;
				if (flt < 15 && Math.abs(point.y - wallDrawPoint.y) < 25) {
					y = point.y;
					found = true;
				}
				// HELP FOR V LINE
				if (flt > 75 && Math.abs(point.x - wallDrawPoint.x) < 25) {
					x = point.x;
					found = true;
				}
				// HELP FOR DIAG LINE
				if (flt < 55 && flt > 35 && Math.abs(Xdiag - wallDrawPoint.x) < 20) {
					x = Xdiag;
					// x = Xdiag;
					found = true;
				}

				wallDrawPoint = setWallDrawPoint({ x, y });
				if (found) {
					$("#line_construc").attr({ "stroke-opacity": 1 });
				} else $("#line_construc").attr({ "stroke-opacity": 0.7 });
			}
			$("#line_construc").attr({
				x2: wallDrawPoint.x,
				y2: wallDrawPoint.y,
			});

			// SHOW WALL SIZE -------------------------------------------------------------------------
			const startText = qSVG.middle(
				point.x,
				point.y,
				wallDrawPoint.x,
				wallDrawPoint.y
			);
			const angleText = angleBetweenPoints(
				point.x,
				point.y,
				wallDrawPoint.x,
				wallDrawPoint.y
			);
			const valueText = (
				qSVG.measure(
					{
						x: point.x,
						y: point.y,
					},
					{
						x: wallDrawPoint.x,
						y: wallDrawPoint.y,
					}
				) / 60
			).toFixed(2);
			//if (typeof lengthTemp == "undefined") {
			if (!lengthTemp) {
				const lt = document.createElementNS(
					"http://www.w3.org/2000/svg",
					"text"
				);
				lt.setAttributeNS(null, "x", startText.x.toString());
				lt.setAttributeNS(null, "y", (startText.y - 15).toString());
				lt.setAttributeNS(null, "text-anchor", "middle");
				lt.setAttributeNS(null, "stroke", "none");
				lt.setAttributeNS(null, "stroke-width", "0.6px");
				lt.setAttributeNS(null, "fill", "#777777");
				lt.textContent = valueText + "m";
				lengthTemp = setLengthTemp(lt);
				$("#boxbind").append(lengthTemp);
			}
			if (lengthTemp && +valueText > 0.1) {
				lengthTemp.setAttributeNS(null, "x", startText.x);
				lengthTemp.setAttributeNS(null, "y", startText.y - 15);
				lengthTemp.setAttribute(
					"transform",
					"rotate(" +
						angleText.deg +
						" " +
						startText.x +
						"," +
						startText.y +
						")"
				);
				lengthTemp.textContent = valueText + " m";
			}
			if (lengthTemp && +valueText < 0.1) {
				lengthTemp.textContent = "";
			}
		}
	}
};

export const onActionFalse = (
	{ binder, setBinder, setPoint }: CanvasState,
	setCursor: (crsr: CursorType) => void,
	snap: Point2D,
	setHelperLineSvgData: (l: SvgPathMetaData | null) => void,
	wallMetaData: WallMetaData[]
) => {
	setCursor("grab");
	let point: Point2D = { x: snap.x, y: snap.y };
	const helpConstruc = createWallGuideLine(
		snap,
		wallMetaData,
		25,
		setHelperLineSvgData
	);
	if (helpConstruc) {
		if (helpConstruc.distance < 10) {
			point = setPoint({ x: helpConstruc.x, y: helpConstruc.y });
		} else {
			setCursor("crosshair");
		}
	}
	const wallNode = editor.nearWallNode(snap, wallMetaData, 20);
	if (wallNode) {
		point = setPoint({ x: wallNode.x, y: wallNode.y });
		setCursor("grab");
		if (binder == null) {
			binder = setBinder(
				qSVG.create("boxbind", "circle", {
					id: "circlebinder",
					class: "circle_css_2",
					cx: wallNode.x,
					cy: wallNode.y,
					r: constants.CIRCLE_BINDER_RADIUS / 1.5,
				})
			);
		}
		setHelperLineSvgData(null);
	} else {
		if (!helpConstruc) setCursor("crosshair");
		if (binder) {
			if (binder.graph) binder.graph.remove();
			else binder.remove();
			binder = setBinder(null);
		}
	}
};
