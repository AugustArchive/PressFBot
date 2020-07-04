import type { ClusterManager as Manager } from '../ClusterManager';
import { OPCodes, MessagePacket, Misc } from '.';
import { createLogger } from '@augu/logging';

export interface ShardArgs {
  shards: Misc.ShardInfo[];
  heap: number;
  rss: number;
}

const logger = createLogger('Process / Message');
export default function onMessage(this: Manager, packet: MessagePacket) {
  if (!packet.hasOwnProperty('fetch') || !packet.hasOwnProperty('op')) {
    logger.warn('Missing "fetch" or "op" in the packet, skipping');
    return;
  }

  switch (packet.op) {
    case OPCodes.CollectStats: {
      const msg = (packet as MessagePacket<ShardArgs>);
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

      this;
      msg.fetch({
        shards,
        heap: memory.heapUsed,
        rss: memory.rss
      });
    } break;

    case OPCodes.Ready: {
      const msg = packet as MessagePacket<number>;
      const cluster = this.get(msg.d!);
      cluster ? cluster.setStatus('online') : void 0;
    }

    default: break;
  }
}