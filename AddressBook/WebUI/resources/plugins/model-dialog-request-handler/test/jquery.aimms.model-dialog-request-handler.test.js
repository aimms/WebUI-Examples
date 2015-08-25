(function($) {

Screw.Unit(function() {with(Screw.Specifications) {with(Screw.Matchers) {

	var testOptions = {
		type: "model-dialog-request-handler",
		modelData: {
			"RequestQueue-empty": identifierModelDataFromTable("rq", "df", [
				["rq",  "title"  ,  "message",   "actions",   "onDone",   "result"],
			]),
			"RequestQueue-1-unhandled-request": identifierModelDataFromTable("rq", "df", [
				["rq",  "title"  ,  "message",   "actions"     ,   "onDone"   ,	  "result" ],
				["01", "a title" ,   "a msg" , '["a","b","c"]' , "the onDone" ,  "<empty>" ],
			]),
			"RequestQueue-2-unhandled-requests": identifierModelDataFromTable("rq", "df", [
				["rq",  "title"  ,  "message",   "actions"     ,   "onDone"   ,	  "result" ],
				["01", "a title" ,   "a msg" , '["a","b","c"]' , "the_onDone" ,  "<empty>" ],
				["02", "title 2" ,   "msg 2" , '["d","e","f"]' , "onDone_two" ,  "<empty>" ],
			]),
			"RequestQueue-1-unhandled-request-not-first": identifierModelDataFromTable("rq", "df", [
				["rq",    "title"  ,  "message",   "actions"     ,   "onDone"   ,	  "result" ],
				["01",   "a title" ,   "a msg" , '["a","b","c"]' , "the onDone" ,     "b"      ],
				["02",   "title 2" ,   "msg 2" , '["d","e","f"]' , "onDone_two" ,  "<empty>"   ],
			]),
			"RequestQueue-2-handled-requests": identifierModelDataFromTable("rq", "df", [
				["rq",    "title"  ,  "message",   "actions"     ,   "onDone"   ,	  "result" ],
				["01",   "a title" ,   "a msg" , '["a","b","c"]' , "the onDone" ,     "b"      ],
				["02",   "title 2" ,   "msg 2" , '["d","e","f"]' , "onDone_two" ,     "f"      ],
			]),
		},
	};

	mockIt(window, "setTimeout", mockSetTimeoutFunction);

	widget_test(testOptions, function(getWidgetElQ) {

		describe("the " + testOptions.type + " factory", function() {
			it("should have set the contents option to 'webui::RequestQueue'", function() {
				assertThat(getWidgetElQ().awf.specifiedOptions('contents'), 'aimms:{"contents":["webui::RequestQueue"]}');
			});
		});

		mockIt(AWF.Bus, "requestPerformDialog", mockFunction);

		describe("when the request queue is empty", function() {
			before(function() {
				getWidgetElQ().awf.specifiedOptions("contents", 'aimms:{"contents":["RequestQueue-empty"]}')
			});

			it("should not show a dialog", function() {
				verify(AWF.Bus.requestPerformDialog, never())();
			});

			describe("when the request queue is filled with two requests", function() {
				before(function fillWithTwoRequests1UnhandledRequestNotFirst() {
					getWidgetElQ().awf.specifiedOptions("contents", 'aimms:{"contents":["RequestQueue-1-unhandled-request-not-first"]}');
				});

				it("should pick up the first unhandled request (and request for a dialog)", function() {
					verify(AWF.Bus.requestPerformDialog)("title 2", "msg 2", m({d:func(), e:func(), f:func()}));
				});

				describe("when the request queue gets a new unhandled request", function() {
					before(function() {
						AWF.Bus.requestPerformDialog.resetInteractions();
						getWidgetElQ().awf.specifiedOptions("contents", 'aimms:{"contents":["RequestQueue-2-unhandled-requests"]}')
					});

					it("should not pick up another request (current request still in process of being handled)", function() {
						verify(AWF.Bus.requestPerformDialog, never())();
					});

					describe("after the user chooses an action in the dialog", function() {
						var args_of_requestPerformDialog;
						before("fillWithTwoRequests1UnhandledRequestNotFirst", function() {
							args_of_requestPerformDialog = captureArguments(AWF.Bus.requestPerformDialog, ['title', 'message', 'actions']);
						});

						["d", "e", "f"].forEach(function(selectedAction) {
							describe("by selecting action " + selectedAction, function() {
								function getDataSource_values() {
									return (getWidgetElQ().awf.resolvedOptions('contents') || {}).values;
								}
								mockIt(getDataSource_values, "requestSetValue", mockFunction);

								before(function() {
									// handle it code (call dialog done function)
									args_of_requestPerformDialog.actions[selectedAction]();
								});

								it("should update the right request in the queue", function() {
									// verify requestSetValue on values part in datasource
									var requestRow = 1; // the row containing the unhandled-request; see the model data at the top of this file
									var resultCol = 3;	// Note:
														//       In the model-data at the top this appears to be the 5th column
														//       but NICE changes columns and sorts them alphabetically (to be
														//       fixed at a more convenient time and date)
									verify(getDataSource_values().requestSetValue)(
										m([{start:requestRow,end:requestRow+1},{start:resultCol,end:resultCol+1}]),
										"values",
										selectedAction
									);
								});

								describe("after the result is handled by AIMMS and the request queue gets updated", function() {
									before(function() {
										getWidgetElQ().awf.specifiedOptions("contents", 'aimms:{"contents":["RequestQueue-1-unhandled-request"]}')
									});

									it("should pick up the first unhandled request (and request for a dialog)", function() {
										verify(AWF.Bus.requestPerformDialog)("a title", "a msg", m({a:func(), b:func(), c:func()}));
									});
								});
							});
						});
					});
				});
			});
		});
	});

}}});

})(jQuery);
