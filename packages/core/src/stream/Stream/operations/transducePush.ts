import type { Chunk } from "../../../collection/immutable/Chunk"
import type { LazyArg } from "../../../data/Function"
import { Option } from "../../../data/Option"
import type { Effect } from "../../../io/Effect"
import type { Managed } from "../../../io/Managed"
import { Channel } from "../../Channel"
import type { Stream } from "../definition"
import { concreteStream, StreamInternal } from "./_internal/StreamInternal"

/**
 * Transduce a stream using a chunk processing function.
 *
 * @tsplus static ets/StreamOps transducePush
 */
export function transducePush<R2, R3, E2, In, Out>(
  push: LazyArg<
    Managed<R2, never, (input: Option<Chunk<In>>) => Effect<R3, E2, Chunk<Out>>>
  >,
  __tsplusTrace?: string
) {
  return <R, E>(stream: Stream<R, E, In>): Stream<R & R2 & R3, E | E2, Out> => {
    const channel: Channel<
      R & R2 & R3,
      E,
      Chunk<In>,
      unknown,
      E | E2,
      Chunk<Out>,
      unknown
    > = Channel.unwrapManaged(push().map((push) => pull(push)))
    concreteStream(stream)
    return new StreamInternal(stream.channel >> channel)
  }
}

function pull<R, E, E2, In, Out>(
  push: (input: Option<Chunk<In>>) => Effect<R, E2, Chunk<Out>>,
  __tsplusTrace?: string
): Channel<R, E, Chunk<In>, unknown, E | E2, Chunk<Out>, unknown> {
  return Channel.readWith(
    (input: Chunk<In>) =>
      Channel.fromEffect(push(Option.some(input))).flatMap((out) =>
        Channel.write(out)
      ) > pull<R, E, E2, In, Out>(push),
    (err) => Channel.fail(err),
    () => Channel.fromEffect(push(Option.none)).flatMap((out) => Channel.write(out))
  )
}