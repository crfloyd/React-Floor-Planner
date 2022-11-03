import { useEffect } from 'react';

export const useKeybindings = (bindings: Map<string, () => void>) => {
	useEffect(() => {
		const onKeyPress = (e: KeyboardEvent) => {
			if (bindings.has(e.key)) {
				bindings.get(e.key)?.();
			}
		};
		document.addEventListener('keydown', onKeyPress);
		return () => {
			document.removeEventListener('keydown', onKeyPress);
		};
	}, [bindings]);
};
