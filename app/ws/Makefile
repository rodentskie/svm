docker:
	mkdir -p tmp
	cp app .dockerignore Dockerfile tmp/
	docker build --no-cache tmp/ --tag ws:latest
	rm -rf tmp