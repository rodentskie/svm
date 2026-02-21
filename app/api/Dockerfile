FROM golang:1.25-alpine3.22

WORKDIR /app

ARG PORT=8080
ENV PORT=${PORT}

COPY . .

RUN apk update
RUN apk add --no-cache gcompat

EXPOSE 8080

ENTRYPOINT ["./app"]