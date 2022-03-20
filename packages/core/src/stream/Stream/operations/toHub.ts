import type { XHub } from "../../../io/Hub"
import { Hub } from "../../../io/Hub"
import type { Managed } from "../../../io/Managed"
import type { Take } from "../../Take"
import type { Stream } from "../definition"

/**
 * Converts the stream to a managed hub of chunks. After the managed hub is
 * used, the hub will never again produce values and should be discarded.
 *
 * @tsplus fluent ets/Stream toHub
 */
export function toHub_<R, E, A>(
  self: Stream<R, E, A>,
  capacity: number,
  __tsplusTrace?: string
): Managed<R, never, XHub<never, unknown, unknown, never, never, Take<E, A>>> {
  return Hub.bounded<Take<E, A>>(capacity)
    .toManagedWith((hub) => hub.shutdown())
    .tap((hub) => self.runIntoHubManaged(hub).fork())
}

/**
 * Converts the stream to a managed hub of chunks. After the managed hub is
 * used, the hub will never again produce values and should be discarded.
 */
export const toHub = Pipeable(toHub_)