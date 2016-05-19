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
				<div class="grid-viewport"></div>
			</div>
		`);
		const gridViewPort = widget.gridViewPort = tableElQ.find('.grid-viewport');

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
		widget.observablePosition.off();

		const tileContainer = $('<div class="tile-container"></div>');
		widget.gridViewPort.append(tileContainer);

		const defaultTileHeightInPx = (function determineTileHeight() {
			// @TODO create proper tile based on block size
			const tileSizingElQ =
				$(`<table class="tile">
					<tbody>
						<tr><td class="grid"><div>mmmmmmmmmm</div></td></tr>
						<tr><td class="grid"><div>mmmmmmmmmm</div></td></tr>
						<tr><td class="grid"><div>mmmmmmmmmm</div></td></tr>
					</tbody>
				   </table>
			    `)
				.css({top: '-999px', left:'-999px'})
				.appendTo(tileContainer)
			;
			// sizes in px
			const defaultTileHeightInPx = tileSizingElQ.outerHeight();
			tileContainer.empty();
			console.log('defaultTileHeightInPx', defaultTileHeightInPx);

			return defaultTileHeightInPx;
		})();

		// @TODO can we calculate these based on the viewport size to obtain an optimized performance?
		const blockSize = {
			numRows: 15,
			numCols: 15,
		};

		// sizes in em
		const defaultColWidth = 10; // @TODO from user-option
		const nonDefaultColWidths = {1: 20, 2: 20, 3: 30, 5: 50, 7: 30, 11: 20}; // @TODO from non-user visible option
		const allColsWithNonDefaultWidth = Object.keys(nonDefaultColWidths).map((colName) => parseInt(colName));

		// width of 1 em in px
		const emToPx = 5; // @TODO calculate

		allColsWithNonDefaultWidth.forEach((col) => {
			widget.element.stylesheet('getRule', `col.col${col}`).style.width = `${nonDefaultColWidths[col] * emToPx}px`;
		});

		// sizes in px
		// @TODO: for when we construct the sizingTileElQ based on blockSize: replace '3' with 'blockSize.numRows'
		const defaultRowHeightInPx = defaultTileHeightInPx / 3;
		const defaultColWidthInPx = defaultColWidth * emToPx;
		const getColWidthInPx = (col) => orElse(nonDefaultColWidths[col], defaultColWidth) * emToPx;
		const isColInTile = (startCol, col) => (col >= startCol) && (col < (startCol + blockSize.numCols));
		const calculateTileWidthInPx = (startCol) => {
			const colsInTileWithNonDefaultWidth = allColsWithNonDefaultWidth.filter(isColInTile.curry(startCol));
			const tileWidthInEm = (blockSize.numCols - colsInTileWithNonDefaultWidth.length) * defaultColWidth
				+ _.sum(colsInTileWithNonDefaultWidth.map((col) => nonDefaultColWidths[col]));

			return emToPx * tileWidthInEm;
		};

		// @TODO take non default column widths into account
		const calculateCellLeftOffsetInPx = (col) => {
			const allColsWithNonDefaultWidthLeftOfCol = allColsWithNonDefaultWidth.filter((col_) => col_ < col);

			const cellLeftOffsetInEm = (col - allColsWithNonDefaultWidthLeftOfCol.length) * defaultColWidth
				+ _.sum(allColsWithNonDefaultWidthLeftOfCol.map((col) => nonDefaultColWidths[col]));

			return cellLeftOffsetInEm * emToPx;
		};
		const calculateCellTopOffsetInPx = (row) => row * defaultRowHeightInPx;

		widget.gridViewPort.css({
			top: colHeader.getNumCols() * defaultRowHeightInPx,
			left: rowHeader.getNumCols() * defaultColWidthInPx, // @TODO getColWidthInPx_for_rowHeader
		})

		const viewPortSizeInPx = {
			width: widget.gridViewPort.width(),
			height: widget.gridViewPort.height(),
		}
		log.debug("viewPortSizeInPx", viewPortSizeInPx.width, viewPortSizeInPx.height);

		class TiledGridView {
			constructor() {
				this.tileDataCache = new TileDataCache({
					blockSize,
					requestDataBlock: (...args) => grid.requestDataBlock(...args)
				});
				this.tiles = {};
			}
			getTileStartRowAndCol(position) {
				return {
					tileStartRow: Math.floor(position.row/blockSize.numRows) * blockSize.numRows,
					tileStartCol: Math.floor(position.col/blockSize.numCols) * blockSize.numCols,
				}
			}
			createTile(tileStartRow, tileStartCol) {
				console.log("Create", tileStartCol);
				const tile = new Tile({
					startRow: tileStartRow,
					startCol: tileStartCol,
					blockSize,
					tileDataCache: this.tileDataCache,
					calculateTileWidthInPx,
				});
				return tile;
			}
			// Note: row, col can be any row or col, the function will figure out which tile it needs
			//       and make sure that it is placed
			assertThatTileExistsAndIsPlaced(row, col) {
				const {tileStartRow, tileStartCol} = this.getTileStartRowAndCol({row, col});
				const tileKey = _key_(tileStartRow, tileStartCol);
				if(!this.tiles[tileKey]) {
					log.debug("Creating tile", tileStartRow, tileStartCol, calculateCellLeftOffsetInPx(tileStartCol));
					const tile = this.tiles[tileKey] = this.createTile(tileStartRow, tileStartCol);

					tile.getOrConstructTileElQ().then((elQ) => {
						elQ.css({
							top: `${calculateCellTopOffsetInPx(tileStartRow)}px`,
							left: `${calculateCellLeftOffsetInPx(tileStartCol)}px`,
						});
						tileContainer.append(elQ);
					});
				}
			}
			assertThatTheViewPortIsFilledWithTiles(position) {
				let numColsInViewPort = 0;
				let colWidthsInPx = 0;
				for(let col = position.col; col < grid.getNumCols() && colWidthsInPx < viewPortSizeInPx.width; col++) {
					const colWidthInPx = Math.max(getColWidthInPx(col), 1); // guard against non-positive results
					colWidthsInPx += colWidthInPx;
					// console.log("col widths:", col, colWidthInPx, colWidthsInPx);
					numColsInViewPort++;
				}

				let numRowsInViewPort = Math.ceil(viewPortSizeInPx.height / defaultRowHeightInPx);

				// console.log("Num rows / cols in vp:", numRowsInViewPort, numColsInViewPort);

				// @TODO do some smartness because we know the block size:
				for(let i = 0; i <= numColsInViewPort; i++) {
					for(let j = 0; j < numRowsInViewPort; j++) {
						// console.log("assertThatTileExistsAndIsPlaced", position.row+j, position.col+i);
						this.assertThatTileExistsAndIsPlaced(position.row+j, position.col+i);
					}
				}
			}
			assertThatTilesThatAreTooDistantFromTheMasterTileAreDestroyed(position) {
				const {tileStartRow: masterTileStartRow, tileStartCol: masterTileStartCol} = this.getTileStartRowAndCol(position);
				Object.forEach(this.tiles, (tileKey, tile) => {
					// console.log(tile.startCol , masterTileStartCol);
					// @TODO find better definition of when to remove tiles
					const maxRowDistance = 30 / blockSize.numRows;
					const maxColDistance = 30 / blockSize.numCols;
					if(Math.abs(tile.startRow/blockSize.numRows - masterTileStartRow/blockSize.numRows) >= maxRowDistance ||
					Math.abs(tile.startCol/blockSize.numCols - masterTileStartCol/blockSize.numCols) >= maxColDistance) {

						delete this.tiles[tileKey];
						tile.destroy();
					}
				});
			}
			scrollTileContainerToPosition(position) {
				// "private local variable" to the scrollTileContainerToPosition;
				this.previousPosition = this.previousPosition || {row: position.row, col: position.col};
				const delta = Math.abs(this.previousPosition.col - position.col);
				this.previousPosition = position;

				tileContainer.toggleClass("fast-scrolling", delta > (2 * blockSize.numCols));

				log.debug(`Scrolling to col ${position.col} (delta: ${delta})`);
				tileContainer.css({
					top: `-${calculateCellTopOffsetInPx(position.row)}px`,
					left: `-${calculateCellLeftOffsetInPx(position.col)}px`,
				});
			}
		};

		const gridView = new TiledGridView();

		widget.observablePosition.on('change', gridView.assertThatTheViewPortIsFilledWithTiles.bind(gridView));
		widget.observablePosition.on('change', gridView.assertThatTilesThatAreTooDistantFromTheMasterTileAreDestroyed.bind(gridView));
		widget.observablePosition.on('change', gridView.scrollTileContainerToPosition.bind(gridView));

		gridView.assertThatTheViewPortIsFilledWithTiles(widget.observablePosition);

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
				doItemsOverflow = createOverflowCheck(getColWidthInPx, viewPortSizeInPx.width);
			} else if(orientation === 'vertical') {
				numOfItems = grid.getNumRows();
				getEndPosition = (row) => [row + 2, widget.observablePosition.col];
				doItemsOverflow = createOverflowCheck(() => defaultRowHeightInPx, viewPortSizeInPx.height);
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
