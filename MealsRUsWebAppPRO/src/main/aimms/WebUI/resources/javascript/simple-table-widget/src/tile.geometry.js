
const determineRowHeightInPx = (viewPortElQ) => {
	const temporaryTileContainer = $('<div class="tile-container"></div>');
	viewPortElQ.append(temporaryTileContainer);
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
		.appendTo(temporaryTileContainer)
	;
	// sizes in px
	const defaultTileHeightInPx = tileSizingElQ.outerHeight();
	viewPortElQ.empty();
	console.log('defaultTileHeightInPx', defaultTileHeightInPx);

	const defaultRowHeightInPx = defaultTileHeightInPx / 3;

	return defaultRowHeightInPx;
};

class TileGeometryUtil {
	constructor(...args) {
		const {blockSize, viewPortElQ, colSizeConfiguration} = Args([
			{colSizeConfiguration:	Args.OBJECT   | Args.Required},
			{viewPortElQ:			Args.OBJECT   | Args.Required},
			{blockSize:				Args.OBJECT   | Args.Required},
		], args);
		const {
			defaultColWidth,
			nonDefaultColWidths,
			allColsWithNonDefaultWidth,
		} = colSizeConfiguration;

		// width of 1 em in px
		const emToPx = 5; // @TODO calculate

		// sizes in px
		// @TODO: for when we construct the sizingTileElQ based on blockSize: replace '3' with 'blockSize.numRows'
		const defaultRowHeightInPx = this.defaultRowHeightInPx = determineRowHeightInPx(viewPortElQ);
		const defaultColWidthInPx = this.defaultColWidthInPx = defaultColWidth * emToPx;
		this.getColWidthInPx = (col) => orElse(nonDefaultColWidths[col], defaultColWidth) * emToPx;
		const calculateTileWidthInPx = this.calculateTileWidthInPx = (startCol) => {
			const isColInTile = (col) => (col >= startCol) && (col < (startCol + blockSize.numCols));
			const colsInTileWithNonDefaultWidth = allColsWithNonDefaultWidth.filter(isColInTile);
			const tileWidthInEm = (blockSize.numCols - colsInTileWithNonDefaultWidth.length) * defaultColWidth
			+ _.sum(colsInTileWithNonDefaultWidth.map((col) => nonDefaultColWidths[col]));

			return emToPx * tileWidthInEm;
		};

		// @TODO take non default column widths into account
		const calculateCellLeftOffsetInPx = this.calculateCellLeftOffsetInPx = (col) => {
			const allColsWithNonDefaultWidthLeftOfCol = allColsWithNonDefaultWidth.filter((col_) => col_ < col);

			const cellLeftOffsetInEm = (col - allColsWithNonDefaultWidthLeftOfCol.length) * defaultColWidth
			+ _.sum(allColsWithNonDefaultWidthLeftOfCol.map((col) => nonDefaultColWidths[col]));

			return cellLeftOffsetInEm * emToPx;
		};
		const calculateCellTopOffsetInPx = this.calculateCellTopOffsetInPx = (row) => row * defaultRowHeightInPx;
	}
}
