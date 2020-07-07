import type { ClusterManager as Manager } from '../ClusterManager';
import { OPCodes, MessagePacket, Misc } from '.';
import { createLogger } from '@augu/logging';
import cluster from 'cluster';
import { resolve } from 'path';

export interface ShardArgs {
  workers: WorkerArgs[];
  shards: Misc.ShardInfo[];
  heap: number;
  rss: number;
}

interface WorkerArgs {
  memory: number;
  dead: boolean;
  cpu: number;
  id?: number;
}

const logger = createLogger('Process / Message');
export default function onMessage(this: Manager, packet: MessagePacket) {
  if (!packet.hasOwnProperty('op')) {
    logger.warn('Missing "op" in the packet, skipping');
    return;
  }

  if (!this.expectingMessages.has(packet.id)) {
    logger.error(`Packet "${packet.id}" was not found?`);
    return;
  }

  switch (packet.op) {
    case OPCodes.CollectStats: {
      const shards: Misc.ShardInfo[] = [];
      const memory = process.memoryUsage();

      for (const shard of this.bot.client.shards.values()) {
        const guilds = this.bot.client.guilds.filter(x => x.shard.id === shard.id);
        const users = guilds.reduce((a, b) => a + b.memberCount, 0);
        let status: Misc.ShardStatus = Misc.ShardStatus.Offline;

        switch (shard.status) {
          case 'connecting':
          case 'handshaking': {
            status = Misc.ShardStatus.Throttling;
          } break;

          case 'disconnected': {
            status = Misc.ShardStatus.Offline;
          } break;

          default: {
            status = Misc.ShardStatus.Online;
          } break;
        }

        shards.push({
          latency: `${shard.latency}ms`,
          guilds: guilds.length,
          status,
          users,
          id: shard.id
        });
      }

      const workers: WorkerArgs[] = [];
      for (const worker of Object.values(cluster.workers)) {
        if (worker === undefined) {
          workers.push({
            memory: 0,
            dead: true,
            cpu: 0
          });
        } else {
          workers.push({
            memory: process.memoryUsage().rss,
            dead: worker!.isDead(),
            cpu: process.cpuUsage().system,
            id: worker!.id
          });
        }
      }

      const { resolve } = this.expectingMessages.get(packet.id)!;
      resolve({
        workers,
        shards,
        heap: memory.heapUsed,
        rss: memory.rss
      });

      this.expectingMessages.delete(packet.id);
    } break;

    case OPCodes.Ready: {
      const msg = packet as MessagePacket<number>;
      const cluster = this.get(msg.d!);
      const { resolve, reject } = this.expectingMessages.get(packet.id)!;

      if (!cluster) return reject(new Error(`Cluster #${msg.d} was not found?`));
      cluster.setStatus('online');
      resolve();

      this.expectingMessages.delete(packet.id);
    }

    default: break;
  }
}