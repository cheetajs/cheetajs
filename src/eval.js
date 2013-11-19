$cheeta.futureEvals = [];

$cheeta.directives.push({ 
	name: 'eval',
	fn:  function(def) {
		$cheeta.futureEvals.push(def);
	}
});