(function($) {

var MyTableWidget = AWF.Widget.create({

	_create: function _create() {
		var widget = this;

		widget.tableContainerElQ = $('<div></div>');
		widget.tableElQ = $('<table>');

		widget.tableContainerElQ
			.append(widget.tableElQ);

		widget.element.find('.awf-dock.center')
			.append(widget.tableContainerElQ);
	},
	
	_createHtmlTable: function _createHtmlTable(rowHeaderDimension,colHeaderDimension) {
	
		var numRowsInRowHeader = rowHeaderDimension.numRows;
		var numColsInRowHeader = rowHeaderDimension.numCols;
		var numRowsInColHeader = colHeaderDimension.numRows
		var numColsInColHeader = colHeaderDimension.numCols;
		
		// Helper function to create table cell DOM element 
		function createCellElQ(type, name, row, col) {
			return $(['<', type, ' class="', name, ' row'+row, ' col'+col, '"></', type, '>'].join(''));
		}
		function createInputElQ(name, row, col) {
			return $(['<td><input type="text" class="', name, ' row'+row, ' col'+col, '"></input></td>'].join(''));
		}

		// 1a. Create the column header
		var theadElQ = $('<thead>');
		_.times(numRowsInColHeader, function(col) {
			var trElQ = $('<tr>');
			_.times(numColsInColHeader, function(row) {
				trElQ.append(createCellElQ('th', 'colHeader', row, col));
			});
			theadElQ.append(trElQ);
		});

		// 1b. Add the pivot area, the 'empty' block in the upper-left corner of the table
		theadElQ.find('tr:first').prepend('<th colspan="'+numColsInRowHeader+'" rowspan="'+numRowsInColHeader+'"></th>');

		// 1c. Create the row header and grid
		var numColsInGrid = numColsInColHeader;
		var tbodyElQ = $('<tbody>');
		_.times(numRowsInRowHeader, function(row) {
			var trElQ = $('<tr>');
			_.times(numColsInRowHeader, function(col) {
				trElQ.append(createCellElQ('th', 'rowHeader', row, col));
			});
			_.times(numColsInGrid, function(col) {
			var gridElQ = 
				trElQ.append(createInputElQ('values', row, col));
			});
			tbodyElQ.append(trElQ);
		});

		// 1d. Construct the table
		var widget = this;
		widget.tableElQ.empty();
		widget.tableElQ.append(theadElQ);
		widget.tableElQ.append(tbodyElQ);
	},

	_fillTable: function _fillTable(dataSource) {
		if (dataSource) {
			var widget = this;
			var numRowsInGrid = dataSource.values.getNumRows();
			var numColsInGrid = dataSource.values.getNumCols();
			
			// Helper function to fill table cell with content
			function updateTableCell(type, row, col, text) {
				var cellElQ = widget.tableElQ.find('.'+type+'.row'+row+'.col'+col);
				if ( type == "values" ) {
					cellElQ.attr('value',text);
					cellElQ.on('change',function(event){
						var newValue = parseFloat(event.target.value);
						if ( _.isNaN(newValue) ) { 
							// newValue is not-a-number, it will be passed as a string
							newValue = event.target.value;
						}
						dataSource.values.requestSetValues([{
							ranges: [{start:row,end:row+1},{start:col,end:col+1}],
							layerName : "values",
							value: newValue
						}],function onDone(status) {
							if ( status.code !== 200 ) {
								alert('Error '+status.code+': '+status.description);
								// revert value
								cellElQ.attr('value',text);
								cellElQ.blur();
							}
						});
					});
				} else {
					cellElQ.text(text);
				}
			}
			
			// 2. Fill the table  (uses asynchronous data retrieval)
			dataSource.requestDataBlocks(
				[
					{start: 0, end: numRowsInGrid},
					{start: 0, end: numColsInGrid},
				],
				["values"],
				function onReady(layeredDataBlocks) {
					['rowHeader', 'colHeader', 'values'].forEach(function(type) {
						var partDataSource = dataSource[type];
						_.times(partDataSource.getNumRows(), function(row) {
							_.times(partDataSource.getNumCols(), function(col) {
								updateTableCell(type, row, col, layeredDataBlocks[type].getLayer("values").get(row, col));
							});
						});
					});
				}
			);
		}
	},

	_refresh: function(dataSource) {
		var widget = this;
		
		var rowHeaderDimension = { numRows:0, numCols: 0 };
		var colHeaderDimension = { numRows:0, numCols: 0 };

		if(dataSource) {
			rowHeaderDimension = { numRows:dataSource.rowHeader.getNumRows(), numCols: dataSource.rowHeader.getNumCols() };
			colHeaderDimension = { numRows:dataSource.colHeader.getNumCols(), numCols: dataSource.colHeader.getNumRows() };
		}
		
		widget._createHtmlTable(rowHeaderDimension, colHeaderDimension);
		widget._fillTable(dataSource);
	},
	
	onResolvedOptionChanged: function(optionName, value) {
		var widget = this;
		if(optionName === "contents") {
			widget._refresh(value);
		}
	},
});
// The jQuery-UI way of registering/creating a new widget:
$.widget('ui.aimms_my_table', MyTableWidget);

})(jQuery);
