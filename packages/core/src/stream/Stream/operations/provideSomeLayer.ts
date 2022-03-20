import type { Erase } from "../../../data/Utils"
import { Layer } from "../../../io/Layer"
import type { Stream } from "../definition"

/**
 * Splits the environment into two parts, providing one part using the
 * specified layer and leaving the remainder.
 *
 * @tsplus fluent ets/Stream provideSomeLayer
 */
export function provideSomeLayer_<R, E, A, R1, E1, A1>(
  self: Stream<R, E, A>,
  layer: Layer<R1, E1, A1>,
  __tsplusTrace?: string
): Stream<R1 & Erase<R, A1>, E | E1, A> {
  // @ts-expect-error
  return self.provideLayer(Layer.environment<R1>().and(layer))
}

export const provideSomeLayer = Pipeable(provideSomeLayer_)