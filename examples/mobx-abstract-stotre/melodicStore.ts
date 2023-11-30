import { action, makeObservable, observable } from "mobx";
import {
  DictationLevelStatesEnum,
  DictationProps,
  GenericDictationPack,
  GenericDictationTrack,
  IMelodicDictationTrack,
} from "../types";
import { DictationGameTypes, ScalesEnum, } from "../../GameStore/types";
import AbstractDictationsStore from "../AbstractDictationsStore";
import { INITIAL_MELODIC_DICTATION_PACK } from "../../UserStore/initialUser";
import { AsyncStorageEnum } from "../../../utils/deviceStorage";
import GameStore from "../../GameStore/GameStore";
import { COLLECTIONS } from "../../../utils/fireUtils";
import { Modify } from "../../../utils/typesUtils";


type MelodicStoreClassProps = Modify<
  DictationProps,
  {
    dictationPacks: GenericDictationPack<DictationGameTypes.Melodic>[];
    currentDictationPack: GenericDictationPack<DictationGameTypes.Melodic>;
    currentDictation: GenericDictationTrack<DictationGameTypes.Melodic>;
    setCurrentDictation: (dictation: IMelodicDictationTrack, isEditor: boolean) => void;
  }
>;

// ** IMPORTS GAMESTORE ** //
export class MelodicStoreClass extends AbstractDictationsStore<DictationGameTypes.Melodic>
  implements MelodicStoreClassProps
{
  hideCurrentDictationRhythm = false;
  constructor() {
    super({
      initPacks: [INITIAL_MELODIC_DICTATION_PACK],
      packsCollection: COLLECTIONS.melodicDictationPacks,
      asyncStorageKeys: {
        packs: AsyncStorageEnum.MelodicDictationsPacks,
        lastPack: AsyncStorageEnum.LastMelodicDictationPackId,
      }, 
    });

    makeObservable(this, {
      hideCurrentDictationRhythm: observable,
      toggleHideCurrentDictationRhythm: action,
    });
  }

  toggleHideCurrentDictationRhythm = (hideToggle: boolean = !this.hideCurrentDictationRhythm) => {
    this.hideCurrentDictationRhythm = hideToggle;
  };

  setCurrentDictation = (dictation: GenericDictationTrack<DictationGameTypes.Melodic>) => {
    const levelsDoneCount = this.currentDictationPack.dictations
      .filter((dic) => dic.levelState === DictationLevelStatesEnum.Success)
      .length;

    this.currentDictation = dictation;

    GameStore.gameProgress = levelsDoneCount;
    GameStore.isFixedRoot = !!dictation?.fixedRoot;
    GameStore.gameLength = this.currentDictationPack.dictations.length;
    GameStore.currentScaleType = dictation?.scaleType ?? ScalesEnum.Major;
  };

  // TODO Change level factor logic. 
  calcDictationLevelXp = () => {
    const isFixedRootPoints = GameStore.isFixedRoot ? 0 : 60; // ?
    const timerPoints =  GameStore.gameTimer < 29 ? 60 - GameStore.gameTimer * 2 : 0
    const optionsPoints = isFixedRootPoints + timerPoints;
    const levelFactor = 1 + ((GameStore.gameLevelNumber || 1) - 1) * 1.05; // adjust this factor to balance XP across levels
    return Math.round((Math.max(optionsPoints, 100) * levelFactor) / 10) * 10;
  };

  // TODO Change level factor logic.
  calcDictationLevelShopPoints = () => {
    const isFixedRootPoints = GameStore.isFixedRoot ? 0 : 60; // ?
    const timerPoints =  GameStore.gameTimer < 29 ? 60 - GameStore.gameTimer * 2 : 0
    const optionsPoints = isFixedRootPoints + timerPoints;
    const levelFactor = 1 + ((GameStore.gameLevelNumber || 1) - 1) * 1.05; // adjust this factor to balance XP across levels
    return Math.round((Math.max(optionsPoints, 100) * levelFactor) / 10) * 10;
  };
}

export default new MelodicStoreClass();
