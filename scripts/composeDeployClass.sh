#!/usr/bin/env bash

# Change Dir To Root Path for Run Docker Compose
cd ../
# safety switch, exit script if there's error.
set -e
# safety switch, uninitialized variables will stop script.
set -u
docker-compose -f ./docker-compose.yml build
docker-compose -f ./docker-compose.yml down
docker-compose -f ./docker-compose.yml up -d
