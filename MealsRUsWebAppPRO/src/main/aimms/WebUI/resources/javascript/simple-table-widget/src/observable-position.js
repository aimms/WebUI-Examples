class ObservablePosition {
	constructor() {
		Observable(this, ["change", "end"]);
		this.on = this.bind;
		this.off = this.unbind;

		this.row = 0;
		this.col = 0;
	}

	get() {
		return this.value;
	}
	set(row, col) {
		this.row = row;
		this.col = col;
		this.trigger('change', {row, col});
	}
}
