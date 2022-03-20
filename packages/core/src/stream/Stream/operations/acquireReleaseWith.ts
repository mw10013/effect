import type { LazyArg } from "../../../data/Function"
import type { Effect, RIO } from "../../../io/Effect"
import { Managed } from "../../../io/Managed"
import { Stream } from "../definition"

/**
 * Creates a stream from a single value that will get cleaned up after the
 * stream is consumed.
 *
 * @tsplus static ets/StreamOps acquireReleaseWith
 */
export function acquireReleaseWith<R, E, A, R2, Z>(
  acquire: LazyArg<Effect<R, E, A>>,
  release: (a: A) => RIO<R2, Z>,
  __tsplusTrace?: string
): Stream<R & R2, E, A> {
  return Stream.managed(Managed.acquireReleaseWith(acquire(), release))
}