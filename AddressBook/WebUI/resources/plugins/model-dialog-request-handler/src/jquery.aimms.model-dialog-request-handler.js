// Create a base AWF Widget and register it as a jQuery UI widget:
jQuery.widget('aimms.model_dialog_request_handler', AWF.Widget.create({
    _create: function() {
		console.log("CREATED");
		this.currentRequestQueue = [];
		this.isHandlingRequest = false;
	},
	onResolvedOptionChanged: function(optionName, optionValue) {
		var widget = this;

		console.log("onResolvedOptionChanged", arguments);
		if(!widget.isHandlingRequest && optionName == "contents2" && optionValue) {
			console.log("WE GOT A VALUE: ", optionValue);
			var dataSource = optionValue;
			AWF.DataSourceUtil.getAsListOfObjects(dataSource, function(requests) {
				widget.currentRequestQueue = requests;

				var unhandledRequests = requests.filter(function(request){return request("result").value == "<empty>"});
				console.log("req/unh:", requests.map(function(r){return r("rq").value}), unhandledRequests.map(function(r){return r("rq").value}));
				var request = unhandledRequests[0];
				console.log("request", request);
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
							console.log("requestSetValue:", actionName)
							var currentResultRef = widget.currentRequestQueue.reduce(function(prev, cur) {
								return prev || (cur("rq").value == requestId && cur("result"));
							}, null);
							var currentDataSource = widget.element.awf.resolvedOptions('contents2');
							console.log("RWGRWGW", request("rq"), request("result"), currentResultRef);
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

					REQUESTS=requests;
					console.log("Check REQUESTS");
					AWF.Bus.requestPerformDialog(title, message, actions);
				}

			});
		}
	},
}));
