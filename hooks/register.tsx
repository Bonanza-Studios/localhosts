import { atom, read, update } from 'claude-code'
import type { EngineInterface as Engine, Register } from 'claude-code'

import type { Server, ServersView } from '../types'

const PANE = 'localhosts'
const REFRESH_MS = 10_000
const STOP_TIMEOUT_MS = 60_000

const empty: ServersView = { servers: [], stopping: [], isLoaded: false }
const view = atom({ plugin: 'localhosts', key: 'view' } as const, empty, { shape: 'view-1' })

const parse = (stdout: string): Server[] =>
  stdout
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const [, ports = '', uptime = '', dir = '', command = ''] = line.split('\t')
      const [port = '', ...more] = ports.split(',')
      return { port, more, uptime, dir, command: command.trim() }
    })
    .filter(server => server.port !== '')

const tilde = (dir: string) => dir.replace(/^\/(Users|home)\/[^/]+(?=\/|$)/, '~')

const script = ($: Engine) => `${$.plugin.root}/localhosts`

const refresh = async ($: Engine) => {
  const ran = await $.process.run([script($), 'raw'])
  await update($, view, current =>
    ran.exitCode === 0
      ? { ...current, servers: parse(ran.stdout), error: undefined, isLoaded: true }
      : { ...current, error: ran.stderr.trim() || `exit ${ran.exitCode}`, isLoaded: true },
  )
}

const stop = async ($: Engine, ports: string[]) => {
  await update($, view, current => ({ ...current, stopping: [...current.stopping, ...ports] }))
  try {
    await $.process.run([script($), 'stop', ...ports], { timeoutMs: STOP_TIMEOUT_MS })
    await refresh($)
  } finally {
    await update($, view, current => ({
      ...current,
      stopping: current.stopping.filter(port => !ports.includes(port)),
    }))
  }
}

const isShown = async ($: Engine) => (await $.ui.panes()).some(pane => pane.id === PANE && pane.isShown)

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'localhosts',
      description: 'Show the local dev servers with a Stop button for each',
    })
    $.clock.every(REFRESH_MS, async () => {
      if (await isShown($)) await refresh($)
    })

    return next(e)
  })

  on('command.run', { command: 'localhosts' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Localhosts' })
    await refresh($)

    return { text: 'Localhosts panel opened.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button, Link } = $.ui.resolve(e)
    const { servers, stopping, error, isLoaded } = await read($, view)

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="row" gap={2}>
          <Text bold>{isLoaded ? `${servers.length} running` : 'Looking…'}</Text>
          {servers.length > 1 && (
            <Button key="stop-all" variant="primary" onPress={() => stop($, servers.map(server => server.port))}>
              Stop all
            </Button>
          )}
          <Button key="refresh" onPress={() => refresh($)}>
            Refresh
          </Button>
        </Box>
        {error && <Text color="error">{error}</Text>}
        {isLoaded && servers.length === 0 && !error && <Text dimColor>No dev servers running.</Text>}
        {servers.map(server => (
          <Box flexDirection="column">
            <Box flexDirection="row" gap={1}>
              {stopping.includes(server.port) ? (
                <Text dimColor>stopping…</Text>
              ) : (
                <Button key={`stop-${server.port}`} onPress={() => stop($, [server.port])}>
                  Stop
                </Button>
              )}
              <Link href={`http://localhost:${server.port}`}>
                {['localhost:' + server.port, ...server.more].join(' +')}
              </Link>
              <Text dimColor>
                {server.command} · {server.uptime}
              </Text>
            </Box>
            <Text>{tilde(server.dir)}</Text>
          </Box>
        ))}
      </Box>
    )
  })
}
