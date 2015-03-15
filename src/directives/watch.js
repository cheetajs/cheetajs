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
	name: 'init.',
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