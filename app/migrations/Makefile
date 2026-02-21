docker:
	mkdir -p tmp
	cp -R transactions/ app .env .dockerignore Dockerfile tmp/
	docker build --no-cache tmp/ --tag migrations:latest
	rm -rf tmp app