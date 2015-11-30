/*
 * log4javascript configuration file.
 *
 * Recommended literature (about the logging stuff):
 *
 *	- http://log4javascript.org/docs/index.html
 *	- http://logging.apache.org/log4j/1.2/manual.html
 */

(function($) {
var consoleAppender = BrowserConsoleAppenderPlus.create();
consoleAppender.setThreshold(log4javascript.Level.ERROR);

var patternLayout = BrowserConsoleAppenderPlusPatternLayout.create({pattern: "%d{yyyy-MM-dd HH:mm:ss,SSS } %c %p | %a (%r)"});
consoleAppender.setLayout(patternLayout);

// Making setupLogger a global function allows us to change
// the logging on-the-fly (using the browser console).
setupLogger = function setupLogger(name, level, appender) {
	var logger = log4javascript.getLogger(name);
	appender = appender || Object.create(consoleAppender);
	logger.addAppender(appender);

	var level = log4javascript.Level[level];
	appender.setThreshold(level);
	logger.setLevel(level);
}

// Level names are: TRACE < DEBUG < INFO < WARN < ERROR < FATAL
setupLogger("awf", "WARN");
setupLogger("armi", "WARN");

//setupLogger("armi", "INFO");
setupLogger("armi.cubeapi.heartbeat", "INFO");
setupLogger("armi.cubeapi", "TRACE");

//setupLogger("armi.controlapi.heartbeat", "INFO");
//setupLogger("armi.controlapi", "TRACE");

///////////////////////
// Keep in mind that setupLogger("awf") also sets up loggers for "awf.*" (loggers use a tree hierarchy)
///////////////////////

//setupLogger("awf", "TRACE");
//setupLogger("awf.core", "TRACE");
//setupLogger("awf.communication", "TRACE");

setupLogger("awf.options", "ERROR");
//setupLogger("awf.options.dom", "TRACE");

//setupLogger("awf.data", "TRACE");
//setupLogger("awf.data.util", "TRACE");
//setupLogger("awf.data.literal", "TRACE");
//setupLogger("awf.data.aimms", "TRACE");
//setupLogger("awf.data.aimms.armi", "TRACE");
//setupLogger("awf.data.aimms.session", "TRACE");

//setupLogger("awf.typeswitching", "TRACE");
//setupLogger("awf.changestack", "TRACE");

setupLogger("addons.data_management", "TRACE");

})(jQuery);
