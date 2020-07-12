import { makeSprite, t } from "@replay/core";
import { WebInputs } from "@replay/web";
import { iOSInputs } from "@replay/swift";

import {
  Path,
  PathLengths,
  getPathLengths,
  interpolateDistance,
  isWithinCircle,
} from "./map";
import {
  Enemy,
  EnemyT,
  EnemyStatus,
  KindId as EnemyKindId,
  getEnemyData,
} from "./enemy";
import { Control } from "./control";
import { Tower, TowerT } from "./tower";
import { Bullet, BulletT } from "./bullet";
import { without, replaceBy } from "./utils.js";

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
  towers: TowerT[];
  bullets: BulletT[];
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

let enemyCount = 0;
let towerCount = 0;

export const Level = makeSprite<LevelProps, LevelState, WebInputs | iOSInputs>({
  init({ props }) {
    const { path, enemies } = levelData[props.level];
    const enemyTs: EnemyT[] = [];
    for (const e of enemies) {
      Array.from({ length: e.count }).map((_, idx) => {
        const data = getEnemyData(e.kind);

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
          lastBullet: null,
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
      towers: [],
      bullets: [],
    };
  },

  loop({ props, state }) {
    if (props.paused) {
      return state;
    }

    const { pathLengths, path, ...rest } = state;
    let { t, lives, towers, enemies } = state;
    t++;

    // Spawn
    enemies
      .filter((e) => e.status === EnemyStatus.NOT_SPAWNED && t >= e.spawnDelay)
      .forEach((e) => (e.status = EnemyStatus.ACTIVE));

    // Die
    enemies
      .filter((e) => e.status === EnemyStatus.ACTIVE && e.health <= 0)
      .forEach((e) => {
        e.status = EnemyStatus.DIEING;

        // Increment tower kill count
        if (e.lastBullet) {
          const towerIdx = towers.findIndex(
            (t) => e.lastBullet && t.id === e.lastBullet.towerId
          );
          towers = replaceBy(towers, towerIdx, {
            kills: towers[towerIdx].kills + 1,
          });
        }
      });

    // Update active
    enemies
      .filter((e) => e.status === EnemyStatus.ACTIVE)
      .forEach((e) => {
        e.distance += e.speed;
        if (e.distance >= pathLengths.total) {
          lives--;
          e.status = EnemyStatus.PASSED;
          // device.audio("boop.wav").play();
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

    return { ...rest, pathLengths, path, t, lives, enemies, towers };
  },

  render({ state, device, updateState }) {
    const { lives, enemies, path, towers, bullets } = state;
    const { size } = device;

    const dieingEnemies = enemies.filter(
      (e) => e.status === EnemyStatus.DIEING
    );
    const activeEnemies = enemies.filter(
      (e) => e.status === EnemyStatus.ACTIVE
    );

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
      ...activeEnemies.map((enemy) =>
        Enemy({
          id: enemy.id,
          enemy,
        })
      ),
      ...dieingEnemies.map((enemy) =>
        Enemy({
          id: enemy.id,
          enemy,
          die: () => {
            updateState((prevState) => ({
              ...prevState,
              enemies: without(
                prevState.enemies,
                prevState.enemies.findIndex((e) => e === enemy)
              ),
            }));
          },
        })
      ),
      ...towers.map((tower) =>
        Tower({
          id: tower.id,
          tower,
          getEnemiesInRange: (range) =>
            activeEnemies.filter((e) =>
              isWithinCircle([tower.x, tower.y], [e.x, e.y], range)
            ),
          fireBullet: (bullet) => {
            updateState((prevState) => ({
              ...prevState,
              bullets: prevState.bullets.concat([bullet]),
            }));
          },
        })
      ),
      ...bullets.map((bullet, idx) =>
        Bullet({
          id: bullet.id,
          bullet,
          getNearbyEnemies: () => activeEnemies,
          hit: (enemy) => {
            updateState((prevState) => {
              const idx = prevState.enemies.findIndex((e) => e === enemy);
              return {
                ...prevState,
                enemies: replaceBy(prevState.enemies, idx, {
                  health: enemy.health - bullet.damage,
                  lastBullet: bullet,
                }),
              };
            });
          },
          die: () => {
            updateState((prevState) => ({
              ...prevState,
              bullets: without(bullets, idx),
            }));
          },
        })
      ),
      t.text({
        text: `Lives: ${lives}`,
        color: "black",
        x: -device.size.width / 2 + 10,
        y: device.size.height / 2 + device.size.heightMargin - 80,
        align: "left",
      }),
      Control({
        id: "control",
        towers,
        addTower: ({ x, y, kind }) => {
          updateState((prevState) => {
            return {
              ...prevState,
              towers: prevState.towers.concat([
                {
                  id: `tower-${towerCount++}`,
                  kind,
                  x,
                  y,
                  isSelected: false,
                  kills: 0,
                },
              ]),
            };
          });
        },
        selectTower: (tower) => {
          updateState((prevState) => {
            const selectedIdx = prevState.towers.findIndex((t) => t.isSelected);
            let towers = replaceBy(prevState.towers, selectedIdx, {
              isSelected: false,
            });
            if (tower != null) {
              const idx = towers.findIndex((t) => t === tower);
              towers = replaceBy(towers, idx, {
                isSelected: true,
              });
            }
            return {
              ...prevState,
              towers,
            };
          });
        },
      }),
    ];
  },
});
