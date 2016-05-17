(function($) {

// disable packery
$.fn.packery = null;

var log = log4javascript.getLogger("widgets.simple-table");
//setupLogger("widgets.simple-table2", "TRACE");

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

		widget.simpleTableWrap = $('<div class="simpleTableWrap"></div>');
		widget.tableElQ = $('<table>');

		widget.simpleTableWrap
			.append(widget.tableElQ);

		widget.element.find('.awf-dock.center')
			.append(widget.simpleTableWrap);

		let scrollbarElQ = widget.scrollbarElQ =
							$(`<div style="
									width: 100%;
									height: 10px;
							">`);
		widget.element.find('.awf-dock.bottom').append(scrollbarElQ);
		scrollbarElQ.scrollbar({
			minimum: 0,
			maximum: 0,
			value: 0,
			blockIncrement: 'visibleAmount',
			unitIncrement: 1,
			change: function(event, ui) {
				// console.log("change", event, ui);
		//					},
		//					start: function(event, ui) {
		//						console.log("start", event, ui);
		//					},
		//					scroll: function(event, ui) {
		//						console.log("scroll", event, ui);
		//					},
		//					stop: function(event, ui) {
		//						console.log("stop", event, ui);
			}
		})
		.on('scrollbarchange', _.throttle((event, ui) => {
			widget.observablePosition.set(0, ui.value);
		}, 33));
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

		log.debug("rowHeader.getNumRows(): ", colHeader.getNumRows());
		log.debug("rowHeader.getNumCols(): ", colHeader.getNumCols());

		log.debug("grid.getNumRows(): ", grid.getNumRows());
		log.debug("grid.getNumCols(): ", grid.getNumCols());

		widget.scrollbarElQ.scrollbar('maximum', grid.getNumCols());
		widget.scrollbarElQ.scrollbar('visibleAmount', 12);

		widget.simpleTableWrap.empty();
		widget.observablePosition.off();

		const tileContainer = $('<div class="tile-container"></div>');
		widget.simpleTableWrap.append(tileContainer);

		const blockSize = {
			numRows: 15,
			numCols: 15,
		};
		const tileDataCache = new TileDataCache({
			blockSize,
			requestDataBlock: (...args) => grid.requestDataBlock(...args)
		});
		const tiles = {};
		const getTileStartRowAndCol = (position) => ({
			tileStartRow: Math.floor(position.row/blockSize.numRows) * blockSize.numRows,
			tileStartCol: Math.floor(position.col/blockSize.numCols) * blockSize.numCols,
		});
		const createTile = (tileStartRow, tileStartCol) => {
			const tile = new Tile({
				startRow: tileStartRow,
				startCol: tileStartCol,
				blockSize,
				tileDataCache,
			});
			tile.on("boundsChanged", (bounds) => {
				const adjacentTileInfos = [
					{placement: ["left_of", "above"],  key: _key_(tileStartRow+blockSize.numRows, tileStartCol+blockSize.numCols)},
					{placement: ["above"],             key: _key_(tileStartRow+blockSize.numRows, tileStartCol)},
					{placement: ["right_of", "above"], key: _key_(tileStartRow+blockSize.numRows, tileStartCol-blockSize.numCols)},
					{placement: ["right_of"],          key: _key_(tileStartRow                  , tileStartCol-blockSize.numCols)},
					{placement: ["right_of", "below"], key: _key_(tileStartRow-blockSize.numRows, tileStartCol-blockSize.numCols)},
					{placement: ["below"],             key: _key_(tileStartRow-blockSize.numRows, tileStartCol)},
					{placement: ["left_of", "below"],  key: _key_(tileStartRow-blockSize.numRows, tileStartCol+blockSize.numCols)},
					{placement: ["left_of"],           key: _key_(tileStartRow                  , tileStartCol+blockSize.numCols)},
				];
				adjacentTileInfos.forEach((tileInfo) => {
					// console.log("Searching for tile with key", tileInfo.key);
					const tile_ = tiles[tileInfo.key];
					if(tile_) {
						tile_.onAdjacentTileBoundsChanged(tileInfo.placement, bounds);
					}
				});
			});
			return tile;
		};
		const assertThatMasterTileExists = (position) => {
			const {tileStartRow, tileStartCol} = getTileStartRowAndCol(position);
			const tileKey = _key_(tileStartRow, tileStartCol);
			if(!tiles[tileKey]) {
				const tile = tiles[tileKey] = createTile(tileStartRow, tileStartCol);

				tile.getOrConstructTileElQ().then((elQ) => {
					elQ.css({
						left: `${tileStartCol * 50}px`,
					});
					tileContainer.append(elQ);
				});
			}
		};
		const assertThatTilesThatAreTooDistantFromTheMasterTileAreDestroyed = (position) => {
			const {tileStartRow: masterTileStartRow, tileStartCol: masterTileStartCol} = getTileStartRowAndCol(position);
			Object.forEach(tiles, (tileKey, tile) => {
				// console.log(tile.startCol , masterTileStartCol);
				if(Math.abs(tile.startRow/blockSize.numRows - masterTileStartRow/blockSize.numRows) >= 2 ||
				   Math.abs(tile.startCol/blockSize.numCols - masterTileStartCol/blockSize.numCols) >= 2) {

					delete tiles[tileKey];
					tile.destroy();
				}
			});
		};
		const assertThatTheAdjacentTileInTheScrollDirectionIsAdded = (position) => {
			// @TODO we can also optimize to only assert the tile is added when nearing the edge of the current tile

			let {tileStartRow, tileStartCol} = getTileStartRowAndCol(position);

			// @TODO For now: Assume scrolling to the right
			if(Math.abs(position.col - tileStartCol) > (blockSize.numCols/5)) {
				tileStartCol += blockSize.numCols;

				const tileKey = _key_(tileStartRow, tileStartCol);
				if(!tiles[tileKey]) {
					const tile = tiles[tileKey] = createTile(tileStartRow, tileStartCol);

					tile.getOrConstructTileElQ().then((elQ) => {
						console.log("tile appended: ", tileStartRow, tileStartCol);
						elQ.css({
							left: `${tileStartCol * 50}px`,
						});
						tileContainer.append(elQ);
					});
				}
			}
		};
		const scrollMasterTileToPosition = (position) => {
			const {tileStartRow, tileStartCol} = getTileStartRowAndCol(position);
			const tileKey = _key_(tileStartRow, tileStartCol);
			const tile = tiles[tileKey];

			if(tile) {
				tile.scrollToPosition(position);
			} else {
				console.error("Tile does not exist! ", tileKey);
			}
		};
		const scrollTileContainerToPosition = (position) => {
			tileContainer.css({
				left: `-${position.col * 50}px`,
			});
			// const {tileStartRow, tileStartCol} = getTileStartRowAndCol(position);
			// const tileKey = _key_(tileStartRow, tileStartCol);
			// const tile = tiles[tileKey];
			// 
			// if(tile) {
			// 	tile.scrollToPosition(position);
			// } else {
			// 	console.error("Tile does not exist! ", tileKey);
			// }
		};
		const printStats = _.debounce((position) => {
			console.log("position", position.row, position.col);
			const {tileStartRow, tileStartCol} = getTileStartRowAndCol(position);
			console.log("tileStartRow,tileStartCol",tileStartRow,tileStartCol);
			console.log("tables: ", widget.simpleTableWrap.find('> table.tile'));
			console.log("tiles: ", tiles);
			console.log("tileDataCache size: ", Object.keys(tileDataCache.cache).length);
		}, 100);

		widget.observablePosition.on('change', assertThatMasterTileExists);
		widget.observablePosition.on('change', assertThatTilesThatAreTooDistantFromTheMasterTileAreDestroyed);
		widget.observablePosition.on('change', assertThatTheAdjacentTileInTheScrollDirectionIsAdded);
		widget.observablePosition.on('change', scrollTileContainerToPosition);
		// widget.observablePosition.on('change', scrollMasterTileToPosition);
		// widget.observablePosition.on('change', printStats);

		assertThatMasterTileExists(widget.observablePosition);
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
