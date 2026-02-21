docker:
	mkdir -p tmp
	cp app .env .dockerignore Dockerfile tmp/
	rsync -a transactions/ tmp/transactions/
	docker build --no-cache tmp/ --tag migrations:latest
	rm -rf tmp app