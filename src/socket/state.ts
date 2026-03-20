import { ConnectedUser } from "./types";

export const DEFAULT_TURN_TIME_LIMIT = 30; // seconds
export const DISCONNECT_TIMEOUT = 30_000; // ms

export const socketUsers = new Map<string, ConnectedUser>();
export const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

export type MatchTimer = {
  interval: ReturnType<typeof setInterval>;
  remainingSeconds: number;
};

export const matchTimers = new Map<string, MatchTimer>();
