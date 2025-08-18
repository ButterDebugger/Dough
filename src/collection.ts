import { dom, type DomContext } from "./context.ts";
import { parse } from "./parser.ts";
import type { DomParsable } from "./types.ts";
import { isDomParsable, isHTML } from "./utils.ts";

/**
 * Dom wrapper for a list of elements
 */
export class DomCollection<L extends Element = Element> extends Array<
    DomContext<L>
> {
    constructor(...args: DomParsable[]) {
        const elements: DomContext<L>[] = [];

        for (const item of args) {
            const ctx = dom<L>(item);
            if (ctx !== null) elements.push(ctx);
        }

        super(...elements);
    }

    /**
     * Gets the element at the given index
     * @param index The index of the element to retrieve
     * @returns The element at the given index, or null
     */
    item(index: number): DomContext<L> | null {
        return this[index] ?? null;
    }

    /**
     * Creates a copy of the collection
     * @returns A new collection containing the same elements
     */
    copy(): DomCollection<L> {
        return new DomCollection(...this);
    }

    /**
     * A collection of all children of every element
     */
    children<E extends Element = Element>(): DomCollection<E> {
        let children: DomContext<E>[] = [];

        for (const $ele of this) {
            children = children.concat($ele.children<E>());
        }

        return collection(...children);
    }

    /**
     * A collection of all parent elements
     */
    parent<E extends Element = Element>(): DomCollection<E> | null {
        const parents: DomContext<E>[] = [];

        for (const $ele of this) {
            const parent = $ele.parent<E>();
            if (parent === null) continue;

            parents.push(parent);
        }

        return collection(...parents);
    }

    /**
     * Creates a new collection of cloned elements
     * @param deep Whether to clone the element and all its children
     * @returns A new collection
     */
    clone(deep = true): DomCollection<L> {
        return new DomCollection(...this.map(($ele) => $ele.clone(deep)));
    }

    // @ts-ignore: This overrides the parent method correctly
    find<K extends keyof HTMLElementTagNameMap>(
        selector: K,
        inclusiveScope?: boolean,
    ): DomContext<HTMLElementTagNameMap[K]> | null;
    // @ts-ignore: This overrides the parent method correctly
    find<K extends keyof SVGElementTagNameMap>(
        selector: K,
        inclusiveScope?: boolean,
    ): DomContext<SVGElementTagNameMap[K]> | null;
    // @ts-ignore: This overrides the parent method correctly
    find<K extends keyof MathMLElementTagNameMap>(
        selector: K,
        inclusiveScope?: boolean,
    ): DomContext<MathMLElementTagNameMap[K]> | null;
    /** @deprecated */
    // @ts-ignore: This overrides the parent method correctly
    find<K extends keyof HTMLElementDeprecatedTagNameMap>(
        selector: K,
        inclusiveScope?: boolean,
    ): DomContext<HTMLElementDeprecatedTagNameMap[K]> | null;
    // @ts-ignore: This overrides the parent method correctly
    find<E extends Element = Element>(
        selector: string,
        inclusiveScope?: boolean,
    ): DomContext<E> | null;
    /**
     * Finds the first element within this collection of elements that matches the given selector
     * @param selector The selector to search for
     * @param inclusiveScope Whether to include the root of each item in the search
     * @returns A DomContext of the first matching element, or null if no elements were found
     */
    // @ts-ignore: This overrides the parent method correctly
    find<E extends Element = Element>(
        selector: string,
        inclusiveScope = false,
    ): DomContext<E> | null {
        for (const $ele of this) {
            const $item = $ele.find<E>(selector, inclusiveScope);

            if ($item === null) continue;

            return $item;
        }

        return null;
    }

    findAll<K extends keyof HTMLElementTagNameMap>(
        selectors: K,
        inclusiveScope?: boolean,
    ): DomCollection<HTMLElementTagNameMap[K]>;
    findAll<K extends keyof SVGElementTagNameMap>(
        selectors: K,
        inclusiveScope?: boolean,
    ): DomCollection<SVGElementTagNameMap[K]>;
    findAll<K extends keyof MathMLElementTagNameMap>(
        selectors: K,
        inclusiveScope?: boolean,
    ): DomCollection<MathMLElementTagNameMap[K]>;
    /** @deprecated */
    findAll<K extends keyof HTMLElementDeprecatedTagNameMap>(
        selectors: K,
        inclusiveScope?: boolean,
    ): DomCollection<HTMLElementDeprecatedTagNameMap[K]>;
    /**
     * Finds all elements within this collection of elements that matches the given selector
     * @param selector The selector to search for
     * @param inclusiveScope Whether to include the root of each item in the search
     * @returns A DomCollection containing all the matching elements
     */
    findAll<E extends Element = Element>(
        selector: string,
        inclusiveScope = false,
    ): DomCollection<E> {
        let items: DomContext<E>[] = [];

        for (const $ele of this) {
            const found = (
                $ele.findAll as (
                    selector: string,
                    inclusiveScope?: boolean,
                ) => DomCollection<E>
            )(selector, inclusiveScope);

            items = items.concat(found);
        }

        return collection(...items);
    }

    /**
     * Sets the given attribute
     * @param name The attribute name to set
     * @param value The value to set the attribute to
     * @returns A reference to itself
     */
    attr(name: string, value: string): DomCollection<L>;
    /**
     * Removes the given attribute
     * @param name The attribute name to remove
     * @returns A reference to itself
     */
    attr(name: string, value: null): DomCollection<L>;
    /**
     * Replaces the given attribute using a callback
     * @param name The attribute name to replace
     * @param value The callback that will be called to set the attribute
     * @returns A reference to itself
     */
    attr(
        name: string,
        value: (oldValue: string | null, index: number) => string | null,
    ): DomCollection<L>;
    /**
     * Gets the given attribute
     * @param name The attribute name to get
     * @returns The attributes value
     */
    attr(name: string): (string | null)[];
    /**
     * Retrieves all attributes
     * @returns An object containing all attributes
     */
    attr(): Record<string, string>[];
    attr(
        name: string | undefined = undefined,
        value:
            | string
            | null
            | undefined
            | ((
                oldValue: string | null,
                index: number,
            ) => string | null) = undefined,
    ): DomCollection<L> | Record<string, string>[] | (string | null)[] {
        // Return value
        if (typeof name === "undefined" && typeof value === "undefined") {
            return this.map(($ele) => $ele.attr());
        }

        // The rest of this function only works if there is a name, so return early
        if (typeof name !== "string") {
            return this;
        }

        if (typeof value === "undefined") {
            return this.map(($ele) => $ele.attr(name));
        }

        // Return self
        if (typeof value === "function") {
            for (let i = 0; i < this.length; i++) {
                const $ele = this[i];
                const oldVal = $ele.attr(name);
                const val = value(oldVal, i);

                $ele.attr(name, val);
            }
        } else {
            for (const $ele of this) {
                $ele.attr(name, value);
            }
        }
        return this;
    }

    /**
     * Gets the given property for every element
     * @param name The property name to get
     * @returns The property value
     */
    prop(name: string): unknown[];
    /**
     * Sets the given property for every element
     * @param name The property name to set
     * @param value The value to set the property to
     * @returns A reference to itself
     */
    prop(name: string, value: unknown): DomCollection<L>;
    /**
     * Replaces the given property for every element using a callback
     * @param name The property name to set
     * @param value The value replacement callback
     * @returns A reference to itself
     */
    prop(name: string, value: (oldValue: unknown) => unknown): DomCollection<L>;
    prop(
        name: string,
        value:
            | undefined
            | unknown
            | ((oldValue: unknown, index: number) => unknown) = undefined,
    ): DomCollection<L> | unknown[] {
        // Return value
        if (typeof value === "undefined") {
            return this.map(($ele) => $ele.prop(name));
        }

        // Return self
        if (typeof value === "function") {
            this.forEach(($ele, index) => {
                const oldVal = $ele.prop(name);
                const val = value(oldVal, index);

                $ele.prop(name, val);
            });
        } else {
            for (const $ele of this) {
                $ele.prop(name, value);
            }
        }
        return this;
    }

    /**
     * Removes the given property from every element
     * @param name The property name to remove
     * @returns A reference to itself
     */
    removeProp(name: string): DomCollection<L> {
        for (const $ele of this) {
            $ele.removeProp(name);
        }
        return this;
    }

    /**
     * Gets the given style for every element
     * @param name The style name to get
     * @returns The style value
     */
    style(name: string): string[];
    /**
     * Sets the given property for every element
     * @param name The property name to set
     * @param value The value to set the property to
     * @returns A reference to itself
     */
    style(name: string, value: string): DomCollection<L>;
    /**
     * Replaces the given style for every element using a callback
     * @param name The style name to set
     * @param value The value replacement callback
     * @returns A reference to itself
     */
    style(
        name: string,
        value: (oldValue: string, index: number) => string,
    ): DomCollection<L>;
    style(
        name: string,
        value:
            | undefined
            | string
            | ((oldValue: string, index: number) => string) = undefined,
    ): DomCollection<L> | string[] {
        // Return value
        if (typeof value === "undefined") {
            return this.map(($ele) => $ele.style(name));
        }

        // Return self
        if (typeof value === "function") {
            this.forEach(($ele, index) => {
                const oldVal = $ele.style(name);
                const val = value(oldVal, index);

                $ele.style(name, val);
            });
        } else {
            for (const $ele of this) {
                $ele.style(name, value);
            }
        }
        return this;
    }

    /**
     * Gets the given computed style for every element
     * @param name The style property name to get
     * @returns The style property values
     */
    css(name: string): string[];
    /**
     * Sets the given style property for every element
     * @param name The style property name to set
     * @param value The value to set the style property to
     * @returns A reference to itself
     */
    css(name: string, value: string): DomCollection<L>;
    /**
     * Replaces the given style property for each element using a callback
     * @param name The style property name to set
     * @param value The value replacement callback
     * @returns A reference to itself
     */
    css(
        name: string,
        value: (oldValue: string, index: number) => string,
    ): DomCollection<L>;
    css(
        name: string,
        value:
            | undefined
            | string
            | ((oldValue: string, index: number) => string) = undefined,
    ): DomCollection<L> | string[] {
        // Return value
        if (typeof value === "undefined") {
            return this.map(($ele) => $ele.css(name));
        }

        // Return self
        if (typeof value === "function") {
            for (let i = 0; i < this.length; i++) {
                const $ele = this[i];
                const oldVal = $ele.css(name);
                const val = value(oldVal, i);

                $ele.css(name, val);
            }
        } else {
            for (const $ele of this) {
                $ele.css(name, value);
            }
        }
        return this;
    }

    /**
     * Creates a list of strings containing the inner text of each element
     */
    text(): string[];
    /**
     * Sets the inner text of each element
     * @param value The text to set
     */
    text(value: string): DomCollection<L>;
    text(value: string | undefined = undefined): DomCollection<L> | string[] {
        // Return value
        if (typeof value === "undefined") {
            return this.map(($ele) => $ele.text());
        }

        // Return self
        for (const $ele of this) {
            $ele.text(value);
        }
        return this;
    }

    /**
     * Creates a list of strings containing the inner html of each element
     */
    html(): string[];
    /**
     * Sets the inner html of each element
     * @param value The html to set
     */
    html(value: string): DomCollection<L>;
    html(value: string | undefined = undefined): DomCollection<L> | string[] {
        // Return value
        if (typeof value === "undefined") {
            return this.map(($ele) => $ele.html());
        }

        // Return self
        for (const $ele of this) {
            $ele.html(value);
        }
        return this;
    }

    /**
     * Adds one or more class names to each element's class list
     * @param classNames The class names to be added, can be a string separated by spaces or an array of strings
     * @returns A reference to itself
     */
    addClass(...classNames: string[]): DomCollection<L> {
        for (const $ele of this) {
            $ele.addClass(...classNames);
        }
        return this;
    }

    /**
     * Removes one or more class names from each element's class list
     * @param classNames The class names to be removed, can be a string separated by spaces or an array of strings
     * @returns A reference to itself
     */
    removeClass(...classNames: string[]): DomCollection<L> {
        for (const $ele of this) {
            $ele.removeClass(...classNames);
        }
        return this;
    }

    /**
     * Toggles one or more class names in each element's class list
     * @param classNames The class names to be toggled, can be a string separated by spaces or an array of strings
     * @returns A reference to itself
     */
    toggleClass(...classNames: string[]): DomCollection<L> {
        for (const $ele of this) {
            $ele.toggleClass(...classNames);
        }
        return this;
    }

    /**
     * Checks if one or more class names are in every element's class list
     * @param classNames The class names to check, can be a string separated by spaces or an array of strings
     * @returns Whether all class names are in every element's class list
     */
    hasClass(...classNames: string[]): boolean {
        for (const $ele of this) {
            if (!$ele.hasClass(...classNames)) return false;
        }
        return true;
    }

    /**
     * Appends the given content to every element
     * @param children The content to append, can be a list of anything dom parsable
     * @returns A reference to itself
     */
    append(...children: DomParsable[]): DomCollection<L> {
        return this.insert("beforeend", ...children);
    }

    /**
     * Appends every element inside this collection to the given target
     * @param target The target to append to
     * @returns A reference to the target
     */
    appendTo(target: DomParsable): DomContext {
        const other = dom(target);

        for (const $ele of this) {
            other.insert("beforeend", $ele);
        }

        return other;
    }

    /**
     * Prepends the given content to every element
     * @param children The content to prepend, can be a list of anything dom parsable
     * @returns A reference to itself
     */
    prepend(...children: DomParsable[]): DomCollection<L> {
        return this.insert("afterbegin", ...children);
    }

    /**
     * Prepends every element inside this collection to the given target
     * @param target The target to prepend to
     * @returns A reference to the target
     */
    prependTo(target: DomParsable): DomContext {
        const other = dom(target);

        for (const $ele of this) {
            other.insert("afterbegin", $ele);
        }

        return other;
    }

    /**
     * Inserts the given content after every element
     * @param children The content to insert after, can be a list of anything dom parsable
     * @returns A reference to itself
     */
    after(...contents: DomParsable[]): DomCollection<L> {
        return this.insert("afterend", ...contents);
    }

    /**
     * Inserts the given content before every element
     * @param children The content to insert before, can be a list of anything dom parsable
     * @returns A reference to itself
     */
    before(...contents: DomParsable[]): DomCollection<L> {
        return this.insert("beforebegin", ...contents);
    }

    /**
     * Inserts the given content at the given position of every element
     * @param contents The content to insert, can be a list of anything dom parsable
     * @returns A reference to itself
     */
    insert(
        where: InsertPosition,
        ...contents: DomParsable[]
    ): DomCollection<L> {
        for (const content of contents.flat()) {
            for (const $ele of this) {
                $ele.insert(where, content);
            }
        }

        return this;
    }

    /**
     * Replaces every element with the given content
     * @param content The content to replace every element with
     * @returns A reference to itself
     */
    replaceWith(
        content: DomParsable | ((currentContext: DomContext) => DomParsable),
    ): DomCollection<L> {
        for (const $ele of this) {
            $ele.replaceWith(content);
        }
        return this;
    }

    /**
     * Appends an event listener to every element
     * @param event The event type to listen for
     * @param callback A function that will be called when the event occurs
     * @returns A reference to itself
     */
    on<K extends keyof GlobalEventHandlersEventMap>(
        event: K,
        callback: (event: GlobalEventHandlersEventMap[K]) => void,
    ): DomCollection<L>;
    on<E extends Event>(
        event: string,
        callback: (event: E) => void,
    ): DomCollection<L>;
    on(event: string, callback: EventListener): DomCollection<L> {
        for (const $ele of this) {
            $ele.on(event, callback);
        }
        return this;
    }

    /**
     * Appends an event listener that only occurs once to every element
     * @param event The event type to listen for
     * @param callback A function that will be called for each event once the event occurs
     * @returns A reference to itself
     */
    once<K extends keyof GlobalEventHandlersEventMap>(
        event: K,
        callback: (event: GlobalEventHandlersEventMap[K]) => void,
    ): DomCollection<L>;
    once<E extends Event>(
        event: string,
        callback: (event: E) => void,
    ): DomCollection<L>;
    once(event: string, callback: EventListener): DomCollection<L> {
        for (const $ele of this) {
            $ele.once(event, callback);
        }
        return this;
    }

    /**
     * Removes an event listener from every element
     * @param event The event type to remove the listener from
     * @param callback The function that was used to register the event
     * @returns A reference to itself
     */
    off<K extends keyof GlobalEventHandlersEventMap>(
        event: K,
        callback: (event: GlobalEventHandlersEventMap[K]) => void,
    ): DomCollection<L>;
    off<E extends Event>(
        event: string,
        callback: (event: E) => void,
    ): DomCollection<L>;
    off(event: string, callback: EventListener): DomCollection<L> {
        for (const $ele of this) {
            $ele.off(event, callback);
        }
        return this;
    }

    /**
     * Removes every element from the collection
     * @returns A reference to itself
     */
    remove(): DomCollection<L> {
        for (const $ele of this) {
            $ele.remove();
        }
        return this;
    }

    /**
     * Gets the bounding rectangle of every element in the collection
     * @returns An array of the bounding rectangle of every element
     */
    boundingRect(): DOMRect[] {
        return this.map(($ele) => $ele.boundingRect());
    }
}

/**
 * Creates a new DomCollection from a list of items
 * @param input A list of parsable items to create the collection from
 * @returns A new DomCollection containing the parsed elements
 */
export function collection<L extends Element>(
    ...input: DomParsable[]
): DomCollection<L> {
    const items: DomContext[] = [];

    for (const item of input) {
        if (typeof item === "string") {
            if (isHTML(item)) {
                const $ele = dom(parse(item));
                if ($ele === null) continue;

                items.push($ele);
            } else {
                for (const element of document.querySelectorAll(item)) {
                    const $ele = dom(element);
                    if ($ele === null) continue;

                    items.push($ele);
                }
            }
        } else if (isDomParsable(item)) {
            const $ele = dom(item);
            if ($ele === null) continue;

            items.push($ele);
        }
    }

    return new DomCollection(...items);
}
