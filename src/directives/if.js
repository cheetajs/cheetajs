$cheeta.directive({
	name: 'if',
	isTemplate: true,
	order: 50,
	link: function (elem, attr, all, modelRefs) {
		var refElem = document.createComment(elem.outerHTML);
		elem.addAfter(refElem);
		elem.removeAttr('if.');
		var addedElem;
		attr.watch(function(val) {
			if (elem.parent()) {
				elem.remove();
			}
			if (val) {
				if (!addedElem) {
					addedElem = elem.cloneNode(true);
					refElem.addBefore(addedElem);
					$cheeta.compiler.compile(addedElem, modelRefs);
				}
			} else {
				if (addedElem) {
					addedElem.remove();
					addedElem = null;
				}
			}
		});
	}
});