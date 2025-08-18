import { collection, type DomCollection } from "./collection.ts";
import { $$ } from "./global.ts";
import { parse } from "./parser.ts";
import type { DomParsable } from "./types.ts";
import { isContext, isDomParsable, isHTML } from "./utils.ts";

/**
 * Dom wrapper for a single element
 */
export class DomContext<L extends Element = Element> {
    readonly #ele: L;

    constructor(element: L) {
        this.#ele = element;
    }

    /**
     * The wrapped element
     */
    get element(): L {
        return this.#ele;
    }

    /**
     * A collection of the elements children
     */
    children<E extends Element = Element>(): DomCollection<E> {
        return collection(...this.#ele.children);
    }

    /**
     * The parent element
     */
    parent<E extends Element = Element>(): DomContext<E> | null {
        const parent = this.#ele.parentElement;
        if (parent === null) return null;

        return dom<E>(parent);
    }

    /**
     * Clones the current element
     * @param deep Whether to clone the element and all its children
     * @returns A DomContext of the cloned element
     */
    clone(deep = true): DomContext<L> {
        const ctx = dom(<L> this.#ele.cloneNode(deep));
        if (ctx === null) throw new Error("Failed to clone element");

        return ctx;
    }

    find<K extends keyof HTMLElementTagNameMap>(
        selector: K,
        inclusiveScope?: boolean,
    ): DomContext<HTMLElementTagNameMap[K]> | null;
    find<K extends keyof SVGElementTagNameMap>(
        selector: K,
        inclusiveScope?: boolean,
    ): DomContext<SVGElementTagNameMap[K]> | null;
    find<K extends keyof MathMLElementTagNameMap>(
        selector: K,
        inclusiveScope?: boolean,
    ): DomContext<MathMLElementTagNameMap[K]> | null;
    /** @deprecated */
    find<K extends keyof HTMLElementDeprecatedTagNameMap>(
        selector: K,
        inclusiveScope?: boolean,
    ): DomContext<HTMLElementDeprecatedTagNameMap[K]> | null;
    find<E extends Element = Element>(
        selector: string,
        inclusiveScope?: boolean,
    ): DomContext<E> | null;
    /**
     * Finds the first element within this element that matches the given selector
     * @param selector The selector to search for
     * @param inclusiveScope Whether to include the element itself in the search
     * @returns A DomContext of the first matching element, or null if no elements were found
     */
    find<E extends Element = Element>(
        selector: string,
        inclusiveScope = false,
    ): DomContext<E> | null {
        // @ts-ignore: Type L is assignable to type E
        if (inclusiveScope && this.#ele.matches(selector)) return this;

        const element = this.#ele.querySelector<E>(selector);
        if (element === null) return null;

        return dom(element);
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
     * Finds all elements within this element that matches the given selector
     * @param selector The selector to search for
     * @param inclusiveScope Whether to include the element itself in the search
     * @returns A DomCollection containing all the matching elements
     */
    findAll<E extends Element = Element>(
        selector: string,
        inclusiveScope = false,
    ): DomCollection<E> {
        const selection: DomContext[] = [];

        for (const ele of this.#ele.querySelectorAll(selector)) {
            selection.push(dom(ele));
        }

        if (inclusiveScope && this.#ele.matches(selector)) {
            selection.unshift(dom(this.#ele));
        }

        return collection(...selection);
    }

    /**
     * Sets the given attribute
     * @param name The attribute name to set
     * @param value The value to set the attribute to
     * @returns A reference to itself
     */
    attr(name: string, value: string): DomContext<L>;
    /**
     * Removes the given attribute
     * @param name The attribute name to remove
     * @returns A reference to itself
     */
    attr(name: string, value: null): DomContext<L>;
    /**
     * Sets or removes the given attribute
     * @param name The attribute name to remove
     * @returns A reference to itself
     */
    attr(name: string, value: string | null): DomContext<L>;
    /**
     * Replaces the given attribute using a callback
     * @param name The attribute name to replace
     * @param value The callback that will be called to set the attribute
     * @returns A reference to itself
     */
    attr(
        name: string,
        value: (oldValue: string | null) => string | null,
    ): DomContext<L>;
    /**
     * Gets the given attribute
     * @param name The attribute name to get
     * @returns The attributes value
     */
    attr(name: string): string | null;
    /**
     * Retrieves all attributes
     * @returns An object containing all attributes
     */
    attr(): Record<string, string>;
    attr(
        name: string | undefined = undefined,
        value:
            | string
            | null
            | undefined
            | ((oldValue: string | null) => string | null) = undefined,
    ): DomContext<L> | Record<string, string> | string | null {
        // Return value
        if (typeof name === "undefined" && typeof value === "undefined") {
            return this.#ele
                .getAttributeNames()
                .reduce((opt: Record<string, string>, name: string) => {
                    const val = this.#ele.getAttribute(name);
                    if (val === null) return opt;

                    opt[name] = val;
                    return opt;
                }, {});
        }
        if (typeof name === "string" && typeof value === "undefined") {
            return this.#ele.getAttribute(name) ?? null;
        }

        // Return self
        if (typeof name === "string" && typeof value === "function") {
            const oldVal = this.#ele.getAttribute(name);
            const attr = value(oldVal);

            if (attr === null) this.#ele.removeAttribute(name);
            else this.#ele.setAttribute(name, attr);

            return this;
        }
        if (typeof name === "string" && value === null) {
            this.#ele.removeAttribute(name);
            return this;
        }
        if (typeof name === "string" && typeof value === "string") {
            this.#ele.setAttribute(name, value);
            return this;
        }

        throw new TypeError("Arguments have mismatched types");
    }

    /**
     * Gets the given property
     * @param name The property name to get
     * @returns The property value
     */
    prop(name: string): unknown;
    /**
     * Sets the given property
     * @param name The property name to set
     * @param value The value to set the property to
     * @returns A reference to itself
     */
    prop(name: string, value: unknown): DomContext<L>;
    /**
     * Replaces the given property using a callback
     * @param name The property name to set
     * @param value The value replacement callback
     * @returns A reference to itself
     */
    prop(name: string, value: (oldValue: unknown) => unknown): DomContext<L>;
    prop(
        name: string,
        value:
            | undefined
            | unknown
            | ((oldValue: unknown) => unknown) = undefined,
    ): DomContext<L> | unknown {
        if (typeof name === "undefined") {
            throw new TypeError("Name must be a string");
        }

        // Return value
        if (typeof value === "undefined") {
            // @ts-ignore: Element is an object
            return this.#ele[name];
        }

        // Return self
        if (typeof value === "function") {
            // @ts-ignore: Element is an object
            const oldVal = this.#ele[name];

            // @ts-ignore: Element is an object
            this.#ele[name] = value(oldVal);
        } else {
            // @ts-ignore: Element is an object
            this.#ele[name] = value;
        }
        return this;
    }

    /**
     * Removes the given property
     * @param name The property name to remove
     * @returns A reference to itself
     */
    removeProp(name: string): DomContext<L> {
        // @ts-ignore: Element is an object
        delete this.#ele[name];
        return this;
    }

    /**
     * Gets the given style
     * @param name The style name to get
     * @returns The style value
     */
    style(name: string): string;
    /**
     * Sets the given property
     * @param name The property name to set
     * @param value The value to set the property to
     * @returns A reference to itself
     */
    style(name: string, value: string): DomContext<L>;
    /**
     * Replaces the given style using a callback
     * @param name The style name to set
     * @param value The value replacement callback
     * @returns A reference to itself
     */
    style(name: string, value: (oldValue: string) => string): DomContext<L>;
    style(
        name: string,
        value: undefined | string | ((oldValue: string) => string) = undefined,
    ): DomContext<L> | string {
        if (!(this.#ele instanceof HTMLElement)) {
            throw new TypeError("Element is not an HTMLElement");
        }

        // Return value
        if (typeof value === "undefined") {
            // @ts-ignore: Element is an object
            return this.#ele.style[name] ?? "";
        }

        // Return self
        if (typeof value === "function") {
            const oldVal = this.style(name);

            // @ts-ignore: Element is an object
            this.#ele.style[name] = value(oldVal);
        } else {
            // @ts-ignore: Element is an object
            this.#ele.style[name] = value;
        }
        return this;
    }

    /**
     * Gets the given computed style
     * @param name The style property name to get
     * @returns The style property value
     */
    css(name: string): string;
    /**
     * Sets the given style property
     * @param name The style property name to set
     * @param value The value to set the style property to
     * @returns A reference to itself
     */
    css(name: string, value: string): DomContext<L>;
    /**
     * Replaces the given style property using a callback
     * @param name The style property name to set
     * @param value The value replacement callback
     * @returns A reference to itself
     */
    css(name: string, value: (oldValue: string) => string): DomContext<L>;
    css(
        name: string,
        value: undefined | string | ((oldValue: string) => string) = undefined,
    ): DomContext<L> | string {
        if (!(this.#ele instanceof HTMLElement)) {
            throw new TypeError("Element is not an HTMLElement");
        }

        // Return value
        if (typeof value === "undefined") {
            return getComputedStyle(this.#ele).getPropertyValue(name) ?? "";
        }

        // Return self
        if (typeof value === "function") {
            const oldVal = this.css(name);
            const val = value(oldVal);
            const newVal = val.replace(/! ?important$/gm, "");
            const important = val.length !== newVal.length ? "important" : "";

            this.#ele.style.setProperty(name, val, important);
        } else {
            const newVal = value.replace(/! ?important$/gm, "");
            const important = value.length !== newVal.length ? "important" : "";

            this.#ele.style.setProperty(name, value, important);
        }
        return this;
    }

    /**
     * Gets the inner text
     * @returns The inner text of the element
     */
    text(): string;
    /**
     * Sets the inner text
     * @param value The text to set
     * @returns A reference to itself
     */
    text(value: string): DomContext<L>;
    text(value: string | undefined = undefined): string | DomContext<L> {
        if (!(this.#ele instanceof HTMLElement)) {
            throw new TypeError("Element is not an HTMLElement");
        }

        // Return value
        if (typeof value === "undefined") {
            return this.#ele.innerText ?? "";
        }

        // Return self
        this.#ele.innerText = value;
        return this;
    }

    /**
     * Gets the inner html
     * @returns The inner html of the element
     */
    html(): string;
    /**
     * Sets the inner html
     * @param value The html to set
     * @returns A reference to itself
     */
    html(value: string): DomContext<L>;
    html(value: string | undefined = undefined): string | DomContext<L> {
        // Return value
        if (typeof value === "undefined") {
            return this.#ele.innerHTML ?? "";
        }

        // Return self
        this.#ele.innerHTML = value;
        return this;
    }

    /**
     * Appends the given content to the element
     * @param children The content to append, can be a list of anything dom parsable
     * @returns A reference to itself
     */
    append(...children: DomParsable[]): DomContext<L> {
        return this.insert("beforeend", ...children);
    }

    /**
     * Appends itself to the given target
     * @param target The element to append to
     * @returns A reference to the target
     */
    appendTo(target: DomParsable): DomContext {
        const other = dom(target);

        other.insert("beforeend", this);

        return other;
    }

    /**
     * Prepends the given content to the element
     * @param children The content to prepend, can be a list of anything dom parsable
     * @returns A reference to itself
     */
    prepend(...children: DomParsable[]): DomContext<L> {
        return this.insert("afterbegin", ...children);
    }

    /**
     * Prepends itself to the given target
     * @param target The element to prepend to
     * @returns A reference to the target
     */
    prependTo(target: DomParsable): DomContext {
        const other = dom(target);

        other.insert("afterbegin", this);

        return other;
    }

    /**
     * Inserts the given content after the element
     * @param children The content to insert after, can be a list of anything dom parsable
     * @returns A reference to itself
     */
    after(...contents: DomParsable[]): DomContext<L> {
        return this.insert("afterend", ...contents);
    }

    /**
     * Inserts the given content before the element
     * @param children The content to insert before, can be a list of anything dom parsable
     * @returns A reference to itself
     */
    before(...contents: DomParsable[]): DomContext<L> {
        return this.insert("beforebegin", ...contents);
    }

    /**
     * Inserts the given content at the given position of the element
     * @param contents The content to insert, can be a list of anything dom parsable
     * @returns A reference to itself
     */
    insert(where: InsertPosition, ...contents: DomParsable[]): DomContext<L> {
        for (const content of contents.flat()) {
            let node: Element | null = null;

            if (typeof content === "string") {
                node = dom(content)?.element ?? null;
            } else if (content instanceof Node) {
                node = content;
            } else if (isContext(content)) {
                node = content.element;
            }

            if (node === null) continue;

            this.#ele.insertAdjacentElement(where, node);
        }

        return this;
    }

    /**
     * Replaces the element with the given content
     * @param content The content to replace the element with
     * @returns A new DomContext of the replaced element
     */
    replaceWith(
        content: DomParsable | ((currentContext: DomContext) => DomParsable),
    ): DomContext {
        if (isDomParsable(content)) {
            const node = dom(content)?.element ?? null;
            if (node === null) return this;

            this.#ele.replaceWith(node);

            return new DomContext(node);
        }
        if (content instanceof Element) {
            this.#ele.replaceWith(content);

            return new DomContext(content);
        }
        if (isContext(content)) {
            const replacement = content.element;

            this.#ele.replaceWith(replacement);

            return new DomContext(replacement);
        }
        if (typeof content === "function") {
            return this.replaceWith(content(this));
        }

        throw new TypeError("Content is an unexpected type");
    }

    /**
     * Adds one or more class names to the element's class list
     * @param classNames The class names to be added, can be a string separated by spaces or an array of strings
     * @returns A reference to itself
     */
    addClass(...classNames: string[]): DomContext<L> {
        const classes = classNames.flatMap((cls) =>
            Array.isArray(cls) ? cls : cls.split(" ")
        );
        this.#ele.classList.add(...classes);
        return this;
    }

    /**
     * Removes one or more class names from the element's class list
     * @param classNames The class names to be removed, can be a string separated by spaces or an array of strings
     * @returns A reference to itself
     */
    removeClass(...classNames: string[]): DomContext<L> {
        const classes = classNames.flatMap((cls) =>
            Array.isArray(cls) ? cls : cls.split(" ")
        );
        this.#ele.classList.remove(...classes);
        return this;
    }

    /**
     * Toggles one or more class names in the element's class list
     * @param classNames The class names to be toggled, can be a string separated by spaces or an array of strings
     * @returns A reference to itself
     */
    toggleClass(...classNames: string[]): DomContext<L> {
        const classes = classNames.flatMap((cls) =>
            Array.isArray(cls) ? cls : cls.split(" ")
        );
        for (const className of classes) {
            this.#ele.classList.toggle(className);
        }
        return this;
    }

    /**
     * Checks if one or more class names are in the element's class list
     * @param classNames The class names to check, can be a string separated by spaces or an array of strings
     * @returns Whether all class names are in the element's class list
     */
    hasClass(...classNames: string[]): boolean {
        const classes = classNames.flatMap((cls) =>
            Array.isArray(cls) ? cls : cls.split(" ")
        );

        for (const className of classes) {
            if (!this.#ele.classList.contains(className)) return false;
        }
        return true;
    }

    /**
     * Appends an event listener to the element
     * @param event The event type to listen for
     * @param callback A function that will be called when the event occurs
     * @returns A reference to itself
     */
    on<K extends keyof GlobalEventHandlersEventMap>(
        event: K,
        callback: (event: GlobalEventHandlersEventMap[K]) => void,
    ): DomContext<L>;
    on<E extends Event>(
        event: string,
        callback: (event: E) => void,
    ): DomContext<L>;
    on(event: string, callback: EventListener): DomContext<L> {
        $$.on(this.#ele, event, callback);
        return this;
    }

    /**
     * Appends an event listener that only occurs once to the element
     * @param event The event type to listen for
     * @param callback A function that will be called for each event once the event occurs
     * @returns A reference to itself
     */
    once<K extends keyof GlobalEventHandlersEventMap>(
        event: K,
        callback: (event: GlobalEventHandlersEventMap[K]) => void,
    ): DomContext<L>;
    once<E extends Event>(
        event: string,
        callback: (event: E) => void,
    ): DomContext<L>;
    once(event: string, callback: EventListener): DomContext<L> {
        $$.once(this.#ele, event, callback);
        return this;
    }

    /**
     * Removes an event listener from the element
     * @param event The event type to remove the listener from
     * @param callback The function that was used to register the event
     * @returns A reference to itself
     */
    off<K extends keyof GlobalEventHandlersEventMap>(
        event: K,
        callback: (event: GlobalEventHandlersEventMap[K]) => void,
    ): DomContext<L>;
    off<E extends Event>(
        event: string,
        callback: (event: E) => void,
    ): DomContext<L>;
    off(event: string, callback: EventListener): DomContext<L> {
        $$.off(this.#ele, event, callback);
        return this;
    }

    /**
     * Removes the element
     */
    remove(): void {
        this.#ele.remove();
    }

    /**
     * @returns The bounding rectangle of the element
     */
    boundingRect(): DOMRect {
        return this.#ele.getBoundingClientRect();
    }
}

/**
 * Creates a new DomContext from a string
 * @param input An HTML string or query section
 * @returns A new DomContext or null if the input is invalid
 */
export function dom<L extends Element = Element>(
    input: string,
): DomContext<L> | null;
/**
 * Creates a new DomContext from an existing element
 * @param input The element to be wrapped
 * @returns A new DomContext
 */
export function dom<L extends Element = Element>(input: L): DomContext<L>;
/**
 * Creates a duplicate of the given DomContext
 * @param input The DomContext to duplicate
 * @returns A new DomContext wrapping the same element
 */
export function dom<L extends Element = Element>(
    input: DomContext<L>,
): DomContext<L>;
/**
 * Creates a new DomContext from the given input
 * @param input The input to parse
 * @returns A new DomContext
 */
export function dom<L extends Element = Element>(
    input: DomParsable,
): DomContext<L>;
export function dom<L extends Element = Element>(
    input: string | L | DomContext<L>,
): DomContext<L> | null {
    if (typeof input === "string") {
        // Parse input as HTML
        if (isHTML(input)) {
            return new DomContext<L>(parse(input));
        }

        // Query for a matching element
        const element = document.querySelector(input);
        if (element === null) return null;

        return new DomContext<L>(element as L);
    }
    if (input instanceof Element) {
        return new DomContext<L>(input);
    }
    if (isContext(input)) {
        return input;
    }

    return null;
}
