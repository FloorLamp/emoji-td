import { makeSprite, t } from "@replay/core";

import ENEMY_DATA from "./data/enemies.json";

export interface EnemyData {
  kinds: {
    [key: string]: {
      health: number;
      speed: number;
      sprite: string;
    };
  };
}

export enum EnemyStatus {
  NOT_SPAWNED,
  ACTIVE,
  PASSED,
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
};

type EnemyProps = {
  kind: KindId;
};

export const enemyWidth = 20;
export const enemyHeight = 20;

export const getEnemyData = (data: EnemyData, kind: KindId) => data.kinds[kind];

export const Enemy = makeSprite<EnemyProps>({
  render({ props }) {
    const { kind } = props;
    return [
      t.text({
        font: { name: "Calibri", size: 24 },
        text: getEnemyData(ENEMY_DATA, kind).sprite,
        color: "#ff0000",
      }),
    ];
  },
});
