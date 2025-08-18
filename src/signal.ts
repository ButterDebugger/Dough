export type SignalEffect<T> = (value: T) => void | Promise<void>;
export interface Signal<T> {
    /**
     * Gets the current value of the signal
     * @returns The value of the signal
     */
    (): T;
    /**
     * Sets the value of the signal
     *
     * Triggers all effects if the value has changed
     * @param newValue The new value to set
     */
    (newValue: T): void;
    /**
     * Adds a change effect for when the signal's value changes
     * @param effect The effect to add
     */
    (effect: SignalEffect<T>): void;
}

export function isSignalEffect<T>(input: unknown): input is SignalEffect<T> {
    return typeof input === "function";
}

export function signal<T>(initValue: T): Signal<T> {
    const effects = new Set<SignalEffect<T>>();
    let value = initValue;

    function signalImpl(): T;
    function signalImpl(newValue: T): void;
    function signalImpl(effect: SignalEffect<T>): void;
    function signalImpl(input?: T | SignalEffect<T>): T | void {
        // Getter
        if (arguments.length === 0 || typeof input === "undefined") {
            return value;
        }

        // Effect
        if (isSignalEffect<T>(input)) {
            effects.add(input);
            return;
        }

        // Setter
        if (value === input) return; // Cancel if the value is the same

        value = input;
        queueMicrotask(() => {
            for (const effect of effects) {
                effect(input);
            }
        });
    }

    return signalImpl as Signal<T>;
}
