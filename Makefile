up:
	docker-compose up -d

down:
	docker-compose down

build:
	docker build -t blockhub_v1 .

run:
	docker run --rm -p 80:80 -p 443:443 -v blockhub_volume:/blockhub blockhub_v1

.PHONY: up down build run

