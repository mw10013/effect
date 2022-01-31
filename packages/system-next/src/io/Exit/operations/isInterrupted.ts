import type { Exit } from "../definition"

/**
 * Determines if the `Exit` result is interrupted.
 */
export function isInterrupted<E, A>(self: Exit<E, A>): boolean {
  switch (self._tag) {
    case "Failure":
      return self.cause.isInterrupted()
    case "Success":
      return false
  }
}