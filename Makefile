.PHONY: setup list doctor demo test test-core test-tasks web-build lint

PYTHON ?= python3

setup:
	$(PYTHON) -m pip install -e .
	npm ci

list:
	PYTHONPATH=core $(PYTHON) -m repogauntlet.cli list

doctor:
	PYTHONPATH=core $(PYTHON) -m repogauntlet.cli doctor

demo:
	PYTHONPATH=core $(PYTHON) -m repogauntlet.cli demo --output reports/latest.json

test-core:
	PYTHONPATH=core $(PYTHON) -m unittest discover -s tests -v

test-tasks:
	PYTHONPATH=core $(PYTHON) -m repogauntlet.cli validate --all

test: test-core test-tasks web-build

web-build:
	npm run build

lint:
	npm run lint
	PYTHONPATH=core $(PYTHON) -m compileall -q core tests

