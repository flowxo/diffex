# DiffEx

A tool to extract key-value pairs by comparing (diffing) a template with an input string.

[![Build Status](https://travis-ci.org/flowxo/diffex.svg?branch=master)](https://travis-ci.org/flowxo/diffex)
[![npm version](https://badge.fury.io/js/diffex.svg)](http://badge.fury.io/js/diffex)
[![Dependency Status](https://david-dm.org/flowxo/diffex.svg)](https://david-dm.org/flowxo/diffex)
[![devDependency Status](https://david-dm.org/flowxo/diffex/dev-status.svg)](https://david-dm.org/flowxo/diffex#info=devDependencies)

## Installation

```
npm install flowxo/diffex
```

## Usage

`diffex` is initialised with a _template_, which is used as a base for the diffing.

A template is a simple string with `{{placeholder}}` values. These placeholders will be replaced with data when the template is applied to an input string.

You should define your template variables inside `{{` and `}}` curly braces. _Don't include any spaces inside the curlys, as this will prevent the extractor from working correctly._

For example, these template variables are ok:

```
{{name}}
{{first_name}}
{{last-name}}
```

whereas these are invalid:

```
{{ name }}
{{first name}}
{{ last name }}
```

Create the diffex object like so:

``` js
var do = diffex(template);
```

Once you have the diffex object, there are two methods available: `placeholders()` and `parse(input)`.

### `.placeholders()`

Parses the template and outputs all found placeholders.

Example:

``` js
var diffex = require('diffex');
var template = '{{customer}} owes £{{amount}}.';

diffex(template).placeholders();
// -> ['customer', 'amount']
```

### `.parse(input)`

Compares the _template_ with an _input_, extracting the differences and outputting as key-value pairs.

``` js
var diffex = require('diffex');
var template = '{{customer}} owes £{{amount}}.';
var input = 'Bob owes £19.'

diffex(template).parse(input);
// -> { customer: 'Bob', amount: '19' }
```

## Credit

The core diff algorithm was implemented by Neil Fraser, originally found [here](https://code.google.com/p/google-diff-match-patch/). The library is reproduced here under the Apache 2.0 license.

## License

Apache 2.0

