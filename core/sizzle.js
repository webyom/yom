define(function() {
;(function(){function y(a,b,c,d,f,e){f=a=="previousSibling"&&!e;for(var h=0,j=d.length;h<j;h++){var g=d[h];if(g){if(f&&g.nodeType===1){g.sizcache=c;g.sizset=h}g=g[a];for(var l=false;g;){if(g.sizcache===c){l=d[g.sizset];break}if(g.nodeType===1&&!e){g.sizcache=c;g.sizset=h}if(g.nodeName===b){l=g;break}g=g[a]}d[h]=l}}}function z(a,b,c,d,f,e){f=a=="previousSibling"&&!e;for(var h=0,j=d.length;h<j;h++){var g=d[h];if(g){if(f&&g.nodeType===1){g.sizcache=c;g.sizset=h}g=g[a];for(var l=false;g;){if(g.sizcache===
c){l=d[g.sizset];break}if(g.nodeType===1){if(!e){g.sizcache=c;g.sizset=h}if(typeof b!=="string"){if(g===b){l=true;break}}else if(k.filter(b,[g]).length>0){l=g;break}}g=g[a]}d[h]=l}}}var v=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|['"][^'"]*['"]|[^[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?/g,w=0,A=Object.prototype.toString,n=false,k=function(a,b,c,d){c=c||[];var f=b=b||document;if(b.nodeType!==1&&b.nodeType!==9)return[];if(!a||typeof a!=="string")return c;var e=[],h,j,g,l,o=true,p=s(b);
for(v.lastIndex=0;(h=v.exec(a))!==null;){e.push(h[1]);if(h[2]){l=RegExp.rightContext;break}}if(e.length>1&&D.exec(a))if(e.length===2&&i.relative[e[0]])j=B(e[0]+e[1],b);else for(j=i.relative[e[0]]?[b]:k(e.shift(),b);e.length;){a=e.shift();if(i.relative[a])a+=e.shift();j=B(a,j)}else{if(!d&&e.length>1&&b.nodeType===9&&!p&&i.match.ID.test(e[0])&&!i.match.ID.test(e[e.length-1])){h=k.find(e.shift(),b,p);b=h.expr?k.filter(h.expr,h.set)[0]:h.set[0]}if(b){h=d?{expr:e.pop(),set:q(d)}:k.find(e.pop(),e.length===
1&&(e[0]==="~"||e[0]==="+")&&b.parentNode?b.parentNode:b,p);j=h.expr?k.filter(h.expr,h.set):h.set;if(e.length>0)g=q(j);else o=false;for(;e.length;){var m=e.pop();h=m;if(i.relative[m])h=e.pop();else m="";if(h==null)h=b;i.relative[m](g,h,p)}}else g=[]}g||(g=j);if(!g)throw"Syntax error, unrecognized expression: "+(m||a);if(A.call(g)==="[object Array]")if(o)if(b&&b.nodeType===1)for(a=0;g[a]!=null;a++){if(g[a]&&(g[a]===true||g[a].nodeType===1&&E(b,g[a])))c.push(j[a])}else for(a=0;g[a]!=null;a++)g[a]&&
g[a].nodeType===1&&c.push(j[a]);else c.push.apply(c,g);else q(g,c);if(l){k(l,f,c,d);k.uniqueSort(c)}return c};k.uniqueSort=function(a){if(r){n=false;a.sort(r);if(n)for(var b=1;b<a.length;b++)a[b]===a[b-1]&&a.splice(b--,1)}return a};k.matches=function(a,b){return k(a,null,null,b)};k.find=function(a,b,c){var d,f;if(!a)return[];for(var e=0,h=i.order.length;e<h;e++){var j=i.order[e];if(f=i.match[j].exec(a)){var g=RegExp.leftContext;if(g.substr(g.length-1)!=="\\"){f[1]=(f[1]||"").replace(/\\/g,"");d=i.find[j](f,
b,c);if(d!=null){a=a.replace(i.match[j],"");break}}}}d||(d=b.getElementsByTagName("*"));return{set:d,expr:a}};k.filter=function(a,b,c,d){for(var f=a,e=[],h=b,j,g,l=b&&b[0]&&s(b[0]);a&&b.length;){for(var o in i.filter)if((j=i.match[o].exec(a))!=null){var p=i.filter[o],m,t;g=false;if(h==e)e=[];if(i.preFilter[o])if(j=i.preFilter[o](j,h,c,e,d,l)){if(j===true)continue}else g=m=true;if(j)for(var u=0;(t=h[u])!=null;u++)if(t){m=p(t,j,u,h);var C=d^!!m;if(c&&m!=null)if(C)g=true;else h[u]=false;else if(C){e.push(t);
g=true}}if(m!==undefined){c||(h=e);a=a.replace(i.match[o],"");if(!g)return[];break}}if(a==f)if(g==null)throw"Syntax error, unrecognized expression: "+a;else break;f=a}return h};var i=k.selectors={order:["ID","NAME","TAG"],match:{ID:/#((?:[\w\u00c0-\uFFFF-]|\\.)+)/,CLASS:/\.((?:[\w\u00c0-\uFFFF-]|\\.)+)/,NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF-]|\\.)+)['"]*\]/,ATTR:/\[\s*((?:[\w\u00c0-\uFFFF-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,TAG:/^((?:[\w\u00c0-\uFFFF\*-]|\\.)+)/,CHILD:/:(only|nth|last|first)-child(?:\((even|odd|[\dn+-]*)\))?/,
POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/,PSEUDO:/:((?:[\w\u00c0-\uFFFF-]|\\.)+)(?:\((['"]*)((?:\([^\)]+\)|[^\2\(\)]*)+)\2\))?/},attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:function(a){return a.getAttribute("href")}},relative:{"+":function(a,b,c){var d=typeof b==="string",f=d&&!/\W/.test(b);d=d&&!f;if(f&&!c)b=b.toUpperCase();c=0;f=a.length;for(var e;c<f;c++)if(e=a[c]){for(;(e=e.previousSibling)&&e.nodeType!==1;);a[c]=d||e&&e.nodeName===b?e||false:e===b}d&&
k.filter(b,a,true)},">":function(a,b,c){var d=typeof b==="string";if(d&&!/\W/.test(b)){b=c?b:b.toUpperCase();c=0;for(var f=a.length;c<f;c++){var e=a[c];if(e){d=e.parentNode;a[c]=d.nodeName===b?d:false}}}else{c=0;for(f=a.length;c<f;c++)if(e=a[c])a[c]=d?e.parentNode:e.parentNode===b;d&&k.filter(b,a,true)}},"":function(a,b,c){var d=w++,f=z;if(!/\W/.test(b)){var e=b=c?b:b.toUpperCase();f=y}f("parentNode",b,d,a,e,c)},"~":function(a,b,c){var d=w++,f=z;if(typeof b==="string"&&!/\W/.test(b)){var e=b=c?b:
b.toUpperCase();f=y}f("previousSibling",b,d,a,e,c)}},find:{ID:function(a,b,c){if(typeof b.getElementById!=="undefined"&&!c)return(a=b.getElementById(a[1]))?[a]:[]},NAME:function(a,b){if(typeof b.getElementsByName!=="undefined"){for(var c=[],d=b.getElementsByName(a[1]),f=0,e=d.length;f<e;f++)d[f].getAttribute("name")===a[1]&&c.push(d[f]);return c.length===0?null:c}},TAG:function(a,b){return b.getElementsByTagName(a[1])}},preFilter:{CLASS:function(a,b,c,d,f,e){a=" "+a[1].replace(/\\/g,"")+" ";if(e)return a;
e=0;for(var h;(h=b[e])!=null;e++)if(h)if(f^(h.className&&(" "+h.className+" ").indexOf(a)>=0))c||d.push(h);else if(c)b[e]=false;return false},ID:function(a){return a[1].replace(/\\/g,"")},TAG:function(a,b){for(var c=0;b[c]===false;c++);return b[c]&&s(b[c])?a[1]:a[1].toUpperCase()},CHILD:function(a){if(a[1]=="nth"){var b=/(-?)(\d*)n((?:\+|-)?\d*)/.exec(a[2]=="even"&&"2n"||a[2]=="odd"&&"2n+1"||!/\D/.test(a[2])&&"0n+"+a[2]||a[2]);a[2]=b[1]+(b[2]||1)-0;a[3]=b[3]-0}a[0]=w++;return a},ATTR:function(a,b,
c,d,f,e){b=a[1].replace(/\\/g,"");if(!e&&i.attrMap[b])a[1]=i.attrMap[b];if(a[2]==="~=")a[4]=" "+a[4]+" ";return a},PSEUDO:function(a,b,c,d,f){if(a[1]==="not")if(v.exec(a[3]).length>1||/^\w/.test(a[3]))a[3]=k(a[3],null,null,b);else{a=k.filter(a[3],b,c,true^f);c||d.push.apply(d,a);return false}else if(i.match.POS.test(a[0])||i.match.CHILD.test(a[0]))return true;return a},POS:function(a){a.unshift(true);return a}},filters:{enabled:function(a){return a.disabled===false&&a.type!=="hidden"},disabled:function(a){return a.disabled===
true},checked:function(a){return a.checked===true},selected:function(a){return a.selected===true},parent:function(a){return!!a.firstChild},empty:function(a){return!a.firstChild},has:function(a,b,c){return!!k(c[3],a).length},header:function(a){return/h\d/i.test(a.nodeName)},text:function(a){return"text"===a.type},radio:function(a){return"radio"===a.type},checkbox:function(a){return"checkbox"===a.type},file:function(a){return"file"===a.type},password:function(a){return"password"===a.type},submit:function(a){return"submit"===
a.type},image:function(a){return"image"===a.type},reset:function(a){return"reset"===a.type},button:function(a){return"button"===a.type||a.nodeName.toUpperCase()==="BUTTON"},input:function(a){return/input|select|textarea|button/i.test(a.nodeName)}},setFilters:{first:function(a,b){return b===0},last:function(a,b,c,d){return b===d.length-1},even:function(a,b){return b%2===0},odd:function(a,b){return b%2===1},lt:function(a,b,c){return b<c[3]-0},gt:function(a,b,c){return b>c[3]-0},nth:function(a,b,c){return c[3]-
0==b},eq:function(a,b,c){return c[3]-0==b}},filter:{PSEUDO:function(a,b,c,d){var f=b[1],e=i.filters[f];if(e)return e(a,c,b,d);else if(f==="contains")return(a.textContent||a.innerText||"").indexOf(b[3])>=0;else if(f==="not"){b=b[3];c=0;for(d=b.length;c<d;c++)if(b[c]===a)return false;return true}},CHILD:function(a,b){var c=b[1],d=a;switch(c){case "only":case "first":for(;d=d.previousSibling;)if(d.nodeType===1)return false;if(c=="first")return true;d=a;case "last":for(;d=d.nextSibling;)if(d.nodeType===
1)return false;return true;case "nth":c=b[2];var f=b[3];if(c==1&&f==0)return true;var e=b[0],h=a.parentNode;if(h&&(h.sizcache!==e||!a.nodeIndex)){var j=0;for(d=h.firstChild;d;d=d.nextSibling)if(d.nodeType===1)d.nodeIndex=++j;h.sizcache=e}d=a.nodeIndex-f;return c==0?d==0:d%c==0&&d/c>=0}},ID:function(a,b){return a.nodeType===1&&a.getAttribute("id")===b},TAG:function(a,b){return b==="*"&&a.nodeType===1||a.nodeName===b},CLASS:function(a,b){return(" "+(a.className||a.getAttribute("class"))+" ").indexOf(b)>
-1},ATTR:function(a,b){var c=b[1];c=i.attrHandle[c]?i.attrHandle[c](a):a[c]!=null?a[c]:a.getAttribute(c);var d=c+"",f=b[2],e=b[4];return c==null?f==="!=":f==="="?d===e:f==="*="?d.indexOf(e)>=0:f==="~="?(" "+d+" ").indexOf(e)>=0:!e?d&&c!==false:f==="!="?d!=e:f==="^="?d.indexOf(e)===0:f==="$="?d.substr(d.length-e.length)===e:f==="|="?d===e||d.substr(0,e.length+1)===e+"-":false},POS:function(a,b,c,d){var f=i.setFilters[b[2]];if(f)return f(a,c,b,d)}}},D=i.match.POS,x;for(x in i.match)i.match[x]=RegExp(i.match[x].source+
/(?![^\[]*\])(?![^\(]*\))/.source);var q=function(a,b){a=Array.prototype.slice.call(a,0);if(b){b.push.apply(b,a);return b}return a};try{Array.prototype.slice.call(document.documentElement.childNodes,0)}catch(F){q=function(a,b){var c=b||[];if(A.call(a)==="[object Array]")Array.prototype.push.apply(c,a);else if(typeof a.length==="number")for(var d=0,f=a.length;d<f;d++)c.push(a[d]);else for(d=0;a[d];d++)c.push(a[d]);return c}}var r;if(document.documentElement.compareDocumentPosition)r=function(a,b){if(!a.compareDocumentPosition||
!b.compareDocumentPosition){if(a==b)n=true;return 0}var c=a.compareDocumentPosition(b)&4?-1:a===b?0:1;if(c===0)n=true;return c};else if("sourceIndex"in document.documentElement)r=function(a,b){if(!a.sourceIndex||!b.sourceIndex){if(a==b)n=true;return 0}var c=a.sourceIndex-b.sourceIndex;if(c===0)n=true;return c};else if(document.createRange)r=function(a,b){if(!a.ownerDocument||!b.ownerDocument){if(a==b)n=true;return 0}var c=a.ownerDocument.createRange(),d=b.ownerDocument.createRange();c.selectNode(a);
c.collapse(true);d.selectNode(b);d.collapse(true);c=c.compareBoundaryPoints(Range.START_TO_END,d);if(c===0)n=true;return c};(function(){var a=document.createElement("div"),b="script"+(new Date).getTime();a.innerHTML="<a name='"+b+"'/>";var c=document.documentElement;c.insertBefore(a,c.firstChild);if(document.getElementById(b)){i.find.ID=function(d,f,e){if(typeof f.getElementById!=="undefined"&&!e)return(f=f.getElementById(d[1]))?f.id===d[1]||typeof f.getAttributeNode!=="undefined"&&f.getAttributeNode("id").nodeValue===
d[1]?[f]:undefined:[]};i.filter.ID=function(d,f){var e=typeof d.getAttributeNode!=="undefined"&&d.getAttributeNode("id");return d.nodeType===1&&e&&e.nodeValue===f}}c.removeChild(a);c=a=null})();(function(){var a=document.createElement("div");a.appendChild(document.createComment(""));if(a.getElementsByTagName("*").length>0)i.find.TAG=function(b,c){var d=c.getElementsByTagName(b[1]);if(b[1]==="*"){for(var f=[],e=0;d[e];e++)d[e].nodeType===1&&f.push(d[e]);d=f}return d};a.innerHTML="<a href='#'></a>";
if(a.firstChild&&typeof a.firstChild.getAttribute!=="undefined"&&a.firstChild.getAttribute("href")!=="#")i.attrHandle.href=function(b){return b.getAttribute("href",2)};a=null})();document.querySelectorAll&&function(){var a=k,b=document.createElement("div");b.innerHTML="<p class='TEST'></p>";if(!(b.querySelectorAll&&b.querySelectorAll(".TEST").length===0)){k=function(d,f,e,h){f=f||document;if(!h&&f.nodeType===9&&!s(f))try{return q(f.querySelectorAll(d),e)}catch(j){}return a(d,f,e,h)};for(var c in a)k[c]=
a[c];b=null}}();document.getElementsByClassName&&document.documentElement.getElementsByClassName&&function(){var a=document.createElement("div");a.innerHTML="<div class='test e'></div><div class='test'></div>";if(a.getElementsByClassName("e").length!==0){a.lastChild.className="e";if(a.getElementsByClassName("e").length!==1){i.order.splice(1,0,"CLASS");i.find.CLASS=function(b,c,d){if(typeof c.getElementsByClassName!=="undefined"&&!d)return c.getElementsByClassName(b[1])};a=null}}}();var E=document.compareDocumentPosition?
function(a,b){return a.compareDocumentPosition(b)&16}:function(a,b){return a!==b&&(a.contains?a.contains(b):true)},s=function(a){return a.nodeType===9&&a.documentElement.nodeName!=="HTML"||!!a.ownerDocument&&a.ownerDocument.documentElement.nodeName!=="HTML"},B=function(a,b){for(var c=[],d="",f,e=b.nodeType?[b]:b;f=i.match.PSEUDO.exec(a);){d+=f[0];a=a.replace(i.match.PSEUDO,"")}a=i.relative[a]?a+"*":a;f=0;for(var h=e.length;f<h;f++)k(a,e[f],c);return k.filter(d,c)};window.Sizzle=k})();
return Sizzle
})
