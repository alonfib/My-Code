import { action, makeObservable, observable } from "mobx";
import { DictationGameTypes } from "../GameStore/types";
import GameStore from "../GameStore/GameStore";
import { COLLECTIONS, addDocument, getDocument, setDocument } from "../../utils/fireUtils";
import {
  DictationLevelStatesEnum,
  DictationPackType,
  DictationProps,
  GenericDictationPack,
  GenericDictationTrack,
  ISetDictationLevel,
  SetValidations,
} from "./types";
import UserStore from "../UserStore/UserStore";
import { UserStatisticEvents } from "../UserStore/types";
import { AsyncStorageEnum, getObjectData, storeStringData } from "../../utils/deviceStorage";

type DICTATIONS_COLLECTIONS = COLLECTIONS.harmonicDictationPacks | COLLECTIONS.melodicDictationPacks;

type AsyncStorageKeys = {
  packs: AsyncStorageEnum.MelodicDictationsPacks | AsyncStorageEnum.HarmonicDictationsPacks;
  lastPack: AsyncStorageEnum.LastMelodicDictationPackId | AsyncStorageEnum.LastHarmonicDictationPackId;
};

type AbstractDictationsConstructorProps = {
  initPacks: DictationPackType<DictationGameTypes>[];
  packsCollection: DICTATIONS_COLLECTIONS;
  asyncStorageKeys: AsyncStorageKeys;
};
// ** IMPORTS GAMESTORE ** //
export abstract class AbstractDictationsStore<TDictationGameType extends DictationGameTypes> implements DictationProps {
  dictationPacks: GenericDictationPack<DictationGameTypes>[] = [] as GenericDictationPack<TDictationGameType>[];
  currentDictationPack: GenericDictationPack<DictationGameTypes> = {} as GenericDictationPack<TDictationGameType>;
  currentDictation: GenericDictationTrack<DictationGameTypes> = {} as GenericDictationTrack<TDictationGameType>;
  isEditorSaveDisabled: boolean = true;
  packsCollection: DICTATIONS_COLLECTIONS;
  asyncStorageKeys: AsyncStorageKeys;
  playsAllowed: number = 0;
  validationsAllowed: number = 0;

  abstract setCurrentDictation(dictation: GenericDictationTrack<DictationGameTypes>, isEditor?: boolean): void;
  abstract calcDictationLevelXp(): number;
  abstract calcDictationLevelShopPoints(): number;

  protected constructor({ initPacks, packsCollection, asyncStorageKeys }: AbstractDictationsConstructorProps) {
    this.dictationPacks = initPacks;
    this.currentDictationPack = this.dictationPacks[0];
    this.currentDictation = this.currentDictationPack.dictations[0];
    this.packsCollection = packsCollection;
    this.asyncStorageKeys = asyncStorageKeys;

    makeObservable(this, {
      dictationPacks: observable,
      currentDictationPack: observable,
      currentDictation: observable,
      isEditorSaveDisabled: observable,
      playsAllowed: observable,
      validationsAllowed: observable,
      uploadDictationPack: action,
      setIsEditorSaveDisabled: action,
      removeDictation: action,
      setDictationLevelState: action,
      resetDictationPackState: action,
      editDictationLevel: action,
      dictationLevelUp: action,
      setDictationLevel: action,
      saveDictationPacks: action,
      addToDictationPacks: action,
      markThisPackDone: action,
      handleFinishPack: action,
      isPackExists: action,
      fetchDictations: action,
      editDictation: action,
      setCurrentDictationPack: action,
      addTrackToCurrentDictationPack: action,
      setValidations: action,
    });
  }

  setValidations = ({
    playsAllowed = 0,
    validationsAllowed = 0,
  }: SetValidations) => {
    this.validationsAllowed = validationsAllowed;
    this.playsAllowed = playsAllowed;
  }

  addTrackToCurrentDictationPack = (track: GenericDictationTrack<DictationGameTypes>) => {
    this.currentDictationPack.dictations.push(track);
    GameStore.gameLength = GameStore.gameLength + 1;
  };

  private findNextDictationIndex = (initial?: boolean): number => {
    let levelIndex = this.currentDictationPack.dictations.findIndex(
      (dict) => dict?.levelState !== DictationLevelStatesEnum.Success
    );
    const isNextLevel = GameStore.gameLevelNumber < this.currentDictationPack.dictations.length;
    const allLevelsDone = levelIndex === -1;

    if (allLevelsDone && initial) {
      levelIndex = 0;
    } else if (allLevelsDone && isNextLevel) {
      levelIndex = GameStore.gameLevelNumber + 1;
    }
    return levelIndex;
  };

  setCurrentDictationPack = (pack: GenericDictationPack<DictationGameTypes>) => {
    storeStringData(this.asyncStorageKeys.lastPack, pack.id);
    this.currentDictationPack = pack;
    const currentDictationIndex = this.findNextDictationIndex(true);

    GameStore.gameLength = pack.dictations.length;
    GameStore.gameProgress = pack.dictations.filter((dic) => dic.levelState !== DictationLevelStatesEnum.Default).length;
    GameStore.gameLevelNumber = currentDictationIndex;

    this.currentDictation = pack.dictations[currentDictationIndex];
  };

  editDictation = async (packTitle: string, dictationTitle: string, track: GenericDictationTrack<DictationGameTypes>) => {
    const packIndex = this.dictationPacks.findIndex((pack) => pack.title === packTitle);
    const dictationIndex = this.dictationPacks[packIndex]?.dictations?.findIndex((dict) => dict.title === dictationTitle);
    if (packIndex !== -1 && dictationIndex !== -1) {
      this.dictationPacks[packIndex].dictations[dictationIndex] = track;
    }

    this.saveDictationPacks(this.dictationPacks);
  };

  isPackExists = async (id: string) => {
    try {
      return !!(await getDocument(this.packsCollection, id));
    } catch (error) {
      console.error(`error in saveDictationPack: ${error}`);
      throw error;
    }
  };

  markThisPackDone() {
    this.currentDictationPack.isPackDone = true;
    this.saveDictationPacks(this.dictationPacks);
  }

  fetchDictations = async () => {
    const tempDictationsPacks = (await getObjectData(this.asyncStorageKeys.packs)) as
      | GenericDictationPack<DictationGameTypes>[]
      | undefined;

    if (!!tempDictationsPacks) {
      this.dictationPacks = tempDictationsPacks;
      this.currentDictationPack = tempDictationsPacks[0];
      this.currentDictation = tempDictationsPacks[0].dictations[0];
      GameStore.gameLength = tempDictationsPacks[0].dictations.length;
    }
  };

  addToDictationPacks = async (pack: GenericDictationPack<DictationGameTypes>) => {
    const tempPack = { ...pack, downloadsCount: pack.downloadsCount + 1 };
    if (!!this.dictationPacks && this.dictationPacks?.length > 0) {
      this.dictationPacks.push(tempPack);
    } else {
      this.dictationPacks = [tempPack];
    }

    await this.saveDictationPacks(this.dictationPacks);
    await setDocument(this.packsCollection, pack.id, { downloadsCount: pack.downloadsCount + 1 });
  };

  saveDictationPacks = async (dictations: GenericDictationPack<DictationGameTypes>[]) => {
    storeStringData(this.asyncStorageKeys.packs, JSON.stringify(dictations));
  };

  handleFinishPack() {
    if (!this.currentDictationPack.isPackDone) {
      this.markThisPackDone();
    }

    GameStore.toggleShowPackDonePage();
    this.setCurrentDictation(this.currentDictationPack.dictations[0]);
    GameStore.gameLevelNumber = 0;
  }

  setDictationLevel = ({ dictation, dictationLevelNumber }: ISetDictationLevel) => {
    if (dictation) {
      this.setCurrentDictation(dictation);
      return;
    }

    const nextDictationIndex = dictationLevelNumber || this.findNextDictationIndex();
    const nextDictation = this.currentDictationPack.dictations?.[nextDictationIndex];

    if (nextDictation) {
      this.setCurrentDictation(nextDictation);
      GameStore.gameLevelNumber = nextDictationIndex;
    } else {
      this.handleFinishPack();
    }
  };

  uploadDictationPack = async (pack: GenericDictationPack<DictationGameTypes>, collection: COLLECTIONS) => {
    try {
      return await addDocument(collection, pack.title.toLocaleLowerCase().replace(" ", "_"), pack);
    } catch (error) {
      console.error(`error in saveDictationPack: ${error}`);
      throw error;
    }
  };

  setIsEditorSaveDisabled = (toggle: boolean) => {
    this.isEditorSaveDisabled = toggle;
  };

  removeDictation = async (packId: string) => {
    const editedPacks = this.dictationPacks.filter((pack) => pack?.id !== packId);
    this.dictationPacks = editedPacks;
    this.saveDictationPacks(editedPacks);
  };

  setDictationLevelState = async (state: DictationLevelStatesEnum) => {
    const currentDictationIndex = this.currentDictationPack.dictations.findIndex(
      (dict) => dict?.title === this.currentDictation?.title
    );

    const currentDictation = this.currentDictationPack.dictations?.[currentDictationIndex];
    currentDictation.levelState = state;

    await this.editDictation(this.currentDictationPack.title, this.currentDictation.title ?? "", currentDictation);
  };

  resetDictationPackState = async () => {
    this.currentDictationPack.dictations.forEach((dic) => {
      dic.levelState = DictationLevelStatesEnum.Default;
    });
  };

  editDictationLevel = (track: GenericDictationTrack<DictationGameTypes>, trackIndex: number) => {
    if (this.currentDictationPack?.dictations?.[trackIndex]) {
      this.currentDictationPack.dictations[trackIndex] = track;
    } else {
      const newTrackIndex = this.currentDictationPack.dictations.findIndex((dic) => dic.title === track.title);
      if (newTrackIndex !== -1) {
        this.currentDictationPack.dictations[newTrackIndex] = track;
      }
    }
  };

  dictationLevelUp = () => {
    const xpPoints = this.calcDictationLevelXp();
    const shopPoints = this.calcDictationLevelShopPoints();
    UserStore.grantXp(xpPoints);
    UserStore.addShopPoints(shopPoints);
    UserStore.updateStatistics(GameStore.testType, GameStore.gameType, UserStatisticEvents.ShopPoints, shopPoints);
    UserStore.updateStatistics(GameStore.testType, GameStore.gameType, UserStatisticEvents.Xp, xpPoints);
  };
}

export default AbstractDictationsStore;
