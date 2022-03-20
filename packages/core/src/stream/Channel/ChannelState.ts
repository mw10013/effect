import { Effect } from "../../io/Effect"
import type { Exit } from "../../io/Exit"
import { _E, _R } from "../../support/Symbols"
import type { ErasedExecutor } from "./ChannelExecutor"

export const ChannelStateSym = Symbol.for("@effect-ts/core/stream/Channel/ChannelState")
export type ChannelStateSym = typeof ChannelStateSym

/**
 * @tsplus type ets/Channel/ChannelState
 */
export interface ChannelState<R, E> {
  readonly [ChannelStateSym]: ChannelStateSym
  readonly [_R]: (_: R) => void
  readonly [_E]: () => E
}

export declare namespace ChannelState {
  type Done = ChannelStateDone
  type Emit = ChannelStateEmit
  type Effect<R, E> = ChannelStateEffect<R, E>
  type Read<R, E> = ChannelStateRead<R, E>
}

export abstract class ChannelStateBase<R, E> implements ChannelState<R, E> {
  readonly [ChannelStateSym]: ChannelStateSym = ChannelStateSym;
  readonly [_R]!: (_: R) => void;
  readonly [_E]!: () => E
}

export class ChannelStateDone extends ChannelStateBase<unknown, never> {
  readonly _tag = "Done"
}

export class ChannelStateEmit extends ChannelStateBase<unknown, never> {
  readonly _tag = "Emit"
}

export class ChannelStateEffect<R, E> extends ChannelStateBase<R, E> {
  readonly _tag = "Effect"
  constructor(readonly effect: Effect<R, E, unknown>) {
    super()
  }
}

export class ChannelStateRead<R, E> extends ChannelStateBase<R, E> {
  readonly _tag = "Read"
  constructor(
    readonly upstream: ErasedExecutor<R>,
    readonly onEffect: (_: Effect<R, never, void>) => Effect<R, never, void>,
    readonly onEmit: (_: unknown) => Effect<R, never, void> | undefined,
    readonly onDone: (_: Exit<unknown, unknown>) => Effect<R, never, void> | undefined
  ) {
    super()
  }
}

/**
 * @tsplus type ets/Channel/ChannelStateOps
 */
export interface ChannelStateOps {}
export const ChannelState: ChannelStateOps = {}

/**
 * @tsplus unify ets/Channel/ChannelState
 */
export function unifyChannelState<X extends ChannelState<any, any>>(
  self: X
): ChannelState<
  [X] extends [ChannelState<infer RX, any>] ? RX : never,
  [X] extends [ChannelState<any, infer EX>] ? EX : never
> {
  return self
}

/**
 * @tsplus macro remove
 */
export function concreteChannelState<R, E>(
  _: ChannelState<R, E>
): asserts _ is
  | ChannelStateDone
  | ChannelStateEmit
  | ChannelStateEffect<R, E>
  | ChannelStateRead<R, E> {
  //
}

/**
 * @tsplus static ets/Channel/ChannelStateOps Done
 */
export const channelStateDone: ChannelState<unknown, never> = new ChannelStateDone()

/**
 * @tsplus static ets/Channel/ChannelStateOps Emit
 */
export const channelStateEmit: ChannelState<unknown, never> = new ChannelStateEmit()

/**
 * @tsplus static ets/Channel/ChannelStateOps Effect
 */
export function channelStateEffect<R, E>(
  effect: Effect<R, E, unknown>
): ChannelState<R, E> {
  return new ChannelStateEffect(effect)
}

/**
 * @tsplus static ets/Channel/ChannelStateOps Read
 */
export function channelStateRead<R, _E>(
  upstream: ErasedExecutor<R>,
  onEffect: (_: Effect<R, never, void>) => Effect<R, never, void>,
  onEmit: (_: unknown) => Effect<R, never, void> | undefined,
  onDone: (_: Exit<unknown, unknown>) => Effect<R, never, void> | undefined
): ChannelState<R, _E> {
  return new ChannelStateRead(upstream, onEffect, onEmit, onDone)
}

/**
 * @tsplus fluent ets/Channel/ChannelState effectOrUnit
 */
export function effectOrUnit<R, E>(
  self: ChannelState<R, E>,
  __tsplusTrace?: string
): Effect<R, E, unknown> {
  concreteChannelState(self)
  return self._tag === "Effect" ? self.effect : Effect.unit
}

/**
 * @tsplus fluent ets/Channel/ChannelState effectOrUndefinedIgnored
 */
export function effectOrUndefinedIgnored<R, E>(
  self: ChannelState<R, E>,
  __tsplusTrace?: string
): Effect<R, never, void> | undefined {
  concreteChannelState(self)
  return self._tag === "Effect" ? self.effect.ignore().asUnit() : undefined
}