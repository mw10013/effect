import type { Chunk } from "../../../collection/immutable/Chunk"
import type { Effect } from "../../../io/Effect"
import { Channel } from "../../Channel"
import type { Sink } from "../definition"
import { SinkInternal } from "./_internal/SinkInternal"

/**
 * A sink that executes the provided effectful function for every chunk fed to
 * it.
 *
 * @tsplus static ets/SinkOps forEachChunk
 */
export function forEachChunk<R, E, In, Z>(
  f: (input: Chunk<In>) => Effect<R, E, Z>,
  __tsplusTrace?: string
): Sink<R, E, In, never, void> {
  const process: Channel<
    R,
    E,
    Chunk<In>,
    unknown,
    E,
    never,
    void
  > = Channel.readWithCause(
    (chunk: Chunk<In>) => Channel.fromEffect(f(chunk)) > process,
    (cause) => Channel.failCause(cause),
    () => Channel.unit
  )
  return new SinkInternal(process)
}