SRC = JSON-Schema-Test-Suite/tests/draft4
DST = test/suite

SRCFILES = $(wildcard $(SRC)/*.json)
JS = $(addsuffix .js, $(basename $(notdir $(SRCFILES))))
DSTFILES = $(JS:%.js=$(DST)/%.js)

build: components index.js $(DSTFILES)
	@component build --dev

components: component.json
	@component install --dev

suite: $(DSTFILES)

$(DST)/%.js: $(SRC)/%.json
	@mkdir -p $(DST)
	@echo "window['json-schema-test-suite']['$(basename $(notdir $@))'] = " > $@ 
	@cat "$<"  >> $@
	@echo ";" >> $@

clean:
	rm -fr build components $(DST)

.PHONY: clean
