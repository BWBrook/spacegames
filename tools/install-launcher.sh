#!/bin/sh
# Installs ~/Applications/Spacegames.app: a double-clickable launcher that builds
# the anthology, serves it locally, and opens it in the default browser. Closing
# the Terminal window it opens stops the server.
set -eu
REPO="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$HOME/Applications"
APP="$APP_DIR/Spacegames.app"
mkdir -p "$APP_DIR"
rm -rf "$APP"
osacompile -o "$APP" <<APPLESCRIPT
tell application "Terminal"
	activate
	do script "cd '$REPO' && pnpm play"
end tell
APPLESCRIPT
echo "Installed $APP"
echo "Double-click it (or drag it to the Dock). For a server-free launcher, host the build and use Safari's Add to Dock."
