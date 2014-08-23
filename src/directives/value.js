new $cheeta.Directive('value.').onModelValueChange(function(val, elem) {
	if (elem.type && elem.type.toLowerCase() === "checkbox") {
		elem.checked = val;
	} else if (elem.value != val) {
		elem.value = val || null;
	}
});