function Observable(target, eventTypes) {
	var handlers;
	
	function init() {
		handlers = {};
		eventTypes.forEach(function(type) {
			handlers[type] = [];
		});
	}

	init();

	/**
	 *	Trigger event type.
	 *
	 *	<code>trigger(type, [extra trigger args])</code>
	 */
	target.trigger = function trigger() {
		var type = Array.prototype.shift.call(arguments);
		var triggerArgs = arguments;
		handlers[type].forEach(function(handler) {
			handler.apply(null, triggerArgs);
		});
	};
	/**
	 *	Overloaded method, two ways to use it:
	 *
	 *	bind(type, handler): Binds a 'handler' for the specified event 'type'.
	 *	bind(handlersObject): An object specifying multiple handlers for various types at once.
	 *					The object's property names must match the event type names.
	 */
	target.on = function bind() {
		function bindHandler(type, handler) {
			if(!handlers[type]) {
				throw "NoSuchEventTypeException: " + type;
			}
			handlers[type].push(handler);
			handlers[type] = handlers[type].unique();
		}

		switch(arguments.length) {
			case 1:
				var handlersObject = arguments[0];
				for(type in handlersObject) {
					bindHandler(type, handlersObject[type]);
				}
				break;
			case 2:
				var type = arguments[0];
				var handler = arguments[1];

				bindHandler(type, handler);
				break;
		}
	};
	// backwards compatibility
	target.bind = target.on;

	/**
	 *	Unbinds a handler for the specified event type.
	 */
	target.off = function(type, handler) {
		if(!type) {
			init();
		} else {
			// This algorithm assumes that handler is contained at most once in the handlers[type] array.
			handlers[type].forEach(function(_handler, index) {
				if(handler === _handler || !handler) { // If no particular handler is specified, remove all.
					handlers.splice(index, 1)
				}
			});
		}
	};
	// backwards compatibility
	target.unbind = target.off;
}
