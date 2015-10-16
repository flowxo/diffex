# DiffEx

> A tool to extract key-value pairs by comparing a template with an input string.

## Installation

```
npm install flowxo/diffex
```

## Usage

This tool attempts to compare (diff) two strings, a _template_ and an _input_, extracting the differences and converting to key-value pairs.

``` js
var diffex = require('diffex');

var template = 'Hello, {{name}}!';
var input = 'Hello, Bob!';

var output = diffex(template, input);

// output -> { name: 'Bob' }
```

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

The template variables will be matched to values in the input string, and an output object will be created accordingly.

Duplicate variables names are not allowed - if the template contains duplicates, when extracting, the first non-empty value from the input string will be taken.

## Credit

The core diff algorithm was implemented by Neil Fraser, originally found [here](https://code.google.com/p/google-diff-match-patch/). The library is reproduced here under the Apache 2.0 license.

## License

Apache 2.0

