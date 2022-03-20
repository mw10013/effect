import type { Map } from "../../../collection/immutable/Map"
import type { LazyArg } from "../../../data/Function"
import type { Cause } from "../../../io/Cause"
import { Effect } from "../../../io/Effect"
import { FiberRef } from "../../../io/FiberRef"
import type { LogLevel } from "../../../io/LogLevel"
import { Managed } from "../../../io/Managed"
import { Sink } from "../definition"

/**
 * Logs the specified message at the current log level.
 *
 * @tsplus static ets/SinkOps log
 */
export function log(
  message: LazyArg<string>,
  __tsplusTrace?: string
): Sink<unknown, never, unknown, unknown, void> {
  return Sink.fromEffect(Effect.log(message))
}

/**
 * Logs the specified message at the debug log level.
 *
 * @tsplus static ets/SinkOps logDebug
 */
export function logDebug(
  message: LazyArg<string>,
  __tsplusTrace?: string
): Sink<unknown, never, unknown, unknown, void> {
  return Sink.fromEffect(Effect.logDebug(message))
}

/**
 * Logs the specified message at the error log level.
 *
 * @tsplus static ets/SinkOps logError
 */
export function logError(
  message: LazyArg<string>,
  __tsplusTrace?: string
): Sink<unknown, never, unknown, unknown, void> {
  return Sink.fromEffect(Effect.logError(message))
}

/**
 * Logs the specified message at the error log level.
 *
 * @tsplus static ets/SinkOps logErrorCause
 */
export function logErrorCause(
  cause: LazyArg<Cause<unknown>>,
  __tsplusTrace?: string
): Sink<unknown, never, unknown, unknown, void> {
  return Sink.fromEffect(Effect.logErrorCause(cause))
}

/**
 * Logs the specified message at the fatal log level.
 *
 * @tsplus static ets/SinkOps logFatal
 */
export function logFatal(
  message: LazyArg<string>,
  __tsplusTrace?: string
): Sink<unknown, never, unknown, unknown, void> {
  return Sink.fromEffect(Effect.logFatal(message))
}

/**
 * Logs the specified message at the info log level.
 *
 * @tsplus static ets/SinkOps logInfo
 */
export function logInfo(
  message: LazyArg<string>,
  __tsplusTrace?: string
): Sink<unknown, never, unknown, unknown, void> {
  return Sink.fromEffect(Effect.logInfo(message))
}

/**
 * Logs the specified message at the trace log level.
 *
 * @tsplus static ets/SinkOps logTrace
 */
export function logTrace(
  message: LazyArg<string>,
  __tsplusTrace?: string
): Sink<unknown, never, unknown, unknown, void> {
  return Sink.fromEffect(Effect.logTrace(message))
}

/**
 * Logs the specified message at the warning log level.
 *
 * @tsplus static ets/SinkOps logWarning
 */
export function logWarning(
  message: LazyArg<string>,
  __tsplusTrace?: string
): Sink<unknown, never, unknown, unknown, void> {
  return Sink.fromEffect(Effect.logWarning(message))
}

/**
 * Sets the log level for streams composed after this.
 *
 * @tsplus static ets/SinkOps logLevel
 */
export function logLevel(level: LogLevel) {
  return <R, E, In, L, Z>(
    sink: Sink<R, E, In, L, Z>,
    __tsplusTrace?: string
  ): Sink<R, E, In, L, Z> => Sink.unwrapManaged(Managed.logLevel(level).as(sink))
}

/**
 * Adjusts the label for the logging span for streams composed after this.
 *
 * @tsplus static ets/SinkOps logSpan
 */
export function logSpan(label: LazyArg<string>) {
  return <R, E, In, L, Z>(
    sink: Sink<R, E, In, L, Z>,
    __tsplusTrace?: string
  ): Sink<R, E, In, L, Z> => Sink.unwrapManaged(Managed.logSpan(label).as(sink))
}

/**
 * Annotates each log in streams composed after this with the specified log
 * annotation.
 *
 * @tsplus static ets/SinkOps logAnnotate
 */
export function logAnnotate(key: LazyArg<string>, value: LazyArg<string>) {
  return <R, E, In, L, Z>(
    sink: Sink<R, E, In, L, Z>,
    __tsplusTrace?: string
  ): Sink<R, E, In, L, Z> =>
    Sink.unwrapManaged(Managed.logAnnotate(key, value).as(sink))
}

/**
 * Retrieves the log annotations associated with the current scope.
 *
 * @tsplus static ets/SinkOps logAnnotations
 */
export function logAnnotations(
  __tsplusTrace?: string
): Sink<unknown, never, unknown, unknown, Map<string, string>> {
  return Sink.fromEffect(FiberRef.currentLogAnnotations.value.get())
}