all: examples/syntax-1.json site.css

examples/%.json: examples/%.yaml
	yaml2json <$< >$@

%.css: %.less
	lessc $< | cleancss --keep-line-breaks --skip-advanced -o $@

%.js: %.jsx
  jsx <$< >$@
