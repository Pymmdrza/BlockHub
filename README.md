# BlockHub - Bitcoin Blockchain Explorer

[![BlockHub Logo](https://img.shields.io/badge/BlockHub-Bitcoin%20Explorer-orange)](https://blockhub.mmdrza.com)
[![Version](https://img.shields.io/badge/version-1.0.3-blue)](https://blockhub.mmdrza.com)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[![BlockHub Bitcoin Explorer Backend Service](.github/logo-headers.svg)](#)

BlockHub is a modern, real-time Bitcoin blockchain explorer designed to provide comprehensive insights into Bitcoin transactions, addresses, and network activity. The platform offers a user-friendly interface for exploring the Bitcoin blockchain, with features including live transaction monitoring, detailed address analysis, and access to extensive blockchain datasets.

## Features

- **Real-time Transaction Monitoring**: Watch Bitcoin transactions as they happen
- **Block Explorer**: Browse the latest blocks and their contents
- **Mempool Explorer**: Monitor unconfirmed transactions and fee estimates
- **Address Explorer**: View comprehensive details about any Bitcoin address
- **Network Statistics**: Track Bitcoin network metrics in real-time
- **Datasets**: Access to extensive Bitcoin blockchain datasets (Auto Update Every 24h)

---

## Fast execution BlockHub with Docker and optimized resources

Run with docker from official blockhub image with `latest` tag.

```shell
docker pull pymmdrza/blockhub:latest
docker run -d -p 80:80 -p 443:443 --name blockhub pymmdrza/blockhub:latest
```


### Git

```shell
git clone https://github.com/Pymmdrza/BlockHub
cd BlockHub
```

- replace `.env.example` to `.env`

```shell
chmod +x docker-setup.sh
./docker-setup.sh
```


### Docker

See [docker-commands.md](docs/docker.md) for a list of useful Docker commands for managing your BlockHub deployment.
- ُفشقف


| Action       | Description                                    | Link                                               |
|--------------|------------------------------------------------|----------------------------------------------------|
| Start        | Start the BlockHub Docker Container            | [view](/docs/docker.md#start-blockhub)             |
| Stop         | Stop the BlockHub Docker Container             | [view](/docs/docker.md#stop-blockhub)              |
| Logs         | View the logs of the BlockHub Docker Container | [view](/docs/docker.md#view-logs)                  |
| Rebuild      | Rebuild the BlockHub Docker Container          | [view](/docs/docker.md#rebuild-and-restart)        |
| Restart      | Restart the BlockHub Docker Container          | [view](/docs/docker.md#rebuild-and-restart)        |
| Status       | Check Container Status                         | [view](/docs/docker.md#check-container-status)     |
| Health       | Check Container Health                         | [view](/docs/docker.md#check-container-health)     |
| Shell        | Enter Container Shell                          | [view](/docs/docker.md#enter-container-shell)      |
| Nginx        | View Nginx Configuration                       | [view](/docs/docker.md#view-nginx-configuration)   |
| Nginx Test   | Test Nginx Configuration                       | [view](/docs/docker.md#test-nginx-configuration)   |
| Nginx Reload | Reload Nginx Configuration                     | [view](/docs/docker.md#reload-nginx-configuration) |

---

### Backup & Restore

| Action     | Description                  | Link                                                 |
|------------|------------------------------|------------------------------------------------------|
| Backup     | Backup BlockHub Data         | [view](/docs/docker.md#backup-and-restore)           |
| Restore    | Restore BlockHub Data        | [view](/docs/docker.md#backup-and-restore)           |
| Backup Env | Backup Environment Variables | [view](/docs/docker.md#backup-environment-variables) |

---

### Troubleshooting

- Check Nginx Logs [view](/docs/docker.md#check-nginx-logs)
- Check Container Resource Usage [view](/docs/docker.md#check-container-resource-usage)
- Restart Container [view](/docs/docker.md#restart-container)
- Force Remove Container [view](/docs/docker.md#force-remove-container)
- Clean Up Docker System [view](/docs/docker.md#clean-up-docker-system)

---

## Technology Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS for modern, responsive styling
- **State Management**: React Hooks
- **Icons**: Lucide React
- **Charts**: Recharts for data visualization
- **API Integration**: Blockchain.com API
- **Containerization**: Docker for easy deployment

## Prerequisites

- Docker
- Docker Compose

## Installation

### Quick Start with Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/blockhub.git
   cd blockhub
   ```

2. Run the setup script:
   ```bash
   chmod +x docker-setup.sh
   ./docker-setup.sh
   ```

3. Access BlockHub at `http://localhost` (or the domain/port you configured)

### Manual Setup with Docker Compose

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/blockhub.git
   cd blockhub
   ```

2. Create a `.env` file with your configuration:
   ```bash
   cp .env.example .env
   ```

3. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

4. Access BlockHub at `http://localhost` (or the domain/port you configured)

### Production Deployment with SSL

1. Set up your domain and ensure it points to your server

2. Run the SSL setup script:
   ```bash
   chmod +x scripts/ssl-setup.sh
   ./scripts/ssl-setup.sh yourdomain.com
   ```

3. Start BlockHub with production settings:

   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

5. Access BlockHub at `https://yourdomain.com`

   
The application includes fallback mechanisms to ensure functionality even when APIs are unavailable.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Programmer



- **Pymmdrza** - [GitHub](https://github.com/Pymmdrza)
