// Create a base AWF Widget and register it as a jQuery UI widget:
jQuery.widget('aimms.model_dialog_request_handler', AWF.Widget.create({
    _create: function() {
		console.log("CREATED");
		this.currentRequestQueue = [];
	},
	onResolvedOptionChanged: function(optionName, optionValue) {
		var widget = this;

		console.log("onResolvedOptionChanged", arguments);
		if(optionName == "contents2" && optionValue) {
			console.log("WE GOT A VALUE: ", optionValue);
			var dataSource = optionValue;
			AWF.DataSourceUtil.getAsListOfObjects(dataSource, function(requests) {
				widget.currentRequestQueue = requests;

				var unhandledRequests = requests.filter(function(request){return request("result").value == "<empty>"});
				console.log("req/unh:", requests, unhandledRequests);
				var request = unhandledRequests[0];
				console.log("request", request);
				if(request) {
					var title = request("title").value;
					var message = request("message").value;
					var resultRef = request("result");
					var actionsJson = request("actions").value;
					var actionsArray = JSON.parse(actionsJson);
					var actions = Object.transform(actionsArray, function(index, actionName) {
						return [actionName, function() {
							console.log("requestSetValue:", actionName)
							dataSource.values.requestSetValue(
								[
									{start: resultRef.position.row, end: resultRef.position.row+1},
									{start: resultRef.position.col, end: resultRef.position.col+1}
								],
								"values",
								actionName
							);
							// var requestInLatestResolvedValue = widget.currentRequestQueue.reduce(function(prev, request_) {
							// 	return prev || request_("requests") == request("requests");
							// }, undefined);
							// console.log("requestInLatestResolvedValue", requestInLatestResolvedValue.position);
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
