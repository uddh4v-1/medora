/**
 * Shared HTTP wrappers — normalised outcome from Axios (`validateStatus`-safe).
 */

export type ApiOutcome<T> = {
  ok: boolean;
  status: number;
  data: T;
};
