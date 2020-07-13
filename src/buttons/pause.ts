import { makeSprite, t, DeviceSize } from "@replay/core";
import { WebInputs } from "@replay/web";
import { iOSInputs } from "@replay/swift";

import { Point, isWithinSquare } from "../utils.js/math";
import { GameStatus } from "..";

type PauseButtonProps = {
  gameStatus: GameStatus;
  setGameStatus: (status: GameStatus) => void;
};

const getPauseButtonCoords = (size: DeviceSize): Point => [
  size.width / 2,
  size.height / 2 - 50,
];

const BUTTON_SIZE = 24;

export const PauseButton = makeSprite<
  PauseButtonProps,
  undefined,
  WebInputs | iOSInputs
>({
  loop({ props, state, device }) {
    const { gameStatus, setGameStatus } = props;
    const { inputs, size } = device;
    const { pointer } = inputs;

    if (pointer.justPressed) {
      const pauseButtonCoords = getPauseButtonCoords(size);
      if (
        isWithinSquare(
          [pointer.x, pointer.y],
          pauseButtonCoords,
          BUTTON_SIZE / 2
        )
      ) {
        if (
          gameStatus === GameStatus.RUNNING ||
          gameStatus === GameStatus.PAUSED
        ) {
          setGameStatus(
            gameStatus === GameStatus.RUNNING
              ? GameStatus.PAUSED
              : GameStatus.RUNNING
          );
        }
      }
    }
    return state;
  },

  render({ props, device }) {
    const { gameStatus } = props;
    const { size } = device;

    const pauseButtonCoords = getPauseButtonCoords(size);
    return [
      t.text({
        font: { name: "Calibri", size: BUTTON_SIZE },
        text: gameStatus === GameStatus.PAUSED ? "▶️" : "⏸",
        color: "black",
        x: pauseButtonCoords[0],
        y: pauseButtonCoords[1],
      }),
    ];
  },
});
