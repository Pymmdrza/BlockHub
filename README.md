# BlockHub - Bitcoin Blockchain Explorer

![BlockHub Logo](https://img.shields.io/badge/BlockHub-Bitcoin%20Explorer-orange)
![Version](https://img.shields.io/badge/version-1.0.3-blue)
![License](https://img.shields.io/badge/license-MIT-green)

BlockHub is a modern, real-time Bitcoin blockchain explorer designed to provide comprehensive insights into Bitcoin transactions, addresses, and network activity. The platform offers a user-friendly interface for exploring the Bitcoin blockchain, with features including live transaction monitoring, detailed address analysis, and access to extensive blockchain datasets.

## 🚀 Features

- **Real-time Transaction Monitoring**: Watch Bitcoin transactions as they happen
- **Address Explorer**: View comprehensive details about any Bitcoin address
- **Block Explorer**: Browse the latest blocks and their contents
- **Mempool Explorer**: Monitor unconfirmed transactions and fee estimates
- **Network Statistics**: Track Bitcoin network metrics in real-time
- **Datasets**: Access to extensive Bitcoin blockchain datasets
- **Dark Mode Optimized**: Beautiful dark interface for comfortable viewing
- **Mobile Responsive**: Fully responsive design for all devices

## 🛠️ Technology Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS for modern, responsive styling
- **State Management**: React Hooks
- **Icons**: Lucide React
- **Charts**: Recharts for data visualization
- **API Integration**: Blockchain.com API
- **Containerization**: Docker for easy deployment

## 📋 Prerequisites

- Docker
- Docker Compose

## 🔧 Installation

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
   chmod +x ssl-setup.sh
   ./ssl-setup.sh yourdomain.com
   ```

3. Start BlockHub with production settings:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. Access BlockHub at `https://yourdomain.com`

## 🌐 Environment Variables

BlockHub can be configured using the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| DOMAIN | Domain name for the application | localhost |
| PORT | Port to run the application on | 80 |
| NGINX_WORKER_PROCESSES | Number of Nginx worker processes | auto |
| NGINX_WORKER_CONNECTIONS | Maximum connections per worker | 1024 |
| PROXY_READ_TIMEOUT | Proxy read timeout in seconds | 60 |
| PROXY_CONNECT_TIMEOUT | Proxy connection timeout in seconds | 60 |

## 📊 API Integration

BlockHub integrates with the following APIs:

- **Blockchain.com API**: For blockchain data, transactions, and blocks
- **CoinGecko API**: For Bitcoin price information
- **GitHub API**: For dataset information

The application includes fallback mechanisms to ensure functionality even when APIs are unavailable.

## 🔍 Docker Commands

See [docker-commands.md](docker-commands.md) for a list of useful Docker commands for managing your BlockHub deployment.

## 📦 Project Structure

```
blockhub/
├── .env                 # Environment variables
├── .env.example         # Example environment variables
├── docker-compose.yml   # Docker Compose configuration
├── docker-compose.prod.yml # Production Docker Compose configuration
├── Dockerfile           # Docker configuration
├── nginx.conf           # Nginx configuration
├── nginx.ssl.conf       # Nginx configuration with SSL
├── docker-entrypoint.sh # Docker entrypoint script
├── docker-setup.sh      # Setup script
├── ssl-setup.sh         # SSL setup script
├── renew-ssl.sh         # SSL renewal script
└── src/                 # Application source code
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

- **Pymmdrza** - [GitHub](https://github.com/Pymmdrza)