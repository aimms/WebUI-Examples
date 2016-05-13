// (function($, _) {

const _key_ = (startRow, startCol) => `${startRow},${startCol}`;	

class TileDataCache {
	constructor(...args) {
		_.extend(this, Args([
			// {dataSource:        Args.OBJECT   | Args.Required},
			{requestDataBlock:  Args.FUNCTION | Args.Required},
			
			// blockSize ({numRows, numCols})
			{blockSize:         Args.OBJECT   | Args.Required},
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
								      ["values"], // @TODO who determines the layer names?
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
						return ['<', type, ' class="', name, ' row'+row, ' col'+col, '">', text, '</', type, '>'].join('');
					};

					const valuesLayer = layeredDataBlock.getLayer("values");
					// window.VL = valuesLayer;window.LDB = layeredDataBlock;
					// console.log("WEGWEGEG", valuesLayer, valuesLayer.get(0,0), valuesLayer.get(10,10));
					const {startRow, startCol, blockSize:{numRows, numCols}} = this;
					const tileHtml = `
						<table class="tile startRow${startRow} startCol${startCol}">
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

					return $(tileHtml);
				})
			;
		}

		return promisedTileElQ;
	}

	scrollToPosition(position) {
		let bounds = {};
		this.getOrConstructTileElQ().then((elQ) => {
			const top = 0;
			const left = -elQ.find(`.row${position.row}.col${position.col}`).position().left;
			const bottom = top + orElse(bounds.height, elQ.height());
			const right = left + orElse(bounds.width, elQ.width());
			elQ.css({
				left: left,
			});

			this.trigger("boundsChanged", {top, left, bottom, right});
		});
	}

	// @TODO also trigger boundsChanged iff they changed
	// probably needs bounds to go to instance scope :(
	// do not respond if this is the master tile
	onAdjacentTileBoundsChanged(placement, bounds) {
		// console.log("onAdjacentTileBoundsChanged", placement, bounds);

		this.getOrConstructTileElQ().then((elQ) => {
			if(placement.contains("right_of")) {
				elQ.css({
					left: bounds.left - elQ.width(),
				});
			} else if(placement.contains("left_of")) {
				elQ.css({
					left: bounds.right,
				});
			}

			// CAVEAT REFACTOR: No else if!
			// if(placement.contains("ABOVE")) {
			// 	elQ.css({
			//
			// 	});
			// } else if(placement.contains("BELOW")) {
			//
			// }
		});
	}

	destroy() {
		if(this.promisedTileElQ) {
			console.log("Removing tile ", this.startRow, this.startCol);
			this.promisedTileElQ.then((elQ) => elQ.remove());
		}
	}
}

// })(jQuery, _);
