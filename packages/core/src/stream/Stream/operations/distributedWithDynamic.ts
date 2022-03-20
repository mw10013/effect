import { HashMap } from "../../../collection/immutable/HashMap"
import { List } from "../../../collection/immutable/List"
import { Tuple } from "../../../collection/immutable/Tuple"
import { Option } from "../../../data/Option"
import type { UIO } from "../../../io/Effect"
import { Effect } from "../../../io/Effect"
import { Exit } from "../../../io/Exit"
import { Managed } from "../../../io/Managed"
import type { Dequeue } from "../../../io/Queue"
import { Queue } from "../../../io/Queue"
import { Ref } from "../../../io/Ref"
import { Semaphore } from "../../../io/Semaphore"
import { AtomicNumber } from "../../../support/AtomicNumber"
import type { UniqueKey } from "../../GroupBy"
import type { Stream } from "../definition"

const distributedWithDynamicId = new AtomicNumber(0)

/**
 * More powerful version of `Stream.distributedWith`. This returns a function
 * that will produce new queues and corresponding indices. You can also provide
 * a function that will be executed after the final events are enqueued in all
 * queues. Shutdown of the queues is handled by the driver. Downstream users can
 * also shutdown queues manually. In this case the driver will continue but no
 * longer backpressure on them.
 *
 * @tsplus fluent ets/Stream distributedWithDynamic
 */
export function distributedWithDynamic_<R, E, A, Z>(
  self: Stream<R, E, A>,
  maximumLag: number,
  decide: (a: A) => UIO<(key: UniqueKey) => boolean>,
  done: (exit: Exit<Option<E>, never>) => UIO<Z> = () => Effect.unit as UIO<Z>,
  __tsplusTrace?: string
): Managed<R, never, UIO<Tuple<[UniqueKey, Dequeue<Exit<Option<E>, A>>]>>> {
  return Managed.Do()
    .bind("queuesRef", () =>
      Ref.make<HashMap<UniqueKey, Queue<Exit<Option<E>, A>>>>(
        HashMap.empty()
      ).toManagedWith((ref) =>
        ref
          .get()
          .flatMap((queues) => Effect.forEach(queues, ([, queue]) => queue.shutdown()))
      )
    )
    .bind("add", ({ queuesRef }) =>
      Managed.Do()
        .bind("queuesLock", () => Semaphore.make(1).toManaged())
        .bind("newQueue", () =>
          Ref.make<UIO<Tuple<[UniqueKey, Queue<Exit<Option<E>, A>>]>>>(
            Effect.Do()
              .bind("queue", () => Queue.bounded<Exit<Option<E>, A>>(maximumLag))
              .bind("id", () =>
                Effect.succeed(distributedWithDynamicId.incrementAndGet())
              )
              .tap(({ id, queue }) => queuesRef.update((map) => map.set(id, queue)))
              .map(({ id, queue }) => Tuple(id, queue))
          ).toManaged()
        )
        .bindValue(
          "finalize",
          ({ newQueue, queuesLock }) =>
            (endTake: Exit<Option<E>, never>) =>
              // Make sure that no queues are currently being added
              queuesLock.withPermit(
                Effect.Do()
                  .tap(() =>
                    // All newly created queues should end immediately
                    newQueue.set(
                      Effect.Do()
                        .bind("queue", () => Queue.bounded<Exit<Option<E>, A>>(1))
                        .tap(({ queue }) => queue.offer(endTake))
                        .bind("id", () =>
                          Effect.succeed(distributedWithDynamicId.incrementAndGet())
                        )
                        .tap(({ id, queue }) =>
                          queuesRef.update((map) => map.set(id, queue))
                        )
                        .map(({ id, queue }) => Tuple(id, queue))
                    )
                  )
                  .bind("queues", () => queuesRef.get().map((map) => map.values()))
                  .tap(({ queues }) =>
                    Effect.forEach(queues, (queue) =>
                      queue
                        .offer(endTake)
                        .catchSomeCause((cause) =>
                          cause.isInterrupted() ? Option.some(Effect.unit) : Option.none
                        )
                    )
                  )
                  .tap(() => done(endTake))
                  .asUnit()
              )
        )
        .tap(({ finalize }) =>
          self
            .runForEachManaged((a) => offer(queuesRef, decide, a))
            .foldCauseManaged(
              (cause) => finalize(Exit.failCause(cause.map(Option.some))).toManaged(),
              () => finalize(Exit.fail(Option.none)).toManaged()
            )
            .fork()
        )
        .map(({ newQueue, queuesLock }) =>
          queuesLock.withPermit(newQueue.get().flatten())
        )
    )
    .map(({ add }) => add)
}

/**
 * More powerful version of `Stream.distributedWith`. This returns a function
 * that will produce new queues and corresponding indices. You can also provide
 * a function that will be executed after the final events are enqueued in all
 * queues. Shutdown of the queues is handled by the driver. Downstream users can
 * also shutdown queues manually. In this case the driver will continue but no
 * longer backpressure on them.
 */
export const distributedWithDynamic = Pipeable(distributedWithDynamic_)

function offer<E, A>(
  ref: Ref<HashMap<UniqueKey, Queue<Exit<Option<E>, A>>>>,
  decide: (a: A) => UIO<(key: UniqueKey) => boolean>,
  a: A,
  __tsplusTrace?: string
): Effect<unknown, E, void> {
  return Effect.Do()
    .bind("shouldProcess", () => decide(a))
    .bind("queues", () => ref.get())
    .tap(({ queues, shouldProcess }) =>
      Effect.reduce(queues, List.empty<UniqueKey>(), (acc, [id, queue]) =>
        shouldProcess(id)
          ? queue.offer(Exit.succeed(a)).foldCauseEffect(
              (cause) =>
                // Ignore all downstream queues that were shut down and remove
                // them later
                cause.isInterrupted()
                  ? Effect.succeedNow(acc.prepend(id))
                  : Effect.failCause(cause),
              () => Effect.succeedNow(acc)
            )
          : Effect.succeedNow(acc)
      ).flatMap((ids) =>
        ids.isEmpty() ? Effect.unit : ref.update((map) => map.removeMany(ids))
      )
    )
}