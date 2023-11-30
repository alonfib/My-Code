import { action, makeObservable, observable } from "mobx";
import { DictationGameTypes, ScalesEnum } from "../../GameStore/types";
import { INITIAL_HARMONIC_DICTATION_PACK } from "../../UserStore/initialUser";
import GameStore from "../../GameStore/GameStore";
import { gamesOptions } from "../../GameStore/options";
import { AsyncStorageEnum } from "../../../utils/deviceStorage";
import { COLLECTIONS } from "../../../utils/fireUtils";
import {
  DictationLevelStatesEnum,
  DictationProps,
  DictationTrackType,
  GenericDictationPack,
  GenericDictationTrack,
  IHarmonicDictationTrack,
} from "../types";
import { Modify } from "../../../utils/typesUtils";
import AbstractDictationsStore from "../AbstractDictationsStore";

type HarmonicStoreClassProps = Modify<
  DictationProps,
  {
    dictationPacks: GenericDictationPack<DictationGameTypes.Harmonic>[];
    currentDictationPack: GenericDictationPack<DictationGameTypes.Harmonic>;
    currentDictation: GenericDictationTrack<DictationGameTypes.Harmonic>;
    setCurrentDictation: (dictation: GenericDictationTrack<DictationGameTypes.Harmonic>, isEditor: boolean) => void;
    withChordPicker: boolean;
    resetDictationEditor: () => void;
  }
>;

// ** IMPORTS GAMESTORE ** //
export class HarmonicStoreClass
  extends AbstractDictationsStore<DictationGameTypes.Harmonic>
  implements HarmonicStoreClassProps
{
  hideCurrentDictationRhythm = false;
  withChordPicker: boolean = false;

  constructor() {
    super({ 
      initPacks: [INITIAL_HARMONIC_DICTATION_PACK],
      packsCollection: COLLECTIONS.harmonicDictationPacks,
      asyncStorageKeys: {
        packs: AsyncStorageEnum.HarmonicDictationsPacks,
        lastPack: AsyncStorageEnum.LastHarmonicDictationPackId,
      },
     });
    makeObservable(this, {
      hideCurrentDictationRhythm: observable,

      withChordPicker: observable,
      resetDictationEditor: action,
      toggleHideCurrentDictationRhythm: action,
    });
  }

  toggleHideCurrentDictationRhythm = (hideToggle: boolean = !this.hideCurrentDictationRhythm) => {
    this.hideCurrentDictationRhythm = hideToggle;
  };

  setCurrentDictation = (dictation: DictationTrackType<DictationGameTypes.Harmonic>, isEditor: boolean = false) => {
    const levelsDoneCount = (this.currentDictationPack.dictations as IHarmonicDictationTrack[]).filter(
      (dic): dic is IHarmonicDictationTrack => dic.levelState === DictationLevelStatesEnum.Success
    ).length;

    GameStore.gameProgress = levelsDoneCount;
    GameStore.currentScaleType = dictation?.scaleType ?? ScalesEnum.Major;
    GameStore.gameLength = this.currentDictationPack.dictations.length;

    this.currentDictation = dictation;
    const currentGameOptions = [...gamesOptions[DictationGameTypes.Harmonic]].filter((opt) =>
      dictation.dictationProps?.gameOptionsIds?.includes(opt.id)
    );

    GameStore.isFixedRoot = !!dictation?.fixedRoot;
    if (!isEditor) {
      GameStore.gameOptions =
        currentGameOptions.length > 0 ? currentGameOptions : [...gamesOptions[DictationGameTypes.Harmonic]];
    }
  };

  resetDictationEditor = () => {
    const currentGameOptions = [...gamesOptions[DictationGameTypes.Harmonic]];
    GameStore.gameOptions = currentGameOptions;
    GameStore.isInversions = false;
    GameStore.isSopranoStates = false;
    GameStore.isFixedRoot = false;
    GameStore.currentScaleType = ScalesEnum.Major;
    this.withChordPicker = false;

    this.setCurrentDictation(
      {
        id: "",
        fixedRoot: true,
        scaleType: ScalesEnum.Major,
        title: "",
        levelState: DictationLevelStatesEnum.Default,
        dictation: [],
        dictationProps: {
          withChordPicker: false,
          gameOptionsIds: currentGameOptions.map((opt) => opt.id),
          isInversions: false,
          isSopranoStates: false,
        },
      },
      true
    );

    return currentGameOptions;
  };

  // TODO Change level factor logic.
  calcDictationLevelXp = () => {
    const isFixedRootPoints = GameStore.isFixedRoot ? 0 : 60; // ?
    const timerPoints = GameStore.gameTimer < 29 ? 60 - GameStore.gameTimer * 2 : 0;
    const inversionsPoints = GameStore.isInversions ? 100 : 0;
    const optionsPoints = isFixedRootPoints + inversionsPoints + timerPoints;
    const levelFactor = 1 + ((GameStore.gameLevelNumber || 1) - 1) * 1.05; // adjust this factor to balance XP across levels
    return Math.round((Math.max(optionsPoints, 100) * levelFactor) / 10) * 10;
  };

  // TODO Change level factor logic.
  calcDictationLevelShopPoints = () => {
    const isFixedRootPoints = GameStore.isFixedRoot ? 0 : 60; // ?
    const timerPoints = GameStore.gameTimer < 29 ? 60 - GameStore.gameTimer * 2 : 0;
    const inversionsPoints = GameStore.isInversions ? 60 : 0;
    const optionsPoints = isFixedRootPoints + inversionsPoints + timerPoints;
    const levelFactor = 1 + ((GameStore.gameLevelNumber || 1) - 1) * 1.05; // adjust this factor to balance XP across levels
    return Math.round((Math.max(optionsPoints, 100) * levelFactor) / 10) * 10;
  };
}

export default new HarmonicStoreClass();
