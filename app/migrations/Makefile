docker:
	mkdir -p tmp
	cp app .env .dockerignore Dockerfile tmp/
	docker build --no-cache tmp/ --tag migrations:latest
	rm -rf tmp