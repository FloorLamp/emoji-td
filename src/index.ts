import { makeSprite, GameProps } from "@replay/core";
import { WebInputs } from "@replay/web";
import { iOSInputs } from "@replay/swift";

import { Level } from "./level";

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
  level: number;
};

export const Game = makeSprite<GameProps, GameState, WebInputs | iOSInputs>({
  init() {
    return {
      level: 0,
    };
  },

  loop({ state }) {
    return state;
  },

  render({ state }) {
    const { level } = state;
    return [Level({ id: "level", level, paused: false })];
  },
});
