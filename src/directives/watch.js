$cheeta.directive({
	name: 'watch*',
	link: function(elem, attr) {
		attr.watch(function() {
			eval(elem.attr('onwatch.'));
		});
	}
});
$cheeta.directive({
	name: 'value.',
	order: 800,
	link: function (elem, attr, modelRefs) {
		attr.watch(function (val) {
			if (elem.type && elem.type.toLowerCase() === 'checkbox') {
				elem.checked = val;
			} else if (elem.value !== val) {
				elem.value = val || null;
			}
		});
		function elemValue() {
			if (elem.type && elem.type.toLowerCase() === 'checkbox') {
				return elem.checked;
			}
			if (elem.tagName.toLowerCase() === 'input' || elem.tagName.toLowerCase() === 'textarea') {
				return elem.value;
			} else {
				return elem.innerHTML;
			}
		}
		function listen (models) {
			elem.on('change keydown keyup', function () {
				for(var i = 0; i < models.length; i++) {
					models[i].setValue(elemValue())
				}
			});
		}
		listen(attr.parse().models);
	}
});
$cheeta.directive({
	name: 'text.',
	link: function (elem, attr) {
		attr.watch(function (val) {
			elem.innerHTML = '';
			elem.appendChild(document.createTextNode(val == null ? '' : val));
		});
	}
});
$cheeta.directive({
	name: 'html.',
	link: function (elem, attr) {
		attr.watch(function (val) {
			if (val !== elem.innerHTML) {
				elem.innerHTML = val == null ? '' : val;
			}
		});
	}
});

$cheeta.directive({
	name: 'show.',
	isTemplate: true,
	link: function (elem, attr) {
		attr.watch(function (val) {
			if (val) {
				elem.style.display = '';
				if (!elem.getAttribute('OoCompiled')) {
					elem.setAttribute('OoCompiled', true);
					$cheeta.compiler.compileChildren(parentModels, elem);
				}
			} else {
				elem.style.display = 'none';
			}
		});
	}
});

$cheeta.directive({
	name: 'onaction.',
	link: function (elem, attr) {
		elem.setAttribute('onclick.onkeydown-space-enter.', attr.value);
		attr.remove();
	}
});

$cheeta.directive({
	name: 'init.',
	link: function (elem, attr) {
		$cheeta.future.evals.push(attr.value);
	}
});

$cheeta.directive({
	name: 'focus.',
	link: function (elem, attr) {
		attr.watch(function (val) {
			elem.focus(val);
		});
	}
});

$cheeta.directive({
	name: '',
	link: function (elem, attr) {
		attr.watch(function (val) {
			var baseAttrName = attr.name.substring(
				attr.name.indexOf('data-') === 0 ? 5 : 0, attr.name.length - 1);
			if (val == null) {
				elem.removeAttribute(baseAttrName);
			} else {
				elem.setAttribute(baseAttrName, val);
			}
		});
	}
});

$cheeta.directive({
	name: 'model.',
	order: 200,
	link: function (elem, attr) {
		//TODO handle app1['myapp,yourapp']
		var modelDef = attr.value.split(/ *, */g);
		var models = [];

		for (var i = 0; i < modelDef.length; i++) {
			//TODO handle app1['123 as 123']
			var split = modelDef[i].split(/ +: +/g);
			var name = split[1] || split[0];
			var as = split.length > 1 ? split[0] : null;
			var model = attr.parse(name).models[0];
			model.alias(as);
			models.push(model);
//			eval(model.ref() + '=' + model.ref() + '|{}');
		}
		return models;
	}
});
