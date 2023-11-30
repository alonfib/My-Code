import React, { createContext } from 'react';
import { configure } from "mobx"

// not necessary for stores without mobx
configure({
	enforceActions: "never",
})

import gameStore from './GameStore/GameStore';
import userStore from './UserStore/UserStore';
import shopStore from './ShopStore/ShopStore';
import tutorialStore from "./TutorialStore/TutorialStore";
import challengeStore from "./ChallengeStore/ChallengeStore";
import melodicStore from  "./DictationsStore/MelodicStore/MelodicStore";
import harmonicStore from  "./DictationsStore/HarmonicStore/HarmonicStore"

// all the stores will be imported and exported from here, to be provided to App component through <Provider />

const stores = {
	gameStore,
	userStore,
	tutorialStore,
	shopStore,
	melodicStore,
	harmonicStore,
	challengeStore
}

export type StoresType = typeof stores;

export const storesContext = createContext(stores);

export default stores;
