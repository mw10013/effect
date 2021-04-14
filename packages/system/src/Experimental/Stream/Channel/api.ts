// tracing: off

import "../../../Operator"

import * as Cause from "../../../Cause"
import * as T from "../../../Effect"
import * as E from "../../../Either"
import * as M from "../../../Managed"
import type { ChannelState } from "./_internal/executor"
import {
  ChannelExecutor,
  ChannelStateDoneTypeId,
  ChannelStateEffectTypeId,
  ChannelStateEmitTypeId
} from "./_internal/executor"
import * as C from "./core"

function runManagedInterpret<Env, InErr, InDone, OutErr, OutDone>(
  channelState: ChannelState<Env, OutErr>,
  exec: ChannelExecutor<Env, InErr, unknown, InDone, OutErr, never, OutDone>
): T.Effect<Env, OutErr, OutDone> {
  // eslint-disable-next-line no-constant-condition
  while (1) {
    switch (channelState._typeId) {
      case ChannelStateEffectTypeId: {
        return T.chain_(channelState.effect, () =>
          runManagedInterpret(exec.run(), exec)
        )
      }
      case ChannelStateEmitTypeId: {
        channelState = exec.run()
        break
      }
      case ChannelStateDoneTypeId: {
        return T.done(exec.getDone())
      }
    }
  }
  throw new Error("Bug")
}

/**
 * Runs a channel until the end is received
 */
export function runManaged<Env, InErr, InDone, OutErr, OutDone>(
  self: C.Channel<Env, InErr, unknown, InDone, OutErr, never, OutDone>
): M.Managed<Env, OutErr, OutDone> {
  return M.mapM_(
    M.makeExit_(
      T.succeedWith(() => new ChannelExecutor(() => self, undefined)),
      (exec, exit) => exec.close(exit) || T.unit
    ),
    (exec) => T.suspend(() => runManagedInterpret(exec.run(), exec))
  )
}

function toPullInterpret<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  channelState: ChannelState<Env, OutErr>,
  exec: ChannelExecutor<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>
): T.Effect<Env, E.Either<OutErr, OutDone>, OutElem> {
  switch (channelState._typeId) {
    case ChannelStateEffectTypeId: {
      return T.chain_(T.mapError_(channelState.effect, E.left), () =>
        toPullInterpret(exec.run(), exec)
      )
    }
    case ChannelStateEmitTypeId: {
      return T.succeed(exec.getEmit())
    }
    case ChannelStateDoneTypeId: {
      const done = exec.getDone()
      if (done._tag === "Success") {
        return T.fail(E.right(done.value))
      } else {
        return T.halt(Cause.map_(done.cause, E.left))
      }
    }
  }
}

/**
 * Interpret a channel to a managed Pull
 */
export function toPull<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  self: C.Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>
): M.Managed<Env, never, T.Effect<Env, E.Either<OutErr, OutDone>, OutElem>> {
  return M.map_(
    M.makeExit_(
      T.succeedWith(() => new ChannelExecutor(() => self, undefined)),
      (exec, exit) => exec.close(exit) || T.unit
    ),
    (exec) => T.suspend(() => toPullInterpret(exec.run(), exec))
  )
}

/**
 * Runs a channel until the end is received
 */
export function run<Env, InErr, InDone, OutErr, OutDone>(
  self: C.Channel<Env, InErr, unknown, InDone, OutErr, never, OutDone>
): T.Effect<Env, OutErr, OutDone> {
  return M.useNow(runManaged(self))
}

/**
 * Runs a channel until the end is received
 */
export function runDrain<Env, InErr, InDone, OutElem, OutErr, OutDone>(
  self: C.Channel<Env, InErr, unknown, InDone, OutErr, OutElem, OutDone>
): T.Effect<Env, OutErr, OutDone> {
  return run(C.drain(self))
}

/**
 * Maps the output of this channel using f
 */
export function mapOut_<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone, OutElem2>(
  self: C.Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>,
  f: (o: OutElem) => OutElem2
): C.Channel<Env, InErr, InElem, InDone, OutErr, OutElem2, OutDone> {
  const reader: C.Channel<
    Env,
    OutErr,
    OutElem,
    OutDone,
    OutErr,
    OutElem2,
    OutDone
  > = C.readWithCause((i) => C.chain_(C.write(f(i)), () => reader), C.halt, C.end)

  return self[">>>"](reader)
}

/**
 * Maps the output of this channel using f
 *
 * @dataFirst mapOut_
 */
export function mapOut<OutElem, OutElem2>(
  f: (o: OutElem) => OutElem2
): <Env, InErr, InElem, InDone, OutErr, OutDone>(
  self: C.Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>
) => C.Channel<Env, InErr, InElem, InDone, OutErr, OutElem2, OutDone> {
  return (self) => mapOut_(self, f)
}

/**
 * Repeats this channel forever
 */
export function repeated<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>(
  self: C.Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone>
): C.Channel<Env, InErr, InElem, InDone, OutErr, OutElem, OutDone> {
  return C.chain_(self, () => repeated(self))
}