/* eslint-disable @typescript-eslint/no-namespace */
/**
 * Copyright (c) 2020 August
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Represents a namespace for IPC-related content 
 */
export namespace IPC {
  /** Interface to represent a "Request" */
  export interface Request<T, V = number> {
    /** The OPCode */
    op: V;

    /** Any data sent (undefined if none) */
    d?: T;
  }

  /** Represents a "response" */
  export interface Response<T> {
    /** If it was successful */
    success: boolean;

    /** The data that was requested */
    d?: T;
  }
}

/** Represents miscellaneous types */
export namespace Misc {
  /** Represents the shard information we needed */
  export interface ShardInfo {
    latency: string;
    guilds: number;
    status: Misc.ShardStatus;
    users: number;
    id: number;
  }

  /** Represents the shard's status */
  export enum ShardStatus {
    Throttling = 'throttle',
    Offline = 'offline',
    Online = 'online'
  }

  /** Returns a string of "hearts" of the shard's status */
  export function status(s: ShardStatus): string {
    switch (s) {
      case ShardStatus.Throttling: return '💛 Connecting';
      case ShardStatus.Online: return '💚 Online';
      case ShardStatus.Offline: return '❤️ Offline';
      default: return '🖤 Unknown';
    }
  }
}

export enum OPCodes {
  CollectStats = 'collectStats',
  Ready = 'ready'
}

export interface MessagePacket<T = unknown> {
  op: OPCodes;
  id: string;
  d?: T;
}