import { makeSprite, t, DeviceSize } from "@replay/core";
import { WebInputs } from "@replay/web";
import { iOSInputs } from "@replay/swift";

import { TowerKindId, getTowerData } from "./tower";
import { Point } from "./map";

type ControlProps = {
  addTower: (t: { x: number; y: number; kind: TowerKindId }) => void;
};

type TowerButton = {
  kind: TowerKindId;
  x: number;
  y: number;
  bounds?: [Point, Point];
};

enum ControlAction {
  NONE,
  PLACE_TOWER,
}

type ControlState = {
  action: ControlAction;
  placeTowerKind: TowerKindId | undefined;
  towers: TowerButton[];
};

const boxHeight = 50;
const buttonSize = 8;

const setButtonPositions = (size: DeviceSize, towers: TowerButton[]) => {
  const width = size.width + size.widthMargin * 2;
  const left = -width / 2;
  const y = -(size.height + size.heightMargin * 2) / 2 + boxHeight / 2;
  return towers.map(
    (tb, i): TowerButton => {
      const x = left + 25 + i * 25;
      return {
        ...tb,
        x,
        y,
        bounds: [
          [x - buttonSize, y - buttonSize],
          [x + buttonSize, y + buttonSize],
        ],
      };
    }
  );
};

export const Control = makeSprite<
  ControlProps,
  ControlState,
  WebInputs | iOSInputs
>({
  init({ device }) {
    const { size } = device;
    const initialTowers = ["0", "1", "2"].map((kind) => ({
      kind,
      x: 0,
      y: 0,
    }));
    return {
      action: ControlAction.NONE,
      placeTowerKind: undefined,
      towers: setButtonPositions(size, initialTowers),
    };
  },

  loop({ props, state, device }) {
    const { towers } = state;
    let { action, placeTowerKind } = state;
    const { log, inputs } = device;
    const { pointer } = inputs;
    if (pointer.justPressed) {
      if (action === ControlAction.NONE) {
        const clickedButton = towers.find(
          (tb) =>
            tb.bounds &&
            pointer.x >= tb.bounds[0][0] &&
            pointer.x <= tb.bounds[1][0] &&
            pointer.y >= tb.bounds[0][1] &&
            pointer.y <= tb.bounds[1][1]
        );
        if (clickedButton) {
          log(clickedButton.kind);
          action = ControlAction.PLACE_TOWER;
          placeTowerKind = clickedButton.kind;
        }
      } else {
        if (placeTowerKind) {
          action = ControlAction.NONE;
          props.addTower({ x: pointer.x, y: pointer.y, kind: placeTowerKind });
        }
      }
    }
    return { towers, action, placeTowerKind };
  },

  render({ state, device }) {
    const { towers, action, placeTowerKind } = state;
    const { size, inputs } = device;
    const { pointer } = inputs;

    const selectedTower =
      action == ControlAction.PLACE_TOWER && placeTowerKind
        ? [
            t.circle({
              radius: getTowerData(placeTowerKind).range,
              color: "rebeccapurple",
              opacity: 0.5,
              x: pointer.x,
              y: pointer.y,
            }),
            t.text({
              font: { name: "Calibri", size: 32 },
              text: getTowerData(placeTowerKind).sprite,
              color: "black",
              x: pointer.x,
              y: pointer.y,
            }),
          ]
        : [];

    return [
      t.rectangle({
        color: "#ccc",
        width: size.width + size.widthMargin * 2,
        height: boxHeight,
        y: -(size.height + size.heightMargin * 2) / 2 + boxHeight / 2,
      }),
      ...towers.map(({ kind, x, y }) =>
        t.text({
          font: { name: "Calibri", size: 16 },
          text: getTowerData(kind).sprite,
          color: "black",
          x,
          y,
        })
      ),
      ...selectedTower,
    ];
  },
});
