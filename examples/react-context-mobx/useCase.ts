import React, { useContext } from "react";
import { storeContext } from './stores';

const Component = observer(() => {
	const { tutorialStore } = useContext(storesContext);

	return (
		<View>
			...
			...
			...
		</View>
	);
});
