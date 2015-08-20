(function($) {

var OptionTypeTable = 
{
	type : "datasource",
	parts : [ {name : "rowHeader"}, {name : "colHeader"} ],
};

AWF.installListenerToMethodBridges(AWF, {

	onCollectTypes: function(collectedTypes, contextElQ) {
		if(!contextElQ || contextElQ.awf.tags("placeable")) {
			collectedTypes.push('my-table-widget');
		}
	},

	onInitializeTags: function(elQ, type) {
		if(type === 'my-table-widget') {
			elQ.awf.tags(["pivotable contents property", "my-table-widget"], 'add');
		}
	},

	onInitializeOptionTypes: function(elQ, type) {
		if(type === 'my-table-widget') {
			AWF.OptionTypeCollector.addOptionType(elQ, "contents", OptionTypeTable);
		}
	},

	onDecorateElement: function(elQ, type) {
		if(type === 'my-table-widget') {
			elQ.aimms_my_table();
		}
	},
});

})(jQuery);
