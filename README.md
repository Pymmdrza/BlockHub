# BlockHub - HTTPS Configuration Guide

This guide provides instructions on how to enable and configure HTTPS for the BlockHub application. By following these steps, you can ensure secure communication between your application and its users.

---

## Prerequisites

1. **Docker and Docker Compose**: Ensure that Docker and Docker Compose are installed on your system.
2. **OpenSSL**: OpenSSL is required to generate self-signed SSL certificates for development environments.

---

## Steps to Enable HTTPS

### 1. Generate SSL Certificates

For development purposes, you can generate self-signed SSL certificates using the provided script.

1. Navigate to the `scripts` directory:
   ```bash
   cd scripts
   ```

2. Run the `generate-ssl-cert.sh` script:
   ```bash
   ./generate-ssl-cert.sh
   ```

   This will generate the following files in the `certs` directory:
   - `self-signed.crt`: The SSL certificate.
   - `self-signed.key`: The private key.

3. Move the generated certificates to the appropriate directory:
   ```bash
   mv certs/self-signed.crt /etc/ssl/certs/
   mv certs/self-signed.key /etc/ssl/private/
   ```

---

### 2. Update Environment Variables

Update the `.env` file with the following SSL configuration:

```env
# SSL Configuration
SSL_CERTIFICATE=/etc/ssl/certs/self-signed.crt
SSL_CERTIFICATE_KEY=/etc/ssl/private/self-signed.key
```

If you are using a custom domain, update the `DOMAIN` variable:

```env
DOMAIN=yourdomain.com
```

---

### 3. Configure Nginx

The Nginx configuration has been updated to support both HTTP and HTTPS. The configuration includes:

- **HTTP to HTTPS Redirection**: All HTTP traffic is redirected to HTTPS.
- **SSL Settings**: Secure protocols and ciphers are enforced.

The Nginx configuration file is located at `nginx.conf`. It uses environment variables to dynamically configure the domain and SSL paths.

---

### 4. Update Docker Compose

The `docker-compose.yml` file has been updated to expose the HTTPS port (443) and mount the SSL certificates. Ensure the following configuration is present:

```yaml
services:
  blockhub:
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/ssl/certs:/etc/ssl/certs:ro
      - /etc/ssl/private:/etc/ssl/private:ro
```

---

### 5. Build and Run the Application

Rebuild the Docker image and start the application:

1. Build the Docker image:
   ```bash
   docker-compose build
   ```

2. Start the application:
   ```bash
   docker-compose up
   ```

---

### 6. Access the Application

- **HTTP**: Access the application at `http://localhost`.
- **HTTPS**: Access the application at `https://localhost`.

If you are using a custom domain, replace `localhost` with your domain name.

---

## Notes

- **Self-Signed Certificates**: Self-signed certificates are suitable for development environments. For production, use certificates issued by a trusted Certificate Authority (CA).
- **Browser Warnings**: Browsers may display warnings for self-signed certificates. This is expected in development environments.

---

## Troubleshooting

1. **SSL Certificate Not Found**:
   - Ensure the `SSL_CERTIFICATE` and `SSL_CERTIFICATE_KEY` paths in the `.env` file are correct.
   - Verify that the certificate and key files exist in the specified locations.

2. **Nginx Configuration Issues**:
   - Check the Nginx logs for errors:
     ```bash
     docker logs blockhub
     ```

3. **Port Conflicts**:
   - Ensure that ports 80 and 443 are not being used by other services on your system.

---

By following this guide, you can successfully enable HTTPS for the BlockHub application, ensuring secure communication for your users.
