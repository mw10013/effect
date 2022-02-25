import type { LazyArg } from "../../../data/Function"
import { Effect } from "../definition"

/**
 * Loops with the specified effectual function purely for its effects. The
 * moral equivalent of:
 *
 * ```typescript
 * var s = initial
 *
 * while (cont(s)) {
 *   body(s)
 *   s = inc(s)
 * }
 * ```
 *
 * @tsplus static ets/EffectOps loopDiscard
 */
export function loopDiscard<Z>(
  initial: LazyArg<Z>,
  cont: (z: Z) => boolean,
  inc: (z: Z) => Z
) {
  return <R, E, X>(
    body: (z: Z) => Effect<R, E, X>,
    __etsTrace?: string
  ): Effect<R, E, void> => {
    return Effect.suspendSucceed(() => {
      const initial0 = initial()
      return cont(initial0)
        ? body(initial0) > loopDiscard(inc(initial0), cont, inc)(body)
        : Effect.unit
    })
  }
}