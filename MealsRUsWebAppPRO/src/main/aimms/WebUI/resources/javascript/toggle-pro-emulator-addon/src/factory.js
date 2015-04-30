(function(AWF){
	AWF.Bus.subscribe({
		onInitializeOptionTypes: function(elQ, type) {
			if (type === 'application') {
				AWF.OptionTypeCollector.addOptionType(elQ, 'pro.emulation', 'boolean');
			}
		},
		onDecorateElement: function(elQ, type) {
			if (type === 'application') {
				elQ.awf.bus.subscribe({
					onDecorateChromebar: function(chromebarElQ) {
						chromebarElQ.aimms_toggle_pro_emulator_addon();
					}
				});

				AWF.Bus.subscribe({
					onRequestResolveUri: function(uri, type, resolvedUriReference) {
						var enabled = elQ.awf.resolvedOptions('pro.emulation') || false;

						if(enabled) {
							var appName = elQ.awf.resolvedOptions('name');
							resolvedUriReference.uri = resolvedUriReference.uri.replace(appName, '');
						}
					},
				});
			}
		},
	});
})(AWF);
