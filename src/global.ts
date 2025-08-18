import { collection, type DomCollection } from "./collection.ts";
import { dom, type DomContext } from "./context.ts";
import { type Signal, signal } from "./signal.ts";
import type { DomGlobal, DomParsable } from "./types.ts";
import { isDomParsable } from "./utils.ts";

/**
 * A caboodle of global helper functions for the Dom library
 *
 * Used to avoid creating a wrapper class for every object
 */
export const $$: DomGlobal = {
    on(target: EventTarget, event: string, callback: EventListener): void {
        target.addEventListener(event, callback);
    },
    once(target: EventTarget, event: string, callback: EventListener): void {
        target.addEventListener(event, callback, {
            once: true,
        });
    },
    off(target: EventTarget, event: string, callback: EventListener): void {
        target.removeEventListener(event, callback);
    },
};

/**
 * @returns A reference to the DomGlobal object, aka $$
 */
export function $(): DomGlobal;
/**
 * Creates a new DomContext from an existing element
 * @param input The element to be wrapped
 * @returns A new DomContext
 */
export function $<L extends Element = Element>(input: L): DomContext<L>;
/**
 * Creates a duplicate of the given DomContext
 * @param input The DomContext to duplicate
 * @returns A new DomContext wrapping the same element
 */
export function $<L extends Element = Element>(
    input: DomContext<L>,
): DomContext<L>;
/**
 * Creates a new DomContext from the given input
 * @param input The input to parse
 * @returns A new DomContext
 */
export function $<L extends Element = Element>(
    input: DomParsable,
): DomContext<L>;
/**
 * Creates a new DomCollection from a list of items
 * @param input A list of parsable items to create the collection from
 * @returns A new DomCollection containing the parsed elements
 */
export function $<L extends Element = Element>(
    input: DomParsable[],
): DomCollection<L>;
/**
 * Creates a new signal
 * @param input The initial value of the signal
 */
export function $<T>(input: T): Signal<T>;
export function $<T>(
    input: undefined | NonNullable<T> | DomParsable | DomParsable[] = undefined,
):
    | DomGlobal
    | DomContext<T extends Element ? T : Element>
    | DomCollection<T extends Element ? T : Element>
    | Signal<NonNullable<T>> {
    // Return DomGlobal
    if (typeof input === "undefined") {
        return $$;
    }

    // Return DomCollection
    if (Array.isArray(input)) {
        return collection(...input);
    }

    // Return DomContext
    if (isDomParsable(input)) {
        // TODO: Make only match Element and DomContext
        return dom(input);
    }

    // Return Signal
    return signal(input);
}
