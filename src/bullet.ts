import { makeSprite, t } from "@replay/core";
import { Point, Speed, getVelocityVector } from "./map";
import { EnemyT, getEnemyData } from "./enemy";

export type BulletT = {
  readonly id: string;
  sprite: string;
  color?: string;
  spriteSize: number;
  source: Point;
  target: Point;
  speed: Speed;
  damage: number;
  hits: number;
};

type BulletProps = {
  bullet: BulletT;
  getNearbyEnemies: () => EnemyT[];
  hit: (enemy: EnemyT) => void;
  die: () => void;
};

type BulletState = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  hits: number;
};

export const Bullet = makeSprite<BulletProps, BulletState>({
  init({ props }) {
    const { source, target, speed, hits } = props.bullet;
    const v = getVelocityVector(source, target, speed);
    return { x: source[0], y: source[1], dx: v[0], dy: v[1], hits };
  },

  loop({ props, state, device }) {
    let { x, y, hits } = state;
    const { dx, dy } = state;
    const { size } = device;
    const xBounds = (size.width + size.widthMargin * 2) / 2;
    const yBounds = (size.height + size.heightMargin * 2) / 2;
    x += dx;
    y += dy;

    if (x > xBounds || x < -xBounds || y > yBounds || y < -yBounds) {
      props.die();
      return state;
    }

    const enemies = props.getNearbyEnemies();
    for (const enemy of enemies) {
      const { size } = getEnemyData(enemy.kind);
      const halfSize = size / 2;
      if (
        enemy.health > 0 &&
        x >= enemy.x - halfSize &&
        x <= enemy.x + halfSize &&
        y >= enemy.y - halfSize &&
        y <= enemy.y + halfSize
      ) {
        hits--;
        props.hit(enemy);

        if (hits === 0) {
          props.die();
          return state;
        }
      }
    }

    return {
      x,
      y,
      dx,
      dy,
      hits,
    };
  },

  render({ props, state }) {
    const { color, sprite, spriteSize } = props.bullet;
    const { x, y } = state;

    return [
      t.text({
        font: { name: "Calibri", size: spriteSize },
        text: sprite,
        color: color || "#000",
        x,
        y,
      }),
    ];
  },
});
