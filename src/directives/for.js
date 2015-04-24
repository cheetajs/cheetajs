// for maps you can do for.="key: Object.keys(obj)"
$cheeta.directive({
	name: 'for',
	isTemplate: true,
	order: 100,
	link: function (elem, attr, all, modelRefs) {
		var refElem = document.createComment(elem.outerHTML);
		elem.addAfter(refElem);
		var array = this.parse(attr.value);
		elem.removeAttr('for.');
		var model = $cheeta.model(array.ref, modelRefs);
		elem.attr('model.', array.variable + ':<M>;' + (elem.attr('model.') || ''));

		function watchFn(val, oldVal) {
			if (elem.parent() != null) {
				elem.remove();
				oldVal = 0;
				if (Object.isArray(val)) {
					model.child('length').watch(elem, repeatElements);
					val = val.length;
					repeatElements(val, oldVal);
					return;
				}
			}
			repeatElements(val, oldVal, true);
		}
		function repeatElements(val, oldVal, isRange) {
			var i;
			if (val > oldVal) {
				for (i = oldVal; i < val; i++) {
					var el = elem.cloneNode(true);
					el.attr('model.', el.attr('model.').replace('<M>',
						isRange ? i + 1 : array.ref + '[' + i + ']' ));
					refElem.addBefore(el);
					if (array.index) {modelRefs[array.index] = i;}
					$cheeta.compiler.compile(el, modelRefs);
				}
			} else if (val < oldVal) {
				for (i = val; i < oldVal; i++) {
					refElem.prev().remove();
				}
			}
		}
		model.watch(elem, watchFn);
		if (model.value != null) {
			watchFn(model.value, null);
		}
	},
	parse : function(val) {
		var split = val.split(/ *: */g);
		var ref = split[1];
		var keys = split[0].split(/ *, */g);
		return {
			ref: ref,
			index: keys.length > 1 ? keys[0] : null,
			variable: keys[keys.length - 1]
		};
	}
});