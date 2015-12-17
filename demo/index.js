'use strict';

var diffex = require('diffex');
var domready = require('domready');

domready(function() {
  var template = document.getElementById('template');
  var input = document.getElementById('input');
  var result = document.getElementById('result');
  var extract = document.getElementById('extract');

  function displayResults() {
    result.textContent = JSON.stringify(diffex(template.value).parse(input.value), null, 2);
  }

  extract.onclick = displayResults;
  displayResults();
});
