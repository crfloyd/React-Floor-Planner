import { useEffect } from 'react';

export type Modifier = 'ctrl' | 'shift' | 'alt';

export interface BindingEntry {
	modifier?: Modifier;
	action: () => void;
}

interface Props {
	keyDown?: Map<string, BindingEntry>;
	keyUp?: Map<string, BindingEntry>;
}

export const useKeybindings = ({ keyDown, keyUp }: Props) => {
	const modifierPressed = (modifier: Modifier, e: KeyboardEvent) => {
		if (modifier === 'ctrl') return e.ctrlKey;
		if (modifier === 'alt') return e.altKey;
		if (modifier === 'shift') return e.shiftKey;
		return false;
	};

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (keyDown?.has(e.key)) {
				const binding = keyDown.get(e.key);
				if (!binding?.modifier || modifierPressed(binding.modifier, e)) {
					binding?.action();
				}
			}
		};
		const onKeyUp = (e: KeyboardEvent) => {
			if (keyUp?.has(e.key)) {
				const binding = keyUp.get(e.key);
				if (!binding?.modifier || modifierPressed(binding.modifier, e)) {
					binding?.action();
				}
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
