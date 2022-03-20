import type { Tuple } from "../../../collection/immutable/Tuple"
import type { Promise } from "../../../io/Promise"
import { Queue } from "../../../io/Queue"
import type { Take } from "../../Take"
import type { Stream } from "../definition"
import { bufferSignal } from "./_internal/bufferSignal"
import { concreteStream, StreamInternal } from "./_internal/StreamInternal"

/**
 * Allows a faster producer to progress independently of a slower consumer by
 * buffering up to `capacity` elements in a sliding queue.
 *
 * This combinator destroys the chunking structure. It's recommended to use
 * rechunk afterwards.
 *
 * Note: prefer capacities that are powers of 2 for better performance.
 *
 * @tsplus fluent ets/Stream bufferSliding
 */
export function bufferSliding_<R, E, A>(
  self: Stream<R, E, A>,
  capacity: number,
  __tsplusTrace?: string
): Stream<R, E, A> {
  const queue = Queue.sliding<Tuple<[Take<E, A>, Promise<never, void>]>>(
    capacity
  ).toManagedWith((queue) => queue.shutdown())
  const stream = self.rechunk(1)
  concreteStream(stream)
  return new StreamInternal(bufferSignal(queue, stream.channel))
}

/**
 * Allows a faster producer to progress independently of a slower consumer by
 * buffering up to `capacity` elements in a sliding queue.
 *
 * This combinator destroys the chunking structure. It's recommended to use
 * rechunk afterwards.
 *
 * Note: prefer capacities that are powers of 2 for better performance.
 */
export const bufferSliding = Pipeable(bufferSliding_)