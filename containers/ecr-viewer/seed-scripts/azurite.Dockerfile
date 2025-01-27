FROM mcr.microsoft.com/azure-storage/azurite:latest

RUN apk add py3-pip
RUN apk add gcc musl-dev python3-dev libffi-dev openssl-dev cargo make
RUN pip install --upgrade pip
RUN pip install azure-cli

WORKDIR /data
CMD ["/bin/sh"]
