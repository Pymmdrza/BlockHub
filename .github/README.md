# Block Hub 

The simplest and most modern Bitcoin transaction explorer


![blockhub Bitcoin explorer backend service](/.github/logo-header.png)

Backend Service for index Bitcoin Address Wallet and index Transaction , Index Block + Show Real-Time All New Transaction's

![screenshot from blockhub bitcoin backend service explorer](/.github/Screenshot_main.png)


- Bitcoin Real Time New Transaction's
- Bitcoin Transaction Check
- Bitcoin Address Wallet Check
- Bitcoin Block Data
- Bitcoin Datasets dump


## Install and usage

> [!NOTE]
> First Change and Replace Your Domain or Sub domain + Email on `.env` [Here](../.env)

A modern, real-time Bitcoin blockchain explorer built with React and TypeScript.

## Quick Start with Docker

The easiest way to run BlockHub is using Docker. Make sure you have [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed on your system.

### One-Command Setup (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/Pymmdrza/BlockHub.git
   cd BlockHub
   ```

2. Run the setup command:
   ```bash
   docker-compose up --build
   ```
   
   This will:
   - Create a `.env` file from `.env.example`
   - Make all scripts executable
   - Install dependencies
   - Set up the environment

3. Update the `.env` file with your settings:
   ```env
   DOMAIN=your-domain.com
   ADMIN_EMAIL=your-email@domain.com
   USE_SSL=true
   ```

4. Start the application:
   ```bash
   make deploy
   ```

### Manual Setup

If you prefer to set up manually:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your settings

3. Build and start:
   ```bash
   docker-compose up -d --build
   ```

## Available Make Commands

- `make help` - Show all available commands
- `make init` - Initialize the project
- `make deploy` - Deploy the application
- `make docker-logs` - View container logs
- `make docker-restart` - Restart containers
- `make docker-clean` - Clean Docker artifacts

## Features

- Real-time Bitcoin price tracking
- Live transaction monitoring
- Address balance and transaction history
- Transaction details and analysis
- Dark mode optimized interface
- Responsive design

## Environment Variables

The following environment variables can be configured in your `.env` file:

- `DOMAIN`: Your domain name (e.g., blockhub.example.com)
- `ADMIN_EMAIL`: Your email address for SSL certificates
- `USE_SSL`: Set to `true` to enable SSL/HTTPS, `false` otherwise
- `VITE_API_BASE_URL`: API base URL (default: /api/v2)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Author

[Pymmdrza](https://github.com/Pymmdrza)

