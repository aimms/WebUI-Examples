// Create a base AWF Widget and register it as a jQuery UI widget:
jQuery.widget('aimms.model_dialog_request_handler', AWF.Widget.create({
    _create: function() {
		this.currentRequestQueue = [];
		this.isHandlingRequest = false;
	},
	onResolvedOptionChanged: function(optionName, optionValue) {
		var widget = this;

		if(!widget.isHandlingRequest && optionName == "contents" && optionValue) {
			var dataSource = optionValue;
			AWF.DataSourceUtil.getAsListOfObjects(dataSource, function(requests) {
				widget.currentRequestQueue = requests;

				var unhandledRequests = requests.filter(function(request){return request("result").value == "<empty>"});
				var request = unhandledRequests[0];
				if(request) {
					widget.isHandlingRequest = true;
					var requestId = request("rq").value;
					var title = request("title").value;
					var message = request("message").value;
					var resultRef = request("result");
					var actionsJson = request("actions").value;
					var actionsArray = JSON.parse(actionsJson);
					var actions = Object.transform(actionsArray, function(index, actionName) {
						return [actionName, function() {
							var currentResultRef = widget.currentRequestQueue.reduce(function(prev, cur) {
								return prev || (cur("rq").value == requestId && cur("result"));
							}, null);
							var currentDataSource = widget.element.awf.resolvedOptions('contents');
							if(currentDataSource) {
								currentDataSource.values.requestSetValue(
									[
										{start: currentResultRef.position.row, end: currentResultRef.position.row+1},
										{start: currentResultRef.position.col, end: currentResultRef.position.col+1}
									],
									"values",
									actionName
								);
							}
							widget.isHandlingRequest = false;
						}];
					});

					AWF.Bus.requestPerformDialog(title, message, actions);
				}

			});
		}
	},
}));
