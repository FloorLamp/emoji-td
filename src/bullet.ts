import { makeSprite, t } from "@replay/core";
import {
  Point,
  Speed,
  getVelocityVector,
  isWithinSquare,
  isWithinCircle,
} from "./utils.js/math";
import { EnemyT, getEnemyData } from "./enemy";

export type BulletT = {
  readonly id: string;
  readonly towerId: string;
  sprite: string;
  color?: string;
  spriteSize: number;
  source: Point;
  target: Point;
  speed: Speed;
  damage: number;
  hits: number;
  splash?: boolean;
  splashRadius?: number;
};

type BulletProps = {
  bullet: BulletT;
  getNearbyEnemies: () => EnemyT[];
  hit: (enemy: EnemyT) => void;
  die: () => void;
};

enum BulletStatus {
  DEFAULT,
  DEATH_START,
  DEATH_END,
}

type BulletState = {
  status: BulletStatus;
  x: number;
  y: number;
  dx: number;
  dy: number;
  hits: number;
  deathFrame: number;
};

const DEATH_ANIMATION_FRAMES = 10;

export const Bullet = makeSprite<BulletProps, BulletState>({
  init({ props }) {
    const { source, target, speed, hits } = props.bullet;
    const v = getVelocityVector(source, target, speed);
    return {
      status: BulletStatus.DEFAULT,
      x: source[0],
      y: source[1],
      dx: v[0],
      dy: v[1],
      hits,
      deathFrame: 0,
    };
  },

  loop({ props, state, device }) {
    const { bullet, getNearbyEnemies, hit, die } = props;
    const { splash, splashRadius } = bullet;
    let { status, x, y, hits, deathFrame } = state;
    const { dx, dy } = state;
    const { size } = device;
    const xBounds = (size.width + size.widthMargin * 2) / 2;
    const yBounds = (size.height + size.heightMargin * 2) / 2;

    if (status === BulletStatus.DEFAULT) {
      x += dx;
      y += dy;

      if (x > xBounds || x < -xBounds || y > yBounds || y < -yBounds) {
        die();
        return state;
      }

      const enemies = getNearbyEnemies();
      for (const enemy of enemies) {
        const { size } = getEnemyData(enemy.kind);
        if (
          enemy.health > 0 &&
          isWithinSquare([x, y], [enemy.x, enemy.y], size / 2)
        ) {
          hits--;
          if (splash && splashRadius != null) {
            for (const splashed of enemies.filter((e) =>
              isWithinCircle([e.x, e.y], [x, y], splashRadius)
            )) {
              hit(splashed);
            }
          } else {
            hit(enemy);
          }

          if (hits === 0) {
            status = BulletStatus.DEATH_START;
            break;
          }
        }
      }
    } else if (status === BulletStatus.DEATH_START) {
      if (!splash) {
        status = BulletStatus.DEATH_END;
      } else {
        deathFrame++;

        if (deathFrame >= DEATH_ANIMATION_FRAMES) {
          status = BulletStatus.DEATH_END;
          deathFrame = DEATH_ANIMATION_FRAMES;
        }
      }
    }

    if (status === BulletStatus.DEATH_END) {
      die();
    }

    return {
      status,
      x,
      y,
      dx,
      dy,
      hits,
      deathFrame,
    };
  },

  render({ props, state }) {
    const { color, sprite, spriteSize, splash, splashRadius } = props.bullet;
    const { status, x, y, deathFrame } = state;

    if (status === BulletStatus.DEATH_START) {
      if (splash && splashRadius != null) {
        return [
          t.circle({
            x,
            y,
            radius: splashRadius,
            color: "red",
            opacity:
              (0.25 * (DEATH_ANIMATION_FRAMES - deathFrame)) /
              DEATH_ANIMATION_FRAMES,
          }),
          t.text({
            font: { name: "Calibri", size: spriteSize },
            text: "💥",
            color: "black",
            x,
            y,
            opacity:
              (DEATH_ANIMATION_FRAMES - deathFrame) / DEATH_ANIMATION_FRAMES,
          }),
        ];
      } else {
        return [];
      }
    } else if (status === BulletStatus.DEFAULT) {
      return [
        t.text({
          font: { name: "Calibri", size: spriteSize },
          text: sprite,
          color: color || "#000",
          x,
          y,
        }),
      ];
    } else {
      return [];
    }
  },
});
