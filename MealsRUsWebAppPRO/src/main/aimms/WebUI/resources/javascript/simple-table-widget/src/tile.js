// (function($, _) {

const _key_ = (startRow, startCol) => `${startRow},${startCol}`;	

class TileDataCache {
	constructor(...args) {
		_.extend(this, Args([
			// {dataSource:        Args.OBJECT   | Args.Required},
			{requestDataBlock:  Args.FUNCTION | Args.Required},
			
			// blockSize ({numRows, numCols})
			{blockSize:         Args.OBJECT   | Args.Required},

			// Debatable modularisation:
			{getNumCols:        Args.FUNCTION   | Args.Required},
			{getNumRows:        Args.FUNCTION   | Args.Required},
		], args));

		this.cache = {};
	}
	// Note: Everything in grid rows/cols, not in tile coordinates.
	getData(startRow, startCol) {
		let promisedData = this.cache[_key_(startRow, startCol)];

		if(!promisedData) {
			promisedData = new Promise((resolve, reject) => {
				this.requestDataBlock([{start: startRow, end: startRow + this.blockSize.numRows},
									   {start: startCol, end: startCol + this.blockSize.numCols}],
								      ["values", "flags", "annotations"], // @TODO who determines the layer names?
								      resolve); // @TODO reject
			});
			this.cache[_key_(startRow, startCol)] = promisedData;
		}

		return promisedData;
	}
}

class Tile {
	constructor(...args) {
		_.extend(this, Args([
			// position of the tile
			{startRow:          Args.INT | Args.Required},
			{startCol:          Args.INT | Args.Required},

			// blockSize ({numRows, numCols})
			{blockSize:         Args.OBJECT  | Args.Required},

			{tileDataCache:     Args.OBJECT  | Args.Required},

			{calculateTileWidthInPx: Args.FUNCTION | Args.Required},
		], args));

		Observable(this, ["boundsChanged"]);
		this.on = this.bind;
		this.off = this.unbind;
	}
	getOrConstructTileElQ() {
		let promisedTileElQ = this.promisedTileElQ;

		if(!promisedTileElQ) {
			promisedTileElQ = this.promisedTileElQ = this.tileDataCache
				.getData(this.startRow, this.startCol)
				.then((layeredDataBlock) => {
					/**
					 *
					 * createCellElQ('th', 'foo', 3, 4)  ==>  '<th class="foo row3 col4"></th>'
					 *
					 */
					const createCellHtml = (type, name, row, col, text) => {
						return ['<', type, ' class="', name, ' row'+row, ' col'+col, '"><div>', text, '</div></', type, '>'].join('');
						// return ['<', type, ' class="', name, ' row'+row, ' col'+col, '">', text, '</', type, '>'].join('');
					};

					const valuesLayer = layeredDataBlock.getLayer("values");
					window.LDB = layeredDataBlock;
					// window.VL = valuesLayer;window.LDB = layeredDataBlock;
					// console.log("WEGWEGEG", valuesLayer, valuesLayer.get(0,0), valuesLayer.get(10,10));
					const {startRow, startCol, blockSize:{numRows, numCols}} = this;
					const id = genUUID().replace(/-/g, "").slice(0,10);
					const tileHtml = `
						<table id="${id}"class="tile startRow${startRow} startCol${startCol}">
							<colgroup>
								${numCols.times((col) => `<col class="col col${startCol + col}"></col>`).join("")}
							</colgroup>
							<tbody>
								${
									numRows.times((row) =>
										`<tr>${
											numCols.times((col) => 
												createCellHtml("td", "grid", startRow + row, startCol + col, valuesLayer.get(row, col))
											).join("")
										}</tr>`
									).join("")
								}
							</tbody>
						</table>
					`;

					const tileElQ = $(tileHtml);
					const tileWidthInPx = this.calculateTileWidthInPx(this.startCol);
					tileElQ.css({width: `${tileWidthInPx}px`})

					return tileElQ;
				})
			;
		}

		return promisedTileElQ;
	}

	destroy() {
		if(this.promisedTileElQ) {
			console.log("Removing tile ", this.startRow, this.startCol);
			this.promisedTileElQ.then((elQ) => elQ.remove());
		}
	}
}

class TiledGridView {
	constructor(...args) {
		_.extend(this, Args([
			{observablePosition:	Args.OBJECT   | Args.Required},
			{viewPortElQ:			Args.OBJECT   | Args.Required},
			{tileDataCache:			Args.OBJECT   | Args.Required},
			{tileGeometryUtil:		Args.OBJECT   | Args.Required},
		], args));

		this.blockSize = this.tileDataCache.blockSize;

		const viewPortSizeInPx = this.viewPortSizeInPx = {
			width: this.viewPortElQ.width(),
			height: this.viewPortElQ.height(),
		};
		log.debug("viewPortSizeInPx", viewPortSizeInPx.width, viewPortSizeInPx.height);

		this.tileContainer = $('<div class="tile-container"></div>');

		this.tiles = {};

		// Bind the updating of the grid view behaviours to the events triggered by changes in the observable position:
		this.observablePosition.on('change', this.assertThatTheViewPortIsFilledWithTiles.bind(this));
		this.observablePosition.on('change', this.assertThatTilesThatAreTooDistantFromTheMasterTileAreDestroyed.bind(this));
		this.observablePosition.on('change', this.scrollTileContainerToPosition.bind(this));
	}
	getTileStartRowAndCol(position) {
		return {
			tileStartRow: Math.floor(position.row/this.blockSize.numRows) * this.blockSize.numRows,
			tileStartCol: Math.floor(position.col/this.blockSize.numCols) * this.blockSize.numCols,
		}
	}
	createTile(tileStartRow, tileStartCol) {
		console.log("Create", tileStartCol);
		const tile = new Tile({
			startRow: tileStartRow,
			startCol: tileStartCol,
			blockSize: this.blockSize,
			tileDataCache: this.tileDataCache,
			calculateTileWidthInPx: this.tileGeometryUtil.calculateTileWidthInPx,
		});
		return tile;
	}
	// Note: row, col can be any row or col, the function will figure out which tile it needs
	//       and make sure that it is placed
	assertThatTileExistsAndIsPlaced(row, col) {
		const {tileStartRow, tileStartCol} = this.getTileStartRowAndCol({row, col});
		const tileKey = _key_(tileStartRow, tileStartCol);
		if(!this.tiles[tileKey]) {
			const tileGeometryUtil = this.tileGeometryUtil;
			log.debug("Creating tile", tileStartRow, tileStartCol, tileGeometryUtil.calculateCellLeftOffsetInPx(tileStartCol));
			const tile = this.tiles[tileKey] = this.createTile(tileStartRow, tileStartCol);

			tile.getOrConstructTileElQ().then((elQ) => {
				elQ.css({
					top: `${tileGeometryUtil.calculateCellTopOffsetInPx(tileStartRow)}px`,
					left: `${tileGeometryUtil.calculateCellLeftOffsetInPx(tileStartCol)}px`,
				});
				this.tileContainer.append(elQ);
			});
		}
	}
	assertThatTheViewPortIsFilledWithTiles(position) {
		let numColsInViewPort = 0;
		let colWidthsInPx = 0;
		for(let col = position.col; col < this.tileDataCache.getNumCols() && colWidthsInPx < this.viewPortSizeInPx.width; col++) {
			const colWidthInPx = Math.max(this.tileGeometryUtil.getColWidthInPx(col), 1); // guard against non-positive results
			colWidthsInPx += colWidthInPx;
			// console.log("col widths:", col, colWidthInPx, colWidthsInPx);
			numColsInViewPort++;
		}

		let numRowsInViewPort = Math.ceil(this.viewPortSizeInPx.height / this.tileGeometryUtil.defaultRowHeightInPx);

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
		const blockSize = this.blockSize;
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

		this.tileContainer.toggleClass("fast-scrolling", delta > (2 * this.blockSize.numCols));

		log.debug(`Scrolling to col ${position.col} (delta: ${delta})`);
		const tileGeometryUtil = this.tileGeometryUtil;
		this.tileContainer.css({
			top: `-${tileGeometryUtil.calculateCellTopOffsetInPx(position.row)}px`,
			left: `-${tileGeometryUtil.calculateCellLeftOffsetInPx(position.col)}px`,
		});
	}
};

// })(jQuery, _);
