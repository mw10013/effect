import type { Chunk } from "../../../collection/immutable/Chunk"
import type { Tuple } from "../../../collection/immutable/Tuple"
import type { LazyArg } from "../../../data/Function"
import type { Option } from "../../../data/Option"
import { Channel } from "../../Channel"
import type { Stream } from "../definition"
import { StreamInternal } from "./_internal/StreamInternal"

/**
 * Like `unfoldChunk`, but allows the emission of values to end one step
 * further than the unfolding of the state. This is useful for embedding
 * paginated APIs, hence the name.
 *
 * @tsplus static ets/StreamOps paginateChunk
 */
export function paginateChunk<S, A>(
  s: LazyArg<S>,
  f: (s: S) => Tuple<[Chunk<A>, Option<S>]>,
  __tsplusTrace?: string
): Stream<unknown, never, A> {
  return new StreamInternal(Channel.suspend(loop(s, f)))
}

function loop<S, A>(
  s: LazyArg<S>,
  f: (s: S) => Tuple<[Chunk<A>, Option<S>]>,
  __tsplusTrace?: string
): Channel<unknown, unknown, unknown, unknown, never, Chunk<A>, unknown> {
  const {
    tuple: [as, maybeS]
  } = f(s())
  return maybeS.fold(
    Channel.write(as) > Channel.unit,
    (s) => Channel.write(as) > loop(s, f)
  )
}