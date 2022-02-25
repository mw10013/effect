import type { Cause } from "../../Cause"
import { Effect } from "../definition"

/**
 * Returns an effect with its full cause of failure mapped using the specified
 * function. This can be used to transform errors while preserving the
 * original structure of `Cause`.
 *
 * See `absorb`, `sandbox`, `catchAllCause` for other functions for dealing
 * with defects.
 *
 * @tsplus fluent ets/Effect mapErrorCause
 */
export function mapErrorCause_<R, E, A, E2>(
  self: Effect<R, E, A>,
  f: (cause: Cause<E>) => Cause<E2>,
  __etsTrace?: string
): Effect<R, E2, A> {
  return self.foldCauseEffect((c) => Effect.failCauseNow(f(c)), Effect.succeedNow)
}

/**
 * Returns an effect with its full cause of failure mapped using the specified
 * function. This can be used to transform errors while preserving the
 * original structure of `Cause`.
 *
 * See `absorb`, `sandbox`, `catchAllCause` for other functions for dealing
 * with defects.
 *
 * @ets_data_first mapErrorCause_
 */
export function mapErrorCause<E, E2>(
  f: (cause: Cause<E>) => Cause<E2>,
  __etsTrace?: string
) {
  return <R, A>(self: Effect<R, E, A>): Effect<R, E2, A> => self.mapErrorCause(f)
}