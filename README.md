# localhosts

See every local dev server you have running, with its port, uptime, command and folder, and stop the ones you don't need.

```
$ localhosts
#   URL                     UP      COMMAND                         DIRECTORY
1   http://localhost:3000   2h 14m  next dev                        ~/acme/web
2   http://localhost:4321   12m     astro dev                       ~/acme/docs
3   http://localhost:5173   38m     vite                            ~/acme/dashboard
Stop which? (numbers, a = all, Enter = none): 3
Stopped localhost:5173 (~/acme/dashboard)
```

One bash script. macOS and Linux. No network calls.

## Install

With Homebrew:

```sh
brew install bonanza-studios/tap/localhosts
```

Without Homebrew, download the script into a folder on your `PATH`:

```sh
curl -fsSL --create-dirs -o ~/.local/bin/localhosts https://raw.githubusercontent.com/Bonanza-Studios/localhosts/main/localhosts && chmod +x ~/.local/bin/localhosts
```

## Usage

```
localhosts                list dev servers, then ask which to stop
localhosts list           list only
localhosts stop <port>... stop the servers on these ports
localhosts stop all       stop every listed server
```

## In Claude Code

The repository is also a Claude Code plugin: `/localhosts` opens a panel beside the chat with every dev server, a Stop button for each and Stop all. At the prompt of a terminal session:

```
/plugin install localhosts --marketplace Bonanza-Studios/localhosts
```

Answer `y` to add the marketplace, then pick a scope. From a shell: `claude plugin install localhosts --marketplace Bonanza-Studios/localhosts`. In the desktop app, click + next to the prompt box, then Plugins, Add marketplace with `Bonanza-Studios/localhosts`, then Add plugin.

## What counts as a dev server

Any process of yours that listens on a TCP port and was started from a folder inside your home folder: `next dev`, `vite`, `rails server`, a Python API. Desktop apps are left out. A server that listens on more than one port shows up as one row.

## How stopping works

`localhosts` asks the server's process group to shut down (`SIGTERM`), so a dev command and the processes it started stop together and the port is freed. Anything still running after three seconds is stopped with `SIGKILL`. If the group also holds your shell, only the listed processes are stopped and the shell stays open.

## Requirements

macOS or Linux with `bash`, `lsof` and `ps`. macOS has all three; on Linux, install `lsof` if your distribution doesn't include it.

## License

MIT, made by [Bonanza Studios](https://bonanza-studios.com).
