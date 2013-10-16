SRC = JSON-Schema-Test-Suite/tests/draft4
DST = test/suite
DSTNODE = test/suite.node

SRCFILES = $(wildcard $(SRC)/*.json)
JSON = $(notdir $(SRCFILES))
JS = $(addsuffix .js, $(basename $(JSON)))

DSTFILES = $(JS:%.js=$(DST)/%.js)
DSTNODEFILES = $(JSON:%.json=$(DSTNODE)/%.json)

build: components index.js $(DSTFILES)
	@component build --dev

components: component.json
	@component install --dev

$(DST)/%.js: $(SRC)/%.json
	@mkdir -p $(DST)
	@echo "window['json-schema-test-suite']['$(basename $(notdir $@))'] = " > $@ 
	@cat "$<"  >> $@
	@echo ";" >> $@

node: $(DSTNODEFILES)

$(DSTNODE)/%.json: $(SRC)/%.json
	@mkdir -p $(DSTNODE)
	@cat "$<"  >> $@

clean:
	rm -fr build components $(DST) $(DSTNODE)

.PHONY: clean
