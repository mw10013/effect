import type { Chunk } from "../../../../collection/immutable/Chunk"
import type { Cause } from "../../../../io/Cause"
import type { SinkEndReason } from "../../SinkEndReason"

export type HandoffSignal<C, E, A> = Emit<A> | Halt<E> | End<C>

export class Emit<A> {
  readonly _tag = "Emit"
  constructor(readonly elements: Chunk<A>) {}
}

export class Halt<E> {
  readonly _tag = "Halt"
  constructor(readonly error: Cause<E>) {}
}

export class End<C> {
  readonly _tag = "End"
  constructor(readonly reason: SinkEndReason<C>) {}
}

/**
 * @tsplus type ets/Stream/HandoffSignalOps
 */
export interface HandoffSignalOps {}
export const HandoffSignal: HandoffSignalOps = {}

/**
 * @tsplus static ets/Stream/HandoffSignalOps Emit
 */
export function emit<A>(elements: Chunk<A>): HandoffSignal<never, never, A> {
  return new Emit<A>(elements)
}

/**
 * @tsplus static ets/Stream/HandoffSignalOps Halt
 */
export function halt<E>(error: Cause<E>): HandoffSignal<never, E, never> {
  return new Halt(error)
}

/**
 * @tsplus static ets/Stream/HandoffSignalOps End
 */
export function end<C>(reason: SinkEndReason<C>): HandoffSignal<C, never, never> {
  return new End(reason)
}