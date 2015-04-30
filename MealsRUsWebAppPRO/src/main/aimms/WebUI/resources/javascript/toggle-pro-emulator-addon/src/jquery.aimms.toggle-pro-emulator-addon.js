(function($, AWF){

var logId = 'addons.toggle-pro-emulator-addon',
log = log4javascript.getLogger(logId);
//setupLogger(logId, "TRACE");

$.widget('aimms.toggle_pro_emulator_addon', AWF.Widget.create({
	_create: function() {
		var widget = this;

		widget.toggleElQ = $('<div class="toggle-pro-emulator">PRO<br/>EMU</div>');

		widget.toggleElQ.on('click', function() {
			var currentState = widget.element.awf.resolvedOptions('pro.emulation');
			widget.element.awf.specifiedOptions('pro.emulation', AWF.OptionUtil.createSpecifiedOption(!currentState));
		});

		widget.element.append(widget.toggleElQ);
	},
	_setEnabled: function(enabled) {
		var widget = this;

		// Update gui
		widget.toggleElQ.toggleClass("enabled", enabled);

		// Toggle AWF / WebUI Runtime
		(function toggleWebUIRuntime() {
			if(widget.element.awf.resolvedOptions('name')) {
				var currentAppBasename = widget.element.awf.resolvedOptions('name').replace(/\/.*/, "");
				var currentPageUri = widget.element.awf.resolvedOptions('pages.current');
				var newAppName;

				if(enabled) {
					newAppName = currentAppBasename+'/1.0';
					AWF.Util.getDeploymentMode = function(){return AWF.Util.DeploymentMode.server};
				} else {
					newAppName = currentAppBasename;
					AWF.Util.getDeploymentMode = function(){return AWF.Util.DeploymentMode.developer};
				}

				// Why can't we just set the new app name and update the pages.current?
				// Navigation addon does not seem to respond to option changes
				widget.element.awf.resolvedOptions('name', newAppName);
				window.history.pushState({pageUri: currentPageUri}, 'app > ' + currentPageUri, location.origin+'/'+newAppName+'/'+currentPageUri);
			}
		})();

		// Toggle Data session
		(function toggleDataSession() {
			if(widget.element.awf.bus.requestRunProcedure) { // during widget construction this might not yet be there?
				widget.element.awf.bus.requestRunProcedure('pro::emu::' + (enabled ? "Enable" : "Disable"), function() {
					// does not appear to be working:(
					//widget.element.awf.bus.requestRunProcedure('webui::RefreshAllCases');
				});
				// workaround
				widget.element.awf.bus.requestRunProcedure('webui::RefreshAllCases');
			}
		})();
	},
	onResolvedOptionChanged: function(optionName, optionValue) {
		var widget = this;

		if(optionName === 'pro.emulation') {
			widget._setEnabled(optionValue || false);
		}
	},
	onControlSessionAvailable: function() {
		var widget = this;
		var currentState = widget.element.awf.resolvedOptions('pro.emulation');

		widget._setEnabled(currentState);
	},
}));

})(jQuery, AWF);
