(function($) {

var viewId = "model-dialog-request-handler";

var log = log4javascript.getLogger("plugins.addons.model-dialog-request-handler");
// setupLogger("plugins.addons.model-dialog-request-handler", "DEBUG");

AWF.Bus.subscribe({
	onInitializeOptionTypes: function(elQ, type) {
		if (type ===  "model-dialog-request-handler") {
		// if (type ===  "application") {
			var DialogRequestListOptionType = {
				type: "datasource",
				cached: true,
				persisted: false,
				parts: [{name: "requests"}, {name: "properties"}],
				preferredPartitionSizes: [{parts: ["requests"], preferredMaxPartSize: 2}, {parts: ["properties"], preferredMaxPartSize: Infinity}],
			};

			// Register the list-of-cases option
			AWF.OptionTypeCollector.addOptionType(elQ, "contents2", DialogRequestListOptionType);
			elQ.awf.specifiedOptions("contents2.partition",
				AWF.OptionUtil.createSpecifiedOption({requests: ["<IDENTIFIER-SET>", "webui::rq"], properties: ["webui::df"]})
			);
		}
	},

	onDecorateElement: function(elQ, type) {
		if (type === "model-dialog-request-handler") {
		// if (type ===  "application") {
			elQ.aimms_model_dialog_request_handler();
		}
	},

	postDecorateElement: function(elQ, type) {
		if (type === "model-dialog-request-handler") {
		// if (type ===  "application") {
		window.setTimeout(function() {
			elQ.awf.specifiedOptions("contents2", AWF.OptionUtil.createSpecifiedOption({contents: ["webui::RequestQueue"]}, "aimms"));
		}, 1000);
		}
	},
});
AWF.Bus.publish([
	["logInfoAvailable","broadcastLogInfo"],
]);

})(jQuery);
