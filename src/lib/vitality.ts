/**
 * Vitality — the heart needs her hand.
 *
 * Whenever the story is waiting for her (the touch prompt, the holds):
 *  - before she has touched it at all, it waits patiently, then slowly fades;
 *  - once she has had her hand on it and lifts it, it goes quickly — the beat
 *    slows, the glow dims, the world stops breathing, and it stops.
 * Her touch brings it back with one strong beat.
 */
import { director } from "./director";
import { frameState as fs } from "./frame-state";
import { heartbeat } from "./heartbeat";

/** she has not touched it yet: patient */
const GRACE_FIRST = 7;
const FADE_FIRST = 12;
/** she lifted her hand: quick */
const GRACE_AFTER = 0.7;
const FADE_AFTER = 3.2;

let waitingFor = 0;
let armed = false;
let hadHand = false;

function recover(dt: number) {
  fs.neglect *= Math.exp(-dt * 4);
  if (fs.neglect < 0.001) fs.neglect = 0;
}

export function updateVitality(dt: number) {
  const wants = fs.touchEnabled || fs.holdEnabled;
  if (!wants) {
    armed = false;
    hadHand = false;
    waitingFor = 0;
    if (fs.dead) revive();
    recover(dt);
    return;
  }
  if (!armed) {
    armed = true;
    hadHand = false;
    waitingFor = 0;
  }
  if (fs.pressing) {
    hadHand = true;
    waitingFor = 0;
    if (fs.dead) revive();
    recover(dt);
    return;
  }
  waitingFor += dt;
  const grace = hadHand ? GRACE_AFTER : GRACE_FIRST;
  const fade = hadHand ? FADE_AFTER : FADE_FIRST;
  fs.neglect = Math.min(1, Math.max(fs.neglect, (waitingFor - grace) / fade));
  if (fs.neglect >= 1 && !fs.dead) {
    fs.dead = true;
    heartbeat.stop();
  }
}

/** Her touch. One strong beat, and it is alive again. */
export function revive() {
  if (!fs.dead) return;
  fs.dead = false;
  fs.neglect = Math.min(fs.neglect, 0.6);
  heartbeat.start();
  director.strongBeat(1);
}
