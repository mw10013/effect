// ets_tracing: off

/**
 * Copyright 2020 Michael Arnaldi and the Matechs Garage Contributors.
 */
import * as A from "../Collections/Immutable/Array"
import * as R from "../Collections/Immutable/Dictionary"
import type { AnyService, Has, ServiceConstructor, Tag } from "../Has"
import { mergeEnvironments } from "../Has"
import type { UnionToIntersection } from "../Utils"
import * as As from "./core"

/**
 * Access a record of services with the required Service Entries
 */
export function accessServicesM<SS extends Record<string, Tag<any>>>(s: SS) {
  return <R = unknown, E = never, B = unknown>(
    f: (a: {
      [k in keyof SS]: [SS[k]] extends [Tag<infer T>] ? T : unknown
    }) => As.Async<R, E, B>
  ) =>
    As.accessM(
      (
        r: UnionToIntersection<
          {
            [k in keyof SS]: [SS[k]] extends [Tag<infer T>] ? Has<T> : unknown
          }[keyof SS]
        >
      ) => f(R.map_(s, (v) => r[v.key]) as any)
    )
}

export const accessServicesTM =
  <SS extends Tag<any>[]>(...s: SS) =>
  <S, R = unknown, E = never, B = unknown>(
    f: (
      ...a: {
        [k in keyof SS]: [SS[k]] extends [Tag<infer T>] ? T : unknown
      }
    ) => As.Async<R, E, B>
  ) =>
    As.accessM(
      (
        r: UnionToIntersection<
          {
            [k in keyof SS]: [SS[k]] extends [Tag<infer T>] ? Has<T> : never
          }[keyof SS & number]
        >
      ) => f(...(A.map_(s, (v) => r[v.key]) as any))
    )

export function accessServicesT<SS extends Tag<any>[]>(...s: SS) {
  return <B = unknown>(
    f: (
      ...a: {
        [k in keyof SS]: [SS[k]] extends [Tag<infer T>] ? T : unknown
      }
    ) => B
  ) =>
    As.access(
      (
        r: UnionToIntersection<
          {
            [k in keyof SS]: [SS[k]] extends [Tag<infer T>] ? Has<T> : never
          }[keyof SS & number]
        >
      ) => f(...(A.map_(s, (v) => r[v.key]) as any))
    )
}

/**
 * Access a record of services with the required Service Entries
 */
export function accessServices<SS extends Record<string, Tag<any>>>(s: SS) {
  return <B>(
    f: (a: {
      [k in keyof SS]: [SS[k]] extends [Tag<infer T>] ? T : unknown
    }) => B
  ) =>
    As.access(
      (
        r: UnionToIntersection<
          {
            [k in keyof SS]: [SS[k]] extends [Tag<infer T>] ? Has<T> : unknown
          }[keyof SS]
        >
      ) => f(R.map_(s, (v) => r[v.key]) as any)
    )
}

/**
 * Access a service with the required Service Entry
 */
export function accessServiceM<T extends AnyService>(s: Tag<T>) {
  return <R, E, B>(f: (a: T) => As.Async<R, E, B>) =>
    As.accessM((r: Has<T>) => f(r[s.key as any]))
}

/**
 * Access a service with the required Service Entry
 */
export function accessService<T extends AnyService>(s: Tag<T>) {
  return <B>(f: (a: T) => B) => accessServiceM(s)((a) => As.succeed(f(a)))
}

/**
 * Access a service with the required Service Entry
 */
export function service<T extends AnyService>(s: Tag<T>) {
  return accessServiceM(s)((a) => As.succeed(a))
}

/**
 * Provides the service with the required Service Entry
 */
export function provideServiceM<T extends AnyService>(_: Tag<T>) {
  return <R, E>(f: As.Async<R, E, ServiceConstructor<T>>) =>
    <R1, E1, A1>(ma: As.Async<R1 & Has<T>, E1, A1>): As.Async<R & R1, E | E1, A1> =>
      As.accessM((r: R & R1) =>
        As.chain_(f, (t) => As.provideAll_(ma, mergeEnvironments(_, r, t)))
      )
}

/**
 * Provides the service with the required Service Entry
 */
export function provideService<T extends AnyService>(_: Tag<T>) {
  return (f: ServiceConstructor<T>) =>
    <R1, E1, A1>(ma: As.Async<R1 & Has<T>, E1, A1>): As.Async<R1, E1, A1> =>
      provideServiceM(_)(As.succeed(f))(ma)
}

/**
 * Replaces the service with the required Service Entry
 */
export function replaceServiceM<R, E, T extends AnyService>(
  _: Tag<T>,
  f: (_: T) => As.Async<R, E, ServiceConstructor<T>>
) {
  return <R1, E1, A1>(
    ma: As.Async<R1 & Has<T>, E1, A1>
  ): As.Async<R & R1 & Has<T>, E | E1, A1> =>
    accessServiceM(_)((t) => provideServiceM(_)(f(t))(ma))
}

/**
 * Replaces the service with the required Service Entry
 */
export function replaceServiceM_<R, E, T extends AnyService, R1, E1, A1>(
  ma: As.Async<R1 & Has<T>, E1, A1>,
  _: Tag<T>,
  f: (_: T) => As.Async<R, E, ServiceConstructor<T>>
): As.Async<R & R1 & Has<T>, E | E1, A1> {
  return accessServiceM(_)((t) => provideServiceM(_)(f(t))(ma))
}

/**
 * Replaces the service with the required Service Entry
 */
export function replaceService<T extends AnyService>(
  _: Tag<T>,
  f: (_: T) => ServiceConstructor<T>
) {
  return <R1, E1, A1>(
    ma: As.Async<R1 & Has<T>, E1, A1>
  ): As.Async<R1 & Has<T>, E1, A1> =>
    accessServiceM(_)((t) => provideServiceM(_)(As.succeed(f(t)))(ma))
}

/**
 * Replaces the service with the required Service Entry
 */
export function replaceService_<R1, E1, A1, T extends AnyService>(
  ma: As.Async<R1 & Has<T>, E1, A1>,
  _: Tag<T>,
  f: (_: T) => ServiceConstructor<T>
): As.Async<R1 & Has<T>, E1, A1> {
  return accessServiceM(_)((t) => provideServiceM(_)(As.succeed(f(t)))(ma))
}