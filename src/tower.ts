import { makeSprite, t } from "@replay/core";

import TOWER_DATA from "./data/towers.json";
import { EnemyT } from "./enemy";
import { BulletT } from "./bullet";
import { Speed } from "./map";

// export type Attack = "bullet" | "other";

export interface TowerData {
  [key: string]: {
    sprite: string;
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
};

type TowerProps = {
  tower: TowerT;
  getEnemiesInRange: () => EnemyT[];
  fireBullet: (bullet: BulletT) => void;
};

type TowerState = {
  t: number;
};

export const getTowerData = (kind: TowerKindId) =>
  (TOWER_DATA as TowerData)[kind];

export const Tower = makeSprite<TowerProps, TowerState>({
  init() {
    return {
      t: 0,
    };
  },

  loop({ props, state }) {
    const {
      tower: { id, kind, x, y },
      getEnemiesInRange,
      fireBullet,
    } = props;
    const { delay, bullet } = getTowerData(kind);
    let { t } = state;
    if (t % delay === 0) {
      const targets = getEnemiesInRange().sort(
        (a, b) => b.distance - a.distance
      );
      if (targets.length) {
        if (bullet) {
          fireBullet({
            ...bullet,
            id: `${id}-bullet-${t}`,
            source: [x, y],
            target: [targets[0].x, targets[0].y],
          });
        }
      }
    }

    t++;
    return {
      t,
    };
  },

  render({ props }) {
    const { kind, x, y } = props.tower;
    return [
      t.text({
        font: { name: "Calibri", size: 32 },
        text: getTowerData(kind).sprite,
        color: "#000",
        x,
        y,
      }),
    ];
  },
});
