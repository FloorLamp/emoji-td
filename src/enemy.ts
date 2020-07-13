import { makeSprite, t } from "@replay/core";

import ENEMY_DATA from "./data/enemies.json";
import { BulletT } from "./bullet";

export interface EnemyData {
  kinds: {
    [key: string]: {
      health: number;
      speed: number;
      sprite: string;
      size: number;
      money: number;
    };
  };
}

export enum EnemyStatus {
  NOT_SPAWNED,
  ACTIVE,
  PASSED,
  DEATH_START,
  DEAD,
}

export type Modifier = number;

export type KindId = string;

export type Kind = {
  health: number;
  speed: number;
};

export type EnemyT = {
  readonly id: string;
  readonly kind: KindId;
  readonly spawnDelay: number;

  modifiers: Modifier[];
  x: number;
  y: number;
  distance: number;
  health: number;
  status: EnemyStatus;
  speed: number;
  money: number;
  lastBullet: BulletT | null;
};

type EnemyProps = {
  enemy: EnemyT;
  // changeStatus: (status: EnemyStatus) => void;
  die?: () => void;
};

type EnemyState = {
  deathFrame: number;
};

const DEATH_ANIMATION_FRAMES = 10;

export const getEnemyData = (kind: KindId) =>
  (ENEMY_DATA as EnemyData).kinds[kind];

export const Enemy = makeSprite<EnemyProps, EnemyState>({
  init() {
    return {
      deathFrame: 0,
    };
  },

  loop({ props, state }) {
    let { deathFrame } = state;
    const { enemy, die } = props;
    const { status } = enemy;

    if (status === EnemyStatus.DEATH_START) {
      deathFrame++;

      if (die && deathFrame >= DEATH_ANIMATION_FRAMES) {
        die();
        deathFrame = DEATH_ANIMATION_FRAMES;
      }
    }

    return {
      deathFrame,
    };
  },

  render({ props, state }) {
    const {
      enemy: { kind, x, y, status },
    } = props;
    const { deathFrame } = state;
    const { sprite, size } = getEnemyData(kind);
    if (status === EnemyStatus.DEATH_START) {
      return [
        t.text({
          font: { name: "Calibri", size },
          text: "💥",
          color: "black",
          x,
          y,
          opacity:
            (DEATH_ANIMATION_FRAMES - deathFrame) / DEATH_ANIMATION_FRAMES,
        }),
      ];
    } else {
      return [
        t.text({
          font: { name: "Calibri", size },
          text: sprite,
          color: "black",
          x,
          y,
        }),
      ];
    }
  },
});
