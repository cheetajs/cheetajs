$cheeta.directive.add({
	name: 'if',
	isTemplate: true,
	order: 50,
	link: function (elem, attr) {
		elem.removeAttr('if.');
		var addedElem;
		elem.isTemplatePlaceHolder = true;
		elem.addClass('hidden');

		attr.watch(function(val) {
			if (val) {
				if (!addedElem) {
					addedElem = elem.cloneNode(true);
					addedElem.removeClass('hidden');
					elem.addBefore(addedElem);
					$cheeta.compiler.compile(addedElem);
				}
			} else {
				if (addedElem) {
					addedElem.remove();
					// attr.fireElemRemoved(addedElem);
					addedElem = null;
				}
			}
		});
	}
});