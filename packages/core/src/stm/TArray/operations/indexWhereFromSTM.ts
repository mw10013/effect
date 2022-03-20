import { STM } from "../../STM"
import type { TArray } from "../definition"
import { concrete } from "./_internal/InternalTArray"

/**
 * Starting at specified index, get the index of the next entry that matches a
 * transactional predicate.
 *
 * @tsplus fluent ets/TArray indexWhereFromSTM
 */
export function indexWhereFromSTM_<E, A>(
  self: TArray<A>,
  f: (a: A) => STM<unknown, E, boolean>,
  from: number
): STM<unknown, E, number> {
  if (from < 0) {
    return STM.succeedNow(-1)
  }
  return forIndex(self, from, f)
}

/**
 * Starting at specified index, get the index of the next entry that matches a
 * transactional predicate.
 *
 * @ets_data_first indexWhereFromSTM_
 */
export function indexWhereFromSTM<E, A>(
  f: (a: A) => STM<unknown, E, boolean>,
  from: number
) {
  return (self: TArray<A>): STM<unknown, E, number> => self.indexWhereFromSTM(f, from)
}

function forIndex<E, A>(
  self: TArray<A>,
  index: number,
  f: (a: A) => STM<unknown, E, boolean>
): STM<unknown, E, number> {
  concrete(self)
  return index < self.chunk.length
    ? self.chunk
        .unsafeGet(index)!
        .get()
        .flatMap(f)
        .flatMap((result) =>
          result ? STM.succeedNow(index) : forIndex(self, index + 1, f)
        )
    : STM.succeedNow(-1)
}