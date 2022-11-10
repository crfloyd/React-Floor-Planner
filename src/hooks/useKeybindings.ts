import { useEffect } from 'react';

interface Props {
	keyDown?: Map<string, () => void>;
	keyUp?: Map<string, () => void>;
}

export const useKeybindings = ({ keyDown, keyUp }: Props) => {
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			e.preventDefault();
			if (keyDown?.has(e.key)) {
				keyDown?.get(e.key)?.();
			}
		};
		const onKeyUp = (e: KeyboardEvent) => {
			e.preventDefault();
			if (keyUp?.has(e.key)) {
				keyUp?.get(e.key)?.();
			}
		};
		document.addEventListener('keydown', onKeyDown);
		document.addEventListener('keyup', onKeyUp);
		return () => {
			document.removeEventListener('keydown', onKeyDown);
			document.removeEventListener('keyup', onKeyUp);
		};
	}, [keyDown, keyUp]);
};
