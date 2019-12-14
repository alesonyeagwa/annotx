var CursorModes = {
    NORMAL: 'mormal',
    POINTER: 'pointer',
    TEXT: 'text',
    MOVE: 'move',
    DRAW: 'crosshair'
}
var AnnotationTypes = {
    NONE: null,
    NOTE: 'note',
    LINK: 'link',
    HIGHLIGHT: 'highlight',
    UNDERLINE: 'underline',
    STRIKE: 'strike',
    LINE: 'line',
    RECT: 'rect',
    ELLIPSE: 'ellipse',
    TEXT: 'text',
    ARROW: 'arrow',
    STAMP: 'stamp',
    INK: 'ink'
}
var DefaultObjectColor = {
    RECT: {fill: 'purple', stroke: '', opacity: 1},
    ELLIPSE: {fill: 'orange', stroke: '', opacity: 1},
    LINE: {fill: 'black', opacity: 1},
    HIGHLIGHT: {fill: '#fc3'},
    UNDERLINE: {fill: 'black', opacity: 1},
    STRIKE: {fill: 'red', opacity: 1},
    LINK: 'blue',
    TEXT: {fill: 'transparent', stroke: '', fontColor: 'black', fontSize: 12, opacity: 1},
    ARROW: {fill: 'green', opacity: 1, thickness: 1},
    INK: {fill: '#005E7A', opacity: 1, thickness: 10},
    NOTE: {fill: 'yellow'}
}
var canv;
var canvObjMoving = false;
var canvObjScaling = false;
var canvObjRotating = false;
var canvActiveObject = null;
var fabCanvasTextMouseDown = false;
var fabSelectorRect = new fabric.Rect({fill: '#ace', opacity: 0.5 });
var fabSelectorGroup = new fabric.Group();
var selectorStartX = 0;
var selectorStartY = 0;
var selectorRects = [];
var textOrder = [];
var canvMouseDown = false;
var scrollInterval = null;
var cursorMode = CursorModes.NORMAL; //cursor mode for viewer
var selectedAnnotationType = AnnotationTypes.NONE;
var selectedFillColor = 'red';
var selectedStrokeColor = 'red';
var notePath = "M 2.1242662,289.72563 H 17.199746 17.115296 M 2.0609236,287.66067 H 13.715916 13.650626 M 7.4872517,285.97573 H 17.11529 17.061357 M 2.2298365,284.10076 h 9.7547225 -0.05464 m -0.483762,-1.87492 h 5.785268 -0.0324 M 2.1348231,280.35091 H 17.210302 17.125851 M 0.99440816,277.90215 c -0.51469605,0 -0.9275221,0.4131 -0.9275221,0.92758 v 12.45753 c 0,0.51471 0.41282596,0.93015 0.9275221,0.93015 H 1.9950871 l -0.2847884,2.39063 2.0353238,-2.39063 H 18.055591 c 0.514696,0 0.927523,-0.4158 0.927523,-0.93015 v -12.45753 c 0,-0.51471 -0.412821,-0.92758 -0.927523,-0.92758 z";

var textAnnotations = [];


var content =  document.querySelector("#textLayer");

var layers = document.getElementsByClassName('textLayer');
if(layers.length > 0){
    for(var p = 0; p < layers.length; p++){
        convertToFabricText(layers[p]);
    }
}

//html2canvas(document.querySelector("#textLayer"), {width: '652', height: '844'}).then(canvas => {
//  var content = document.getElementById('textLayer');
//  canvas.id = 'ccx';
//  //var ccxContext = ccx.getContext('2d');
//  //ccxContext.drawImage(canvas, 0, 0);
//  //document.body.appendChild(canvas);
//        //hideContent();
//  convertToFabricText();
//  //convertToEaseText();
//});

function convertToEaseText(){
  var content = document.getElementById('textLayer');
  //content.style.display = 'none';
  
 //  var stage = new createjs.Stage("c");
 //  stage.autoClear = false;
 //  var text = new createjs.Text("Hello worlddddd");
 //  stage.addChild(text);
 //  // stage.update();
 //  // var textt = new createjs.Text("Hello world");
 //  // stage.addChild(textt);
 //  stage.update();
 // //  createjs.Ticker.addEventListener("tick", handleTick);
 // // function handleTick(event) {
 // //     //stage.update();
 // // }
  var stage = new createjs.Stage("ccx");
  stage.autoClear = false;
  stage.enableMouseOver();
// setInterval(function () {
//     stage.update();
// }, 100);
  var elements = document.getElementById('textLayer').querySelectorAll('span');
  console.log(elements[0]);
  for(var i = 0; i < 1; i++){
    //console.log(elements[i]);
    var ele = elements[i];
    var top = parseFloat(ele.style.top.replace('px', '')) - 7;
    var left = parseFloat(ele.style.left.replace('px', '')) - 8;
    var fontSize = parseFloat(ele.style.fontSize.replace('px', ''));
    var fontFamily = ele.style.fontFamily.replace('px', '');
    var font = ele.style.fontSize + ' ' + ele.style.fontFamily;
    var color = '#000';
    console.log(font);
    //console.log(ele.getBoundingClientRect().width)
    var scaleXX = parseFloat((ele.getBoundingClientRect().width / ele.offsetWidth).toFixed(6));
    console.log(top);
  
    var text = new  createjs.Text(ele.innerText, font, color);
    text.x = left;
    text.y = top;
    text.scaleX = scaleXX
    console.log('width: ' + text.getMeasuredWidth());
    //text.set('editable', false);
    stage.addChild(text);
    stage.addChildAt(new Selector(stage, text, null), 0);
    stage.update();
  }
  content.style.display = 'none';
}



function convertToFabricText(layer){
    
    textOrder = [];
    
    //Set up interaction canvas for annotations
    //var layer = document.getElementById('textLayer');
    var _pageCanvas = document.createElement('canvas');
    var _pageID = generateUUID();
    _pageCanvas.setAttribute('id', _pageID);
    _pageCanvas.setAttribute('width', layer.style.width);
    _pageCanvas.setAttribute('height', layer.style.height);
    _pageCanvas.style.top = 0;
    _pageCanvas.style.left = 0;
    layer.parentNode.insertBefore(_pageCanvas, layer.nextSibling);
    
    canv = new fabric.Canvas(_pageID);
    canv.hoverCursor = cursorMode;
    
    var drawStartPoint = {x: 0, y: 0};
    
    var currentRectDraw, currentCircleDraw, currentPlainLineDraw, currentLineDraw, currentTriangleDraw, currentNoteDraw, arrowDX, arrowDY, currentTriangleAdded = false;
    
    //var content = document.getElementById('textLayer');
    //content.style.display = 'none';
    
    var rect = new fabric.Rect({
      left: 100,
      top: 100,
      fill: 'red',
      width: 20,
      height: 20
    });
    
    if(selectedAnnotationType == AnnotationTypes.INK && cursorMode == CursorModes.DRAW){
        canv.isDrawingMode = true;
        canv.freeDrawingBrush.color = DefaultObjectColor.INK.fill;
        canv.freeDrawingBrush.width =  DefaultObjectColor.INK.thickness;
    }

    canv.on({
        'mouse:down' : function(e){
            console.log("down");
            canvMouseDown = true;
            fabClearSelect();
            //canv.remove(fabSelectorGroup);
            //fabCanvasTextMouseDown = true;
//            if(cursorMode == CursorModes.NORMAL && selectedAnnotationType == AnnotationTypes.HIGHLIGHT){
//                highlighters = [];
//            }
            if(cursorMode == CursorModes.DRAW && selectedAnnotationType && !checkObjectStructureChange()){
                drawStartPoint.x = e.pointer.x;
                drawStartPoint.y = e.pointer.y;
                switch(selectedAnnotationType){
                    case AnnotationTypes.RECT:
                        currentRectDraw = new fabric.Rect({left: e.pointer.x,top: e.pointer.y,fill: DefaultObjectColor.RECT.fill,width: 0,height: 0});
                        canv.add(currentRectDraw);
                        break;
                    case AnnotationTypes.ELLIPSE:
                        currentCircleDraw = new fabric.Ellipse({left: e.pointer.x,top: e.pointer.y,originX: 'left',originY: 'top',rx: 0,ry: 0,fill: DefaultObjectColor.ELLIPSE.fill,type : 'ellipse'});
                        canv.add(currentCircleDraw);
                        break;
                    case AnnotationTypes.LINE:
                        var points = [e.pointer.x, e.pointer.y, e.pointer.x, e.pointer.y];
                        currentPlainLineDraw = new fabric.Line(points, {strokeWidth: 2,fill: DefaultObjectColor.LINE.fill, stroke: DefaultObjectColor.LINE.fill,originX: 'left',originY: 'center',id:'line',type : 'line', lockScalingX: true, lockScalingY: true});
                        canv.add(currentPlainLineDraw);
                        break;
                    case AnnotationTypes.ARROW:
                        var points = [e.pointer.x, e.pointer.y, e.pointer.x, e.pointer.y];
                        currentLineDraw = new fabric.Line(points, {strokeWidth: 2,fill: DefaultObjectColor.ARROW.fill,stroke: DefaultObjectColor.ARROW.fill,originX: 'center',originY: 'center',id:'arrow_line',type : 'arrow'});
                        var centerX = (currentLineDraw.x1 + currentLineDraw.x2) / 2;
                        var centerY = (currentLineDraw.y1 + currentLineDraw.y2) / 2;
                        arrowDX = currentLineDraw.left - centerX;
                        arrowDY = currentLineDraw.top - centerY;
                        
                        //if(arrowDX > 0 || arrowDY > 0){
                            currentTriangleDraw = new fabric.Triangle({left: currentLineDraw.get('x1') + arrowDX,top: currentLineDraw.get('y1') + arrowDY,originX: 'center',originY: 'center',lockScalingX: true,selectable: false,pointType: 'arrow_start',angle: -45,width: 10,height: 10,fill: DefaultObjectColor.ARROW.fill,id:'arrow_triangle'});
                            canv.add(currentLineDraw);
                            currentTriangleAdded = false;
                        //}
                        break;
                    case AnnotationTypes.TEXT:
                        var text = new fabric.IText(ele.innerText.trim(), { top: e.pointer.y, left: e.pointer.x, fontSize: 12, text: 'Insert text here'});
                        confClone(text);
                        //canv.add(text);
                        cursorMode = CursorModes.NORMAL;
                        break;
                    case AnnotationTypes.NOTE:
                        var note = new fabric.Path(notePath);
                        var centerX = e.pointer.x - (note.getScaledWidth())/2;
                        var centerY = e.pointer.y - (note.getScaledHeight())/2;
                        note.set({ fill: DefaultObjectColor.NOTE.fill, stroke: 'black', opacity: 1, left: centerX, top: centerY});
                        clearControls(note);
                        canv.add(note);
                        break;
                }
            }
        },
        'mouse:up' : function(e){
            console.log("up");
            canvMouseDown = false;
            fabCanvasTextMouseDown = false;
            canv.selection = true;
            if(scrollInterval){
                clearInterval(scrollInterval);
                scrollInterval = null;
            }
            if(cursorMode == CursorModes.NORMAL && (selectedAnnotationType == AnnotationTypes.HIGHLIGHT || selectedAnnotationType == AnnotationTypes.UNDERLINE || selectedAnnotationType == AnnotationTypes.STRIKE)){
                addTextAnnotations();
            }
            if(cursorMode == CursorModes.DRAW && selectedAnnotationType && !checkObjectStructureChange()){
                switch(selectedAnnotationType){
                    case AnnotationTypes.RECT:
                        currentRectDraw.clone((clone) => {
                            canv.remove(currentRectDraw);
                            confClone(clone);
                        });
                        break;
                    case AnnotationTypes.ELLIPSE:
                        currentCircleDraw.clone((clone) => {
                            canv.remove(currentCircleDraw);
                            confClone(clone);
                        })
                        break;
                    case AnnotationTypes.LINE:
                        var dx = Math.abs(currentPlainLineDraw.left - drawStartPoint.x);
                        var dy = Math.abs(currentPlainLineDraw.top - drawStartPoint.y);
                         //trying to position line and triangle on a straight line and then rotate group to orginal angle the shape was drawn with
                        var distance = Math.sqrt(Math.pow(currentPlainLineDraw.get('x2') - currentPlainLineDraw.get('x1'), 2) + Math.pow(currentPlainLineDraw.get('y2') - currentPlainLineDraw.get('y1'), 2)); //distance between two points
                        var mainAngle = fabricCalcArrowAngle(currentPlainLineDraw.x1,currentPlainLineDraw.y1,currentPlainLineDraw.x2,currentPlainLineDraw.y2) - 90;
                        currentPlainLineDraw.set('y2', currentPlainLineDraw.get('y1'));
                        currentPlainLineDraw.set('x2', currentPlainLineDraw.get('x1') + distance);
                        currentPlainLineDraw.set('angle', mainAngle);
                        if(dx > 0 || dy > 0){
                            currentPlainLineDraw.clone((clone) => {
                                canv.remove(currentPlainLineDraw);
                                clone.set({lockScalingX: true, lockScalingY: true})
                                confClone(clone);
                            })
                        }else{
                            canv.remove(currentPlainLineDraw);
                        }
                        break;
                    case AnnotationTypes.ARROW:
                        var dx = Math.abs(currentLineDraw.left - drawStartPoint.x);
                        var dy = Math.abs(currentLineDraw.top - drawStartPoint.y);
                        console.log('arrow DX: ' + dx);
                        console.log('arrow DY: ' + dy);
                        
                        //trying to position line and triangle on a straight line and then rotate group to orginal angle the shape was drawn with
                        var distance = Math.sqrt(Math.pow(currentLineDraw.get('x2') - currentLineDraw.get('x1'), 2) + Math.pow(currentLineDraw.get('y2') - currentLineDraw.get('y1'), 2)); //distance between two points
                        var mainAngle = fabricCalcArrowAngle(currentLineDraw.x1,currentLineDraw.y1,currentLineDraw.x2,currentLineDraw.y2) - 90;
                        currentLineDraw.set('y2', currentLineDraw.get('y1'));
                        currentLineDraw.set('x2', currentLineDraw.get('x1') + distance);
                        currentTriangleDraw.set('top', currentLineDraw.get('y2') + arrowDY)
                        currentTriangleDraw.set('left', currentLineDraw.get('x2') + arrowDY)
                        var angle = fabricCalcArrowAngle(currentLineDraw.x1,currentLineDraw.y1,currentLineDraw.x2,currentLineDraw.y2);
                        currentTriangleDraw.set('angle', angle);
                        
                        if(dx > 0 || dy > 0){
                            var group = new window.fabric.Group([currentLineDraw,currentTriangleDraw],{lockScalingFlip : true,typeOfGroup : 'arrow',userLevel : 1,name:'my_ArrowGroup',type : 'arrow',originX: 'left',originY: 'center',angle: mainAngle, lockScalingY: true});
                            canv.remove(currentLineDraw);
                            canv.remove(currentTriangleDraw);
                            confClone(group);
                        }else{
                            canv.remove(currentLineDraw);
                            canv.remove(currentTriangleDraw);
                        }
                        break;
                    case AnnotationTypes.INK:
                        canv.isDrawingMode = false;
                        break;
                }
            }
        },
        'mouse:move' : function(e){
            canv.selection = false;
            //console.log('move: ' + e.pointer.y);
            //console.log('scrollY: ' + window.scrollY);
            //console.log('moveEv: ' + JSON.stringify(e))
            if(canvMouseDown && cursorMode == CursorModes.NORMAL){
                if(e.pointer.y <= window.scrollY + 1){
                    if(!scrollInterval){
                        scrollInterval = setInterval(() => {
                                            window.scroll({
                                              top: window.scrollY - 15 > 0 ? window.scrollY - 15 : 0,
                                              left: window.scrollX,
                                              behavior: 'auto'
                                            });
                                        },100)
                    }
                }else{
                    clearInterval(scrollInterval);
                    scrollInterval = null;
                }
            }else if(cursorMode == CursorModes.DRAW && selectedAnnotationType && !checkObjectStructureChange()){
                if(canvMouseDown){
                    switch (selectedAnnotationType){
                        case AnnotationTypes.RECT:
                            currentRectDraw.set({width: Math.abs(drawStartPoint.x - e.pointer.x), height: Math.abs(drawStartPoint.y - e.pointer.y)})
                            break;
                        case AnnotationTypes.ELLIPSE:
                            var rx = Math.abs(drawStartPoint.x - e.pointer.x)/2;
                            var ry = Math.abs(drawStartPoint.y - e.pointer.y)/2;
                            if (rx > currentCircleDraw.strokeWidth) {
                                rx -= currentCircleDraw.strokeWidth/2;
                            }
                            if (ry > currentCircleDraw.strokeWidth) {
                                ry -= currentCircleDraw.strokeWidth/2;
                            }
                            currentCircleDraw.set({ rx: rx, ry: ry});
                            /*if(origX > pointer.x){
                                ellipse.set({originX: 'right' });
                            } else {
                                ellipse.set({originX: 'left' });
                            }
                            if(origY > pointer.y){
                                ellipse.set({originY: 'bottom'  });
                            } else {
                                ellipse.set({originY: 'top'  });
                            }*/
                            break;
                        case AnnotationTypes.LINE:
                            currentPlainLineDraw.set({x2: e.pointer.x,y2: e.pointer.y});
                            break;
                        case AnnotationTypes.ARROW:
                            var dx = Math.abs(currentLineDraw.left - drawStartPoint.x);
                            var dy = Math.abs(currentLineDraw.top - drawStartPoint.y);
                            if(dx > 0 || dy > 0){
                                if(!currentTriangleAdded){
                                    canv.add(currentTriangleDraw);
                                    currentTriangleAdded = true;
                                }
                            }else{
                                canv.remove(currentTriangleDraw);
                                currentTriangleAdded = false;
                            }
                            currentLineDraw.set({x2: e.pointer.x,y2: e.pointer.y});
                            currentTriangleDraw.set({'left': e.pointer.x + arrowDX,'top': e.pointer.y + arrowDY,'angle': fabricCalcArrowAngle(currentLineDraw.x1,currentLineDraw.y1,currentLineDraw.x2,currentLineDraw.y2)});
                            break;
                    }
                    canv.renderAll();
                }
            }
        },
        'selection:created' : function(e){
            console.log(e);
            confClone(e.target);
            canvActiveObject = e.target;
            e.target.hoverCursor = CursorModes.MOVE;
        },
        'selection:cleared' : function(e){
            //console.log(e);
            canvActiveObject.hoverCursor = CursorModes.POINTER;
            canvActiveObject = null;
        },
        'object:moving' : function(e){
            canvObjMoving = true;
            e.target.hoverCursor = CursorModes.MOVE;
        },
        'object:moved' : function(e){
            //console.log(e);
            canvObjMoving = false;
            e.target.hoverCursor = CursorModes.POINTER;
        },
        'object:scaling' : function(e){
            //console.log(e);
            canvObjScaling = true;
        },
        'object:scaled' : function(e){
            //console.log(e);
            canvObjScaling = false;
        },
        'object:rotating' : function(e){
            console.log(e);
            canvObjRotating = true;
        },
        'object:rotated' : function(e){
            //console.log(e);
            canvObjRotating = false;
        }
    })
  
    //canv.add(rect);
    //canv.add(fabSelectorGroup);
    
    var elements = layer.querySelectorAll('span');
    
    //console.log(elements[0]);
    for(var i = 0; i < elements.length; i++){
        //console.log(elements[i]);
        var ele = elements[i];
        var top = parseFloat(ele.style.top.replace('px', '')) - 1;
        var left = parseFloat(ele.style.left.replace('px', '')) - 1;
        var fontSize = parseFloat(ele.style.fontSize.replace('px', ''));
        var fontFamily = ele.style.fontFamily.replace('px', '');
        //console.log(ele.getBoundingClientRect().width)
        var scaleXX = parseFloat((ele.getBoundingClientRect().width / ele.offsetWidth).toFixed(6));
        //console.log(top);

        //console.log(ele.innerText.trim());
        var text = new fabric.Text(ele.innerText.trim(), { top: top, left: left, fontSize: fontSize, fontFamily: fontFamily, opacity: 0});
        //  console.log('width: ' + text.width);
        //  console.log('text: ' + text.text);
        text.set('selectable', true);
        text.scaleX = scaleXX;

        
        //text.set('editable', false);
        initFabricText(text);
        canv.add(text);
    }
    
    //first sort;
    /*textOrder.sort(function(a,b){
        if(Math.ceil(a.top) - Math.ceil(b.top) == 0){
            return a.left - b.left
        }
        return a.top - b.top;
    })*/
    /*textOrder.sort(function(a,b){
        var canvHalfway = canv.width/2;
        if(a.left < canvHalfway && b.left < canvHalfway){
            return a.top - b.top;
        }else if(a.left < canvHalfway && b.left > canvHalfway){
            if(b.top < a.top){
                if(a.left + a.getScaledWidth() > canvHalfway || !checkTextBeside(b, false)){
                    return 1
                }
            }
            return -1;
        }else if(a.left > canvHalfway && b.left < canvHalfway){
            if(a.top < b.top){
                if(b.left + b.getScaledWidth() > canvHalfway || !checkTextBeside(a, false)){
                    return -1
                }
            }
            return 1;
        }else if(a.left > canvHalfway && b.left > canvHalfway){
            return a.top - b.top;
        }
    });*/
    console.log(textOrder);
}

var fabricCalcArrowAngle = function(x1, y1, x2, y2) {
        var angle = 0, x, y;
        console.log(angle);
        x = (x2 - x1);
        y = (y2 - y1);
        if (x === 0) {
            angle = (y === 0) ? 0 : (y > 0) ? Math.PI / 2 : Math.PI * 3 / 2;
        } else if (y === 0) {
            angle = (x > 0) ? 0 : Math.PI;
        } else {
            angle = (x < 0) ? Math.atan(y / x) + Math.PI :
                (y < 0) ? Math.atan(y / x) + (2 * Math.PI) : Math.atan(y / x);
        }
        console.log('angle '+ (angle * 180 / Math.PI + 90));
        return (angle * 180 / Math.PI + 90);
};
var fabricCalcLineAngle = function(fabricLine){
    var width = fabricLine.getScaledWidth();
    var height = fabricLine.getScaledHeight();
    return Math.atan2(fabricLine.height, fabricLine.width) * (180/Math.PI);
}
function confClone(clone){
    clone.hoverCursor = CursorModes.POINTER;
    canv.add(clone);
    setObjectCorners(clone);
}
function clearControls(object){
    object.set({hasControls: false, hoverCursor: CursorModes.POINTER, borderColor: 'red'})
}
function checkObjectStructureChange(){
    return canvObjMoving || canvObjRotating || canvObjScaling || canvActiveObject;
}

function setObjectCorners(obj){
    obj.set({
        borderColor: 'red',
        cornerColor: 'green',
        cornerSize: 6,
        transparentCorners: false
    });
}

function checkTextBeside(text, byRight){
    var canvHalfway = canv.width/2;
    var beside = textOrder.filter(t => {
        var sideCheck = false
        if(byRight){
            sideCheck = t.left >= canvHalfway;
        }else{
            sideCheck = t.left + t.getScaledWidth() < canvHalfway;
        }
        return sideCheck && t.top == text.top
    })
}

//function findWhiteLineBefore(text, by)

function fabClearSelect(){
    for(var i = 0; i < selectorRects.length; i++){
        canv.remove(selectorRects[i]);
    }
}

function Selector(stage, text, textInput, textBox) {
    var select = new createjs.Shape();
    var textWidth = text.getMeasuredWidth();
    var textHeight = text.getMeasuredHeight();
    var initialPosition;
    var lastPosition;
    var disableSelection;

    function selectorByPosition(initialPosition, lastPosition) {
        var selectedTextWidth = getTextWidth(text.text.substring(initialPosition,lastPosition));
        var initialX = getXByPosition(initialPosition);
        var lastX = getXByPosition(lastPosition + 1);
        select.graphics.clear().beginFill("#ace").drawRect(initialX || 0, text.y-1 || 0, lastX - initialX || 0, textHeight || 0);
      stage.update();
      
    }

    function selector(x, y, width, height) {
        select.graphics.clear().beginFill("#ace").drawRect(x || 0, y || 0, width || 0, height || 0);
    }
  
  function clearSelect(){
    select.graphics.clear();
    stage.update();
  }

    //Gets the width of the text
    function getTextWidth(t) {
      var tempText = new createjs.Text(t);
      tempText.font = text.font;
      return tempText.getMeasuredWidth();
    }

    function getPointInText(rawX) {
      var position = 0;
      var totalW = text.x;
      for(var i=0; i < text.text.length; i++) {
        totalW += getTextWidth(text.text[i]);
        if (totalW >= rawX) {
          position = i;
          break;
        }
      }
      return position;
    }

    function getXByPosition(position) {
      var totalW = text.x;
      for(var i = 0; i < position; i++) {
        totalW += getTextWidth(text.text[i]);
      }
      return totalW;
    }

    window.addEventListener('click', function() {
      //console.log("CLICK!!!");
      // if(!textInput.hasFocus) {
      //   console.log("NO FOCUS");
      // }

    }, false);

    text.addEventListener("mousedown", function (e) {
        var startX = e.rawX;
        var onMove = function (e) {
            clearSelect();
          if (e.rawX >= text.x && e.rawX <= text.x + textWidth) {
            initialPosition = getPointInText(startX);
            lastPosition = getPointInText(e.rawX);
            if(initialPosition > lastPosition) {
              var temp = initialPosition;
              initialPosition = lastPosition;
              lastPosition = temp;
            }
            selectorByPosition(initialPosition, lastPosition);
          }
        };
        var onUp = function () {
            stage.removeEventListener("stagemousemove", onMove);
            selectorByPosition(initialPosition, lastPosition);
            //textInput.value = text.text.substring(initialPosition, lastPosition+1);
            // textInput.focus();
            // textInput.select();
        };

        stage.addEventListener("stagemousemove", onMove);
        stage.addEventListener("stagemouseup", onUp);
    });

    return select;
}



function FabricSelector(stage, text, textInput, textBox) {
    var select = new createjs.Shape();
    var textWidth = text.getMeasuredWidth();
    var textHeight = text.getMeasuredHeight();
    var initialPosition;
    var lastPosition;
    var disableSelection;

    function selectorByPosition(initialPosition, lastPosition) {
        var selectedTextWidth = getTextWidth(text.text.substring(initialPosition,lastPosition));
        var initialX = getXByPosition(initialPosition);
        var lastX = getXByPosition(lastPosition + 1);
        select.graphics.clear().beginFill("#ace").drawRect(initialX || 0, text.y-1 || 0, lastX - initialX || 0, textHeight || 0);
      stage.update();
      
    }

    function selector(x, y, width, height) {
        select.graphics.clear().beginFill("#ace").drawRect(x || 0, y || 0, width || 0, height || 0);
    }
  
  function clearSelect(){
    select.graphics.clear();
    stage.update();
  }

    //Gets the width of the text
    function getTextWidth(t) {
      var tempText = new fabric.Text(t, {fontSize: text.fontSize, fontFamily: text.fontFamily});
      //tempText.font = text.font;
      return tempText.width;
    }

    function getPointInText(rawX) {
      var position = 0;
      var totalW = text.left;
      for(var i=0; i < text.text.length; i++) {
        totalW += getTextWidth(text.text[i]);
        if (totalW >= rawX) {
          position = i;
          break;
        }
      }
      return position;
    }

    function getXByPosition(position) {
      var totalW = text.left;
      for(var i = 0; i < position; i++) {
        totalW += getTextWidth(text.text[i]);
      }
      return totalW;
    }

    window.addEventListener('click', function() {
      //console.log("CLICK!!!");
      // if(!textInput.hasFocus) {
      //   console.log("NO FOCUS");
      // }

    }, false);

    text.addEventListener("mousedown", function (e) {
        var startX = e.rawX;
        var onMove = function (e) {
            clearSelect();
          if (e.rawX >= text.x && e.rawX <= text.x + textWidth) {
            initialPosition = getPointInText(startX);
            lastPosition = getPointInText(e.rawX);
            if(initialPosition > lastPosition) {
              var temp = initialPosition;
              initialPosition = lastPosition;
              lastPosition = temp;
            }
            selectorByPosition(initialPosition, lastPosition);
          }
        };
        var onUp = function () {
            stage.removeEventListener("stagemousemove", onMove);
            selectorByPosition(initialPosition, lastPosition);
            //textInput.value = text.text.substring(initialPosition, lastPosition+1);
            // textInput.focus();
            // textInput.select();
        };

        stage.addEventListener("stagemousemove", onMove);
        stage.addEventListener("stagemouseup", onUp);
    });
    
    

    return select;
}

var firstDragText;
var lastDragText;
var selectionDirection = true; //true - downward; false - upward
const LINE_PADDING = 20;
var selectedRects = []
function initFabricText(text){
    var textWidth = text.getScaledWidth() - 0;
    var textHeight = text.getScaledHeight();
    var fabSelectorRect = new fabric.Rect({fill: '#ace', opacity: 0.5 });
    var fabHighlighterRect = new fabric.Rect({fill: '#fc3', opacity: 0.5, rx: 5, ry:5 });
    var fabTextUnderline = new fabric.Line({fill: DefaultObjectColor.UNDERLINE});
    var fabStrikeOutLine = new fabric.Line({fill: DefaultObjectColor.STRIKE});
    var fabSquigglyLine = new fabric.Line({fill: DefaultObjectColor.UNDERLINE});
    var initialPosition;
    var lastPosition;
    var moveEvent;
    
    //console.log('text left ' + text.left);
    //console.log('text width ' + textWidth);
    
    
    fabSelectorRect.set('selectable', false);
    fabSelectorRect.hoverCursor = 'normal';
    selectorRects.push(fabSelectorRect);
    
    fabSelectorRect.uuid = generateUUID();
    
    text.orderIndex = textOrder.length;
    text.annotHighlight = fabHighlighterRect;
    text.annotStrike = fabStrikeOutLine;
    text.annotUnderline = fabTextUnderline;
    textOrder.push({text: text, rect: fabSelectorRect});
    
    text.hoverCursor = 'text';
    text.set('selectable', false);
    text.on({
        'mousedown': function(e){
            //console.log(e);
            text.hoverCursor = cursorMode;
            if(cursorMode == CursorModes.NORMAL){
                text.hoverCursor = 'text'
                selectorStartX = e.pointer.x;
                selectorStartY = text.top;
                firstDragText = text;
                //console.log(selectorStartY);
                fabCanvasTextMouseDown = true;
            }
        }
    })
    
    var onMove = function(e){
        text.hoverCursor = cursorMode;
        if(cursorMode == CursorModes.NORMAL){
            text.hoverCursor = CursorModes.TEXT;
            if(fabCanvasTextMouseDown){
                //console.log(e.pointer.x);
                if(e.pointer.y < selectorStartY - 4 && firstDragText == text){
                    selectionDirection = false;
                    var widt = ((selectorStartX) - text.left);
                    console.log('widt: '+ text.text)
                    selector(text.left, text.top, widt, textHeight)
                }else if((text.top + textHeight < selectorStartY || text.top < selectorStartY) && e.pointer.y < selectorStartY){
                    //console.log('upwards: ' + text.text)
                    //when selecting text upwards from a startpoint
                    if(e.pointer.y < text.top && e.pointer.y < selectorStartY && (e.pointer.x >= text.left && e.pointer.x <= text.left + textWidth)){
                        //console.log('passed!!! ' + text.text)
                        //select the whole text after line is passed; upwardds
                        selector(text.left, text.top, textWidth, textHeight)
                    }else if(e.pointer.y < text.top + textHeight && e.pointer.y < selectorStartY && (e.pointer.y > text.top) && e.pointer.x >= text.left &&  e.pointer.x <= text.left + textWidth){
                        //select a portion of the text; backwards because it goes upwards
                        lastDragText = text;
                        if(firstDragText.orderIndex < text.orderIndex || lastDragText.orderIndex > text.orderIndex){
                            canv.remove(fabSelectorRect);
                            removeSelectedRect(fabSelectorRect);
                            return;
                        }
                        var widt = (text.left + textWidth) - e.pointer.x;
                        console.log('hover up')
                        selector(e.pointer.x, text.top, widt, textHeight)
                        selectAllInRange(text, firstDragText);
                    }else{
                        //console.log('clearer');
                        if(!lastDragText){
                            return;
                        }
                        //console.log('clearing');
                        if(firstDragText.orderIndex < text.orderIndex || lastDragText.orderIndex > text.orderIndex){
                            canv.remove(fabSelectorRect);
                            removeSelectedRect(fabSelectorRect);
                            //console.log('remove: ' + text.text);
                        }
                    }
                }else if(firstDragText == text){
                    selectionDirection = true;
                    //when cursor is on the line the drag started from and for the line the drag was started from
                    //check to find out when cursor goes below line drag was started from; if it does highlight the whole line(textWidth)
                    //if it doesnt, check if drag is forwards or backwards.. and do neccessary calc
                    var widt = text.top + textHeight < e.pointer.y ? textWidth : e.pointer.x < selectorStartX ? (selectorStartX - e.pointer.x) : (e.pointer.x - text.left);
                    var initX = e.pointer.x < selectorStartX ? e.pointer.x : selectorStartX;
                    console.log('widt3')
                    selector(initX, text.top, widt, textHeight);
                }
                /*else if(text.top + textHeight >= selectorStartY && e.pointer.y > text.top && e.pointer.y > selectorStartY && e.pointer.x > text.left){
                    //select all on line.
                    console.log('all select')
                    selector(text.left, text.top, textWidth, textHeight)
                }*/
                else if ((e.pointer.x >= text.left - LINE_PADDING && e.pointer.x <= text.left + textWidth + LINE_PADDING) && (e.pointer.y >= text.top && e.pointer.y <= text.top + textHeight)) {
                    console.log('hover down ' + text.text)
                    var initX = selectorStartY == text.top ? selectorStartX : text.left
                    initialPosition = getPointInText(initX);
                    lastPosition = getPointInText(e.pointer.x);
                    if(initialPosition > lastPosition) {
                      var temp = initialPosition;
                      initialPosition = lastPosition;
                      lastPosition = temp;
                    }
                    lastDragText = text;

                    var widt = e.pointer.x - text.left;
                    //var widt = e.pointer.x - text.left > textWidth ? textWidth : e.pointer.x - text.left;
                    selector(text.left, text.top, widt, textHeight);
                    //selectorByPosition(initialPosition, lastPosition);
                    selectAllInRange(firstDragText, text);
                }else{
                    if(!lastDragText){
                        return;
                    }
                    if(lastDragText == text){
                        canv.remove(fabSelectorRect);
                        removeSelectedRect(fabSelectorRect);
                        return;
                    }
                    var check = selectionDirection ? (firstDragText.orderIndex > text.orderIndex || lastDragText.orderIndex < text.orderIndex) : (firstDragText.orderIndex < text.orderIndex || lastDragText.orderIndex > text.orderIndex)
                    //console.log('check: '+ text.text);
                    if(check){
                        canv.remove(fabSelectorRect);
                        removeSelectedRect(fabSelectorRect);
                        //console.log('remove: ' + text.text);
                    }
                }
            }else{
                if(canvMouseDown && (e.pointer.x >= text.left - LINE_PADDING && e.pointer.x <= text.left + textWidth + LINE_PADDING) && (e.pointer.y >= text.top && e.pointer.y <= text.top + textHeight)){
                    firstDragText = text;
                    selectorStartX = e.pointer.x;
                    selectorStartY = text.top;
                    fabCanvasTextMouseDown = true;
                }
            }
        }
    }
    canv.on({
        'mouse:move' : onMove
    })
    
    function selectAllInRange(afterText, beforeText){
        if(!afterText || !beforeText){
            return;
        }
        //console.log('afterText index: ' + afterText.orderIndex);
        //console.log('beforeText index: '+ beforeText.orderIndex);

        var indexes = [];
        if(afterText.orderIndex <= beforeText.orderIndex){
            for(var i = afterText.orderIndex + 1; i < beforeText.orderIndex; i++){
                var txt = textOrder[i].text;
                selector(txt.left, txt.top, txt.getScaledWidth(), txt.getScaledHeight(), txt, textOrder[i].rect);
                //console.log('selected: ' + txt.text)
                //indexes.push(i);
            }
        }else{
            for(var i = afterText.orderIndex; i < beforeText.orderIndex - 1; i--){
                var txt = textOrder[i].text;
                selector(txt.left, txt.top, txt.getScaledWidth(), txt.getScaledHeight(), txt, textOrder[i].rect);
                //console.log('selected: ' + txt.text)
                //indexes.push(i);
            }
        }
        //console.log(indexes.join(','));
        
        
    }
    
    function getPointInText(rawX) {
      var position = 0;
      var totalW = text.left;
      for(var i=0; i < text.text.length; i++) {
        totalW += getTextWidth(text.text[i]);
        if (totalW >= rawX) {
          position = i;
          break;
        }
      }
      return position;
    }
    
    function getTextWidth(t) {
      var tempText = new fabric.Text(t, {fontSize: text.fontSize, fontFamily: text.fontFamily});
      //tempText.font = text.font;
      return tempText.getScaledWidth();
    }
    
    function getXByPosition(position) {
      var totalW = text.left;
      for(var i = 0; i < position; i++) {
        totalW += getTextWidth(text.text[i]);
      }
      return totalW;
    }
    
    function selectorByPosition(initialPosition, lastPosition) {
        var selectedTextWidth = getTextWidth(text.text.substring(initialPosition,lastPosition));
        var initialX = getXByPosition(initialPosition);
        var lastX = getXByPosition(lastPosition + 1);
        //console.log("draw: " + JSON.stringify({fill: '#ace', opacity: 0.5, left: initialX || 0, top: text.top-1 || 0, width: lastX - initialX || 0, height: textHeight || 0}));
        fabSelectorGroup.remove(fabSelectorRect);
        canv.remove(fabSelectorRect);
        //fabSelectorRect = new fabric.Rect({fill: '#ace', opacity: 0.5, left: initialX || 0, top: text.top-1 || 0, width: lastX - initialX || 0, height: textHeight || 0});
        fabSelectorRect.setOptions({fill: '#ace', opacity: 0.5, left: initialX || 0, top: text.top-1 || 0, width: lastX - initialX || 0, height: textHeight || 0})

        canv.add(fabSelectorRect);
    }
    
    function selector(x, y, width, height, txt, rect) {
        var selRect = rect ? rect : fabSelectorRect;
        var _text = txt ? txt : text;
        //console.log(width)
        x = x < _text.left ? _text.left : x;
        var initX = getXByPosition(getPointInText(x));
        var lastX = getXByPosition(getPointInText(x + width));
        width = x + width > _text.left + _text.getScaledWidth() ? (_text.left + _text.getScaledWidth()) - x : width;
        //width = lastX - initX;
        //console.log(width)
//        var textAnnot;
//        if(selectedAnnotationType == AnnotationTypes.HIGHLIGHT){
//            _text.annotHighlight.setOptions({opacity: 0.5, left: x || 0, top: y - 1 || 0, width: width || 0, height: height || 0})
//            textAnnot = _text.annotHighlight;
//        }else if(selectedAnnotationType == AnnotationTypes.UNDERLINE){
//            _text.annotUnderline.setOptions({left: x || 0, top: y - 1 || 0, width: width || 0, height: height || 0})
//            textAnnot = fabTextUnderline;
//        }else if(selectedAnnotationType == AnnotationTypes.STRIKE){
//            textAnnot = fabStrikeOutLine;
//        }
        
        canv.remove(selRect);
        removeSelectedRect(selRect);
        selRect.setOptions({fill: '#ace', opacity: 0.5, left: x || 0, top: y - 1 || 0, width: width || 0, height: height || 0})
//        if(textAnnot){
//            removeTextAnnotation(textAnnot);
//            textAnnotations.push(textAnnot);
//        }
        
        canv.add(selRect);
        selectedRects.push(selRect);
        
        console.log(_text.text + ' - top: '+ (y - 1) + JSON.stringify(fabHighlighterRect))
    }
    
}

function removeTextAnnotation(value){
    textAnnotations = textAnnotations.filter((val) => {
        return val.uuid != value.uuid;
    })
}

function removeSelectedRect(value){
    selectedRects = selectedRects.filter((val) => {
        return val.uuid != value.uuid;
    })
}

function addTextAnnotations(){
    var txtAnnots = [];
    var selAnnot = selectedAnnotationType;
    selectedRects.forEach((r) => {
//        h.clone((clone) => {
//            highs.push(clone)
//            //canv.add(clone)
//        });
        if(selAnnot == AnnotationTypes.HIGHLIGHT){
            var highlight = new fabric.Rect({fill: DefaultObjectColor.HIGHLIGHT, opacity: 0.4, rx: 5, ry:5, left: r.get('left'), top: r.get('top'), width: r.get('width'), height: r.get('height') });
            txtAnnots.push(highlight);
        }else if(selAnnot == AnnotationTypes.UNDERLINE){
            var underline = new fabric.Line([r.get('left'), r.get('top') + r.get('height') - 1, r.get('left') + r.get('width'), r.get('top') + r.get('height') - 1], {stroke: DefaultObjectColor.UNDERLINE, fill: DefaultObjectColor.UNDERLINE});
            txtAnnots.push(underline);
        }else if(selAnnot == AnnotationTypes.STRIKE){
            var strike = new fabric.Line([r.get('left'), r.get('top') + (r.get('height')/2)+1, r.get('left') + r.get('width'), r.get('top') + (r.get('height')/2)+1], {stroke: DefaultObjectColor.STRIKE, fill: DefaultObjectColor.STRIKE});
            txtAnnots.push(strike);
        }
    });
    console.log(txtAnnots);
    var groupTextAnnotations = new fabric.Group(txtAnnots, {lockScalingY: true, lockScalingX: true, selectable: false});
    canv.add(groupTextAnnotations);
    selectedRects = [];
    fabClearSelect();
}

function generateUUID(){
    var d = new Date().getTime();
    if(window.performance && typeof window.performance.now === "function"){
        d += performance.now(); //use high-precision timer if available
    }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

Array.prototype.remove = function(value){
    return this.filter((ele) => {
        return ele != value;
    })
}