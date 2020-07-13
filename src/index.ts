import { makeSprite, GameProps, t } from "@replay/core";
import { WebInputs } from "@replay/web";
import { iOSInputs } from "@replay/swift";

import { Level } from "./level";

export enum GameStatus {
  RUNNING,
  PAUSED,
  DEFEAT,
  VICTORY,
}

export const gameProps: GameProps = {
  id: "Game",
  size: {
    landscape: {
      width: 600,
      height: 400,
      maxWidthMargin: 150,
    },
    portrait: {
      width: 400,
      height: 600,
      maxHeightMargin: 150,
    },
  },
  defaultFont: {
    name: "Courier",
    size: 10,
  },
};

type GameState = {
  map: number;
  status: GameStatus;
  isNewGame: boolean;
};

const INITIAL_STATE = { map: 0, status: GameStatus.RUNNING, isNewGame: true };

export const Game = makeSprite<GameProps, GameState, WebInputs | iOSInputs>({
  init() {
    return INITIAL_STATE;
  },

  loop({ state }) {
    return state;
  },

  render({ state, updateState }) {
    const { map, status, isNewGame } = state;

    let gameStatus = null;
    if (status === GameStatus.PAUSED) {
      gameStatus = t.text({
        font: { name: "Courier", size: 32 },
        text: "PAUSED",
        color: "black",
        x: 0,
        y: 0,
      });
    } else if (status === GameStatus.DEFEAT) {
      gameStatus = t.text({
        font: { name: "Courier", size: 32 },
        text: "DEFEAT",
        color: "black",
        x: 0,
        y: 0,
      });
    } else if (status === GameStatus.VICTORY)
      gameStatus = t.text({
        font: { name: "Courier", size: 32 },
        text: "VICTORY",
        color: "black",
        x: 0,
        y: 0,
      });

    return [
      Level({
        id: "level",
        map,
        status,
        isNewGame,
        setStatus: (status) =>
          updateState((prevState) => ({ ...prevState, status })),
        startGame: () =>
          updateState((prevState) => ({ ...prevState, isNewGame: false })),
        restartGame: () => updateState(() => INITIAL_STATE),
      }),
      gameStatus,
    ];
  },
});
