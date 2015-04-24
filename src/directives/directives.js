$cheeta.directive({
	name: 'watch*',
	link: function(elem, attr) {
		attr.watch(function() {
			eval(elem.attr('onwatch'));
		});
	}
});
$cheeta.directive({
	name: 'value',
	link: function (elem, attr) {
		attr.watch(function (val) {
			if (elem.type && elem.type.toLowerCase() === 'checkbox') {
				elem.checked = val;
			} else if (elem.value !== val) {
				elem.value = val || null;
			}
		});
	}
});
$cheeta.directive({
	name: 'bind',
	order: 800,
	link: function (elem, attr) {
		$cheeta.directives.get('value')[0].directive.link(elem, attr);
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
			//todo exclude keys that don't edit like arrow keys
			elem.on('change keydown keyup', function () {
				for(var i = 0; i < models.length; i++) {
					models[i].setValue(elemValue());
				}
			});
		}
		listen(attr.models());
	}
});
$cheeta.directive({
	name: 'text',
	link: function (elem, attr) {
		attr.watch(function (val) {
			elem.innerHTML = '';
			elem.appendChild(document.createTextNode(val == null ? '' : val));
		});
	}
});
$cheeta.directive({
	name: 'html',
	link: function (elem, attr) {
		attr.watch(function (val) {
			if (val !== elem.innerHTML) {
				elem.innerHTML = val == null ? '' : val;
			}
		});
	}
});

$cheeta.directive({
	name: 'show',
	isTemplate: true,
	link: function (elem, attr, modelRefs) {
		attr.watch(function (val) {
			if (val) {
				elem.style.display = '';
				if (!elem.getAttribute('OoCompiled')) {
					elem.setAttribute('OoCompiled', true);
					$cheeta.compiler.compileChildren(elem, modelRefs);
				}
			} else {
				elem.style.display = 'none';
			}
		});
	}
});

$cheeta.directive({
	name: 'onaction',
	link: function (elem, attr, allAttr, modelRefs) {
		$cheeta.compiler.compileAttr(elem,
			{name: 'onclick.onkeydown-space-enter.', value: attr.value}, modelRefs);
	}
});

$cheeta.directive({
	name: 'init',
	link: function (elem, attr) {
		$cheeta.future(attr.evaluate);
	}
});

$cheeta.directive({
	name: 'focus',
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
			var baseAttrName = attr.key;
			if (val == null) {
				elem.removeAttribute(baseAttrName);
			} else {
				elem.setAttribute(baseAttrName, val);
			}
		});
	}
});

$cheeta.directive({
	name: 'model',
	order: 200,
	lastId: 0,
	link: function (elem, attr, allAttr, modelRefs) {
		//TODO handle app1['myapp,yourapp']
		var modelDef = attr.value.split(/ *[,;] */g);
		var models = {};

		function makeWatch(m, ref) {
			return function() {
				m.value = attr.evaluate({}, ref);
				m.valueChange();
			};
		}

		for (var i = 0; i < modelDef.length; i++) {
			if (modelDef[i] === '') continue;
			//TODO handle app1['123 as 123']
			var split = modelDef[i].split(/ *: */g);
			var ref = split[1] || split[0];
			var as = split.length > 1 ? split[0] : null;
			if (as) {
				var m = new $cheeta.Model(as, null);
				m.refId = this.lastId++;
				m.value = attr.evaluate({}, ref);
				attr.watch(makeWatch(m, ref), ref);
				models[as] = m;
				models.$$last$$ = m;
			} else {
				var model = $cheeta.model(ref, modelRefs);
				models[model.names[0]] = model;
				models.$$last$$ = model;
			}
//			eval(model.ref() + '=' + model.ref() + '|{}');
		}
		return models;
	}
});