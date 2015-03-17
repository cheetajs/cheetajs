// for maps you can do for.="key: Object.keys(obj)"
$cheeta.directive({
	name: 'for',
	isTemplate: true,
	order: 100,
	counter: 0,
	link: function (elem, attr, all, modelRefs) {
		var refElem = document.createComment(elem.outerHTML);
		var array = this.parse(attr.value);
		elem.removeAttr('for.');
		var model = $cheeta.model(array.ref);
		var templateName;
		model.watch(function(val, oldVal) {
			templateName = this.createTemplate(val, elem, array);
			if (Object.isArray(val)) {
				model.child('length').watch(createNewElements);
				val = val.length;
			}
			createNewElements(val, oldVal);
		});
		function createNewElements(val, oldVal) {
			if (val > oldVal) {
				for (var i = oldVal; i < val; i++) {
					var el = new El(templateName).attr('model.', array.index + ':' + i);
					refElem.addBefore(el);
					$cheeta.compiler.compile(el, modelRefs);
				}
			}
		}
	},
	createTemplate: function(val, elem, array) {
		if (Object.isArray(val)) {
			elem.attr('attach.', array.ref + '[' + array.variable + ']');
			elem.attr('model.', array.variable + ':' + array.ref + '[' + array.index + ']');
		} else {
			elem.attr('attach.', array.index + ' > ' + array.ref);
		}
		var templateName = 'O.iterate.tmpl' + this.counter++;
		$cheeta.directive('template.').templates[templateName] = elem.outerHTML;
		return templateName;
	},
	parse : function(val) {
		var split = val.split(/ *: */g);
		var ref = split[1];
		var keys = split[0].split(/ *, */g);
		return {
			ref: ref,
			index: keys.length > 1 ? keys[0] : 'O.iterateIndex',
			variable: keys[keys.length - 1]
		};
	}
});