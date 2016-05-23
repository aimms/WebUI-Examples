(function($) {

// disable packery
$.fn.packery = null;

var log = log4javascript.getLogger("widgets.simple-table");
// setupLogger("widgets.simple-table", "DEBUG");

/**
 *	An AWF Widget or Widget Addon is a 'subclass' (i.e. derived from a protype)
 *	of a jQuery UI widget. Most, if not all, documentation of jQuery-UI framework¹
 *	is also applicable here.
 *
 *	____
 *	¹ http://www.erichynds.com/jquery/tips-for-developing-jquery-ui-widgets/
 */
var SimpleTableWidget = AWF.Widget.create({

	/**
	 * This is the standard jQuery-UI create function. Please refer to the
	 * jQuery-UI documentation for more information.
	 */
	_create: function _create() {
		var widget = this;

		widget.observablePosition = new ObservablePosition();

		const tableElQ = widget.tableElQ = $(`
			<div class="simple-table-wrap">
				<div class="colheader-viewport"></div>
				<div class="grid-viewport"></div>
			</div>
		`);
		const gridViewPort = widget.gridViewPort = tableElQ.find('.grid-viewport');
		const colHeaderViewPort = widget.colHeaderViewPort = tableElQ.find('.colheader-viewport');

		widget.element.find('.awf-dock.center')
			.append(widget.tableElQ)
		;

		// @TODO generate ID
		widget.element.attr('id', 'my-dummy-id');

		let horizontalScrollBarElQ = widget.horizontalScrollBarElQ =
							$(`<div style="
									width: 100%;
									height: 10px;
							">`);
		widget.element.find('.awf-dock.bottom').append(horizontalScrollBarElQ);
		horizontalScrollBarElQ
			.scrollbar({
				minimum: 0,
				maximum: 0,
				value: 0,
				blockIncrement: 'visibleAmount',
				unitIncrement: 1,
			})
			.on('scrollbarchange', _.throttle((event, ui) => {
				widget.observablePosition.set(widget.observablePosition.row, ui.value);
			}, 33))
		;

		let verticalScrollBarElQ = widget.verticalScrollBarElQ =
							$(`<div style="
									width: 10px;
									height: 100%;
							">`);
		widget.element.find('.awf-dock.right').append(verticalScrollBarElQ);
		verticalScrollBarElQ
			.scrollbar({
				minimum: 0,
				maximum: 0,
				value: 0,
				blockIncrement: 'visibleAmount',
				unitIncrement: 1,
			})
			.on('scrollbarchange', _.throttle((event, ui) => {
				widget.observablePosition.set(ui.value, widget.observablePosition.col);
			}, 33))
		;
	},

/*
 *
 *	Constructs a table, installs listeners and attempts to fill the table.
 *	The attempt to fill the table also triggers the asynchronous data retrieval which,
 *	when the data becomes available, will notify the installed listeners.
 *
 * @param {type} partDataSources, an object containing the following properties:
 *
 *		rowHeader		- The part datasource that contains the row header data
 *		colHeader		- The part datasource that contains the column header data
 *		grid			- The part data source that contains the values that are
 *						  spanned by the colHeaderPart and the rowHeaderPart.
 *


                                   The Anatomy of a Table
                                   ======================


                                             .-------- colHeader.getNumRows()  <<-- CAVEAT LECTOR (transposed)
                                            /
                                  |-----------------------|

                             +-----+-----------------------+ ---
                             |Pivot|                       |  |
                             |Area |       colHeader       |  | ------ colHeader.getNumCols()  <<-- CAVEAT LECTOR (transposed)
                             |     |                       |  |
                        ---  +-----x-----------------------+ ===
                         |   |  r  |                       |  |
  rowHeader.getNumRows() |   |  o  |                       |  |
                  \      |   |  w  |                       |  |
                   `-----|   |  H  |                       |  |
                         |   |  e  |         grid          |  | ------ grid.getNumRows()
                         |   |  a  |                       |  |
                         |   |  d  |                       |  |
                         |   |  e  |                       |  |
                         |   |  r  |                       |  |
                        ---  +-----+-----------------------+ ---                                  x: 'the pivot point'

                             |-----|-----------------------|
                               /               \
  rowHeader.getNumCols() -----'                 `------- grid.getNumCols()

 *
 *
 */
	_constructTable: function _constructTable(dataSource) {
		var widget = this;
		var rowHeader = dataSource.rowHeader;
		var colHeader = dataSource.colHeader;
		var grid = dataSource.grid;

		log.debug("rowHeader.getNumRows(): ", rowHeader.getNumRows());
		log.debug("rowHeader.getNumCols(): ", rowHeader.getNumCols());

		log.debug("colHeader.getNumRows(): ", colHeader.getNumRows());
		log.debug("colHeader.getNumCols(): ", colHeader.getNumCols());

		log.debug("grid.getNumRows(): ", grid.getNumRows());
		log.debug("grid.getNumCols(): ", grid.getNumCols());

		widget.horizontalScrollBarElQ.scrollbar('maximum', grid.getNumCols());
		widget.horizontalScrollBarElQ.scrollbar('visibleAmount', 12);
		widget.verticalScrollBarElQ.scrollbar('maximum', grid.getNumRows());
		widget.verticalScrollBarElQ.scrollbar('visibleAmount', 24);

		// reset state
		// try {
		// 	// @TODO fix stylesheet plugin (make dispose idempotent or something)
		// 	widget.element.stylesheet('dispose');
		// } catch(e) {} 
		widget.gridViewPort.empty();
		widget.colHeaderViewPort.empty();
		widget.observablePosition.off();

		// @TODO can we calculate these based on the viewport size to obtain an optimized performance?
		const blockSize = {
			numRows: 15,
			numCols: 15,
		};

		class ColSizeConfiguration {
			constructor() {
				// sizes in em
				const defaultColWidth = this.defaultColWidth = 10; // @TODO from user-option
				const nonDefaultColWidths = this.nonDefaultColWidths = {1: 20, 2: 20, 3: 30, 5: 50, 7: 30, 11: 20}; // @TODO from non-user visible option
				this.allColsWithNonDefaultWidth = Object.keys(nonDefaultColWidths).map((colName) => parseInt(colName));
			}
		}

		const colSizeConfiguration = new ColSizeConfiguration({

		});

		const tileGeometryUtil = new TileGeometryUtil({
			colSizeConfiguration: colSizeConfiguration,
			viewPortElQ: 		  widget.gridViewPort,
			blockSize,
		});

		colSizeConfiguration.allColsWithNonDefaultWidth.forEach((col) => {
			widget.element.stylesheet('getRule', `col.col${col}`).style.width = `${tileGeometryUtil.getColWidthInPx(col)}px`;
		});

		// Grid
		// Position the viewPort
		widget.gridViewPort.css({
			top: colHeader.getNumCols() * tileGeometryUtil.defaultRowHeightInPx,
			left: rowHeader.getNumCols() * tileGeometryUtil.defaultColWidthInPx, // @TODO getColWidthInPx_for_rowHeader
		})

		// Add the gridView to the viewPort
		const gridView = new TiledGridView({
			observablePosition: widget.observablePosition,
			blockSize,
			viewPortElQ: widget.gridViewPort,
			tileGeometryUtil: tileGeometryUtil,
			tileDataCache: new TileDataCache({
				blockSize,
				// @TODO debatable modularisation:
				getNumCols: () => grid.getNumCols(),
				getNumRows: () => grid.getNumRows(),
				requestDataBlock: (...args) => grid.requestDataBlock(...args),
			})
		});
		gridView.assertThatTheViewPortIsFilledWithTiles(widget.observablePosition);
		widget.gridViewPort.append(gridView.tileContainer);

		// Col Header
		// Position the viewPort
		widget.colHeaderViewPort.css({
			top: 0,
			left: rowHeader.getNumCols() * tileGeometryUtil.defaultColWidthInPx, // @TODO getColWidthInPx_for_rowHeader
			height: colHeader.getNumCols() * tileGeometryUtil.defaultRowHeightInPx, // @TODO NOTE transposed so actually numRows!
		})

		const cHTDC = new TileDataCache({
			blockSize,
			// @TODO debatable modularisation:
			// getNumCols: () => colHeader.getNumCols(),
			// getNumRows: () => colHeader.getNumRows(),
			// requestDataBlock: (...args) => colHeader.requestDataBlock(...args),
			getNumCols: () => colHeader.getNumRows(),
			getNumRows: () => colHeader.getNumCols(),
			requestDataBlock: (...args) => colHeader.requestDataBlock([args[0][1], args[0][0]], args[1], args[2]),
		});
		const origGetData = cHTDC.getData.bind(cHTDC);
		cHTDC.getData = (...args) => origGetData(...args)
			.then((layeredDataBlock) => {
				const origGetLayer = layeredDataBlock.getLayer.bind(layeredDataBlock);

				layeredDataBlock.getLayer = (...args) => {
					const origLayer = origGetLayer(...args);
					const origGet = origLayer.get.bind(origLayer);
					origLayer.get = (row, col) => origGet(col, row);
					return origLayer;
				};

				return layeredDataBlock;
			})
		;

		// Add the colHeaderView to the viewPort
		const colHeaderView = new TiledGridView({
			observablePosition: widget.observablePosition,
			blockSize,
			viewPortElQ: widget.colHeaderViewPort,
			tileGeometryUtil: tileGeometryUtil,
			tileDataCache: cHTDC,
		});
		colHeaderView.assertThatTheViewPortIsFilledWithTiles(widget.observablePosition);
		widget.colHeaderViewPort.append(colHeaderView.tileContainer);


		const printStats = _.debounce((position) => {
			console.log("position", position.row, position.col);
			const {tileStartRow, tileStartCol} = getTileStartRowAndCol(position);
			console.log("tileStartRow,tileStartCol",tileStartRow,tileStartCol);
			console.log("tables: ", widget.gridViewPort.find('> table.tile'));
			console.log("tiles: ", tiles);
			console.log("tileDataCache size: ", Object.keys(tileDataCache.cache).length);
		}, 100);
		// widget.observablePosition.on('change', printStats);

		// @TODO Move to scroll plugin
		const handleScrollEnd = (orientation) => {
			let numOfItems = null;
			let getEndPosition = null;
			const createOverflowCheck = (getDimension, viewPortDimension) => {
				let total = 0;
				return (position) => {
					total += getDimension(position);
					return total > viewPortDimension;
				}
			};

			if(orientation === 'horizontal') {
				numOfItems = grid.getNumCols();
				getEndPosition = (col) => [widget.observablePosition.row, col + 2];
				doItemsOverflow = createOverflowCheck(tileGeometryUtil.getColWidthInPx, gridView.viewPortSizeInPx.width);
			} else if(orientation === 'vertical') {
				numOfItems = grid.getNumRows();
				getEndPosition = (row) => [row + 2, widget.observablePosition.col];
				doItemsOverflow = createOverflowCheck(() => tileGeometryUtil.defaultRowHeightInPx, gridView.viewPortSizeInPx.height);
			}

			for(let i=numOfItems; i--;) {
				if(doItemsOverflow(i)) {
					widget.observablePosition.set(...getEndPosition(i));
					break;
				}
			}
		};
		widget.horizontalScrollBarElQ.off('scrollbarend').on('scrollbarend', handleScrollEnd.curry("horizontal"));
		widget.verticalScrollBarElQ.off('scrollbarend').on('scrollbarend', handleScrollEnd.curry("vertical"));
	},

	/**
	 * The most important message on the per-widget message bus is the 'resolvedOptionChanged' message.
	 * It has two arguments:
	 *
	 *	1) optionName		- The option name that was specified in the factory
	 *	2) value			- The value for the option. It can be 'null', which, if it is,
	 *						  means 'go back to the default value'. If it is non-null, the
	 *						  value is guaranteed to be of the type that the factory specified
	 *						  for the option.
	 */
	onResolvedOptionChanged: function(optionName, value) {
		var widget = this;

		if(optionName === "contents") {
			if(value) {
				// 'value' is the datasource (because in the factory we specified the 'contents' option to be a datasource)
				// 'rows' and 'cols' arethe part names that we specified in the OptionTypeTable
				// 'table' because we want to access it as a table and not as a tree (value.list.tree); the extra '.table'
				// was a bad and obsolete idea, it is scheduled to be removed;
				widget._constructTable(value);
			} else {
				widget.tableElQ.empty();
			}
		}
	},
});
// The jQuery-UI way of registering/creating a new widget:
$.widget('ui.aimms_simple_table', SimpleTableWidget);

})(jQuery);
