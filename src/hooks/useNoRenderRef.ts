import { useRef } from 'react';

export const useNoRenderRef = <T>(currentValue: T) => {
	const ref = useRef(currentValue);
	ref.current = currentValue;
	return ref;
};
