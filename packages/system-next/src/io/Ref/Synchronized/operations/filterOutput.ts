import type { Option } from "../../../../data/Option"
import { Effect } from "../../../Effect"
import type { XSynchronized } from "../definition"
import { filterOutputEffect_ } from "./filterOutputEffect"

/**
 * Filters the `get` value of the `XRef.Synchronized` with the specified
 * predicate, returning a `XRef.Synchronized` with a `get` value that
 * succeeds if the predicate is satisfied or else fails with `None`.
 */
export function filterOutput_<RA, RB, EA, EB, A, B>(
  self: XSynchronized<RA, RB, EA, EB, A, B>,
  f: (a: B) => boolean
): XSynchronized<RA, RB, EA, Option<EB>, A, B> {
  return filterOutputEffect_(self, (b) => Effect.succeedNow(f(b)))
}

/**
 * Filters the `get` value of the `XRef.Synchronized` with the specified
 * predicate, returning a `XRef.Synchronized` with a `get` value that
 * succeeds if the predicate is satisfied or else fails with `None`.
 *
 * @ets_data_first filterOutput_
 */
export function filterOutput<B>(f: (a: B) => boolean) {
  return <RA, RB, EA, EB, A>(
    self: XSynchronized<RA, RB, EA, EB, A, B>
  ): XSynchronized<RA, RB, EA, Option<EB>, A, B> => filterOutput_(self, f)
}