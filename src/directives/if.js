$cheeta.directive({
	name: 'if',
	isTemplate: true,
	order: 50,
	link: function (elem, attr, all, modelRefs) {
		var refElem = document.createComment(elem.outerHTML);
		elem.addAfter(refElem);
		elem.removeAttr('if.');
		var addedElem;
		elem.cheetaNotCompiled = true;
		elem.addClass('hidden');

		attr.watch(function(val) {
			if (val) {
				if (!addedElem) {
					addedElem = elem.cloneNode(true);
					addedElem.removeClass('hidden');
					refElem.addBefore(addedElem);
					$cheeta.compiler.compile(addedElem, modelRefs);
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