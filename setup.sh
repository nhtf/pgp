#!/bin/sh

set -x

if [ ! -f .env ]; then
	cp example.env .env
fi

if [ ! -f backend/.env ]; then
	ln .env backend/.env
fi

if [ ! -f frontend/.env ]; then
	ln .env frontend/.env
fi
