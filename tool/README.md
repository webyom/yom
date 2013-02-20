# YOM Builder
YOM builder is a tool for packaging AMD modules, compiling micro templates and optimizing html files.

## Rules
- JS file of which name is "main" or end with "-main" or the same as the folder name is the target building file. For example, "main.js", "index-main.js" and "index/index.js" are target building files.
- Dependancy module with relative path will be packaged whith target building file.  
`var mod1 = require('./mod1')`  
`var mod2 = require('../mod2')`  
`var mod3 = require('mod3')`  
mod1 and mod2 will be packaged with target building file.  
The building result file are named as "main-built.js", "index-main-built.js" and "index/index-built.js".
- Html file of which name is end with '.tpl' is micro template file. This file will be built into AMD module file. For example, you have a file named "cargo-list.tpl.html", and you can require it as below.  
`var cargoListTmpl = require('./cargo-list.tpl.html')`  
Then you can use it as below.  
`$('cargo-list').innerHTML = cargoListTmpl.render(data)`

## Usage
YOM builder is built on NodeJS. You can run it in command line like this:  
`node path/to/builder.js`

## Supported Options
- `--config-file filepath` : In general builder does't need config file to work,  It does traversal building in current working directory according to the rules. However, you can specify a config file to use advanced setting.
- `--uglify N` : YOM builder use uglifyJS to compress JS code. N stands for compress level, default is 0.  
-1: beautify  
0 : do nothing  
1 : uglify  
2 : mangle  
3 : squeeze
- `--cssmin` : YOM builder use cssmin to compress CSS code. Pass this if you want to compress CSS file.
- `--build-node-tpl` : Pass this if you want to build micro template file into nodeJS module file.
- `--exclude filelist` : Relative file path list delimited by comma. Used to exclude files built with target building file.

## Config File
Config file is a json file. It has below options.
- uglify : Same as uglify option in command line. eg. {"uglify": -1}
- cssmin : Same as cssmin option in command line. eg. {"cssmin": true}
- buildNodeTpl : Same as build-node-tpl option in command line. eg. {"buildNodeTpl": true}
- exclude : Same as exclude option in command line, but is a hash object. eg. {"exclude" : {"./mod1": 1, "../mod2": 1}}