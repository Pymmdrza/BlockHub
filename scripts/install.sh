#!/bin/bash
set -e

# **User-configurable settings**
IMAGE_NAME="pymmdrza/blockhub:latest"  # Docker image name and tag from Docker Hub.
CONTAINER_NAME="blockhub-container"     # Desired name for the Docker container.
APP_HOST_PORT="8080"                  # Host port to access the application (e.g., http://localhost:8080).
APP_CONTAINER_PORT="80"               # Container port the application listens on (usually 80, based on Dockerfile).

# **Check if script is running inside a Docker container**
if [ -f /.dockerenv ]; then
    echo "Error: Running this script inside a Docker container is not supported." >&2
    exit 1
fi

# **Check if Docker is installed**
if command -v docker &> /dev/null; then
    echo "Docker is already installed."
else
    echo "Docker is not installed. Attempting to install Docker..."

    # **Detect Operating System**
    OS=$(uname -s)
    DISTRO=""

    if [[ "$OS" == "Linux" ]]; then
        if command -v apt-get &> /dev/null; then
            DISTRO="debian" # Debian, Ubuntu, Mint, etc.
        elif command -v yum &> /dev/null; then
            DISTRO="centos" # CentOS, RHEL, Fedora (older versions), etc.
        elif command -v dnf &> /dev/null; then
            DISTRO="fedora" # Fedora (newer versions), CentOS Stream, etc.
        elif command -v pacman &> /dev/null; then
            DISTRO="arch" # Arch Linux, Manjaro, etc.
        elif command -v zypper &> /dev/null; then
            DISTRO="suse" # openSUSE, SUSE Linux Enterprise
        else
            DISTRO="unknown_linux"
        fi
    elif [[ "$OS" == "Darwin" ]]; then
        DISTRO="macos"
    else
        DISTRO="unknown"
    fi

    echo "Detected Operating System: $OS ($DISTRO)"

    # **Install Docker based on OS**
    case "$DISTRO" in
        debian|ubuntu|mint)
            echo "- Update and install Requirements For Debian/Ubuntu..."
            sudo apt-get update
            sudo apt-get install -y docker-compose-plugin curl
            ;;
        centos|rhel|fedora)
            echo "- Update and install Requirements For CentOS/RHEL/Fedora..."
            sudo yum update -y # Or dnf for newer Fedora
            sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin # Or dnf for newer Fedora
            ;;
        arch|manjaro)
            echo "- Update and install Requirements For Arch Linux..."
            sudo pacman -Syu --noconfirm docker docker-compose
            sudo systemctl enable docker.service # Enable Docker service to start on boot
            sudo systemctl start docker.service   # Start Docker service immediately
            ;;
        suse|opensuse)
            echo "- Update and install Requirements For openSUSE/SUSE Linux Enterprise..."
            sudo zypper install -y docker docker-compose
            sudo systemctl enable docker.service # Enable Docker service to start on boot
            sudo systemctl start docker.service   # Start Docker service immediately
            ;;
        macos)
            echo "Automatic Docker Desktop installation on macOS is not supported."
            echo "Please download and install Docker Desktop from: https://docs.docker.com/desktop/install/mac/"
            exit 1
            ;;
        unknown_linux|unknown)
            echo "Automatic Docker installation is not supported for your operating system."
            echo "Please install Docker manually from: https://docs.docker.com/get-docker/ for your OS."
            exit 1
            ;;
        *)
            echo "Unknown operating system."
            echo "Please install Docker manually."
            exit 1
            ;;
    esac

    # **Verify Docker installation**
    if ! command -v docker &> /dev/null; then
        echo "Error: Docker installation failed. Please check the installation logs and try again." >&2
        exit 1
    else
        echo "- Run Auto Installer from: get.docker.com"
        curl -sSL https://get.docker.com | sh
        echo "Docker has been successfully installed."
    fi
fi


# **Leave Docker Swarm if active**
docker swarm leave --force 1> /dev/null 2> /dev/null || true

# **Pull Docker image**
echo "Pulling Docker image ${IMAGE_NAME}..."
docker pull ${IMAGE_NAME}

# **Run Docker container**
echo "Running Docker container ${CONTAINER_NAME}..."
docker run --rm -d \
  --name ${CONTAINER_NAME} \
  -p ${APP_HOST_PORT}:${APP_CONTAINER_PORT} \
  ${IMAGE_NAME}

# **Display success message and access URL**
echo ""
echo "Your application has been successfully installed and started."
echo "Your application accessible @:"
echo "http://localhost:${APP_HOST_PORT} (Host port ${APP_HOST_PORT} mapped to container port 80)"
echo "Or if deployed on a server:"
echo "http://<server_ip_address>:${APP_HOST_PORT} (Host port ${APP_HOST_PORT} mapped to container port 80)"
echo ""
echo "To view Application Logs:"
echo "docker logs ${CONTAINER_NAME}"
echo "To stop the application:"
echo "docker stop ${CONTAINER_NAME}"
