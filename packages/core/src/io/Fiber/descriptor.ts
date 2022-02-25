import type { HashSet } from "../../collection/immutable/HashSet"
import type { FiberId } from "../FiberId"
import type { InterruptStatus } from "../InterruptStatus"
import type { Scope } from "../Scope"
import type { FiberStatus } from "./status"

/**
 * A record containing information about a `Fiber`.
 */
export class Descriptor {
  constructor(
    /**
     * The unique identifier of the `Fiber`.
     */
    readonly id: FiberId,
    /**
     * The status of the `Fiber`.
     */
    readonly status: FiberStatus,
    /**
     * The set of fibers attempting to interrupt the fiber or its ancestors.
     */
    readonly interrupters: HashSet<FiberId>,
    /**
     * The interrupt status of the `Fiber`.
     */
    readonly interruptStatus: InterruptStatus,
    /**
     * The current scope of the `Fiber`.
     */
    readonly scope: Scope
  ) {}
}