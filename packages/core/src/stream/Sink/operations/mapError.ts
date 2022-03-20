import type { Sink } from "../definition"
import { concreteSink, SinkInternal } from "./_internal/SinkInternal"

/**
 * Transforms the errors emitted by this sink using `f`.
 *
 * @tsplus fluent ets/Sink mapError
 */
export function mapError_<R, E, E2, In, L, Z>(
  self: Sink<R, E, In, L, Z>,
  f: (z: E) => E2,
  __tsplusTrace?: string
): Sink<R, E2, In, L, Z> {
  concreteSink(self)
  return new SinkInternal(self.channel.mapError(f))
}

/**
 * Transforms the errors emitted by this sink using `f`.
 */
export const mapError = Pipeable(mapError_)