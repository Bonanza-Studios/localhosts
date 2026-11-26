export type Server = { port: string; more: string[]; uptime: string; dir: string; command: string }

export type ServersView = {
  servers: Server[]
  stopping: string[]
  error?: string
  isLoaded: boolean
}

declare module 'claude-code' {
  interface PluginState {
    localhosts: { view: Shaped<ServersView> }
  }
}
