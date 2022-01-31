import * as O from "../../../data/Option"
import type * as Fiber from "../../Fiber"
import type { Scope } from "../../Scope"
import type { Effect, RIO } from "../definition"
import { IFork } from "../definition"

/**
 * @ets fluent ets/Effect forkIn
 */
export function forkIn_<R, E, A>(
  self: Effect<R, E, A>,
  scope: Scope,
  __etsTrace?: string
): RIO<R, Fiber.Runtime<E, A>> {
  return new IFork(self, O.some(scope), __etsTrace)
}

/**
 * @ets_data_first forkIn_
 */
export function forkIn(scope: Scope, __etsTrace?: string) {
  return <R, E, A>(self: Effect<R, E, A>): RIO<R, Fiber.Runtime<E, A>> =>
    forkIn_(self, scope)
}