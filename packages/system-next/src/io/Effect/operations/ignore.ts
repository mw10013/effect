import { constVoid } from "../../../data/Function"
import type { Effect, RIO } from "../definition"

/**
 * Returns a new effect that ignores the success or failure of this effect.
 *
 * @ets fluent ets/Effect ignore
 */
export function ignore<R, E, A>(
  self: Effect<R, E, A>,
  __etsTrace?: string
): RIO<R, void> {
  return self.fold(constVoid, constVoid)
}