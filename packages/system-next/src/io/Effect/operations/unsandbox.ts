import type { Cause } from "../../Cause"
import { flatten } from "../../Cause"
import type { Effect } from "../definition"

/**
 * The inverse operation `sandbox(effect)`
 *
 * Terminates with exceptions on the `Left` side of the `Either` error, if it
 * exists. Otherwise extracts the contained `Effect< R, E, A>`
 *
 * @ets fluent ets/Effect unsandbox
 */
export function unsandbox<R, E, A>(self: Effect<R, Cause<E>, A>, __etsTrace?: string) {
  return self.mapErrorCause(flatten)
}