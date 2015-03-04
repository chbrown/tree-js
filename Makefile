all: examples/syntax-1.json site.css checker/components.js checker/TreeNode.js

examples/%.json: examples/%.yaml
	yaml2json <$< >$@

%.css: %.less
	lessc $< | cleancss --keep-line-breaks --skip-advanced -o $@

%.js: %.jsx
	jsx <$< >$@

%.js: %.ts
	tsc -m commonjs -t ES5 $+
