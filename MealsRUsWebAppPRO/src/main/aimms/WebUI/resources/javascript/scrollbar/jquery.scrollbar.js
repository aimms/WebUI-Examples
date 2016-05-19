(function($){

	/**
	 *	Implementation of a scrollbar. A user typically adjusts a scrollbar to manipulate the position of displayable contents inside a
	 *	viewport. The manipulation is performed using various mouse clicks and drags on key positions on a scrollbar.
	 *<br/><br/>
	 *	Anatomy of a scrollbar:
	 *  <pre>
	 *                   ____________________________________
	 *                  | /| |       |////////|         | |\ |
	 *                  |_\|_|_______|////////|_________|_|/_|
	 *   (unit)          /      /        |         \       \          (unit)
	 * decrement _______/      /         |          \       \_______ increment
	 *   button               /          |           \                button
	 *                       /           |            \
	 *    thumb container __/            |             \__ thumb container
	 *  (block decrements)            thumb                (block increments)
	 *                            (drag to scroll)
	 *  </pre>
	 *	A scrollbar has six parameters that configure the scrollbar specfic behaviour for the user interactions on these key positions:
	 *
	 *	@param [minimum=0]			The minimum value that the scrollbar can attain.
	 *	@param [maximum=100]		The maximum value that the scrollbar can attain.
	 *	@param [visibleAmount=10]	The visible amount (of units) that the viewport associated with this scrollbar contains.
	 *	@param [value=0]			The (initial) value of the scrollbar. This value always lies between the minimum and the maximum
	 *								minus the visible amount.
	 *	@param [blockIncrement='visibleAmount']
	 *								The amount with which value is either increased or decreased when a block increment or decrement
	 *								is requested by user input (see above).
	 *	@param [unitIncrement=1]	The amount with which value is either increased or decreased when a user clicks on the increment
	 *								or decrement button.
	 *
	 *	@class
	 */
	Scrollbar = {
		options: {
			minimum: 0,
			maximum: 100,
			value: 0,
			visibleAmount: 10,
			blockIncrement: 'visibleAmount',
			unitIncrement: 1
		},

		/**
		 *	Initializes the DOM element associated with this scrollbar instance. The steps performed are:
		 *	<ol>
		 *		<li>Its contents is adjusted to contain the four main components that comprise a scrollbar: The decrement button,
		 *			the thumb container; the thumb; and the increment button.</li>
		 *		<li>The scrollbar specific behaviour methods are bounds to these components.</li>
		 *		<li>The CSS/styling UI behaviour is setup for these components.</li>
		 *		<li>The newly initialized scrollbar widget is given its initial refresh, to update its view.</li>
		 *
		 *	@private @function @memberOf Scrollbar
		 */
		_init: function _init() {
			this.options.orientation = this.element.width() > this.element.height() ? 'horizontal' : 'vertical';
			this.options.visibleAmount = this.options.visibleAmount.clamp(1, this.options.maximum - this.options.minimum);

			// 1. Initialize the contents of the DOM element.
			this.element.addClass('ui-scrollbar ui-widget');
			this.element.html(
				'<div class="ui-button ui-widget ui-state-default"><span class="ui-icon"></span></div>\
				<div class="ui-thumb-container ui-thumb-container-'+this.options.orientation+' ui-widget ui-widget-content">\
					<div class="ui-thumb ui-thumb-'+this.options.orientation+' ui-slider-handle ui-state-default"></div>\
				</div>\
				<div class="ui-button ui-widget ui-state-default"><span class="ui-icon"></span></div>');

			var decrementButton = this.element.decrementButton = this.element.find(">.ui-button").first();
			var thumbContainer = this.element.thumbContainer = this.element.find(">.ui-thumb-container");
			var thumb = this.element.thumb = this.element.find(">.ui-thumb-container>.ui-thumb");
			var incrementButton = this.element.incrementButton = this.element.find(">.ui-button").last();

			// 2. Bind the scrollbar specific behaviour methods.
			thumb.draggable({
				containment:	'parent',
				axis:			this.options.orientation == 'horizontal' ? 'x' : 'y',
				start:			this._onThumbDragStart.bind(this),
				drag:			this._onThumbDrag.bind(this),
				stop:			this._onThumbDragStop.bind(this)
			});
			// Prevent mouse down events on the thumb to propagate to the thumb container.
			thumb.mousedown(function(event,ui){event.stopPropagation();});
			thumbContainer.mousedown(this._onThumbContainerMouseDown.bind(this));
			[decrementButton,incrementButton].forEach(function(button) {
				button.mousedown(this._onButtonMouseDown.bind(this));
			}.bind(this));
			// Prevent selection on the thumb (so it doesn't show a text cursor while dragging).
			thumb.disableSelection();

			// 3. Set up interactive CSS/styling UI behaviour.
			thumb.bind('dragstop', function() {thumb.removeClass('ui-state-active')});
			[decrementButton,incrementButton,thumb].forEach(function(button) {
				button.hover(
					function() {button.addClass('ui-state-hover')},
					function() {button.removeClass('ui-state-hover')}
				);
				button.mousedown(
					function() {button.addClass('ui-state-active')}
				);
				button.mouseup(
					function() {button.removeClass('ui-state-active')}
				);
			});
			[decrementButton,incrementButton].forEach(function(button) {
				button.mousedown(
					function(event) {event.stopPropagation();}
				);
				button.mouseleave(
					function() {button.removeClass('ui-state-active')}
				);
			});

			if(this.options.orientation == 'horizontal') {
				decrementButton.addClass("ui-button-left ui-corner-left");
				decrementButton.find("*:first").addClass("ui-icon-triangle-1-w");
				incrementButton.addClass("ui-button-right ui-corner-right");
				incrementButton.find("*:first").addClass("ui-icon-triangle-1-e");
			} else {
				decrementButton.addClass("ui-button-up ui-corner-top");
				decrementButton.find("*:first").addClass("ui-icon-triangle-1-n");
				incrementButton.addClass("ui-button-down ui-corner-bottom");
				incrementButton.find("*:first").addClass("ui-icon-triangle-1-s");
			}

			// 4. Give the initial refresh.
			this.element.resize(this._refresh.bind(this));
			this._refresh();
		},

		/**
		 *	Destroys the scrollbar by removing all child nodes and scrollbar related css classes from the element associated with this scrollbar.
		 *
		 *	@public @function @memberOf Scrollbar
		 */
		destroy: function destroy() {
			this.element.empty();
			this.element.removeClass('ui-scrollbar ui-widget');
		},

		/**
		 *	Refreshes the current view of this scrollbar by recalculating and reapplying sizes and positions to the scrollbar's four main components:
		 *	The decrement button; the thumb container; the thumb; and the increment button.
		 *<br/></br>
		 *	This method also detects if the element has switched orientation, if this is the case,
		 *	it will reinitialize the widget with the new orientation.
		 *
		 *	@private @function @memberOf Scrollbar
		 */
		_refresh: function _refresh() {
			// Detect if the element has switched orientation and act accordingly.
			var newOrientation = this.element.width() > this.element.height() ? 'horizontal' : 'vertical';
			if(this.options.orientation != newOrientation) {
				this.destroy();
				this._init();
				return;
			}

			this._refreshThumb();
		},

		/**
		 *	Refreshes the size and position of the thumb.
		 *
		 *	@private @function @memberOf Scrollbar
		 */
		_refreshThumb: function _refreshThumb() {
			var options = this.options;
			var elt = this.element;

			var thumbContainerOuterMajorDimension = this._sizeAlongMajorAxis(elt.thumbContainer, 'outer');
			var thumbContainerInnerMajorDimension = this._sizeAlongMajorAxis(elt.thumbContainer, 'inner');
			var range = (options.maximum - options.minimum) || 1;
			var visibleAmount = Math.floor(options.visibleAmount / range * thumbContainerOuterMajorDimension);
			var thumbOffset = Math.floor((options.value - options.minimum) / range * thumbContainerOuterMajorDimension);
			thumbOffset = Math.min(thumbOffset, thumbContainerInnerMajorDimension - visibleAmount);

			if(options.orientation == 'horizontal') {
				elt.thumb.css( {
					width: visibleAmount+'px',
					left: thumbOffset+'px'
				});
			} else {
				elt.thumb.css( {
					height: visibleAmount+'px',
					top: thumbOffset+'px'
				});
			}
		},

		/**
		 *	Get or set the unit increment. The current value of the scrollbar is increased or decreased by this amount whenever either the
		 *	increment or decrement button has been pressed.
		 *
		 *	@param [unitIncrement]	The unit increment. The value will be clamped between 1 and infinity.
		 *							When specified, this method acts as a setter, otherwise it acts as a getter.
		 *
		 *	@return The unit increment of the scrollbar when @param unitIncrement is not specified, the jQuery object itself otherwise.
		 *
		 *	@public @function @memberOf Scrollbar
		 */
		// The behavior of this getter/setter is in accordance with jQuery standards, the jQuery-ui plugin framework will ensure the behavior.
		unitIncrement: function unitIncrement(unitIncrement) {
			if(unitIncrement != undefined) {
				this.options.unitIncrement = unitIncrement.clamp(1, Infinity);
			} else {
				return this.options.unitIncrement;
			}
		},

		/**
		 *	Get or set the block increment. The current value of the scrollbar is increased or decreased by this amount whenever there is being
		 *	clicked inside either the region between the thumb and the increment button (to increase), or inside the region between the thumb and
		 *	the decrement button (to decrease the value).
		 *
		 *	@param [blockIncrement]	The new block increment, which can be either a numerical value, or the literal string 'visibleAmount'.
		 *							When the block increment is set to 'visibleAmount' it will evaluate to the actual visible amount each time
		 *							the block increment is requested. Any numerical value is clamped between 1 and infinity.
		 *							When specified, this method acts as a setter, otherwise it acts as a getter.
		 *
		 *
		 *	@return The block increment of the scrollbar when @param blockIncrement is not specified, the jQuery object itself otherwise.
		 *
		 *	@public @function @memberOf Scrollbar
		 */
		// The behavior of this getter/setter is in accordance with jQuery standards, the jQuery-ui plugin framework will ensure the behavior.
		blockIncrement: function blockIncrement(blockIncrement) {
			if(blockIncrement != undefined) {
				if(blockIncrement == 'visibleAmount') {
					this.options.blockIncrement = blockIncrement;
				} else {
					this.options.blockIncrement = blockIncrement.clamp(1, Infinity);
				}
			} else {
				if(this.options.blockIncrement == 'visibleAmount') {
					return this.options.visibleAmount;
				} else {
					return this.options.blockIncrement;
				}
			}
		},

		// The behavior of this getter/setter is in accordance with jQuery standards, the jQuery-ui plugin framework will ensure the behavior.
		maximum: function maximum(maximum) {
			if(maximum != undefined) {
				this.options.maximum = Math.max(this.options.minimum, maximum);
				this._refreshThumb();
			} else {
				return this.options.maximum;
			}
		},

		// The behavior of this getter/setter is in accordance with jQuery standards, the jQuery-ui plugin framework will ensure the behavior.
		minimum: function minimum(minimum) {
			if(minimum != undefined) {
				this.options.minimum = Math.min(this.options.maximum, minimum);
				this._refreshThumb();
			} else {
				return this.options.minimum;
			}
		},

		/**
		 *	Get or set the visible amount. The value is clamped between 1 and maximum - minimum.
		 *	Changing the visible amount may cause the value of this scrollbar to change for the new handle to fit.
		 *	When this happens, a value change event is triggered accordingly.
		 *
		 *	@param [visibleAmount] The new visible amount, when specified this method acts as a setter, otherwise it acts as a getter.
		 *	@return The visible amount of the scrollbar when @param visibleAmount is not specified, the jQuery object itself otherwise.
		 *
		 *	@public @function @memberOf Scrollbar
		 */
		// The behavior of this getter/setter is in accordance with jQuery standards, the jQuery-ui plugin framework will ensure the behavior.
		visibleAmount: function visibleAmount(visibleAmount) {
			if(visibleAmount != undefined) {
				var newVisibleAmount = visibleAmount.clamp(1, this.options.maximum - this.options.minimum);
				if(this.options.visibleAmount != newVisibleAmount) {
					this.options.visibleAmount = newVisibleAmount;
					this._setValue(this.options.value);	// setting the value again will apply any necessary clamping
					this._refreshThumb();					// for readability's sake, always refresh
				}
			} else {
				return this.options.visibleAmount;
			}
		},

		/**
		 *	Get or set the value. The value is clamped between minimum and maximum - visible amount.
		 *	When the value is updated this method will trigger a change event accordingly.
		 *
		 *	@param [value] The new value. When specified, this method acts as a setter, otherwise it acts as a getter.
		 *	@return The value of the scrollbar when value is not specified, the jQuery object itself otherwise.
		 *
		 *	@public @function @memberOf Scrollbar
		 */
		// The behavior of this getter/setter is in accordance with jQuery standards, the jQuery-ui plugin framework will ensure the behavior.
		value: function value(value) {
			if(value != undefined) {
				if(this._setValue(value)) {
					this._refreshThumb();
					return true;
				} else {
					return false;
				}
			} else {
				return this.options.value;
			}
		},

		/**
		 *	Sets the value without updating the view. The value is clamped between minimum and maximum - visible amount.
		 *	When the value is updated this method will trigger a change event accordingly.
		 *
		 *	@param value The new value.
		 *
		 *	@returns <em>true</em> if value has been updated, <em>false</em> otherwise.
		 *
		 *	@private @function @memberOf Scrollbar
		 */
		_setValue: function _setValue(value) {
			var newValue = value.clamp(this.options.minimum, this.options.maximum - this.options.visibleAmount);
			if(newValue != this.options.value) {
				this.options.value = newValue;
				if((this.options.visibleAmount + this.options.value) === this.options.maximum){
					this._trigger('end', 0, {value: this.options.value});
				} else{
					this._trigger('change', 0, {value: this.options.value});
				}
				return true;
			} else {
				return false
			}
		},

		/**
		 *	Handles mouse presses on both the increment and the decrement button.   Depending on the  <em>event.target</em>
		 *	this method will increase or decrease the scrollbar value by unit increment. If the mouse remains pressed this
		 *	operation is automatically repeated.
		 *
		 *	@param event				The event as passed by a jQuery event dispatcher.
		 *	@param ui					The ui object as passed by a jQuery event dispatcher.
		 *	@param [isAutoRepeating]	A boolean value set to true by <code>jQuery.autoRepeat</code> to indicate that
		 *	                            the method invocation is being performed as part of an auto repeat. When this value
		 *	                            is set to false, or when it is not defined, this method will initialize auto repeat
		 *	                            behaviour.
		 *
		 *	Note: This method is currently not suited to be bound to other buttons than the increment and decrement buttons.
		 *
		 *	@private @function @memberOf Scrollbar
		 */
		_onButtonMouseDown: function _onButtonMouseDown(event, ui, isAutoRepeating) {
			var PRIMARY_BUTTON=0;
			if(event.button === PRIMARY_BUTTON) {
				// Single click
				if($(event.target).closest('.ui-button')[0] === this.element.decrementButton[0]) {
					this._setValue(this.options.value - this.options.unitIncrement);
				} else {
					this._setValue(this.options.value + this.options.unitIncrement);
				}
				this._refreshThumb();

				if(!isAutoRepeating) {
					$.autoRepeat(event, ui, this);
				}
			}
		},

		/**
		 *	Handles mouse clicks inside the thumb container that indicate that the user requests a block increment or decrement to be applied.
		 *
		 *	@param event				The event as passed by a jQuery event dispatcher.
		 *	@param ui					The ui object as passed by a jQuery event dispatcher.
		 *	@param [isAutoRepeating]	A boolean value set to true by <code>jQuery.autoRepeat</code> to indicate that
		 *	                            the method invocation is being performed as part of an auto repeat. When this value
		 *	                            is set to false, or when it is not defined, this method will initialize auto repeat
		 *	                            behaviour.
		 *
		 *	@private @function @memberOf Scrollbar
		 */
		_onThumbContainerMouseDown: function _onThumbContainerMouseDown(event, ui, isAutoRepeating) {
			var thumb = this.element.thumb;
			var thumbContainer = this.element.thumbContainer;
			var thumbContainerOffset = thumbContainer.offset();
			// jQuery uses 'position' for relative and 'offset' for global coordinates, we follow this practise here.
			var mousePosition = {top: event.pageY - thumbContainerOffset.top, left: event.pageX - thumbContainerOffset.left};
			var thumbPosition = thumb.position();
			var normalizedDelta = this._normalize({top: mousePosition.top - thumbPosition.top, left: mousePosition.left - thumbPosition.left});

			if(normalizedDelta.distMajorAxis < 0) {
				this.value(this.options.value - this.blockIncrement());
			}
			// This check prevents the thumb from oscillating about the mouse down position of the event during an auto repeat.
			else if(normalizedDelta.distMajorAxis > this._sizeAlongMajorAxis(this.element.thumb)) {
				this.value(this.options.value + this.blockIncrement());
			}

			if(!isAutoRepeating) {
				$.autoRepeat(event, ui, this);
			}
		},

		/**
		 *	This method updates the value after a user starts to drag the thumb and triggers a 'start' event on this scrollbar afterwards.
		 *
		 *	@param event				The event as passed by a jQuery event dispatcher.
		 *	@param ui					The ui object as passed by a jQuery event dispatcher.
		 *
		 *	@private @function @memberOf Scrollbar
		 */
		_onThumbDragStart: function _onThumbDragStart(event, ui) {
			this._updateValue();
			this._trigger('start', event, {value: this.options.value});
		},

		/**
		 *	This method attempts to update the value while a user is dragging the thumb and, if this dragging causes the value
		 *	to actually update, triggers a 'scroll' event on this scrollbar afterwards.
		 *
		 *	@param event				The event as passed by a jQuery event dispatcher.
		 *	@param ui					The ui object as passed by a jQuery event dispatcher.
		 *
		 *	@private @function @memberOf Scrollbar
		 */
		_onThumbDrag: function _onThumbDrag(event, ui) {
			// We use a help variable to make sure a scroll event is always triggered on the first drag movement. This is done,
			// because _onThumbDragStart also performs an _updateValue. This means, that on the first call to _onThumbDrag, the call
			// to _updateValue will always return false.
			if(this._updateValue() || !this.element.thumb.dragging) {
				this.element.thumb.dragging = true; // do not move to _onThumbDragStart, it will be set too soon
				this._trigger('scroll', event, {value: this.options.value});
			}
		},

		/**
		 *	This method updates the value after a user stops dragging the thumb and triggers a 'stop' event on this scrollbar afterwards.
		 *
		 *	@param event				The event as passed by a jQuery event dispatcher.
		 *	@param ui					The ui object as passed by a jQuery event dispatcher.
		 *
		 *	@private @function @memberOf Scrollbar
		 */
		_onThumbDragStop: function _onThumbDragStop(event, ui) {
			this._updateValue()
			this.element.thumb.dragging = false;
			this._trigger('stop', event, {value: this.options.value});
		},

		/**
		 *	Updates this.options.value based on the current position of the thumb. When the value is updated this method
		 *	will trigger a change event accordingly.
		 *
		 *	@returns <em>true</em> if value has been updated, <em>false</em> otherwise.
		 *
		 *	@private @function @memberOf Scrollbar
		 */
		_updateValue: function _updateValue() {
			var thumb = this.element.thumb;
			var thumbContainer = this.element.thumbContainer;
			var newValue = Math.round(
				(this._normalize(thumb.position()).distMajorAxis /
							this._sizeAlongMajorAxis(thumbContainer) * (this.options.maximum - this.options.minimum)) + this.options.minimum
			);
			return this._setValue(newValue);
		},

		/**
		 *	Normalizes coordinates from top/left to major/minor axes. The major axis corresponds to the long edge of the
		 *	DOM element associated with this instance and the minor axis corresponds to the short edge.
		 *
		 *	@param coordinate An object with fields <em>top</em> and <em>left</em>.
		 *
		 *	@private @function @memberOf Scrollbar
		 */
		_normalize: function _normalize(coordinate) {
			return (this.options.orientation == 'horizontal') ? {
				distMajorAxis: coordinate.left,
				distMinorAxis: coordinate.top
			} : {
				distMajorAxis: coordinate.top,
				distMinorAxis: coordinate.left
			};
		},

		/**
		 *	Returns the size of the object along the major axis.  The major axis corresponds to the long edge of the
		 *	DOM element associated with this instance.
		 *
		 *	@param object	Object of which you want to get the size along the major axis.
		 *					This object must support the width() and height() functions to retrieve the actual sizes.
		 *	@param [what]	A string indicating what specific dimension to retrieve. One of ['inner', 'outer'].
		 *					Will cause the method to use innerWidth()/innerHeight() or outerWidth/outerHeight() respectively.
		 *					If this parameter is specified, <code>object</code> must support the methods mentioned above.
		 *
		 *	@private @function @memberOf Scrollbar
		 */
		_sizeAlongMajorAxis: function _sizeAlongMajorAxis(object, what) {
			switch(what) {
			case 'inner':
				return (this.options.orientation == 'horizontal') ? object.innerWidth() : object.innerHeight();
			case 'outer':
				return (this.options.orientation == 'horizontal') ? object.outerWidth() : object.outerHeight();
			default:
				return (this.options.orientation == 'horizontal') ? object.width() : object.height();
			}
		},

		/**
		 *	Returns the size of the object along the minor axis.  The minor axis corresponds to the short edge of the
		 *	DOM element associated with this instance.
		 *
		 *	@param object	Object of which you want to get the size along the minor axis.
		 *					This object must support the width() and height() functions to retrieve the actual sizes.
		 *	@param [what]	A string indicating what specific dimension to retrieve. One of ['inner', 'outer'].
		 *					Will cause the method to use innerWidth()/innerHeight() or outerWidth/outerHeight() respectively.
		 *					If this parameter is specified, <code>object</code> must support the methods mentioned above.
		 *
		 *	@private @function @memberOf Scrollbar
		 */
		_sizeAlongMinorAxis: function _sizeAlongMinorAxis(object, what) {
			switch(what) {
			case 'inner':
				return (this.options.orientation == 'horizontal') ? object.innerHeight() : object.innerWidth();
			case 'outer':
				return (this.options.orientation == 'horizontal') ? object.outerHeight() : object.outerWidth();
			default:
				return (this.options.orientation == 'horizontal') ? object.height() : object.width();
			}
		}
	};

	/**
	 * @augments jQuery
	 */
	$.widget('ui.scrollbar', Scrollbar);
})(jQuery);
