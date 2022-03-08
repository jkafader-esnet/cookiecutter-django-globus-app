FROM python:3.9

ENV PYTHONBUFFERED=1

RUN apt-get update \
    && pip install --upgrade pip

COPY requirements.txt /
RUN pip install -r /requirements.txt

COPY ./entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r//' /entrypoint.sh \
    && chmod +x /entrypoint.sh

COPY . /backend
WORKDIR /backend

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]