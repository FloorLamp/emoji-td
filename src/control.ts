import { makeSprite, t, DeviceSize } from "@replay/core";
import { WebInputs } from "@replay/web";
import { iOSInputs } from "@replay/swift";

import { TowerKindId, getTowerData, TowerT } from "./tower";
import { Point, isWithinRect, isWithinSquare } from "./map";

type ControlProps = {
  towers: TowerT[];
  addTower: (t: { x: number; y: number; kind: TowerKindId }) => void;
  selectTower: (tower: TowerT | null) => void;
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
  SELECT_TOWER,
}

type ControlState = {
  action: ControlAction;
  placeTowerKind: TowerKindId | undefined;
  towerButtons: TowerButton[];
};

const boxHeight = 50;
const buttonSize = 8;

const setButtonPositions = (size: DeviceSize, towerButtons: TowerButton[]) => {
  const width = size.width + size.widthMargin * 2;
  const left = -width / 2;
  const y = -(size.height + size.heightMargin * 2) / 2 + boxHeight / 2;
  return towerButtons.map(
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
      towerButtons: setButtonPositions(size, initialTowers),
    };
  },

  loop({ props, state, device }) {
    const { towerButtons } = state;
    let { action, placeTowerKind } = state;
    const { inputs, size } = device;
    const { pointer } = inputs;
    const boundsTop = -(size.height + size.heightMargin * 2) / 2 + boxHeight;

    if (pointer.justPressed) {
      switch (action) {
        case ControlAction.NONE:
          if (pointer.y < boundsTop) {
            // Click on level object
            const clickedButton = towerButtons.find(
              (tb) =>
                tb.bounds &&
                isWithinRect([pointer.x, pointer.y], tb.bounds[0], tb.bounds[1])
            );
            if (clickedButton) {
              action = ControlAction.PLACE_TOWER;
              placeTowerKind = clickedButton.kind;
            }
          } else {
            // Click in control area
            const clickedTower = props.towers.find((t) => {
              const { spriteSize } = getTowerData(t.kind);
              return isWithinSquare(
                [pointer.x, pointer.y],
                [t.x, t.y],
                spriteSize / 2
              );
            });
            if (clickedTower) {
              action = ControlAction.SELECT_TOWER;
              props.selectTower(clickedTower);
            }
          }
          break;
        case ControlAction.PLACE_TOWER:
          action = ControlAction.NONE;

          // TODO: Check collision with path
          if (pointer.y > boundsTop) {
            if (placeTowerKind) {
              props.addTower({
                x: pointer.x,
                y: pointer.y,
                kind: placeTowerKind,
              });
            }
          }
          break;
        case ControlAction.SELECT_TOWER:
          action = ControlAction.NONE;
          props.selectTower(null);
        default:
          break;
      }
    }
    return { towerButtons, action, placeTowerKind };
  },

  render({ state, device }) {
    const { towerButtons, action, placeTowerKind } = state;
    const { size, inputs } = device;
    const { pointer } = inputs;

    const selectedTower =
      action == ControlAction.PLACE_TOWER && placeTowerKind
        ? [
            t.circle({
              radius: getTowerData(placeTowerKind).range,
              color: "rebeccapurple",
              opacity: 0.4,
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
      ...towerButtons.map(({ kind, x, y }) =>
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
