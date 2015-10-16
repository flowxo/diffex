'use strict';

var isString = require('lodash.isstring'),
    defaults = require('lodash.defaults'),
    DiffMatchPatch = require('./diff-match-patch.js').diff_match_patch;

var getDiff = function(str, template, options) {
  var dmp = new DiffMatchPatch();
  dmp.Diff_Timeout = 0;
  dmp.Diff_EditCost = 4;

  var diff = dmp.diff_main(template, str);
  dmp.diff_cleanupEfficiency(diff);

  var removed, added, collectingCommon = false;

  // Combine any 'common' values,
  // and return an array of diff objects.
  return diff.reduce(function(rtn, item) {
    var code = item[0],
        value = item[1];

    switch(code) {
      case -1:
        var startsWithCurlys = value.trim().startsWith(options.open);
        var endsWithCurlys = value.trim().endsWith(options.close);

        if(startsWithCurlys && endsWithCurlys) {
          rtn.push({ removed: true, value: value });

        } else if(startsWithCurlys) {
          // Begin collection of common data.
          collectingCommon = true;
          removed = value;
          added = '';

        } else if(endsWithCurlys) {
          // End collection of common data.
          removed += value;
          rtn.push({ removed: true, value: removed });
          rtn.push({ added: true, value: added });

          collectingCommon = false;
          removed = null;
          added = null;

        } else {
          // just push as normal.
          rtn.push({ removed: true, value: value });
        }
      break;

      case 0:
        if(collectingCommon) {
          // Goes into both key and value.
          removed += value;
          added += value;
        } else {
          // Regular push.
          rtn.push({ value: value });
        }
      break;

      case 1:
        if(collectingCommon) {
          added += value;
        } else {
          rtn.push({ added: true, value: value });
        }
      break;
    }

    return rtn;
  }, []);
};

/**
 * Diffs the received data with a template to attempt to
 * retrieve interpolated values.
 * @param  {String} str      input data
 * @param  {String} template
 * @return {Object}          key-value pairs of interpolated data.
 */
module.exports = function(str, template, options) {
  if(!isString(str) || !isString(template)) {
    return {};
  }

  options = defaults(options || {}, {
    open: '{{',
    close: '}}'
  });

  var diff = getDiff(str, template, options);
  if(!diff) {
    return {};
  }

  var key = null,
      val = null,
      runningVal = '',
      shouldTakeRunning = false,
      rtn = {};

  var matchRegex = new RegExp(options.open + '(\\S+)' + options.close);

  diff.forEach(function(item) {
    item.value = item.value || '';
    runningVal += item.value;

    if(item.removed) {
      // Try an find an interpolation key.
      var matches = item.value.match(matchRegex);
      if(matches) {
        // matches array:
        // [0]: full value
        // [1]: text inside '{{ }}'
        key = matches[1].trim();
        runningVal = '';
        shouldTakeRunning = true;
      }

    } else if(item.added) {
      if(!shouldTakeRunning) {
        // Discard everything before this.
        val = item.value;
      } else {
        val = runningVal;
      }
      shouldTakeRunning = true;
    }

    if(key && val) {
      // Only store if we don't already have this key.
      if(!rtn[key]) {
        val = val.trim();
        if(val) {
          rtn[key] = val;
        }
      }
      key = null;
      val = null;
    }
  });

  return rtn;
};
