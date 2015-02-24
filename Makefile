all: examples/syntax-1.json

examples/%.json: examples/%.yaml
	yaml2json <$< >$@
