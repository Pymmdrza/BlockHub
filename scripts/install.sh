#!/bin/sh
set -e

REPO_URL="https://github.com/Pymmdrza/BlockHub.git"
CLONE_DIR="BlockHub"
SOURCE_DIR="source"
PORT=3000

# Check for Node.js and npm
check_node() {
    if ! command -v node >/dev/null 2>&1; then
        echo "Node.js not found. Installing..."
        if [ "$(uname)" = "Darwin" ]; then
            # macOS installation
            if ! command -v brew >/dev/null 2>&1; then
                echo "Homebrew required. Installing..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            brew install node
        else
            # Linux installation
            curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
            sudo apt-get install -y nodejs
        fi
    fi
}

# Main installation
main() {
    check_node

    echo "Cloning repository..."
    git clone $REPO_URL $CLONE_DIR || { echo "Clone failed!"; exit 1; }
    cd $CLONE_DIR

    echo "Installing dependencies..."
    cd $SOURCE_DIR
    npm install --silent

    echo "Building application..."
    npm run build

    echo "Starting application..."
    npm run dev &

    sleep 5
    # shellcheck disable=SC2028
    echo "\n\033[1;32mApplication is running!\033[0m"
    echo "Visit http://localhost:$PORT in your browser"
}

main
