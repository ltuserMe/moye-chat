export type Brand<TValue, TBrand extends string> = TValue & { readonly __brand: TBrand };

export type ISODateTime = Brand<string, "ISODateTime">;
export type EntityId = Brand<string, "EntityId">;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  readonly [key: string]: JsonValue;
}

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface Disposable {
  dispose(): void;
}
