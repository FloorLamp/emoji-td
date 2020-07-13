import { makeSprite, t } from "@replay/core";
import { WebInputs } from "@replay/web";
import { iOSInputs } from "@replay/swift";

import MAP_DATA from "./data/maps.json";
import {
  Path,
  PathLengths,
  getPathLengths,
  interpolateDistance,
  isWithinCircle,
} from "./utils.js/math";
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
import { GameStatus } from ".";
import { PauseButton } from "./buttons/pause";
import { RestartButton } from "./buttons/restart";

type SpawnableEnemy = {
  kind: EnemyKindId;
  delay: number;
  interval: number;
  count: number;
};

interface MapData {
  waves: SpawnableEnemy[][];
  path: Path;
}

export const getMapData = (idx: number) => (MAP_DATA as MapData[])[idx];

type LevelProps = {
  map: number;
  status: GameStatus;
  isNewGame: boolean;
  setStatus: (status: GameStatus) => void;
  startGame: () => void;
  restartGame: () => void;
};

type LevelState = {
  wave: number;
  f: number;
  money: number;
  lives: number;
  path: Path;
  pathLengths: PathLengths;
  enemies: EnemyT[];
  towers: TowerT[];
  bullets: BulletT[];
};

let towerCount = 0;

const spawnEnemies = (map: MapData, wave: number) => {
  const enemies: EnemyT[] = [];
  for (const e of map.waves[wave]) {
    Array.from({ length: e.count }).map((_, idx) => {
      const { health, speed, money } = getEnemyData(e.kind);

      enemies.push({
        id: `enemy-${wave}-${idx}`,
        kind: e.kind,
        spawnDelay: e.delay + idx * e.interval,
        modifiers: [],
        x: map.path[0][0],
        y: map.path[0][1],
        distance: 0,
        health,
        status: EnemyStatus.NOT_SPAWNED,
        speed,
        lastBullet: null,
        money,
      });
    });
  }
  return enemies;
};

const getStateFromProps = (props: LevelProps) => {
  const { map } = props;
  const mapData = getMapData(map);
  const { path } = mapData;
  const wave = 0;

  return {
    wave,
    f: -300,
    money: 10,
    lives: 100,
    path: path,
    pathLengths: getPathLengths(path),
    enemies: spawnEnemies(mapData, wave),
    towers: [],
    bullets: [],
  };
};

export const Level = makeSprite<LevelProps, LevelState, WebInputs | iOSInputs>({
  init({ props }) {
    return getStateFromProps(props);
  },

  loop({ props, state }) {
    if (props.isNewGame) {
      props.startGame();
      return getStateFromProps(props);
    }
    if (props.status !== GameStatus.RUNNING) {
      return state;
    }

    const { pathLengths, path, ...rest } = state;
    let { f, wave, money, lives, towers, enemies } = state;

    // Next wave
    if (!enemies.length) {
      const mapData = getMapData(props.map);
      if (f > 0) {
        wave++;

        if (wave === mapData.waves.length) {
          // Last wave passed, show victory
          props.setStatus(GameStatus.VICTORY);
          return state;
        } else {
          // Delay until next wave
          f = -300;
        }
      } else if (f === 0) {
        enemies = spawnEnemies(mapData, wave);
      }
    }

    // Increment frame
    f++;

    // Spawn
    enemies
      .filter((e) => e.status === EnemyStatus.NOT_SPAWNED && f >= e.spawnDelay)
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
          money += e.money;
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

    // Defeat condition
    if (lives < 0) {
      lives = 0;
      props.setStatus(GameStatus.DEFEAT);
    }

    return {
      ...rest,
      wave,
      pathLengths,
      path,
      f,
      money,
      lives,
      enemies,
      towers,
    };
  },

  render({ props, state, device, updateState }) {
    const { wave, lives, money, enemies, path, towers, bullets } = state;
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
        text: `Wave: ${wave + 1}`,
        color: "black",
        x: -device.size.width / 2,
        y: device.size.height / 2 + device.size.heightMargin - 50,
        align: "left",
      }),
      t.text({
        text: `Lives: ${lives}`,
        color: "black",
        x: -device.size.width / 2,
        y: device.size.height / 2 + device.size.heightMargin - 65,
        align: "left",
      }),
      t.text({
        text: `Money: ${money}`,
        color: "black",
        x: -device.size.width / 2,
        y: device.size.height / 2 + device.size.heightMargin - 80,
        align: "left",
      }),
      Control({
        id: "control",
        towers,
        money,
        gameStatus: props.status,
        addTower: ({ x, y, kind, cost }) => {
          updateState((prevState) => {
            return {
              ...prevState,
              money: prevState.money - cost,
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
      PauseButton({
        id: "pause",
        gameStatus: props.status,
        setGameStatus: props.setStatus,
      }),
      RestartButton({
        id: "restart",
        restartGame: props.restartGame,
      }),
    ];
  },
});
