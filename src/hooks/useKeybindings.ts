import { useEffect } from "react";

interface Props {
	onSelectMode: () => void;
	onWallMode: () => void;
}

export const useKeybindings = ({ onSelectMode, onWallMode }: Props) => {
	useEffect(() => {
		document.addEventListener("keydown", onKeyPress);
		return () => {
			document.removeEventListener("keydown", onKeyPress);
		};
	}, []);
	const onKeyPress = (e: KeyboardEvent) => {
		switch (e.key) {
			case "Escape":
			case "s":
				onSelectMode();
				break;
			case "w":
				onWallMode();
				break;

			default:
				break;
		}
	};
};
