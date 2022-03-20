import type { Chunk } from "../../../collection/immutable/Chunk"
import type { LazyArg } from "../../../data/Function"
import type { Channel } from "../../Channel"
import type { Stream } from "../definition"
import { concreteStream, StreamInternal } from "./_internal/StreamInternal"

/**
 * Pipes all values from this stream through the provided channel, passing
 * through any error emitted by this stream unchanged.
 *
 * @tsplus fluent ets/Stream pipeThroughChannelFail
 */
export function pipeThroughChannelFail_<R, E, A, R2, E2, A2>(
  self: Stream<R, E, A>,
  channel: LazyArg<Channel<R2, E, Chunk<A>, unknown, E2, Chunk<A2>, unknown>>,
  __tsplusTrace?: string
): Stream<R & R2, E | E2, A2> {
  concreteStream(self)
  return new StreamInternal(self.channel.pipeToOrFail(channel))
}

/**
 * Pipes all values from this stream through the provided channel, passing
 * through any error emitted by this stream unchanged.
 */
export const pipeThroughChannelFail = Pipeable(pipeThroughChannelFail_)