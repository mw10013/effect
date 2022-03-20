import { Chunk } from "../../../src/collection/immutable/Chunk"
import { Tuple } from "../../../src/collection/immutable/Tuple"
import { Either } from "../../../src/data/Either"
import { Option } from "../../../src/data/Option"
import { Effect } from "../../../src/io/Effect"
import { Promise } from "../../../src/io/Promise"
import { Queue } from "../../../src/io/Queue"
import { Stream } from "../../../src/stream/Stream"
import type { Take } from "../../../src/stream/Take"

describe("Stream", () => {
  describe("zipAllSortedByKeyWith", () => {
    // TODO(Mike/Max): implement after Gen
    it.skip("zips and sorts by keys", async () => {
      // val genSortedByKey = for {
      //   map    <- Gen.mapOf(Gen.int(1, 100), Gen.int(1, 100))
      //   chunk   = Chunk.fromIterable(map).sorted
      //   chunks <- splitChunks(Chunk(chunk))
      // } yield chunks
      // check(genSortedByKey, genSortedByKey) { (as, bs) =>
      //   val left   = ZStream.fromChunks(as: _*)
      //   val right  = ZStream.fromChunks(bs: _*)
      //   val actual = left.zipAllSortedByKeyWith(right)(identity, identity)(_ + _)
      //   val expected = Chunk.fromIterable {
      //     as.flatten.toMap.foldLeft(bs.flatten.toMap) { case (map, (k, v)) =>
      //       map.get(k).fold(map + (k -> v))(v1 => map + (k -> (v + v1)))
      //     }
      //   }.sorted
      //   assertM(actual.runCollect)(equalTo(expected))
      // }
    })
  })

  describe("zip", () => {
    it("doesn't pull too much when one of the streams is done", async () => {
      const left =
        Stream.fromChunks(Chunk(1, 2), Chunk(3, 4), Chunk(5)) +
        Stream.fail("nothing to see here")
      const right = Stream.fromChunks(Chunk("a", "b"), Chunk("c"))
      const program = left.zip(right).runCollect()

      const result = await program.unsafeRunPromise()

      expect(result.toArray()).toEqual([Tuple(1, "a"), Tuple(2, "b"), Tuple(3, "c")])
    })

    it("equivalence with Chunk.zip", async () => {
      const left = Chunk(Chunk(1, 2), Chunk(3, 4), Chunk(5))
      const right = Chunk(Chunk(6, 7), Chunk(8, 9), Chunk(10))
      const program = Effect.struct({
        chunkResult: Effect.succeed(left.flatten().zip(right.flatten())),
        streamResult: Stream.fromChunks(...left)
          .zip(Stream.fromChunks(...right))
          .runCollect()
      })

      const { chunkResult, streamResult } = await program.unsafeRunPromise()

      expect(streamResult.toArray()).toEqual(chunkResult.toArray())
    })
  })

  describe("zipWith", () => {
    it("prioritizes failure", async () => {
      const program = Stream.never
        .zipWith(Stream.fail("ouch"), () => Option.none)
        .runCollect()
        .either()

      const result = await program.unsafeRunPromise()

      expect(result).toEqual(Either.left("ouch"))
    })
  })

  describe("zipAll", () => {
    it("prioritizes failure", async () => {
      const program = Stream.never
        .zipAll(Stream.fail("ouch"), Option.none, Option.none)
        .runCollect()
        .either()

      const result = await program.unsafeRunPromise()

      expect(result).toEqual(Either.left("ouch"))
    })
  })

  describe("zipAllWith", () => {
    it("simple example", async () => {
      const left = Chunk(Chunk(1, 2), Chunk(3, 4), Chunk(5))
      const right = Chunk(Chunk(6, 7), Chunk(8, 9), Chunk(10))
      const program = Stream.fromChunks(...left)
        .map(Option.some)
        .zipAll(Stream.fromChunks(...right).map(Option.some), Option.none, Option.none)
        .runCollect()

      const result = await program.unsafeRunPromise()
      const expected = left.flatten().zipAllWith(
        right.flatten(),
        (a, b) => Tuple(Option.some(a), Option.some(b)),
        (a) => Tuple(Option.some(a), Option.none),
        (b) => Tuple(Option.none, Option.some(b))
      )

      expect(result.toArray()).toEqual(expected.toArray())
    })
  })

  describe("zipWithIndex", () => {
    it("equivalence with Chunk.zipWithIndex", async () => {
      const stream = Stream.range(0, 5)
      const program = Effect.struct({
        streamResult: stream.zipWithIndex().runCollect(),
        chunkResult: stream.runCollect().map((chunk) => chunk.zipWithIndex())
      })

      const { chunkResult, streamResult } = await program.unsafeRunPromise()

      expect(streamResult.toArray()).toEqual(chunkResult.toArray())
    })
  })

  describe("zipWithLatest", () => {
    it("succeed", async () => {
      const program = Effect.Do()
        .bind("left", () => Queue.unbounded<Chunk<number>>())
        .bind("right", () => Queue.unbounded<Chunk<number>>())
        .bind("out", () => Queue.bounded<Take<never, Tuple<[number, number]>>>(1))
        .tap(({ left, out, right }) =>
          Stream.fromChunkQueue(left)
            .zipWithLatest(Stream.fromChunkQueue(right), (a, b) => Tuple(a, b))
            .runIntoQueue(out)
            .fork()
        )
        .tap(({ left }) => left.offer(Chunk.single(0)))
        .tap(({ right }) => right.offerAll(Chunk(Chunk.single(0), Chunk.single(1))))
        .bind("chunk1", ({ out }) =>
          out
            .take()
            .flatMap((take) => take.done())
            .replicateEffect(2)
            .map((chunk) => chunk.flatten())
        )
        .tap(({ left }) => left.offerAll(Chunk(Chunk.single(1), Chunk.single(2))))
        .bind("chunk2", ({ out }) =>
          out
            .take()
            .flatMap((take) => take.done())
            .replicateEffect(2)
            .map((chunk) => chunk.flatten())
        )

      const { chunk1, chunk2 } = await program.unsafeRunPromise()

      expect(chunk1.toArray()).toEqual([Tuple(0, 0), Tuple(0, 1)])
      expect(chunk2.toArray()).toEqual([Tuple(1, 1), Tuple(2, 1)])
    })

    it("handle empty pulls properly - 1", async () => {
      const stream0 = Stream.fromChunks(
        Chunk.empty<number>(),
        Chunk.empty<number>(),
        Chunk.single(2)
      )
      const stream1 = Stream.fromChunks(Chunk.single(1), Chunk.single(1))
      const program = Effect.Do()
        .bind("promise", () => Promise.make<never, number>())
        .bind("latch", () => Promise.make<never, void>())
        .bind("fiber", ({ latch, promise }) =>
          (stream0 + Stream.fromEffect(promise.await()) + Stream(2))
            .zipWithLatest(
              Stream(1, 1).ensuring(latch.succeed(undefined)) + stream1,
              (_, n) => n
            )
            .take(3)
            .runCollect()
            .fork()
        )
        .tap(({ latch }) => latch.await())
        .tap(({ promise }) => promise.succeed(2))
        .flatMap(({ fiber }) => fiber.join())

      const result = await program.unsafeRunPromise()

      expect(result.toArray()).toEqual([1, 1, 1])
    })

    it("handle empty pulls properly - 2", async () => {
      const program = Stream.unfold(0, (n) =>
        Option.some(Tuple(n < 3 ? Chunk.empty<number>() : Chunk.single(2), n + 1))
      )
        .flattenChunks()
        .forever()
        .zipWithLatest(Stream(1).forever(), (_, n) => n)
        .take(3)
        .runCollect()

      const result = await program.unsafeRunPromise()

      expect(result.toArray()).toEqual([1, 1, 1])
    })

    // TODO(Mike/Max): implement after Gen
    it.skip("preserves partial ordering of stream elements", async () => {
      // val genSortedStream = for {
      //   chunk  <- Gen.chunkOf(Gen.int(1, 100)).map(_.sorted)
      //   chunks <- splitChunks(Chunk(chunk))
      // } yield ZStream.fromChunks(chunks: _*)
      // check(genSortedStream, genSortedStream) { (left, right) =>
      //   for {
      //     out <- left.zipWithLatest(right)(_ + _).runCollect
      //   } yield assert(out)(isSorted)
      // }
    })
  })

  describe("zipWithNext", () => {
    it("should zip with next element for a single chunk", async () => {
      const program = Stream(1, 2, 3).zipWithNext().runCollect()

      const result = await program.unsafeRunPromise()

      expect(result.toArray()).toEqual([
        Tuple(1, Option.some(2)),
        Tuple(2, Option.some(3)),
        Tuple(3, Option.none)
      ])
    })

    it("should work with multiple chunks", async () => {
      const program = Stream.fromChunks(
        Chunk.single(1),
        Chunk.single(2),
        Chunk.single(3)
      )
        .zipWithNext()
        .runCollect()

      const result = await program.unsafeRunPromise()

      expect(result.toArray()).toEqual([
        Tuple(1, Option.some(2)),
        Tuple(2, Option.some(3)),
        Tuple(3, Option.none)
      ])
    })

    it("should play well with empty streams", async () => {
      const program = Stream.empty.zipWithNext().runCollect()

      const result = await program.unsafeRunPromise()

      expect(result.toArray()).toEqual([])
    })

    it("should output same values as zipping with tail plus last element", async () => {
      const chunks = Chunk(Chunk(1, 2), Chunk(3, 4), Chunk(5, 6, 7), Chunk(8))
      const stream = Stream.fromChunks(...chunks)
      const program = Effect.struct({
        result0: stream
          .zipWithNext()
          .runCollect()
          .map((chunk) => chunk.toArray()),
        result1: stream
          .zipAll(stream.drop(1).map(Option.some), 0, Option.none)
          .runCollect()
          .map((chunk) => chunk.toArray())
      })

      const { result0, result1 } = await program.unsafeRunPromise()

      expect(result0).toEqual(result1)
    })
  })

  describe("zipWithPrevious", () => {
    it("should zip with previous element for a single chunk", async () => {
      const program = Stream(1, 2, 3).zipWithPrevious().runCollect()

      const result = await program.unsafeRunPromise()

      expect(result.toArray()).toEqual([
        Tuple(Option.none, 1),
        Tuple(Option.some(1), 2),
        Tuple(Option.some(2), 3)
      ])
    })

    it("should work with multiple chunks", async () => {
      const program = Stream.fromChunks(
        Chunk.single(1),
        Chunk.single(2),
        Chunk.single(3)
      )
        .zipWithPrevious()
        .runCollect()

      const result = await program.unsafeRunPromise()

      expect(result.toArray()).toEqual([
        Tuple(Option.none, 1),
        Tuple(Option.some(1), 2),
        Tuple(Option.some(2), 3)
      ])
    })

    it("should play well with empty streams", async () => {
      const program = Stream.empty.zipWithPrevious().runCollect()

      const result = await program.unsafeRunPromise()

      expect(result.toArray()).toEqual([])
    })

    it("should output same values as first element plus zipping with init", async () => {
      const chunks = Chunk(Chunk(1, 2), Chunk(3, 4), Chunk(5, 6, 7), Chunk(8))
      const stream = Stream.fromChunks(...chunks)
      const program = Effect.struct({
        result0: stream
          .zipWithPrevious()
          .runCollect()
          .map((chunk) => chunk.toArray()),
        result1: (Stream(Option.none) + stream.map(Option.some))
          .zip(stream)
          .runCollect()
          .map((chunk) => chunk.toArray())
      })

      const { result0, result1 } = await program.unsafeRunPromise()

      expect(result0).toEqual(result1)
    })
  })

  describe("zipWithPreviousAndNext", () => {
    it("succeed", async () => {
      const program = Stream(1, 2, 3).zipWithPreviousAndNext().runCollect()

      const result = await program.unsafeRunPromise()

      expect(result.toArray()).toEqual([
        Tuple(Option.none, 1, Option.some(2)),
        Tuple(Option.some(1), 2, Option.some(3)),
        Tuple(Option.some(2), 3, Option.none)
      ])
    })

    it("should output same values as zipping with both previous and next element", async () => {
      const chunks = Chunk(Chunk(1, 2), Chunk(3, 4), Chunk(5, 6, 7), Chunk(8))
      const stream = Stream.fromChunks(...chunks)
      const program = Effect.struct({
        result0: stream
          .zipWithPreviousAndNext()
          .runCollect()
          .map((chunk) => chunk.toArray()),
        result1: (Stream(Option.none) + stream.map(Option.some))
          .zipFlatten(stream)
          .zipFlatten(stream.drop(1).map(Option.some) + Stream(Option.none))
          .runCollect()
          .map((chunk) => chunk.toArray())
      })

      const { result0, result1 } = await program.unsafeRunPromise()

      expect(result0).toEqual(result1)
    })
  })

  describe("tuple", () => {
    it("should zip the results of an arbitrary number of streams into a Tuple", async () => {
      const program = Stream.tuple(
        Stream(1, 2, 3),
        Stream("a", "b", "c"),
        Stream(true, false, true)
      ).runCollect()

      const result = await program.unsafeRunPromise()

      expect(result.toArray()).toEqual([
        Tuple(1, "a", true),
        Tuple(2, "b", false),
        Tuple(3, "c", true)
      ])
    })

    it("should terminate on exit of the shortest stream", async () => {
      const program = Stream.tuple(
        Stream(1, 2, 3),
        Stream("a", "b", "c"),
        Stream(true, false)
      ).runCollect()

      const result = await program.unsafeRunPromise()

      expect(result.toArray()).toEqual([Tuple(1, "a", true), Tuple(2, "b", false)])
    })
  })
})