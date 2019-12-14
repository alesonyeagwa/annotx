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
    NOTE: {fill: 'yellow'},
    STAMP: {opacity: 1}
}
//var canv;
var pageCanvs = [];
var canvObjMoving = false;
var canvObjScaling = false;
var canvObjRotating = false;
var canvActiveObject = null;
var fabCanvasTextMouseDown = false;
var fabSelectorRect = new fabric.Rect({fill: '#ace', opacity: 0.5 });
var fabSelectorGroup = new fabric.Group();
var selectorStartX = 0;
var selectorStartY = 0;
//var selectorRects = [];
var textOrder = [];
var canvMouseDown = false;
var scrollInterval = null;
var cursorMode = CursorModes.DRAW; //cursor mode for viewer
var selectedAnnotationType = AnnotationTypes.STAMP;
var selectedFillColor = 'red';
var selectedStrokeColor = 'red';
var notePath = "M 2.1242662,289.72563 H 17.199746 17.115296 M 2.0609236,287.66067 H 13.715916 13.650626 M 7.4872517,285.97573 H 17.11529 17.061357 M 2.2298365,284.10076 h 9.7547225 -0.05464 m -0.483762,-1.87492 h 5.785268 -0.0324 M 2.1348231,280.35091 H 17.210302 17.125851 M 0.99440816,277.90215 c -0.51469605,0 -0.9275221,0.4131 -0.9275221,0.92758 v 12.45753 c 0,0.51471 0.41282596,0.93015 0.9275221,0.93015 H 1.9950871 l -0.2847884,2.39063 2.0353238,-2.39063 H 18.055591 c 0.514696,0 0.927523,-0.4158 0.927523,-0.93015 v -12.45753 c 0,-0.51471 -0.412821,-0.92758 -0.927523,-0.92758 z";

var stampFileTypes = ['image/jpg', 'image/jpeg', 'image/png'];

var textAnnotations = [];

function init(){
    var layers = document.getElementsByClassName('textLayer');
    if(layers.length > 0){
        textOrder = [];
        pageCanvs = [];
        for(var p = 0; p < layers.length; p++){
            convertToFabricText(layers[p]);
        }
    }
}


function convertToFabricText(layer){
    
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
    
    var canv = new fabric.Canvas(_pageID);
    
    
    
    canv.hoverCursor = cursorMode;
    canv.selectorRects = [];
    
    var drawStartPoint = {x: 0, y: 0};
    
    var currentRectDraw, currentCircleDraw, currentPlainLineDraw, currentLineDraw, currentTriangleDraw, currentNoteDraw, arrowDX, arrowDY, currentTriangleAdded = false;
    
    
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
                    case AnnotationTypes.STAMP:
                        var input = document.createElement('input');
                        input.style.position = 'absolute';
                        input.style.top = '1000px';
                        input.style.left = '-1000px';
                        input.style.opacity = 0.5;
                        input.setAttribute('type', 'file');
                        input.setAttribute('accept', 'image/png,image/jpg,image/jpeg');
                        document.body.appendChild(input);
                        input.onchange = function(e){
                            if(input.files.length == 1){
                                if(stampFileTypes.indexOf(input.files[0].type) >= 0){
                                    var reader = new FileReader();
                                    reader.readAsDataURL(input.files[0])
                                    reader.onload = function(e){
                                        fabric.Image.fromURL(reader.result, function(oImg) {
                                            var imgWidth = oImg.getScaledWidth();
                                            var imgHeight = oImg.getScaledHeight();
                                            var imgRatio = imgWidth/imgHeight;
                                            var scale = 1;
                                            var left = drawStartPoint.x - (imgWidth)/2;
                                            var top = drawStartPoint.y - (imgHeight)/2;
                                            if(imgWidth > canv.width){
                                                scale = 1/(imgWidth/canv.width);
                                                left = 0;
                                                top = drawStartPoint.y - (scale * imgHeight)/2;
                                                if((scale * imgHeight) > canv.height){
                                                    scale = 1/(imgHeight/canv.height);
                                                    top = 0;
                                                    left = drawStartPoint.x - (scale * imgWidth)/2;
                                                }
                                            }else if(imgHeight > canv.height){
                                                scale = 1/(imgHeight/canv.height);
                                                top = 0;
                                                left = drawStartPoint.x - (scale * imgWidth)/2;
                                            }
                                            oImg.scale(scale);

                                            oImg.set({left: left, top: top, opacity: DefaultObjectColor.STAMP.opacity});
                                            restrictObjectBounds(oImg);

                                            canv.add(oImg);
                                        });
                                        document.body.removeChild(input);
                                    }
                                }
                            }else{
                               document.body.removeChild(input);
                            }
                        }
                        input.click();
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
            //console.log(e);
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
            //console.log(e);
            e.target.hoverCursor = CursorModes.MOVE;
            restrictObjectBounds(e.target);
        },
        'object:moved' : function(e){
            //console.log(e);
            canvObjMoving = false;
            e.target.hoverCursor = CursorModes.POINTER;
        },
        'object:scaling' : function(e){
            //console.log(e);
            canvObjScaling = true;
            
            restrictObjectBounds(e.target);
        },
        'object:scaled' : function(e){
            //console.log(e);
            canvObjScaling = false;
            
            restrictObjectBounds(e.target);
        },
        'object:rotating' : function(e){
            //console.log(e);
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
    
    pageCanvs.push(canv);
    
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

        text.canvId = pageCanvs.length - 1;
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
    
    function restrictObjectBounds(obj){
        var objWidth = obj.getScaledWidth();
        var objHeight = obj.getScaledHeight()
        var canvWidth = canv.width;
        var canvHeight = canv.height;
        if(obj.left < 0){
            obj.left = 0;
        }else if(obj.left + objWidth > canvWidth){
            obj.left = canvWidth - objWidth;
        }
        if(obj.top < 0){
            obj.top = 0;
        }else if(obj.top + objHeight > canvHeight){
            obj.top = canvHeight - objHeight;
        }
    }
    
    function confClone(clone){
        clone.hoverCursor = CursorModes.POINTER;
        canv.add(clone);
        setObjectCorners(clone);
    }
    
    function addTextAnnotations(){
        var txtAnnots = [];
        var selAnnot = selectedAnnotationType;
        selectedRects.forEach((r) => {
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
}