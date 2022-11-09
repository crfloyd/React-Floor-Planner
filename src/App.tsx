import './App.scss';

import { useContext, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { constants } from './constants';
import DoorWindowTools from './components/DoorWindowTools';
import FloorPlannerCanvas from './components/FloorPlannerCanvas/FloorPlannerCanvas';
import ObjectTools from './components/ObjectTools';
import WallTools from './components/WallTools';
import { FloorPlanContext } from './context/FloorPlanContext';
import { CanvasState } from './engine';
import { useWalls } from './hooks';
import { useCameraTools } from './hooks/useCameraTools';
import { useHistory } from './hooks/useHistory';
import { useKeybindings } from './hooks/useKeybindings';
import {
	CursorType,
	DeviceMetaData,
	LayerSettings,
	Mode,
	ObjectMetaData,
	RoomDisplayData,
	RoomMetaData,
	WallMetaData
} from './models/models';
import { setAction, setDoorType, setMode, setObjectType } from './store/floorPlanSlice';
import { RootState } from './store/store';

const canvasState = new CanvasState();

function App() {
	const dispatch = useDispatch();
	const action = useSelector((state: RootState) => state.floorPlan.action);
	const mode = useSelector((state: RootState) => state.floorPlan.mode);
	const [cursor, setCursor] = useState<CursorType>('default');
	const [layerSettings, setLayerSettings] = useState<LayerSettings>({
		showSurfaces: true,
		showDevices: true,
		showMeasurements: true,
		showTexture: true
	});

	const [selectedObject, setSelectedObject] = useState({
		minWidth: 0,
		maxWidth: 0,
		width: 0,
		minHeight: 0,
		maxHeight: 0,
		height: 0,
		rotation: 0,
		showStepCounter: false,
		stepCount: 0
	});

	const [selectedOpening, setSelectedOpening] = useState({
		id: '',
		minWidth: 0,
		maxWidth: 0,
		width: 0
	});

	const [enableUndo, setEnableUndo] = useState(false);
	const [enableRedo, setEnableRedo] = useState(false);

	const [showMainPanel, setShowMainPanel] = useState(true);
	const [showConfigureDoorWindowPanel, setShowConfigureDoorWindowPanel] = useState(false);
	const [showObjectTools, setShowObjectTools] = useState(false);
	const [showRoomTools, setShowRoomTools] = useState(false);
	const [selectedRoomData, setSelectedRoomData] = useState<RoomDisplayData>({
		roomId: '',
		size: '',
		roomIndex: 0,
		surface: '',
		showSurface: true,
		background: '',
		name: '',
		action: ''
	});
	const [showSubMenu, setShowSubMenu] = useState(false);
	const [continuousWallMode, setContinuousWallMode] = useState(true);
	const [roomColor, setRoomColor] = useState('gradientNeutral');
	const [selectedRoomColor, setSelectedRoomColor] = useState<string | undefined>();
	const [boxInfoText, setBoxInfoText] = useState('');
	const [showDoorList, setShowDoorList] = useState(false);
	const [showWindowList, setShowWindowList] = useState(false);
	const [showEnergyList, setShowEnergyList] = useState(false);
	const [showLayerList, setShowLayerList] = useState(false);
	const [canvasDimensions, setCanvasDimenions] = useState({
		width: 0,
		height: 0
	});
	const [roomMetaData, setRoomMetaData] = useState<RoomMetaData[]>([]);
	const [openingWidth, setOpeningWidth] = useState<number | null>(null);
	const [openingIdBeingEdited, setOpeningIdBeingEdited] = useState<string | undefined>();

	const [selectedWall, setSelectedWall] = useState<WallMetaData | null>(null);

	const { save, init, undo, redo, historyIndex } = useHistory();

	const { viewbox, scaleValue, zoomIn, zoomOut, dragCamera, moveCamera, resetCamera } =
		useCameraTools(canvasDimensions);
	const [planToRecover, setPlanToRecover] = useState(false);
	const [deviceBeingMoved, setDeviceBeingMoved] = useState<DeviceMetaData>();

	const { wallMetaData, objectMetaData, setWallMetaData, setObjectMetaData } =
		useContext(FloorPlanContext);

	const { splitWall, deleteWall, updateWallThickness, makeWallInvisible, makeWallVisible } =
		useWalls();

	const modalRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (localStorage.getItem('history')) {
			setPlanToRecover(true);
		}

		const modals = document.querySelectorAll('[data-modal]');

		modals.forEach(function (trigger) {
			const a = trigger as HTMLAnchorElement;
			const modal = document.getElementById(a.dataset.modal ?? '');
			modal?.classList.add('open');
			const exits = modal?.querySelectorAll('.modal-exit');
			exits?.forEach(function (exit) {
				exit.addEventListener('click', function (event) {
					event.preventDefault();
					modal?.classList.remove('open');
				});
			});
		});
	}, []);

	const dismissModal = () => {
		modalRef.current?.classList.remove('open');
	};

	const onRoomColorClicked = (val: string) => {
		setSelectedRoomData({ ...selectedRoomData, background: val });
		const backgroundFill = 'url(#' + val + ')';
		setSelectedRoomColor(backgroundFill);
	};

	const onApplySurfaceClicked = () => {
		setShowRoomTools(false);
		setShowMainPanel(true);

		// const roomMetaCopy = [...roomMetaData];
		// const id = selectedRoomData.roomIndex;

		// const roomMeta = roomMetaCopy[id];
		// if (!roomMeta) return;

		// roomMeta.color = selectedRoomData.background;
		// roomMeta.name = selectedRoomData.name;
		// roomMeta.surface = selectedRoomData.surface;
		// roomMeta.showSurface = selectedRoomData.showSurface;

		// setRoomMetaData(roomMetaCopy);

		setSelectedRoomColor(undefined);

		setBoxInfoText('Room modified');
		applyMode(Mode.Select);
	};

	const onUndoClicked = () => {
		if (historyIndex - 1 > 0) {
			const { objects, walls, rooms } = undo(viewbox);
			apply(objects, walls, rooms);
			setEnableRedo(true);
		}
		if (historyIndex == 1) {
			setEnableUndo(false);
		}
	};

	const onRedoClicked = () => {
		if (historyIndex < history.length) {
			const { objects, walls, rooms } = redo(viewbox);
			apply(objects, walls, rooms);
			setEnableUndo(true);
			if (historyIndex == history.length) {
				setEnableRedo(false);
			}
		}
	};

	const onDoorTypeClicked = (type: 'simple' | 'opening' | 'double') => {
		setCursor('crosshair');
		setBoxInfoText('Add a door');
		dispatch(setDoorType(type));
		applyMode(Mode.Opening);
	};

	const onWindowTypeClicked = (type: string) => {
		setCursor('crosshair');
		setBoxInfoText('Add a window');
		setShowDoorList(false);
		setShowWindowList(false);
		dispatch(setDoorType('fix'));
		applyMode(Mode.Opening);
	};

	const onObjectTypeClicked = (type: string) => {
		setShowSubMenu(false);
		setShowDoorList(false);
		setCursor('move');
		dispatch(setObjectType(type));
		setBoxInfoText('Add an object');
	};

	const applyMode = (mode: Mode) => {
		save(wallMetaData, objectMetaData, roomMetaData);
		setShowSubMenu(false);
		dispatch(setMode(mode));
	};

	const initHistory = (type: string) => {
		const { objects, walls, rooms } = init(type, viewbox);
		apply(objects, walls, rooms);
	};

	const apply = (
		objectData: ObjectMetaData[],
		wallData: WallMetaData[],
		roomData: RoomMetaData[]
	) => {
		setObjectMetaData(objectData);

		setWallMetaData(wallData);
		setRoomMetaData(roomData);
		// updateMeasurementText(wallMetaData);
	};

	// Wall Tools
	const onWallWidthChanged = (value: number) => {
		if (!selectedWall) {
			throw new Error('No selectedWall was set!');
		}
		updateWallThickness(selectedWall, value);
		// if (objectsUpdated) {
		// 	setObjectMetaData([...objectMetaData]);
		// }
	};

	const onWallSplitClicked = () => {
		if (!selectedWall) {
			throw new Error('No selectedWall was set!');
		}
		splitWall(selectedWall);
		save(wallMetaData, objectMetaData, roomMetaData);
		dispatch(setMode(Mode.Select));
	};

	const onConvertWallToSeparationClicked = () => {
		if (!selectedWall) {
			throw new Error('No selectedWall was set!');
		}
		if (!makeWallInvisible(selectedWall)) {
			setBoxInfoText('Walls containing doors or windows cannot be separated!');
			return;
		}
		save(wallMetaData, objectMetaData, roomMetaData);
	};

	const onConvertSeparationToWallClicked = () => {
		if (!selectedWall) {
			throw new Error('No selectedWall was set!');
		}
		makeWallVisible(selectedWall);
		dispatch(setMode(Mode.Select));
	};

	const onWallTrashClicked = () => {
		if (!selectedWall) {
			throw new Error('No selectedWall was set!');
		}
		deleteWall(selectedWall);
		setSelectedWall(null);
		// updateMeasurementText(wallMetaData);
		dispatch(setMode(Mode.Select));
		setShowMainPanel(true);
	};

	// Object Tools
	const onObjectWidthChanged = (val: number) => {
		// const objTarget = canvasState.binder.obj;
		// objTarget.size = (val / 100) * constants.METER_SIZE;
		// objTarget.update();
		// canvasState.binder.size = (val / 100) * constants.METER_SIZE;
		// canvasState.binder.update();
	};

	const onConfigureObjectBackClicked = () => {
		// applyMode(Mode.Select);
		// setBoxInfoText('Mode selection');
		// setShowObjectTools(false);
		// setShowMainPanel(true);
		// canvasState.setBinder(null);
	};

	const onObjectHeightChanged = (val: number) => {
		// const objTarget = canvasState.binder.obj;
		// objTarget.thick = (val / 100) * constants.METER_SIZE;
		// objTarget.update();
		// canvasState.binder.thick = (val / 100) * constants.METER_SIZE;
		// canvasState.binder.update();
	};

	const onObjectNumStepsChanged = (val: number) => {
		// canvasState.binder.obj.value = val;
		// canvasState.binder.obj.update();
	};

	const onObjectRotationChanged = (val: number) => {
		// const objTarget = canvasState.binder.obj;
		// objTarget.angle = val;
		// objTarget.update();
		// canvasState.binder.angle = val;
		// canvasState.binder.update();
	};

	const onObjectTrashClicked = () => {
		setBoxInfoText('Object removed');
		setShowObjectTools(false);
		setShowMainPanel(true);
		applyMode(Mode.Select);

		setObjectMetaData([...objectMetaData.filter((o) => o.id !== selectedOpening.id)]);
	};

	// Door/Window Tools
	const onFlipOpeningClicked = () => {
		const target = objectMetaData.find((o) => o.id === selectedOpening.id);
		if (!target) {
			console.warn('No opening found with the id:', selectedOpening.id);
			return;
		}
		const hingeStatus = target.hinge; // normal - reverse
		target.hinge = hingeStatus == 'normal' ? 'reverse' : 'normal';
		setObjectMetaData([...objectMetaData]);
	};

	const onOpeningWidthChanged = (val: number) => {
		setOpeningWidth(val);
		// const objTarget = objectMetaData.find((o) => o.id === canvasState.binder.targetId);
		// if (!objTarget) return;
		// const wallBind = getWallsOnPoint({ x: objTarget.x, y: objTarget.y }, wallMetaData);
		// const wallUnderOpening = wallBind[wallBind.length - 1];
		// const limits = computeLimit(wallUnderOpening.equations.base, val, objTarget);
		// if (
		// 	wallUnderOpening.pointInsideWall(limits[0], false) &&
		// 	wallUnderOpening.pointInsideWall(limits[1], false)
		// ) {
		// 	objTarget.size = val;
		// 	objTarget.limit = limits;
		// 	objTarget.update();
		// 	canvasState.binder.size = val;
		// 	canvasState.binder.limit = limits;
		// 	canvasState.binder.update();
		// 	setObjectMetaData([...objectMetaData]);
		// }
		// // wallUnderOpening.inWallRib(objectMeta);
		// setInWallMeasurementText(wallUnderOpening, objectMetaData);
	};

	const onWallModeClicked = () => {
		setCursor('crosshair');
		setBoxInfoText('Wall creation');
		applyMode(Mode.Line);
	};

	const enterSelectMode = () => {
		setBoxInfoText('Selection mode');
		// canvasState.setBinder(null);
		setCursor('default');
		applyMode(Mode.Select);
	};

	const cancelWallCreation = () => {
		if ((mode == Mode.Line || mode == Mode.Partition) && action) {
			dispatch(setAction(false));
		}
	};

	useKeybindings({
		keyDown: new Map([
			['s', enterSelectMode],
			['w', onWallModeClicked],
			['r', () => applyMode(Mode.Room)]
		])
	});

	const updateRoomDisplayData = (roomData: RoomDisplayData) => {
		setSelectedRoomData(roomData);
		if (roomData.background) {
			setRoomColor(roomData.background);
		}
		setShowMainPanel(false);
		setShowRoomTools(true);
		setCursor('default');
		setBoxInfoText('Configure the room');
	};

	const showOpeningTools = (opening: ObjectMetaData) => {
		const min = opening.params.resizeLimit.width.min;
		const max = opening.params.resizeLimit.width.max;
		setSelectedOpening({
			id: opening.id,
			minWidth: min,
			maxWidth: max,
			width: opening.size
		});
		setOpeningIdBeingEdited(opening.id);
		setCursor('default');
		setBoxInfoText('Configure the door/window');
		setShowMainPanel(false);
		setShowConfigureDoorWindowPanel(true);
	};

	const updateObjectTools = () => {
		setShowMainPanel(false);
		setShowObjectTools(true);
		// const objTarget = canvasState.binder.obj;
		// const limit = objTarget.params.resizeLimit;
		// setSelectedObject({
		// 	minWidth: +limit.width.min,
		// 	maxWidth: +limit.width.max,
		// 	width: +objTarget.width * 100,
		// 	minHeight: +limit.height.min,
		// 	maxHeight: +limit.height.max,
		// 	height: +objTarget.height * 100,
		// 	rotation: +objTarget.angle,
		// 	showStepCounter: objTarget.class === 'stair',
		// 	stepCount: +objTarget.value
		// });
		setBoxInfoText('Modify the object');
	};

	const handleWallCliked = (wall: WallMetaData) => {
		const isSeparation = wall.type == 'separate';
		setBoxInfoText(`Modify the ${isSeparation ? 'separation' : 'wall'}`);
		setShowMainPanel(false);
		setSelectedWall(wall);
	};

	return (
		<>
			<header>React Floor Planner Ver.0.1</header>

			<FloorPlannerCanvas
				layerSettings={layerSettings}
				canvasState={canvasState}
				continuousWallMode={continuousWallMode}
				startModifyingOpening={showOpeningTools}
				wallClicked={handleWallCliked}
				roomClicked={updateRoomDisplayData}
				cursor={cursor}
				setCanvasDimensions={setCanvasDimenions}
				viewbox={viewbox}
				// roomMetaData={roomMetaData}
				// setRoomMetaData={setRoomMetaData}
				selectedRoomData={selectedRoomData}
				onMouseMove={() => setShowSubMenu(false)}
				openingWidth={openingWidth}
				openingIdBeingEdited={openingIdBeingEdited}
				selectedRoomColor={selectedRoomColor}
				deviceBeingMoved={deviceBeingMoved}
				setDeviceBeingMoved={setDeviceBeingMoved}
				zoomCameraIn={zoomIn}
				zoomCameraOut={zoomOut}
				dragCamera={dragCamera}
				defaultRoomColor={'url(#gradientWhite)'}
			/>

			<div id="areaValue"></div>

			{selectedWall && (
				<WallTools
					wall={selectedWall}
					onWallWidthChanged={onWallWidthChanged}
					onSeparationClicked={onConvertWallToSeparationClicked}
					onSplitClicked={onWallSplitClicked}
					onWallTrashClicked={onWallTrashClicked}
					onTransformToWallClicked={onConvertSeparationToWallClicked}
					onGoBackClicked={() => {
						applyMode(Mode.Select);
						setBoxInfoText('Select Mode');
						setShowMainPanel(true);
						setSelectedWall(null);
					}}
				/>
			)}

			{showObjectTools && (
				<ObjectTools
					data={selectedObject}
					onHeightChanged={onObjectHeightChanged}
					onWidthChanged={onObjectWidthChanged}
					onNumStepsChanged={onObjectNumStepsChanged}
					onRotationChanged={onObjectRotationChanged}
					onBackClicked={onConfigureObjectBackClicked}
					onTrashClicked={onObjectTrashClicked}
				/>
			)}

			{showConfigureDoorWindowPanel && (
				<div id="objTools" className="leftBox">
					<DoorWindowTools
						data={selectedOpening}
						onFlipOpeningClicked={() => onFlipOpeningClicked()}
						onOpeningWidthChanged={(val: number) => onOpeningWidthChanged(val)}
						onTrashClicked={() => onObjectTrashClicked()}
						onBackClicked={() => {
							applyMode(Mode.Select);
							setBoxInfoText('Mode selection');
							setShowObjectTools(false);
							setShowMainPanel(true);
							setShowConfigureDoorWindowPanel(false);
							setOpeningIdBeingEdited(undefined);
							// updateMeasurementText(wallMetaData);
						}}
					/>
				</div>
			)}

			{showRoomTools && (
				<div id="roomTools" className="leftBox">
					<span style={{ color: '#08d' }}>React Floor Planner</span> estimated a surface of :<br />
					<b>
						<span className="size">{`${selectedRoomData.size} m²`}</span>
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
							value={selectedRoomData.surface}
							onChange={(e) => {
								setSelectedRoomData((prev) => ({
									...prev,
									surface: e.target.value
								}));
							}}
						/>
						<span className="input-group-addon" id="basic-addon2">
							m²
						</span>
					</div>
					<br />
					<input
						type="hidden"
						id="roomName"
						value={selectedRoomData.name != '' ? selectedRoomData.name : ''}
					/>
					Select Room Type :<br />
					<div className="btn-group">
						<button
							className="btn dropdown-toggle btn-default"
							data-toggle="dropdown"
							id="roomLabel">
							{selectedRoomData.name != '' ? selectedRoomData.name : 'None '}
							{/* <span className="caret">{roomType}</span> */}
						</button>
						<ul className="dropdown-menu">
							<li>
								<button
									className="dropdown-item"
									onClick={() => {
										setSelectedRoomData({ ...selectedRoomData, name: 'None' });
									}}>
									None
								</button>
							</li>
							<li>
								<button
									className="dropdown-item"
									onClick={() => {
										setSelectedRoomData({
											...selectedRoomData,
											name: 'Living Room'
										});
									}}>
									Living Room
								</button>
							</li>
							<li>
								<button
									className="dropdown-item"
									onClick={() => {
										setSelectedRoomData({
											...selectedRoomData,
											name: 'Kitchen'
										});
									}}>
									Kitchen
								</button>
							</li>
							<li>
								<button
									className="dropdown-item"
									onClick={(e) => {
										setSelectedRoomData({
											...selectedRoomData,
											name: 'Bathroom'
										});
									}}>
									Bathroom
								</button>
							</li>
							<li>
								<button
									className="dropdown-item"
									onClick={() => {
										setSelectedRoomData({
											...selectedRoomData,
											name: 'Bathroom 2'
										});
									}}>
									Bathroom 2
								</button>
							</li>
							<li>
								<button
									className="dropdown-item"
									onClick={() => {
										setSelectedRoomData({
											...selectedRoomData,
											name: 'Bedroom 1'
										});
									}}>
									Bedroom 1
								</button>
							</li>
							<li>
								<button
									className="dropdown-item"
									onClick={() => {
										setSelectedRoomData({
											...selectedRoomData,
											name: 'Bedroom 2'
										});
									}}>
									Bedroom 2
								</button>
							</li>
							<li>
								<button
									className="dropdown-item"
									onClick={() => {
										setSelectedRoomData({
											...selectedRoomData,
											name: 'Bedroom 3'
										});
									}}>
									Bedroom 3
								</button>
							</li>
							<li>
								<button
									className="dropdown-item"
									onClick={() => {
										setSelectedRoomData({
											...selectedRoomData,
											name: 'Bedroom 4'
										});
									}}>
									Bedroom 4
								</button>
							</li>
							<li>
								<button
									className="dropdown-item"
									onClick={() => {
										setSelectedRoomData({
											...selectedRoomData,
											name: 'Bedroom 5'
										});
									}}>
									Bedroom 5
								</button>
							</li>
							<li>
								<button
									className="dropdown-item"
									onClick={() => {
										setSelectedRoomData({
											...selectedRoomData,
											name: 'Closet'
										});
									}}>
									Closet
								</button>
							</li>
							<li>
								<button
									className="dropdown-item"
									onClick={() => {
										setSelectedRoomData({
											...selectedRoomData,
											name: 'Office'
										});
									}}>
									Office
								</button>
							</li>
							<li>
								<button
									className="dropdown-item"
									onClick={() => {
										setSelectedRoomData({
											...selectedRoomData,
											name: 'Hall'
										});
									}}>
									Hall
								</button>
							</li>
							<li>
								<button
									className="dropdown-item"
									onClick={() => {
										setSelectedRoomData({
											...selectedRoomData,
											name: 'Foyer'
										});
									}}>
									Foyer
								</button>
							</li>
							<li className="divider"></li>
							<li>
								<button
									className="dropdown-item"
									onClick={() => {
										setSelectedRoomData({
											...selectedRoomData,
											name: 'Balcony'
										});
									}}>
									Balcony
								</button>
							</li>
							<li>
								<button
									className="dropdown-item"
									onClick={() => {
										setSelectedRoomData({
											...selectedRoomData,
											name: 'Terrace'
										});
									}}>
									Terrace
								</button>
							</li>
							<li>
								<button
									className="dropdown-item"
									onClick={() => {
										setSelectedRoomData({
											...selectedRoomData,
											name: 'Garage'
										});
									}}>
									Garage
								</button>
							</li>
							<li>
								<button
									className="dropdown-item"
									onClick={() => {
										setSelectedRoomData({
											...selectedRoomData,
											name: 'Clearance'
										});
									}}>
									clearance
								</button>
							</li>
						</ul>
					</div>
					<br />
					<br />
					{/* Meter :
					<div className="funkyradio">
						<div className="funkyradio-success">
							<input
								type="checkbox"
								name="roomShow"
								value="showSurface"
								id="seeArea"
								checked={selectedRoomData.showSurface}
								onChange={() =>
									setSelectedRoomData({
										...selectedRoomData,
										showSurface: !selectedRoomData.showSurface,
									})
								}
							/>
							<label htmlFor="seeArea">Show the surface</label>
						</div>
					</div>
					<div className="funkyradio">
						<div className="funkyradio-success">
							<input
								type="radio"
								name="roomAction"
								id="addAction"
								value="add"
								checked={selectedRoomData.action == "add" || addSurface}
								onChange={() => setAddSurface(!addSurface)}
							/>
							<label htmlFor="addAction">Add the surface</label>
						</div>
						<div className="funkyradio-warning">
							<input
								type="radio"
								name="roomAction"
								id="passAction"
								value="pass"
								checked={selectedRoomData.action == "pass" || ignoreSurface}
								onChange={() => setIgnoreSurface(!ignoreSurface)}
							/>
							<label htmlFor="passAction">Ignore the surface</label>
						</div>
					</div> */}
					<hr />
					<p>Colors</p>
					<div
						className="roomColor"
						data-type="roomGradientRed"
						style={{
							background: `linear-gradient(30deg, ${constants.COLOR_ROOM_RED}, ${constants.COLOR_ROOM_RED})`
						}}
						onClick={() => {
							onRoomColorClicked('roomGradientRed');
						}}></div>
					<div
						className="roomColor"
						data-type="roomGradientGreen"
						style={{
							background: `linear-gradient(30deg, ${constants.COLOR_ROOM_GREEN}, ${constants.COLOR_ROOM_GREEN})`
						}}
						onClick={() => {
							onRoomColorClicked('roomGradientGreen');
						}}></div>
					<div
						className="roomColor"
						data-type="roomGradientOrange"
						style={{
							background: `linear-gradient(30deg, ${constants.COLOR_ROOM_ORANGE}, ${constants.COLOR_ROOM_ORANGE})`
						}}
						onClick={() => {
							onRoomColorClicked('roomGradientOrange');
						}}></div>
					<div
						className="roomColor"
						data-type="roomGradientBlue"
						style={{
							background: `linear-gradient(30deg, ${constants.COLOR_ROOM_BLUE}, ${constants.COLOR_ROOM_BLUE})`
						}}
						onClick={() => {
							onRoomColorClicked('roomGradientBlue');
						}}></div>
					<div
						className="roomColor"
						data-type="roomGradientGray"
						style={{
							background: `linear-gradient(30deg, ${constants.COLOR_ROOM_GRAY}, ${constants.COLOR_ROOM_GRAY})`
						}}
						onClick={() => {
							onRoomColorClicked('roomGradientGray');
						}}></div>
					{/* <div
						className="roomColor"
						data-type="roomGradientBlack"
						style={{
							background: `linear-gradient(30deg, ${constants.COLOR_ROOM_BLACK}, ${constants.COLOR_ROOM_BLACK})`,
						}}
						onClick={() => {
							setRoomColor("roomGradientBlack");
							onRoomColorClicked("roomGradientBlack", binder);
						}}
					></div> */}
					<div
						className="roomColor"
						data-type="gradientYellow"
						style={{ background: 'linear-gradient(30deg,#e4c06e, #ffb000)' }}
						onClick={() => {
							onRoomColorClicked('gradientYellow');
						}}></div>
					<div
						className="roomColor"
						data-type="gradientGreen"
						style={{ background: 'linear-gradient(30deg,#88cc6c, #60c437)' }}
						onClick={() => {
							onRoomColorClicked('gradientGreen');
						}}></div>
					<div
						className="roomColor"
						data-type="gradientSky"
						style={{ background: 'linear-gradient(30deg,#77e1f4, #00d9ff)' }}
						onClick={() => {
							onRoomColorClicked('gradientSky');
						}}></div>
					<div
						className="roomColor"
						data-type="gradientBlue"
						style={{ background: 'linear-gradient(30deg,#4f72a6, #284d7e)' }}
						onClick={() => {
							onRoomColorClicked('gradientBlue');
						}}></div>
					<div
						className="roomColor"
						data-type="gradientGrey"
						style={{ background: 'linear-gradient(30deg,#666666, #aaaaaa)' }}
						onClick={() => {
							onRoomColorClicked('gradientGrey');
						}}></div>
					<div
						className="roomColor"
						data-type="gradientWhite"
						style={{ background: 'linear-gradient(30deg,#fafafa, #eaeaea)' }}
						onClick={() => {
							onRoomColorClicked('gradientWhite');
						}}></div>
					<div
						className="roomColor"
						data-type="gradientOrange"
						style={{ background: 'linear-gradient(30deg, #f9ad67, #f97f00)' }}
						onClick={() => {
							onRoomColorClicked('gradientOrange');
						}}></div>
					<div
						className="roomColor"
						data-type="gradientPurple"
						style={{ background: 'linear-gradient(30deg,#a784d9, #8951da)' }}
						onClick={() => {
							onRoomColorClicked('gradientPurple');
						}}></div>
					<div
						className="roomColor"
						data-type="gradientPink"
						style={{ background: 'linear-gradient(30deg,#df67bd, #e22aae)' }}
						onClick={() => {
							onRoomColorClicked('gradientPink');
						}}></div>
					<div
						className="roomColor"
						data-type="gradientBlack"
						style={{ background: 'linear-gradient(30deg,#3c3b3b, #000000)' }}
						onClick={() => {
							onRoomColorClicked('gradientBlack');
						}}></div>
					<div
						className="roomColor"
						data-type="gradientNeutral"
						style={{ background: 'linear-gradient(30deg,#e2c695, #c69d56)' }}
						onClick={() => {
							onRoomColorClicked('gradientNeutral');
						}}></div>
					<br />
					<br />
					<div data-type="#ff008a" style={{ clear: 'both' }}></div>
					<br />
					<br />
					<input type="hidden" id="roomBackground" value={selectedRoomData.background} />
					<input type="hidden" id="roomIndex" value={selectedRoomData.roomIndex} />
					<button
						type="button"
						className="btn btn-primary"
						id="applySurface"
						onClick={() => {
							onApplySurfaceClicked();
						}}>
						Apply
					</button>
					<button
						type="button"
						className="btn btn-danger"
						id="resetRoomTools"
						onClick={() => {
							setShowRoomTools(false);
							setShowMainPanel(true);
							setBoxInfoText('Room modified');
							applyMode(Mode.Select);
							setSelectedRoomColor(undefined);
							// if (canvasState.binder && canvasState.binder.remove) {
							// 	canvasState.binder.remove();
							// }
							// onResetRoomToolsClicked(binder, setBinder);
						}}>
						Cancel
					</button>
					<br />
				</div>
			)}

			{showMainPanel && (
				<div
					id="panel"
					className="leftBox"
					onMouseMove={() => {
						cancelWallCreation();
					}}>
					<ul className="list-unstyled">
						<li>
							<button
								className={`btn ${enableUndo ? '' : 'disabled'} halfy`}
								id="undo"
								title="undo"
								onClick={() => {
									onUndoClicked();
								}}>
								<i className="fa fa-chevron-circle-left" aria-hidden="true"></i>
							</button>
							<button
								className={`btn ${enableRedo ? '' : 'disabled'} halfy pull-right`}
								id="redo"
								title="redo"
								onClick={() => {
									onRedoClicked();
								}}>
								<i className="fa fa-chevron-circle-right" aria-hidden="true"></i>
							</button>
						</li>
						<br />

						<li>
							<button
								className="btn btn-success fully "
								id="select_mode"
								style={{ boxShadow: '2px 2px 3px #ccc' }}
								onClick={() => {
									enterSelectMode();
								}}>
								<i className="fa fa-2x fa-mouse-pointer" aria-hidden="true"></i>
							</button>
						</li>
						<br />

						<li>
							<button
								className="btn btn-default fully "
								style={{
									marginBottom: '5px',
									outline: 'none',
									boxShadow: 'none !important'
								}}
								id="line_mode"
								data-toggle="tooltip"
								data-placement="right"
								title="Make walls"
								onMouseDown={() => onWallModeClicked()}>
								WALL
							</button>
							<button
								className="btn btn-default fully "
								style={{ marginBottom: '8px' }}
								id="partition_mode"
								data-toggle="tooltip"
								data-placement="right"
								title="Make partitions wall"
								onClick={() => {
									setCursor('crosshair');
									setBoxInfoText('Partition creation');
									applyMode(Mode.Partition);
								}}>
								PARTITION
							</button>
							<div className="funkyradio" style={{ fontSize: '1em' }}>
								<div className="funkyradio-success">
									<input
										type="checkbox"
										id="multi"
										checked={continuousWallMode}
										onChange={() => setContinuousWallMode((prev) => !prev)}
									/>
									<label htmlFor="multi">Continuous</label>
								</div>
							</div>
						</li>
						<br />

						<li>
							<button
								className="btn btn-default fully "
								id="room_mode"
								onClick={() => {
									setBoxInfoText('Configure rooms');
									setCursor('pointer');
									setShowRoomTools(true);
									applyMode(Mode.Room);
								}}>
								Configure Rooms
							</button>
						</li>
						<br />
						{showDoorList && !showSubMenu && (
							<div
								id="door_list"
								className="list-unstyled sub"
								style={{
									boxShadow: '2px 2px 3px #ccc',
									// background: "#fff",
									borderRadius: '0 5px 5px 0',
									padding: '10px',
									position: 'absolute',
									left: '200px',
									width: '150px'
								}}
								onMouseLeave={() => setShowDoorList(false)}>
								<button
									className="btn btn-default fully door"
									id="opening"
									onClick={() => {
										onDoorTypeClicked('opening');
									}}>
									Opening
								</button>
								<button
									className="btn btn-default fully door"
									id="simple"
									onClick={() => {
										onDoorTypeClicked('simple');
									}}>
									Simple
								</button>
								<button
									className="btn btn-default fully door"
									id="double"
									onClick={() => {
										onDoorTypeClicked('double');
									}}>
									Double
								</button>
								{/* <button
									className="btn btn-default fully door"
									id="pocket"
									onClick={() => {
										onDoorTypeClicked('pocket');
									}}>
									Pocket
								</button> */}
							</div>
						)}
						<li>
							<button
								className="btn btn-default fully "
								id="door_mode"
								onClick={() => {
									setShowSubMenu(false);
									setShowDoorList(!showDoorList);
									setShowWindowList(false);
								}}>
								DOOR
							</button>
						</li>

						{showWindowList && !showSubMenu && (
							<div
								id="window_list"
								className="list-unstyled sub"
								style={{
									boxShadow: '2px 2px 3px #ccc',
									// background: "#fff",
									borderRadius: '0 5px 5px 0',
									padding: '10px',
									position: 'absolute',
									left: '200px',
									width: '150px'
								}}
								onMouseLeave={() => setShowWindowList(false)}>
								<button
									className="btn btn-default fully window"
									id="fix"
									onClick={() => {
										onWindowTypeClicked('fix');
									}}>
									Fix
								</button>
								<button
									className="btn btn-default fully window"
									id="flap"
									onClick={() => {
										onWindowTypeClicked('flap');
									}}>
									Simple
								</button>
								<button
									className="btn btn-default fully window"
									id="twin"
									onClick={() => {
										onWindowTypeClicked('twin');
									}}>
									Double
								</button>
								{/* <button
									className="btn btn-default fully window"
									id="bay"
									onClick={() => {
										onWindowTypeClicked("bay");
									}}
								>
									Slide
								</button> */}
							</div>
						)}
						<li>
							<button
								className="btn btn-default fully "
								id="window_mode"
								onClick={() => {
									setShowSubMenu(false);
									setShowWindowList(!showWindowList);
									setShowDoorList(false);
									setShowEnergyList(false);
								}}>
								WINDOW
							</button>
						</li>
						<li>
							<button
								className="btn btn-default fully object"
								id="stair_mode"
								onClick={() => {
									onObjectTypeClicked('stair_mode');
									setCursor('move');
									setBoxInfoText('Add a staircase');
									applyMode(Mode.Object);
								}}>
								STAIR
							</button>
						</li>
						<br />
						{showEnergyList && !showSubMenu && (
							<div
								id="energy_list"
								className="list-unstyled sub"
								style={{
									boxShadow: '2px 2px 3px #ccc',
									// background: "#fff",
									borderRadius: '0 5px 5px 0',
									padding: '10px',
									position: 'absolute',
									left: '200px',
									bottom: '40px'
									// width: "400px",
								}}
								onMouseLeave={() => setShowEnergyList(false)}>
								<div
									style={{
										width: '150px',
										// float: "left",
										padding: '10px',
										display: 'flex',
										justifyContent: 'center'
									}}>
									{/* <p>Energy</p> */}
									<div
										style={{
											// float: "left",
											padding: '10px',
											margin: '5px',
											border: '1px solid #ddd',
											borderRadius: '5px'
										}}>
										{/* <p>Strong Current</p> */}
										<div style={{ width: '120px', padding: '2px' }}>
											<button
												className="btn btn-default fully object"
												id="switch"
												onClick={() => {
													onObjectTypeClicked('switch');
												}}>
												Switch
											</button>
											<button
												className="btn btn-default fully object"
												id="doubleSwitch"
												onClick={() => {
													onObjectTypeClicked('doubleSwitch');
												}}>
												Double switch
											</button>
											<button
												className="btn btn-default fully object"
												id="dimmer"
												onClick={() => {
													onObjectTypeClicked('dimmer');
												}}>
												Dimmer
											</button>
										</div>
										<div style={{ width: '120px', float: 'left', padding: '2px' }}>
											<button
												className="btn btn-default fully object"
												id="plug"
												onClick={() => {
													onObjectTypeClicked('plug');
												}}>
												Outlet
											</button>
											<button
												className="btn btn-default fully object"
												id="roofLight"
												onClick={() => {
													onObjectTypeClicked('roofLight');
												}}>
												Ceiling light
											</button>
											<button
												className="btn btn-default fully object"
												id="wallLight"
												onClick={() => {
													onObjectTypeClicked('wallLight');
												}}>
												Wall light
											</button>
										</div>
									</div>
								</div>
							</div>
						)}
						<li>
							<button
								className="btn btn-default fully "
								id="object_mode"
								onClick={() => {
									setShowSubMenu(false);
									setShowEnergyList(!showEnergyList);
									setShowDoorList(false);
									setShowWindowList(false);
								}}>
								DEVICES
							</button>
						</li>
						<br />

						<li>
							<button
								className="btn btn-default fully "
								id="layer_mode"
								onClick={() => {
									setShowSubMenu(false);
									setShowLayerList(!showLayerList);
								}}>
								Layers
							</button>
						</li>

						{showLayerList && !showSubMenu && (
							<div
								id="layer_list"
								className="list-unstyled sub"
								style={{
									boxShadow: '2px 2px 3px #ccc',
									// display: "none",
									background: '#fff',
									borderRadius: '0 5px 5px 0',
									padding: '10px',
									position: 'absolute',
									left: '200px',
									bottom: '100px',
									width: '200px'
								}}>
								<div className="funkyradio" style={{ fontSize: '0.8em' }}>
									<div className="funkyradio-info">
										<input
											type="checkbox"
											id="showRib"
											checked={layerSettings.showMeasurements}
											onChange={() => {
												const nextVal = !layerSettings.showMeasurements;
												setLayerSettings((prev: LayerSettings) => ({
													...prev,
													showMeasurements: nextVal
												}));
											}}
										/>
										<label htmlFor="showRib">Measurement</label>
									</div>
								</div>
								<div className="funkyradio" style={{ fontSize: '0.8em' }}>
									<div className="funkyradio-info">
										<input
											type="checkbox"
											id="showArea"
											checked={layerSettings.showSurfaces}
											onChange={() => {
												setLayerSettings((prev) => ({
													...prev,
													showSurfaces: !prev.showSurfaces
												}));
											}}
										/>
										<label htmlFor="showArea">Surface</label>
									</div>
								</div>
								<div className="funkyradio" style={{ fontSize: '0.8em' }}>
									<div className="funkyradio-info">
										<input
											type="checkbox"
											id="showLayerRoom"
											checked={layerSettings.showTexture}
											onChange={() =>
												setLayerSettings((prev) => ({
													...prev,
													showTexture: !prev.showTexture
												}))
											}
										/>
										<label htmlFor="showLayerRoom">Texture</label>
									</div>
								</div>
								<div className="funkyradio" style={{ fontSize: '0.8em' }}>
									<div className="funkyradio-info">
										<input
											type="checkbox"
											id="showLayerDevices"
											checked={layerSettings.showDevices}
											onChange={() =>
												setLayerSettings((prev) => ({
													...prev,
													showDevices: !prev.showDevices
												}))
											}
										/>
										<label htmlFor="showLayerDevices">Devices</label>
									</div>
								</div>
							</div>
						)}

						<div style={{ clear: 'both' }}></div>
					</ul>
				</div>
			)}

			<div className="container">
				<a data-modal="modal-one"></a>
			</div>

			<div className="modal" id="modal-one" ref={modalRef}>
				<div className="modal-bg modal-exit"></div>
				<div className="modal-container">
					<div className="modal-header">
						<h4 className="modal-title" id="myModalLabel">
							React Floor Plan v0.1
						</h4>
					</div>
					<div className="modal-body">
						<div id="recover">
							{planToRecover && (
								<>
									<p>A plan already exists in history, would you like recover it?</p>
									<button
										className="btn btn-default"
										onClick={() => {
											initHistory('recovery');
											dismissModal();
										}}>
										Yes
									</button>
									<hr />
									<p>Or would you prefer to start a new plan?</p>
								</>
							)}
							{!planToRecover && (
								<>
									<p>Select a template or start a blank canvas</p>
									<hr />
								</>
							)}
						</div>
						<div className="row new-plan-button-row">
							<button
								className="col-md-3 col-xs-3 boxMouseOver"
								style={{
									minHeight: '140px',
									margin: '15px',
									background: "url('newPlanEmpty.jpg')"
								}}
								onClick={() => {
									initHistory('');
									dismissModal();
								}}>
								<img src="newPlanEmpty.jpg" className="img-responsive" alt="newPlanEmpty" />
							</button>
							<button
								className="col-md-3 col-xs-3 boxMouseOver"
								style={{
									minHeight: '140px',
									margin: '15px',
									background: "url('newPlanEmpty.jpg')"
								}}
								onClick={() => {
									initHistory('newSquare');
									dismissModal();
								}}>
								<img
									src="newPlanSquare.jpg"
									className="img-responsive"
									alt="newPlanSquare"
									style={{ marginTop: '10px' }}
								/>
							</button>
							<button
								className="col-md-3 col-xs-3 boxMouseOver"
								style={{
									minHeight: '140px',
									margin: '15px',
									background: "url('newPlanEmpty.jpg')"
								}}
								onClick={() => {
									initHistory('newL');
									dismissModal();
								}}>
								<img
									src="newPlanL.jpg"
									alt="newPlanL"
									className="img-responsive"
									style={{ marginTop: '20px' }}
								/>
							</button>
						</div>
					</div>
					<button className="modal-close modal-exit">X</button>
				</div>
			</div>

			<div
				style={{
					position: 'absolute',
					bottom: '10px',
					left: '210px',
					fontSize: '1.5em',
					color: '#08d'
				}}
				id="boxinfo">
				{boxInfoText}
			</div>

			<div
				id="moveBox"
				style={{
					position: 'absolute',
					right: '15px',
					top: '15px',
					color: '#08d',
					background: 'transparent',
					zIndex: '2',
					textAlign: 'center',
					transitionDuration: '0.2s',
					transitionTimingFunction: 'ease-in'
				}}>
				<p style={{ margin: '0px 0 0 0', fontSize: '11px' }}>
					<img
						src="https://cdn4.iconfinder.com/data/icons/mathematics-doodle-3/48/102-128.png"
						width="20px"
					/>{' '}
					React Floor Plan
				</p>
				<div className="pull-right" style={{ margin: '10px' }}>
					<p style={{ margin: 0 }}>
						<button
							className="btn btn-xs btn-info zoom"
							data-zoom="zoomtop"
							style={{ boxShadow: '2px 2px 3px #ccc' }}
							onClick={() => moveCamera('up')}>
							<i className="fa fa-arrow-up" aria-hidden="true"></i>
						</button>
					</p>
					<p style={{ margin: 0 }}>
						<button
							className="btn btn-xs btn-info zoom"
							data-zoom="zoomleft"
							style={{ boxShadow: '2px 2px 3px #ccc' }}
							onClick={() => moveCamera('left')}>
							<i className="fa fa-arrow-left" aria-hidden="true"></i>
						</button>
						<button
							className="btn btn-xs btn-default zoom"
							data-zoom="zoomreset"
							style={{ boxShadow: '2px 2px 3px #ccc' }}
							onClick={() => resetCamera()}>
							<i className="fa fa-bullseye" aria-hidden="true"></i>
						</button>
						<button
							className="btn btn-xs btn-info zoom"
							data-zoom="zoomright"
							style={{ boxShadow: '2px 2px 3px #ccc' }}
							onClick={() => moveCamera('right')}>
							<i className="fa fa-arrow-right" aria-hidden="true"></i>
						</button>
					</p>
					<p style={{ margin: 0 }}>
						<button
							className="btn btn-xs btn-info zoom"
							data-zoom="zoombottom"
							style={{ boxShadow: '2px 2px 3px #ccc' }}
							onClick={() => moveCamera('down')}>
							<i className="fa fa-arrow-down" aria-hidden="true"></i>
						</button>
					</p>
				</div>
			</div>

			<div
				id="zoomBox"
				style={{
					position: 'absolute',
					zIndex: '100',
					right: '15px',
					bottom: '20px',
					textAlign: 'center',
					background: 'transparent',
					padding: '0px',
					color: '#fff',
					transitionDuration: '0.2s',
					transitionTimingFunction: 'ease-in'
				}}>
				<div className="pull-right" style={{ marginRight: '10px' }}>
					<button
						className="btn btn btn-default zoom"
						data-zoom="zoomin"
						style={{ boxShadow: '2px 2px 3px #ccc' }}
						onClick={() => zoomIn()}>
						<i className="fa fa-plus" aria-hidden="true"></i>
					</button>
					<button
						className="btn btn btn-default zoom"
						data-zoom="zoomout"
						style={{ boxShadow: '2px 2px 3px #ccc' }}
						onClick={() => zoomOut()}>
						<i className="fa fa-minus" aria-hidden="true"></i>
					</button>
				</div>
				<div style={{ clear: 'both' }}></div>
				<div
					id="scaleVal"
					className="pull-right"
					style={{
						boxShadow: '2px 2px 3px #ccc',
						width: 60 * scaleValue + 'px',
						height: '20px',
						background: '#4b79aa',
						borderRadius: '4px',
						marginRight: '10px'
					}}>
					1m
				</div>

				<div style={{ clear: 'both' }}></div>
			</div>
		</>
	);
}

export default App;
