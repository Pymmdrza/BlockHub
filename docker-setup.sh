#!/bin/bash
echo "Installing BlockHub - [PULLING IMAGE]"
docker pull pymmdrza/blockhub:latest
docker run -d -p 80:80 -p 443:443 --name blockhub pymmdrza/blockhub:latest
echo "BlockHub is Running..."
# client ip
ip_addr=$(curl ifconfig.io)

echo "You Can Access BlockHub @: http://$ip_addr"
