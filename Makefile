SRC = JSON-Schema-Test-Suite/tests/draft4
DST = test/suite

SRCFILES = $(wildcard $(SRC)/*.json)
JS = $(addsuffix .js, $(basename $(notdir $(SRCFILES))))
DSTFILES = $(JS:%.js=$(DST)/%.js)

build: components index.js $(DSTFILES)
	@component build --dev

components: component.json
	@component install --dev

$(DST)/%.js: $(SRC)/%.json
	@echo "window['json-schema-test-suite']['$(basename $(notdir $@))'] = " > $@ 
	@cat "$<"  >> $@
	@echo ";" >> $@

clean:
	rm -fr build components template.js

.PHONY: clean
