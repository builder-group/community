#!/bin/sh

# Function to check if a directory is a monorepo root
is_monorepo_root() {
    local dir=$1
    [ -f "$dir/pnpm-workspace.yaml" ] && return 0
    return 1
}

# Function to find the monorepo root
find_monorepo_root() {
    local cwd=${1:-$(pwd)}
    while [ "$cwd" != "/" ]; do
        if is_monorepo_root "$cwd"; then
            echo "$cwd"
            return
        fi
        cwd=$(dirname "$cwd")
    done
    echo "⛔️ No monorepo root could be found upwards from the directory $1" >&2
    exit 1
}
