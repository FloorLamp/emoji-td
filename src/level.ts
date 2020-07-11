import { makeSprite, t } from "@replay/core";
import { WebInputs } from "@replay/web";
import { iOSInputs } from "@replay/swift";

import { Path, PathLengths, getPathLengths, interpolateDistance } from "./map";
import {
  Enemy,
  EnemyT,
  EnemyStatus,
  KindId as EnemyKindId,
  getEnemyData,
} from "./enemy";
import ENEMY_DATA from "./data/enemies.json";

type LevelProps = {
  level: number;
  paused: boolean;
};

type LevelState = {
  t: number;
  lives: number;
  path: Path;
  pathLengths: PathLengths;
  enemies: EnemyT[];
};

type SpawnableEnemy = {
  kind: EnemyKindId;
  delay: number;
  interval: number;
  count: number;
};

type LevelData = {
  enemies: SpawnableEnemy[];
  path: Path;
};

const levelData: LevelData[] = [
  {
    enemies: [
      {
        kind: "0",
        delay: 10,
        interval: 15,
        count: 50,
      },
      {
        kind: "1",
        delay: 100,
        interval: 30,
        count: 10,
      },
      {
        kind: "2",
        delay: 200,
        interval: 100,
        count: 5,
      },
    ],
    path: [
      [-400, 0],
      [-50, 0],
      [-50, 100],
      [-150, 100],
      [-150, -100],
      [150, -100],
      [150, 100],
      [50, 100],
      [50, 0],
      [400, 0],
    ],
  },
];

export const Level = makeSprite<LevelProps, LevelState, WebInputs | iOSInputs>({
  init({ props }) {
    const { path, enemies } = levelData[props.level];
    let enemyCount = 0;
    const enemyTs: EnemyT[] = [];
    for (const e of enemies) {
      Array.from({ length: e.count }).map((_, idx) => {
        const data = getEnemyData(ENEMY_DATA, e.kind);

        enemyTs.push({
          id: `enemy-${enemyCount}`,
          kind: e.kind,
          spawnDelay: e.delay + idx * e.interval,
          modifiers: [],
          x: path[0][0],
          y: path[0][1],
          distance: 0,
          health: data.health,
          status: EnemyStatus.NOT_SPAWNED,
          speed: data.speed,
        });
        enemyCount++;
      });
    }
    return {
      t: 0,
      lives: 100,
      path: path,
      pathLengths: getPathLengths(path),
      enemies: enemyTs,
    };
  },

  loop({ props, state }) {
    if (props.paused) {
      return state;
    }

    let { t, lives, enemies, pathLengths, path, ...rest } = state;
    t++;

    // Spawn
    enemies
      .filter((e) => e.status === EnemyStatus.NOT_SPAWNED && t >= e.spawnDelay)
      .forEach((e) => (e.status = EnemyStatus.ACTIVE));

    // Update active
    enemies
      .filter((e) => e.status === EnemyStatus.ACTIVE)
      .forEach((e) => {
        e.distance += e.speed;
        if (e.distance >= pathLengths.total) {
          lives--;
          e.status = EnemyStatus.PASSED;
          // device.audio("boop.wav").play();
          console.log(`${e.id} arrived`);
          return;
        }

        const idx = pathLengths.segments.findIndex((s) => s > e.distance);
        const segmentDistance = e.distance - pathLengths.segments[idx - 1];
        const [x, y] = interpolateDistance(
          path[idx - 1],
          path[idx],
          segmentDistance
        );
        e.x = x;
        e.y = y;
        return;
      });

    // Remove passed
    enemies = enemies.filter((e) => e.status !== EnemyStatus.PASSED);

    return { t, lives, enemies, pathLengths, path, ...rest };
  },

  render({ state, device }) {
    const { lives, enemies, path } = state;
    const { size } = device;

    return [
      t.rectangle({
        color: "#add8e6",
        width: size.width + size.widthMargin * 2,
        height: size.height + size.heightMargin * 2,
      }),
      t.line({
        color: "#aaa",
        thickness: 10,
        path,
      }),
      ...enemies
        .filter((e) => e.status === EnemyStatus.ACTIVE)
        .map(({ id, kind, x, y }) => Enemy({ id, kind, x, y })),
      t.text({
        text: `Lives: ${lives}`,
        color: "black",
        x: -device.size.width / 2 + 10,
        y: device.size.height / 2 + device.size.heightMargin - 80,
        align: "left",
      }),
    ];
  },
});
