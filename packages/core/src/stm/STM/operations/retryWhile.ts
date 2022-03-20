import type { Predicate } from "../../../data/Function"
import { Option } from "../../../data/Option"
import type { STM } from "../definition"

/**
 * Filters the value produced by this effect, retrying the transaction while
 * the predicate returns true for the value.
 *
 * @tsplus fluent ets/STM retryWhile
 */
export function retryWhile_<R, E, A>(
  self: STM<R, E, A>,
  f: Predicate<A>
): STM<R, E, A> {
  return self.continueOrRetry((a) => (f(a) ? Option.none : Option.some(a)))
}

/**
 * Filters the value produced by this effect, retrying the transaction while
 * the predicate returns true for the value.
 *
 * @ets_data_first retryWhile_
 */
export function retryWhile<A>(f: Predicate<A>) {
  return <R, E>(self: STM<R, E, A>): STM<R, E, A> => self.retryWhile(f)
}