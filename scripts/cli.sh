#!/bin/sh

# This script serves as a local execution wrapper for the @ibg/cli tool.
# We are using this approach because we couldn't figure out how to
# reliable bind the "ibg" command in the local development environment
# and within the constraints of a PaaS build step.
# It ensures the run.sh script within the CLI's bin directory is directly invoked
# with the necessary arguments and environment variables setup.

# Exit immediately if a command exits with a non-zero status
set -e

DIR="$(dirname "$0")"

# Find the absolute path to the monorepo's root directory
chmod +x "$DIR/find_monorepo_root.sh"
source "$DIR/find_monorepo_root.sh"
MONOREPO_ROOT=$(find_monorepo_root)
echo "👉 Monorepo root found at: $MONOREPO_ROOT"

# Get the absolute path to the CLI's bin directory
CLI_BIN_PATH="$MONOREPO_ROOT/packages/cli/bin"

# Execute the run.sh script with passed arguments
chmod +x "$CLI_BIN_PATH/run.sh"
"$CLI_BIN_PATH/run.sh" "$@"
