
var iconv = require('iconv-lite')
// engineData is an array form descriptor.coffee

var MATCH_TYPE = [  hashStart,
                    hashEnd,
                    multiLineArrayStart,
                    multiLineArrayEnd,
                    property, 
                    propertyWithData,
                    singleLineArray,
                    boolean,
                    number,
                    numberWithDecimal,
                    string];

var VALUE_TYPE = []

var nodeStack = [], propertyStack = [];
var currentNode = [], currentProperty;

var paresr = function(engineData){
    //字符替换？
    textReg(textSegment(codeToString(engineData)));
    //分割
    //逐行正则
    return currentNode[0]
}


function codeToString(engineData){
    return String.fromCharCode.apply(null, engineData);
}

function textSegment(text){
    return text.split('\n');
}

function textReg(textArr){
    textArr.map(function(currentText){
        typeMatch(currentText.replace(/^\t+/g, ''));
    });

}

function typeMatch(currentText){

    for (var currentType in MATCH_TYPE) {
        var t = new MATCH_TYPE[currentType](currentText);
        if (t.match){
            return t.parse();
        }
    }

    return currentText;
}

// helper fun
function Match(reg, text){
    return reg.test(text);
}
function isArray(o){
    return Object.prototype.toString.call(o) === '[object Array]';
}

// tyep reg
function hashStart(text){
    var reg = /^<<$/;

    return {
        match: Match(reg, text),
        parse: function(){
            stackPush({});
        }
    }
}
function hashEnd(text){
    var reg = /^>>$/;

    return {
        match: Match(reg, text),
        parse: function(){
            updateNode();
        }
    }
}
function multiLineArrayStart(text){
    var reg = /^\/(\w+) \[$/;

    return {
        match: Match(reg, text),
        parse: function(){
            propertyStack.push(text.match(reg)[1]);
            stackPush([]);
        }
    }
}
function multiLineArrayEnd(text){
    var reg = /^\]$/;

    return {
        match: Match(reg, text),
        parse: function(){
            updateNode();
        }
    }
}
function property(text){
    var reg = /^\/([A-Z0-9]+)$/i;

    return {
        match: Match(reg, text),
        parse: function(){
            propertyStack.push(text.match(reg)[1]);
        }
    }
}
function propertyWithData(text){
    var reg = /^\/([A-Z0-9]+)\s((.|\r)*)$/i;

    return {
        match: Match(reg, text),
        parse: function(){
            var match = text.match(reg);
            pushKeyValue(match[1], typeMatch(match[2]));
        }
    }
}
// value reg
function boolean(text){
    var reg = /^(true|false)$/;
    return {
        match: Match(reg, text),
        parse: function(){
            return text === 'true'? true:false;
        }
    }
}
function number(text){
    var reg = /^-?\d+$/;
    return {
        match: Match(reg, text),
        parse: function(){
            return Number(text);
        }
    }
}
function numberWithDecimal(text){
    var reg = /^(-?\d*)\.(\d+)$/;
    return {
        match: Match(reg, text),
        parse: function(){
            return Number(text);
        }
    }
}
function singleLineArray(text){
    //单行数组似乎只有数字数组的情况
    var reg = /^\[(.*)\]$/;
    return {
        match: Match(reg, text),
        parse: function(){
            var items = text.match(reg)[1].trim().split(' ');
            var tempArr = [];
            for (var i=0, l=items.length; i<l; i++){
                tempArr.push(typeMatch(items[i]));
            }
            return tempArr;
        }
    }
}

function string(text){
    //有点复杂，最后再来//妈蛋Editor中Text不靠谱啊，编码有问题啊
    var reg = /^\(((.|\r)*)\)$/;
    return {
        match: Match(reg, text),
        parse: function(){
            var txt = text.match(reg)[1];
            var bf = [];
            for (var i=0,l=txt.length;i<l;i++){
                bf.push(txt.charCodeAt(i));
            }
            return iconv.decode(new Buffer(bf), 'utf-16');//前两位指定了，这里直接uft-16
        }
    }
}

// node handle
function stackPush(node){
    nodeStack.push(currentNode);
    currentNode = node;
}
function updateNode(){
    var node = nodeStack.pop();
    if (isArray(node)){
        node.push(currentNode);
    } else {
        node[propertyStack.pop()] = currentNode;
    }
    currentNode = node;
}
function pushKeyValue(key,value){
    currentNode[key] = value;
}


module.exports = paresr;
