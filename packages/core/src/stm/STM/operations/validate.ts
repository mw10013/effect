import { Chunk } from "../../../collection/immutable/Chunk"
import type { NonEmptyArray } from "../../../collection/immutable/NonEmptyArray"
import * as NA from "../../../collection/immutable/NonEmptyArray"
import type { LazyArg } from "../../../data/Function"
import { STM } from "../definition"

/**
 * Feeds elements of type `A` to `f` and accumulates all errors in error
 * channel or successes in success channel.
 *
 * This combinator is lossy meaning that if there are errors all successes
 * will be lost. To retain all information please use `partition`.
 *
 * @tsplus static ets/STMOps validate
 */
export function validate<R, E, A, B>(
  as: LazyArg<Iterable<A>>,
  f: (a: A) => STM<R, E, B>
): STM<R, NonEmptyArray<E>, Chunk<B>> {
  return STM.partition(as, f).flatMap(({ tuple: [es, bs] }) =>
    es.isEmpty()
      ? STM.succeedNow(Chunk.from(bs))
      : STM.fail(NA.prepend_(es.tail().toArray(), es.unsafeFirst()!))
  )
}