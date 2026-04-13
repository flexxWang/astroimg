import { PresenceService } from './presence.service';

describe('PresenceService', () => {
  let service: PresenceService;

  beforeEach(() => {
    service = new PresenceService({
      getOrThrow: jest.fn(),
      get: jest.fn(),
    } as any);
  });

  it('marks the first connection as an online state change', async () => {
    const result = await service.addConnection('user-1', 'socket-1');

    expect(result).toEqual({
      userId: 'user-1',
      changed: true,
      online: true,
    });
    await expect(service.isOnline('user-1')).resolves.toBe(true);
  });

  it('does not emit an extra state change for additional sockets', async () => {
    await service.addConnection('user-1', 'socket-1');

    const result = await service.addConnection('user-1', 'socket-2');

    expect(result.changed).toBe(false);
    expect(service.getSockets('user-1')).toEqual(
      new Set(['socket-1', 'socket-2']),
    );
  });

  it('only flips offline when the last socket disconnects', async () => {
    await service.addConnection('user-1', 'socket-1');
    await service.addConnection('user-1', 'socket-2');

    const first = await service.removeConnection('user-1', 'socket-1');
    const second = await service.removeConnection('user-1', 'socket-2');

    expect(first).toEqual({
      userId: 'user-1',
      changed: false,
      online: true,
    });
    expect(second).toEqual({
      userId: 'user-1',
      changed: true,
      online: false,
    });
    await expect(service.isOnline('user-1')).resolves.toBe(false);
  });
});
