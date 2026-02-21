docker:
	mkdir -p tmp
	cp app .env .dockerignore Dockerfile tmp/
	docker build --no-cache tmp/ --tag api:latest
	rm -rf tmp app