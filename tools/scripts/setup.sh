#!/bin/bash

set -e

# reset nx cache
nx reset

# cleanup docker environment
docker rm -f $(docker ps -aq) || true
echo "y" | docker system prune -a && echo "y" | docker volume prune -a && docker system df

# build
yarn run build

# build docker image
yarn run docker

# run compose file
docker-compose -f _docker/docker-compose.yml up -d