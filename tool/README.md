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
- `uglify` : Same as uglify option in command line.  
eg. `{"uglify": -1}`
- `cssmin` : Same as cssmin option in command line.  
eg. `{"cssmin": true}`
- `buildNodeTpl` : Same as build-node-tpl option in command line.  
eg. `{"buildNodeTpl": true}`
- `exclude` : Same as exclude option in command line, and has higher priority, but is a hash object.  
eg. `{"exclude" : {"./mod1": 1, "../mod2": 1}}`
- `copyright` : JS copyright text.  
eg. `{"copyright": "/* All rights reserved */"}`
- `properties` : This option defines reusable values.  
eg. `{"properties": {"a": {"b": {"c": 1}}}}`  
Defined values can be used as `%{{a.b.c}}%`
- `builds` : Building target list. Each item in the list has below options.
    - `input` : Target building file or folder path.
    - `output` : If input is a file this is the built file output path.
    - `exclude` : Same as top level exclude option in the config json, and has higher priority.
- `combines` : Combine some files into one file.
    - `output`: Combined file path.
    - `input` : To be combined file list.  
    eg. `{"input": ["mod1.js", "mod2.js"], "output": "mod3.js"}`

## Optimize Html File
YOM builder can build external JS and CSS file into Html file, in order to enhance the page performance by reducing http request amount. Html file of which name is end with ".inc" is considerred the source file to be optimized, and the optimized result file will be output to the same folder with the name without ".inc". Micro template file can also be optimized in this way. Below are instructions of optimization.
- `include` : Include an external file into the Html source file, the included file can also be Html source file, and the optimization is done recursively.  
eg. `<!-- include "./mod1.js" -->`  
You can even specify a plain-id to the instruction, in order to make the JS code not execuded immediately, and execude it on demand.  
eg. `<!-- include "./mod1.js" plain-id:mod1-script -->`  
The output will be `<script type="text/plain" id="mod1-script">...`

