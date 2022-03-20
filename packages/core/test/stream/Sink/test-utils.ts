import type { Chunk } from "../../../src/collection/immutable/Chunk"
import { constVoid } from "../../../src/data/Function"
import { Option } from "../../../src/data/Option"
import type { UIO } from "../../../src/io/Effect"
import { Effect } from "../../../src/io/Effect"
import type { Queue } from "../../../src/io/Queue"
import { XQueueInternal } from "../../../src/io/Queue"
import { Sink } from "../../../src/stream/Sink"
import type { Stream } from "../../../src/stream/Stream"

export function findSink<A>(a: A): Sink<unknown, void, A, A, A> {
  return Sink.fold<A, Option<A>>(
    Option.none,
    (option) => option.isNone(),
    (_, v) => (a === v ? Option.some(a) : Option.none)
  ).mapEffect((option) => option.fold(Effect.fail(constVoid), Effect.succeedNow))
}

export function sinkRaceLaw<E, A, L>(
  s: Stream<unknown, never, A>,
  sink1: Sink<unknown, E, A, L, A>,
  sink2: Sink<unknown, E, A, L, A>
): UIO<boolean> {
  return Effect.struct({
    r1: s.run(sink1).either(),
    r2: s.run(sink2).either(),
    r: s.run(sink1.raceBoth(sink2)).either()
  }).map(({ r, r1, r2 }) =>
    r.fold(
      () => r1.isLeft() || r2.isLeft(),
      (v) =>
        v.fold(
          (w) => r1.isRight() && r1.right === w,
          (w) => r2.isRight() && r2.right === w
        )
    )
  )
}

export function zipParLaw<A, B, C, E>(
  s: Stream<unknown, never, A>,
  sink1: Sink<unknown, E, A, A, B>,
  sink2: Sink<unknown, E, A, A, C>
): UIO<boolean> {
  return Effect.struct({
    zb: s.run(sink1).either(),
    zc: s.run(sink2).either(),
    zbc: s.run(sink1.zipPar(sink2)).either()
  }).map(({ zb, zbc, zc }) =>
    zbc.fold(
      (e) => (zb.isLeft() && zb.left === e) || (zc.isLeft() && zc.left === e),
      ({ tuple: [b, c] }) =>
        zb.isRight() && zb.right === b && zc.isRight() && zc.right === c
    )
  )
}

export function createQueueSpy<A>(queue: Queue<A>): Queue<A> {
  return new QueueSpyImplementation(queue)
}

class QueueSpyImplementation<A> extends XQueueInternal<
  unknown,
  unknown,
  never,
  never,
  A,
  A
> {
  #isShutdown = false

  constructor(readonly queue: Queue<A>) {
    super()
  }

  _awaitShutdown: UIO<void> = this.queue.awaitShutdown()

  _capacity: number = this.queue.capacity()

  _isShutdown: UIO<boolean> = Effect.succeed(this.#isShutdown)

  _offer(a: A): Effect<unknown, never, boolean> {
    return this.queue.offer(a)
  }

  _offerAll(as: Iterable<A>): Effect<unknown, never, boolean> {
    return this.queue.offerAll(as)
  }

  _shutdown: UIO<void> = Effect.succeed(() => {
    this.#isShutdown = true
  })

  _size: UIO<number> = this.queue.size

  _take: Effect<unknown, never, A> = this.queue.take()

  _takeAll: Effect<unknown, never, Chunk<A>> = this.queue.takeAll()

  _takeUpTo(n: number): Effect<unknown, never, Chunk<A>> {
    return this.queue.takeUpTo(n)
  }
}