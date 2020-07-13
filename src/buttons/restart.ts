import { makeSprite, t, DeviceSize } from "@replay/core";
import { WebInputs } from "@replay/web";
import { iOSInputs } from "@replay/swift";

import { Point, isWithinSquare } from "../utils.js/math";

type RestartButtonProps = {
  restartGame: () => void;
};

type RestartButtonState = {
  showConfirm: boolean;
};

const getRestartButtonCoords = (size: DeviceSize): Point => [
  size.width / 2 - 50,
  size.height / 2 - 50,
];

const BUTTON_SIZE = 24;

export const RestartButton = makeSprite<
  RestartButtonProps,
  RestartButtonState,
  WebInputs | iOSInputs
>({
  init() {
    return {
      showConfirm: false,
    };
  },

  loop({ props, state, device }) {
    const { restartGame } = props;
    let { showConfirm } = state;
    const { inputs, size } = device;
    const { pointer } = inputs;

    if (pointer.justPressed) {
      const RestartButtonCoords = getRestartButtonCoords(size);
      if (
        isWithinSquare(
          [pointer.x, pointer.y],
          RestartButtonCoords,
          BUTTON_SIZE / 2
        )
      ) {
        if (showConfirm) {
          restartGame();
          showConfirm = false;
        } else {
          showConfirm = true;
        }
      }
    }
    return { showConfirm };
  },

  render({ state, device }) {
    const { showConfirm } = state;
    const { size } = device;

    const RestartButtonCoords = getRestartButtonCoords(size);
    return [
      t.text({
        font: { name: "Calibri", size: BUTTON_SIZE },
        text: showConfirm ? "✅" : "↩️",
        color: "black",
        x: RestartButtonCoords[0],
        y: RestartButtonCoords[1],
      }),
    ];
  },
});
