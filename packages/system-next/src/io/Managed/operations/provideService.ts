import type { Has, Tag } from "../../../data/Has"
import type { Erase } from "../../../data/Utils"
import { Managed } from "../definition"

/**
 * Provides the `Managed` effect with the single service it requires. If the
 * managed effect requires more than one service use `provideEnvironment`
 * instead.
 *
 * @ets fluent ets/Managed provideService
 */
export function provideService_<R, E, A, T>(
  self: Managed<R & Has<T>, E, A>,
  tag: Tag<T>,
  __etsTrace?: string
) {
  return (service: T): Managed<Erase<R & Has<T>, Has<T>>, E, A> =>
    self.provideServiceManaged(tag)(Managed.succeedNow(service))
}

/**
 * Provides the `Managed` effect with the single service it requires. If the
 * managed effect requires more than one service use `provideEnvironment`
 * instead.
 *
 * @ets_data_first provideService_
 */
export function provideService<T>(tag: Tag<T>) {
  return (service: T) =>
    <R, E, A>(
      self: Managed<R & Has<T>, E, A>
    ): Managed<Erase<R & Has<T>, Has<T>>, E, A> =>
      provideService_(self, tag)(service)
}