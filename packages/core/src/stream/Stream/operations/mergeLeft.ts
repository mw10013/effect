import type { LazyArg } from "../../../data/Function"
import type { Stream } from "../definition"
import { TerminationStrategy } from "../TerminationStrategy"

/**
 * Merges this stream and the specified stream together, discarding the values
 * from the right stream.
 *
 * @tsplus fluent ets/Stream mergeLeft
 */
export function mergeLeft_<R, E, A, R2, E2, A2>(
  self: Stream<R, E, A>,
  that: LazyArg<Stream<R2, E2, A2>>,
  strategy: LazyArg<TerminationStrategy> = () => TerminationStrategy.Both,
  __tsplusTrace?: string
): Stream<R & R2, E | E2, A> {
  return self.merge(that().drain(), strategy)
}

/**
 * Merges this stream and the specified stream together, discarding the values
 * from the right stream.
 */
export const mergeLeft = Pipeable(mergeLeft_)