# replace these values
export DOMAIN=${PRIMARY_DOMAIN:-example.com}
export APP_ADDRESS={${DOMAIN:-example.com}:9000}

# install docker first, and then run following command
docker run -d \
  --name nginx-auto-ssl \
  --restart on-failure \
  --network host \
  -e ALLOWED_DOMAINS="$DOMAIN" \
  -e SITES="$DOMAIN=$APP_ADDRESS" \
  -v ssl-data:/etc/resty-auto-ssl \
  valian/docker-nginx-auto-ssl

# display logs from container, to check if everything is fine.
docker logs nginx-auto-ssl