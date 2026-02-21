FROM golang:1.25-alpine3.22

WORKDIR /app

ARG PORT

COPY . .

RUN apk update
RUN apk add --no-cache gcompat

EXPOSE ${PORT}

ENTRYPOINT ["./app"]