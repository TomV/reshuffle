import { Operation } from 'fast-json-patch';

export type Comparable = string | number | Date;
export type Equatable = Comparable | boolean;

// Typescript's way of defining any - undefined is "{} | null", see:
// https://github.com/Microsoft/TypeScript/issues/7648.  But... this
// also has to pass typescript-json-schema which takes that type too
// literally.  Spell out all the top-level types of a JSONable.
export type Serializable = {} | any[] | string | number | boolean | null;

export interface PathFilter {
  readonly path: string[];
}

export interface EqFilter extends PathFilter {
  readonly operator: 'eq';
  readonly value: Equatable;
}

export interface NeFilter extends PathFilter {
  readonly operator: 'ne';
  readonly value: Equatable;
}

export interface ComparableFilter extends PathFilter {
  readonly value: Comparable;
}

export interface GtFilter extends ComparableFilter {
  readonly operator: 'gt';
}

export interface GteFilter extends ComparableFilter {
  readonly operator: 'gte';
}

export interface LtFilter extends ComparableFilter {
  readonly operator: 'lt';
}

export interface LteFilter extends ComparableFilter {
  readonly operator: 'lte';
}

export interface ExistsFilter extends PathFilter {
  readonly operator: 'exists';
}

export interface IsNullFilter extends PathFilter {
  readonly operator: 'isNull';
}

export interface MatchesFilter extends PathFilter {
  readonly operator: 'matches';
  readonly pattern: string;
  readonly caseInsensitive: boolean;
}

export interface StartsWithFilter extends PathFilter {
  readonly operator: 'startsWith';
  readonly value: string;
}

export interface AndFilter {
  readonly operator: 'and';
  readonly filters: Filter[];
}

export interface OrFilter {
  readonly operator: 'or';
  readonly filters: Filter[];
}

export interface NotFilter {
  readonly operator: 'not';
  readonly filter: Filter;
}

export type Filter = EqFilter | NeFilter
  | GtFilter | GteFilter | LtFilter | LteFilter
  | ExistsFilter | IsNullFilter
  | MatchesFilter | StartsWithFilter
  | AndFilter | OrFilter | NotFilter;

export type Direction = 'ASC' | 'DESC';
export const ASC: 'ASC' = 'ASC';
export const DESC: 'DESC' = 'DESC';

export interface Order {
  path: string[];
  direction: Direction;
}

export interface Query {
  filter: Filter;
  limit?: number;
  skip?: number;
  orderBy?: ReadonlyArray<Order>;
}

// tslint:disable-next-line:no-empty-interface
export interface ClientContext {
  auth: {
    v1: {
      // Contents TBD
      appId: string;
      apiKey: string;
    };
  };
}

export interface ServerOnlyContext {
  tags?: { [key: string]: string };
  logLevel?: string;
  logExtra?: { [key: string]: any };
  sampleRate?: number;
  debugId: string;              // (generated by server)
}

export interface UpdateOptions {
  /**
   * Used to mark an update originated from a specific operation (useful for optimistic UI).
   * This is meant to be UUID generated by the client.
   */
  readonly operationId?: string;
}

export interface Version {
  major: number;
  minor: number;
}

export interface Patch {
  readonly version: Version;
  /**
   * Used to mark an update originated from a specific operation (useful for optimistic UI).
   * @see UpdateOptions
   */
  readonly operationId?: string;
  readonly ops: Operation[];
}

export type KeyedPatches = Array<[string, Patch[]]>;

export interface VersionedObject {
  version: Version;
  value: Serializable;
}

export interface VersionedMaybeObject {
  version: Version;
  value?: Serializable;
}

interface Patches {
  /**
   * Stores changes made to the document, meant to be used internally by poll().
   */
  patches: Patch[];
}

export interface StoredDocument extends VersionedObject, Patches {
  updatedAt: number;
}

/**
 * A deleted document in the database, used for updating and for
 * streaming.
 */
export interface Tombstone extends Patches {
  updatedAt: number;
  // (0, 0) if the document was never there in the first place.
  version: Version;
}

export interface DB {
  /**
   * Gets a single document.
   * @return - value or undefined if key doesn’t exist.
   */
  get: {
    params: { key: string; };
    returns: any;
  };

  /**
   * Gets a single document and its version.  First half of an update cycle.
   */
  getWithVersion: {
    params: { key: string; };
    returns: VersionedMaybeObject;
  };

  /**
   * Updates document at key if version matches.  Second half of an update cycle.
   * @return - true if key updated.
   */
  setIfVersion: {
    params: { key: string; value: Serializable; version: Version };
    returns: boolean;
  };

  /**
   * Gets the "current version" of a document with the intent to poll on it.
   * @return - Versioned document or tombstone if it's marked deleted.
   */
  startPolling: {
    params: { key: string; }
    returns: VersionedMaybeObject;
  };

  /**
   * Creates a document for a given key.
   * @param value - Object to store, must be JSONable (so not undefined).
   * @return - true if document was created, false if key already exists.
   */
  create: {
    params: { key: string; value: Serializable; }
    returns: boolean;
  };

  /**
   * Removes the document at key.
   * @return - true if a document was deleted.
   */
  remove: {
    params: { key: string; }
    returns: boolean;
  };
}
