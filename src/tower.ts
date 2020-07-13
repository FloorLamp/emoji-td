import { makeSprite, t } from "@replay/core";

import TOWER_DATA from "./data/towers.json";
import { EnemyT } from "./enemy";
import { BulletT } from "./bullet";
import { Speed } from "./map";

// export type Attack = "bullet" | "other";

export interface TowerData {
  [key: string]: {
    sprite: string;
    spriteSize: number;
    cost: number;
    attack: string;
    range: number;
    delay: number;
    bullet?: {
      sprite: string;
      color?: string;
      speed: Speed;
      damage: number;
      spriteSize: number;
      hits: number;
    };
  };
}

export type TowerKindId = string;

export type TowerT = {
  readonly id: string;
  readonly kind: TowerKindId;
  x: number;
  y: number;
  isSelected: boolean;
  kills: number;
};

type TowerProps = {
  tower: TowerT;
  getEnemiesInRange: (range: number) => EnemyT[];
  fireBullet: (bullet: BulletT) => void;
};

type TowerState = {
  f: number;
  shots: number;
};

export const getTowerData = (kind: TowerKindId) =>
  (TOWER_DATA as TowerData)[kind];

export const Tower = makeSprite<TowerProps, TowerState>({
  init() {
    return {
      shots: 0,
      f: 0,
    };
  },

  loop({ props, state }) {
    const { tower, getEnemiesInRange, fireBullet } = props;
    const { id, kind, x, y } = tower;

    const { range, delay, bullet } = getTowerData(kind);
    let { shots, f } = state;
    if (f > 0) {
      f = (f + 1) % delay;
    }

    if (f === 0) {
      const targets = getEnemiesInRange(range).sort(
        (a, b) => b.distance - a.distance
      );
      if (targets.length) {
        if (bullet) {
          fireBullet({
            ...bullet,
            id: `${id}-bullet-${shots++}`,
            towerId: id,
            source: [x, y],
            target: [targets[0].x, targets[0].y],
          });
          f++;
        }
      }
    }

    return {
      shots,
      f,
    };
  },

  render({ props, state, device }) {
    const { kind, x, y, isSelected, kills } = props.tower;
    const { sprite, range } = getTowerData(kind);
    const { size } = device;
    const rangeCircle = isSelected
      ? [
          t.circle({
            radius: range,
            color: "rebeccapurple",
            opacity: 0.4,
            x,
            y,
          }),
        ]
      : [];
    const details = isSelected
      ? t.text({
          text: `Kills: ${kills}`,
          color: "black",
          x: -size.width / 2 + 10,
          y: -size.height / 2 + size.heightMargin + 80,
          align: "left",
        })
      : null;
    return [
      t.text({
        font: { name: "Calibri", size: 32 },
        text: sprite,
        color: "#000",
        x,
        y,
      }),
      ...rangeCircle,
      details,
    ];
  },
});
