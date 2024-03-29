// var AnnotX = {
//     loadAnnotations: 
// };
if (!String.prototype.format) {
    String.prototype.format = function() {
      var args = arguments;
      return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined'
          ? args[number]
          : match
        ;
      });
    };
}



var init = function () {
    var AnnotationEvents = {
        OBJECTADDED: 'objectAdded',
        OBJECTMODIFIED: 'objectModified',
        OBJECTREMOVED: 'objectRemoved',
        COMMENTEDITED: 'commentEdited',
        REPLYADDED: 'replyAdded',
        REPLYEDITED: 'replyEdited',
        REPLYREMOVED: 'replyRemoved'
    }
    var CursorModes = {
        DEFAULT: 'default',
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
        INK: 'ink',
        SIGNATURE: 'signature'
    }
    var AnnotationsConfig = {
        RECT: {
            fill: 'purple',
            stroke: '',
            opacity: 1,
            icon: '',
            strokeWidth: 0
        },
        ELLIPSE: {
            fill: 'orange',
            stroke: '',
            opacity: 1,
            icon: '',
            strokeWidth: 0
        },
        LINE: {
            stroke: 'black',
            opacity: 1,
            icon: '',
            strokeWidth: 2
        },
        HIGHLIGHT: {
            fill: '#fc3',
            icon: ''
        },
        UNDERLINE: {
            stroke: 'black',
            opacity: 1,
            icon: ''
        },
        STRIKE: {
            stroke: 'red',
            opacity: 1,
            icon: ''
        },
        LINK: 'blue',
        TEXT: {
            fill: 'transparent',
            //stroke: '',
            fontColor: 'black',
            fontSize: 12,
            opacity: 1,
            //strokeWidth: 1,
            icon: ''
        },
        ARROW: {
            stroke: 'green',
            opacity: 1,
            strokeWidth: 2,
            icon: ''
        },
        INK: {
            stroke: '#005E7A',
            opacity: 1,
            strokeWidth: 15,
            icon: ''
        },
        NOTE: {
            fill: 'yellow',
            icon: '',
            opacity: 1
        },
        STAMP: {
            opacity: 1,
            icon: ''
        },
        SIGNATURE: {
            icon: '',
            stroke: 'black',
            opacity: 1,
            strokeWidth: 2,
        }
    }
    //var canv;
    var pageCanvs = [];
    var pageAnnotations = [];
    var donePages = [];
    var pageCanvsMaps = [];
    var renderedPages = [];
    var canvObjMoving = false;
    var canvObjScaling = false;
    var canvObjRotating = false;
    var canvActiveObject = null;
    var fabCanvasTextMouseDown = false;
    var fabSelectorRect = new fabric.Rect({
        fill: '#ace',
        opacity: 0.5
    });
    var fabSelectorGroup = new fabric.Group();
    var selectorStartX = 0;
    var selectorStartY = 0;
    //var selectorRects = [];
    var textOrder = [];
    var canvMouseDown = false;
    var scrollInterval = null;
    this.cursorMode = CursorModes.NORMAL; //cursor mode for viewer
    this.selectedAnnotationType = AnnotationTypes.NONE;
    var selectedFillColor = 'red';
    var selectedStrokeColor = 'red';
    var notePath = "m 20.677967,8.54499 c -7.342801,0 -13.295293,4.954293 -13.295293,11.065751 0,2.088793 0.3647173,3.484376 1.575539,5.150563 L 6.0267418,31.45501 13.560595,29.011117 c 2.221262,1.387962 4.125932,1.665377 7.117372,1.665377 7.3428,0 13.295291,-4.954295 13.295291,-11.065753 0,-6.111458 -5.952491,-11.065751 -13.295291,-11.065751 z M 3.119915,3.119915 h 33.76017 v 33.76017 H 3.119915 Z";

    var stampFileTypes = ['image/jpg', 'image/jpeg', 'image/png'];

    var textAnnotations = [];

    var canvasScale = 1;
    var orginalPageDimensions = {width: 0, height: 0};
    var originalOrientation = 'potrait';
    var currentPagesRotationAngle = 0;
    var lastPagesRotationAngle = 0;
    var currentPagesRotationDegrees = 0;
    var rotateDirection = 1;
    var canvasCenter // center of canvas
    var signatureCanvas = null;
    var currentSignature = null;
    var addedCurrentSignature = false;
    var deleteAnnotationButton = null;

    var annotData = {author: {id: '0', name:'Guest'}, docId: '0', annotations: []};
    if(gup('data')){
        annotData = JSON.parse(atob(gup('data')));
    }
    var author = annotData && annotData.author ? annotData.author : {id: '0', name: 'Guest'};

    

    //var pageRotationAngle = 0;

    function getElementTransform (el, transform){
        var st = window.getComputedStyle(el, null);
        var tm = st.getPropertyValue("-webkit-transform") ||
                st.getPropertyValue("-moz-transform") ||
                st.getPropertyValue("-ms-transform") ||
                st.getPropertyValue("-o-transform") ||
                st.getPropertyValue("transform") ||
                "none";
        if (tm != "none") {
            var values = tm.split('(')[1].split(')')[0].split(',');
            var a = values[0];
            var b = values[1];
            switch (transform) {
                case 'scale':
                    return Math.sqrt(a*a + b*b);
                case 'rotate':
                    var angle = Math.round(Math.atan2(b,a) * (180/Math.PI));
                    return (angle < 0 ? angle + 360 : angle); 
                default:
                    break;
            }
        }
        if(transform == 'scale'){
            return 1;
        }else if(transform == 'rotate'){
            return 0;
        }
        return 0;
    }

    var cwRotateListener = function(e){
        lastPagesRotationAngle = currentPagesRotationAngle;
        currentPagesRotationAngle = PDFViewerApplication.pdfViewer.pagesRotation;
        currentPagesRotationDegrees += currentPagesRotationAngle;
        currentPagesRotationDegrees = currentPagesRotationDegrees > 270 ? 0 : currentPagesRotationDegrees;
        rotateDirection = 1;
    }
    var ccwRotateListener = function(e){
        lastPagesRotationAngle = currentPagesRotationAngle;
        currentPagesRotationAngle = PDFViewerApplication.pdfViewer.pagesRotation;
        currentPagesRotationDegrees += currentPagesRotationAngle;
        currentPagesRotationDegrees = currentPagesRotationDegrees < 0 ? 270 : currentPagesRotationDegrees;
        rotateDirection = -1;
    }

    document.addEventListener('page-rotatecw', cwRotateListener);
    document.addEventListener('page-rotateccw', ccwRotateListener);

    

    document.addEventListener('text-rendered', function (event) {
        if (donePages.length == 0) {
            initAnnotActions();
            initAnnotationsList();
            initAnnotationsProps();
            initSignatureCanvas();
            var _layer = document.querySelector(".page[data-page-number='" + event.detail.pageNumber + "'] .textLayer");
            var _lWidth = parseFloat(_layer.style.width.replace('px', ''));
            var _lHeight = parseFloat(_layer.style.height.replace('px', ''));
            orginalPageDimensions.width = _lWidth;
            orginalPageDimensions.height = _lHeight;
            originalOrientation = _lHeight > _lWidth ? 'portrait':'landscape';
            lastPagesRotationAngle = PDFViewerApplication.pdfViewer.pagesRotation;
            currentPagesRotationAngle = lastPagesRotationAngle;
            if(currentPagesRotationAngle == 0 || currentPagesRotationAngle == 180){
                canvasCenter = new fabric.Point(_lWidth / 2, _lHeight / 2)
            }else{
                canvasCenter = new fabric.Point(_lHeight / 2, _lWidth / 2)
            }
        }

        if (donePages.indexOf(event.detail.pageNumber) >= 0) {
            var findCanv = pageCanvs.find((pc) => {
                return pc.pageNumber == event.detail.pageNumber;
            })
            var parentNode = document.querySelector(".page[data-page-number='" + findCanv.pageNumber + "']")
            if (parentNode) {
                var containerExists = false
                if ('contains' in parentNode) {
                    containerExists = parentNode.contains(findCanv.container);
                } else {
                    containerExists = parentNode.compareDocumentPosition(findCanv.container) % 16;
                }
                if (!containerExists) {
                    parentNode.append(findCanv.container);
                }
                var layer = parentNode.querySelector(".textLayer");
                var lWidth = parseFloat(layer.style.width.replace('px', ''));
                var lHeight = parseFloat(layer.style.height.replace('px', ''))

                var orientation =  lHeight > lWidth ? 'portrait':'landscape';
                
                var ratio = [lWidth/findCanv.canv.width, lHeight/findCanv.canv.height];
                //console.log( "ratios:", ratio );
                scaleMultiplier = orientation == 'portrait' ? ratio[0] : ratio[1];

                var rotated = false;
                if(findCanv.canv.width == lHeight && findCanv.canv.height){
                    //page was rotated, no need to scale
                    rotated = true;
                    scaleMultiplier = 1;
                    //console.log('Rotate Angle: ' + PDFViewerApplication.pdfViewer.pagesRotation);
                    var _angle = PDFViewerApplication.pdfViewer.pagesRotation;
                    if(_angle != currentPagesRotationAngle){
                        lastPagesRotationAngle = currentPagesRotationAngle;
                    }
                    currentPagesRotationAngle = PDFViewerApplication.pdfViewer.pagesRotation;
                }
                canvasScale = canvasScale * scaleMultiplier;

                findCanv.container.style.width = layer.style.width;
                findCanv.container.style.height = layer.style.height;
                
                if(currentPagesRotationAngle == 0 || currentPagesRotationAngle == 180){
                    canvasCenter = new fabric.Point(lWidth / 2, lHeight / 2)
                }else{
                    canvasCenter = new fabric.Point(lHeight / 2, lWidth / 2)
                }

                var objects = findCanv.canv.getObjects();
                AnnotationsConfig.INK.strokeWidth *= canvasScale;
                findCanv.canv.freeDrawingBrush.width = AnnotationsConfig.INK.strokeWidth;

                degrees = PDFViewerApplication.pdfViewer.pagesRotation;
                //console.log("cwid: " + findCanv.canv.getWidth());
                //console.log("lwidth "+ lWidth);
                let radians = fabric.util.degreesToRadians(degrees)

                var cWidth = findCanv.canv.getWidth();
                var cHeight = findCanv.canv.getHeight();
                var xDiff, yDiff = 0;

                findCanv.canv.setDimensions({width:lWidth, height:lHeight});
                
                var cRotation = rotateDirection * 90;;
                if(currentPagesRotationAngle == 90 || currentPagesRotationAngle == 270){
                    xDiff = (lWidth - cWidth)/2
                    yDiff = (lHeight - cHeight)/2
                    
                }else{
                    xDiff = rotateDirection * (lWidth - cWidth)/2
                    yDiff = rotateDirection * (cHeight - lHeight)/2
                }

                findCanv.canv.getObjects().forEach((obj) => {
                    var scaleX = obj.scaleX;
                    var scaleY = obj.scaleY;
                    var left = obj.left;
                    var top = obj.top;
                    
                    var tempScaleX =  scaleX * scaleMultiplier;
                    var tempScaleY =  scaleY * scaleMultiplier;
                    var tempLeft = left * scaleMultiplier;
                    var tempTop = top * scaleMultiplier;

                    obj.scaleX = tempScaleX;
                    obj.scaleY = tempScaleY;
                    obj.left = tempLeft;
                    obj.top = tempTop;

                    if(rotated){
                        var objectOrigin = new fabric.Point(obj.left, obj.top);
                        rads = fabric.util.degreesToRadians(cRotation)
                        var new_loc = fabric.util.rotatePoint(objectOrigin, canvasCenter, rads);
                        obj.top = new_loc.y + yDiff;
                        obj.left = new_loc.x + xDiff;
                        obj.angle += cRotation; //rotate each object buy the same angle
                    }
                    obj.setCoords();
                    findCanv.canv.requestRenderAll();
                });

                findCanv.canv.requestRenderAll();
                findCanv.canv.calcOffset();
            }
        } else {
            donePages.push(event.detail.pageNumber)
            init(event.detail.pageNumber);
        }
    }, true);

    var init = function (pageNum) {
        // var layers = document.getElementsByClassName('textLayer');
        // if(layers.length > 0){
        //     var currentPage
        //     //textOrder = [];
        //     //pageCanvs = [];
        //     for(var p = 0; p < layers.length; p++){
        //         convertToFabricText(layers[p]);
        //     }
        // }

        var layer = document.querySelector(".page[data-page-number='" + pageNum + "'] .textLayer");
        convertToFabricText(layer);
    }

    function convertToFabricText(layer) {

        //Set up interaction canvas for annotations
        //var layer = document.getElementById('textLayer');
        var pageNumber = parseInt(layer.parentNode.getAttribute('data-page-number'));
        var findCanv = pageCanvs.find((pc) => {
            return pc.pageNumber == event.detail.pageNumber;
        })
        if (findCanv) {
            return;
        }
        console.log('index' + donePages.indexOf(pageNumber));
        var _pageCanvas = document.createElement('canvas');
        var _pageID = generateUUID();
        _pageCanvas.setAttribute('id', _pageID);
        _pageCanvas.classList.add('canv' + pageNumber);
        _pageCanvas.setAttribute('width', layer.style.width);
        _pageCanvas.setAttribute('height', layer.style.height);
        _pageCanvas.style.top = 0;
        _pageCanvas.style.left = 0;
        layer.parentNode.insertBefore(_pageCanvas, layer.nextSibling);

        var canv = new fabric.Canvas(_pageID);

        var realCanv = document.getElementById(_pageID);

        pageCanvs.push({
            pageNumber: pageNumber,
            canv: canv,
            container: realCanv.parentNode,
            pageID: _pageID
        });

        canv.hoverCursor = cursorMode;
        canv.selectorRects = [];

        var drawStartPoint = {
            x: 0,
            y: 0
        };

        var currentRectDraw, currentCircleDraw, currentPlainLineDraw, currentLineDraw, currentTriangleDraw, currentNoteDraw, arrowDX, arrowDY, currentTriangleAdded = false;


        var rect = new fabric.Rect({
            left: 100,
            top: 100,
            fill: 'red',
            width: 20,
            height: 20
        });

       

        if (selectedAnnotationType == AnnotationTypes.INK && cursorMode == CursorModes.DRAW) {
            canv.isDrawingMode = true;
            canv.freeDrawingBrush.color = AnnotationsConfig.INK.stroke;
            canv.freeDrawingBrush.width = AnnotationsConfig.INK.strokeWidth;
        }

        canv.on({
            'mouse:down': function (e) {
                //console.log("down");
                canvMouseDown = true;
                fabClearSelect();
                //canv.remove(fabSelectorGroup);
                //fabCanvasTextMouseDown = true;
                //            if(cursorMode == CursorModes.NORMAL && selectedAnnotationType == AnnotationTypes.HIGHLIGHT){
                //                highlighters = [];
                //            }
                if (cursorMode == CursorModes.DRAW && selectedAnnotationType && !checkObjectStructureChange()) {
                    drawStartPoint.x = e.pointer.x;
                    drawStartPoint.y = e.pointer.y;
                    switch (selectedAnnotationType) {
                        case AnnotationTypes.RECT:
                            currentRectDraw = new fabric.Rect({
                                left: e.pointer.x,
                                top: e.pointer.y,
                                fill: AnnotationsConfig.RECT.fill,
                                stroke: AnnotationsConfig.RECT.stroke,
                                strokeWidth: AnnotationsConfig.RECT.strokeWidth,
                                width: 0,
                                height: 0
                            });
                            canv.add(currentRectDraw);
                            currentRectDraw.setCoords();
                            break;
                        case AnnotationTypes.ELLIPSE:
                            currentCircleDraw = new fabric.Ellipse({
                                left: e.pointer.x,
                                top: e.pointer.y,
                                originX: 'left',
                                originY: 'top',
                                rx: 0,
                                ry: 0,
                                fill: AnnotationsConfig.ELLIPSE.fill,
                                type: 'ellipse'
                            });
                            canv.add(currentCircleDraw);
                            break;
                        case AnnotationTypes.LINE:
                            var points = [e.pointer.x, e.pointer.y, e.pointer.x, e.pointer.y];
                            currentPlainLineDraw = new fabric.Line(points, {
                                strokeWidth: AnnotationsConfig.LINE.strokeWidth,
                                fill: AnnotationsConfig.LINE.stroke,
                                stroke: AnnotationsConfig.LINE.stroke,
                                originX: 'left',
                                originY: 'center',
                                id: 'line',
                                type: 'line',
                                lockScalingX: true,
                                lockScalingY: true,
                                hasControls: false,
                                hasBorders: false,
                                padding: 6
                            });
                            canv.add(currentPlainLineDraw);
                            break;
                        case AnnotationTypes.ARROW:
                            var points = [e.pointer.x, e.pointer.y, e.pointer.x, e.pointer.y];
                            currentLineDraw = new fabric.Line(points, {
                                strokeWidth: 2,
                                fill: AnnotationsConfig.ARROW.stroke,
                                stroke: AnnotationsConfig.ARROW.stroke,
                                originX: 'center',
                                originY: 'center',
                                id: 'arrow_line',
                                type: 'arrow'
                            });
                            var centerX = (currentLineDraw.x1 + currentLineDraw.x2) / 2;
                            var centerY = (currentLineDraw.y1 + currentLineDraw.y2) / 2;
                            arrowDX = currentLineDraw.left - centerX;
                            arrowDY = currentLineDraw.top - centerY;

                            //if(arrowDX > 0 || arrowDY > 0){
                            currentTriangleDraw = new fabric.Triangle({
                                left: currentLineDraw.get('x1') + arrowDX,
                                top: currentLineDraw.get('y1') + arrowDY,
                                originX: 'center',
                                originY: 'center',
                                //lockScalingX: true,
                                //lockScalingY: true,
                                selectable: false,
                                pointType: 'arrow_start',
                                angle: -45,
                                width: 10,
                                height: 10,
                                fill: AnnotationsConfig.ARROW.stroke,
                                id: 'arrow_triangle'
                            });
                            canv.add(currentLineDraw);
                            currentTriangleAdded = false;
                            //}
                            break;
                        case AnnotationTypes.TEXT:
                            var text = new fabric.IText(ele.innerText.trim(), {
                                top: e.pointer.y,
                                left: e.pointer.x,
                                fontSize: AnnotationsConfig.TEXT.fontSize,
                                text: 'Insert text here'
                            });
                            confClone(text);
                            //canv.add(text);
                            cursorMode = CursorModes.NORMAL;
                            break;
                        case AnnotationTypes.NOTE:
                            var note = new fabric.Path(notePath);
                            var centerX = e.pointer.x - (note.getScaledWidth()) / 2;
                            var centerY = e.pointer.y - (note.getScaledHeight()) / 2;
                            note.set({
                                fill: AnnotationsConfig.NOTE.fill,
                                stroke: 'black',
                                opacity: 1,
                                left: centerX,
                                top: centerY
                            });
                            clearControls(note);
                            confClone(note);
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
                            input.onchange = function (e) {
                                if (input.files.length == 1) {
                                    if (stampFileTypes.indexOf(input.files[0].type) >= 0) {
                                        var reader = new FileReader();
                                        reader.readAsDataURL(input.files[0])
                                        reader.onload = function (e) {
                                            fabric.Image.fromURL(reader.result, function (oImg) {
                                                var imgWidth = oImg.getScaledWidth();
                                                var imgHeight = oImg.getScaledHeight();
                                                var imgRatio = imgWidth / imgHeight;
                                                var scale = 1;
                                                var left = drawStartPoint.x - (imgWidth) / 2;
                                                var top = drawStartPoint.y - (imgHeight) / 2;
                                                if (imgWidth > canv.width) {
                                                    scale = 1 / (imgWidth / canv.width);
                                                    left = 0;
                                                    top = drawStartPoint.y - (scale * imgHeight) / 2;
                                                    if ((scale * imgHeight) > canv.height) {
                                                        scale = 1 / (imgHeight / canv.height);
                                                        top = 0;
                                                        left = drawStartPoint.x - (scale * imgWidth) / 2;
                                                    }
                                                } else if (imgHeight > canv.height) {
                                                    scale = 1 / (imgHeight / canv.height);
                                                    top = 0;
                                                    left = drawStartPoint.x - (scale * imgWidth) / 2;
                                                }
                                                oImg.scale(scale);

                                                oImg.set({
                                                    left: left,
                                                    top: top,
                                                    opacity: AnnotationsConfig.STAMP.opacity
                                                });
                                                restrictObjectBounds(oImg);
                                                confClone(oImg);
                                            });
                                            document.body.removeChild(input);
                                        }
                                    }
                                } else {
                                    document.body.removeChild(input);
                                }
                            }
                            input.click();
                            break;
                    }
                }
            },
            'mouse:up': function (e) {
                //console.log("up");
                deselectOherActiveObjects();
                canvMouseDown = false;
                fabCanvasTextMouseDown = false;
                canv.selection = true;
                if (scrollInterval) {
                    clearInterval(scrollInterval);
                    scrollInterval = null;
                }
                if (cursorMode == CursorModes.NORMAL && (selectedAnnotationType == AnnotationTypes.HIGHLIGHT || selectedAnnotationType == AnnotationTypes.UNDERLINE || selectedAnnotationType == AnnotationTypes.STRIKE)) {
                    addTextAnnotations();
                }
                if (cursorMode == CursorModes.DRAW && selectedAnnotationType && !checkObjectStructureChange()) {
                    switch (selectedAnnotationType) {
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
                            var mainAngle = fabricCalcArrowAngle(currentPlainLineDraw.x1, currentPlainLineDraw.y1, currentPlainLineDraw.x2, currentPlainLineDraw.y2) - 90;
                            currentPlainLineDraw.set('y2', currentPlainLineDraw.get('y1'));
                            currentPlainLineDraw.set('x2', currentPlainLineDraw.get('x1') + distance);
                            currentPlainLineDraw.set('angle', mainAngle);
                            currentPlainLineDraw.noControls = true;
                            // currentPlainLineDraw.set({
                            //     x2: e.pointer.x,
                            //     y2: e.pointer.y
                            // });
                            if (dx > 0 || dy > 0) {
                                currentPlainLineDraw.clone((clone) => {
                                    // var points = [drawStartPoint.x, drawStartPoint.y, e.pointer.x, e.pointer.y];
                                    // // var x1 = currentPlainLineDraw.x1, x2 = currentPlainLineDraw.x2, y1 = currentPlainLineDraw.y1, y2 = currentPlainLineDraw.y2;
                                    // // var points = [drawStartPoint.x, drawStartPoint.y, x1 + distance, drawStartPoint.y];
                                    // var clone = new fabric.Line(points, {
                                    //     strokeWidth: 2,
                                    //     fill: AnnotationsConfig.LINE.fill,
                                    //     stroke: AnnotationsConfig.LINE.fill,
                                    //     //hasControls: false,
                                    //     //hasBorders: false, 
                                    //     originX: 'left', 
                                    //     originY: 'center',
                                    // })
                                    canv.remove(currentPlainLineDraw);
                                    //clone.hasBorders = clone.hasControls = false;
                                    //clone.noControls = true;
                                    //clone.hasSecondaryPivot = true;
                                    clone.rotateable = true;
                                    confClone(clone);
                                    //confPivots(clone);
                                    clone.set({
                                        lockScalingY: true,
                                        originX: 'left', 
                                        originY: 'center',
                                        padding: 6
                                    })
                                    clone.setControlVisible('mt', false);
                                    clone.setControlVisible('mb', false);
                                    clone.setControlVisible('tl', false);
                                    clone.setControlVisible('tr', false);
                                    clone.setControlVisible('bl', false);
                                    clone.setControlVisible('br', false);
                                })
                            } else {
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
                            var mainAngle = fabricCalcArrowAngle(currentLineDraw.x1, currentLineDraw.y1, currentLineDraw.x2, currentLineDraw.y2) - 90;
                            currentLineDraw.set('y2', currentLineDraw.get('y1'));
                            currentLineDraw.set('x2', currentLineDraw.get('x1') + distance);
                            currentTriangleDraw.set('top', currentLineDraw.get('y2') + arrowDY)
                            currentTriangleDraw.set('left', currentLineDraw.get('x2') + arrowDY)
                            var angle = fabricCalcArrowAngle(currentLineDraw.x1, currentLineDraw.y1, currentLineDraw.x2, currentLineDraw.y2);
                            currentTriangleDraw.set('angle', angle);

                            if (dx > 0 || dy > 0) {
                                var group = new window.fabric.Group([currentLineDraw, currentTriangleDraw], {
                                    lockScalingFlip: true,
                                    typeOfGroup: 'arrow',
                                    userLevel: 1,
                                    name: 'my_ArrowGroup',
                                    type: 'arrow',
                                    originX: 'left',
                                    originY: 'center',
                                    angle: mainAngle,
                                    lockScalingY: true,
                                    padding: 6,
                                    strokeWidth: AnnotationsConfig.ARROW.strokeWidth,
                                    stroke: AnnotationsConfig.ARROW.stroke
                                });
                                canv.remove(currentLineDraw);
                                canv.remove(currentTriangleDraw);
                                confClone(group);
                                group.rotateable = true;
                                group.setControlsVisibility({
                                    mt: false,
                                    mb: false,
                                    tl: false,
                                    tr: false,
                                    bl: false,
                                    br: false
                                });
                                group.on({
                                    'scaling' : function(obj){
                                        var triangle = obj.target.item(1), _group = obj.target;
                                        //var _scaleX = _group.width / (_group.width * _group.scaleX);
                                        //var _scaleY = _group.height / (_group.height * _group.scaleY);
                                        var _scaleX = triangle.get('width') / _group.getScaledWidth();
                                        var _scaleY = triangle.get('height') / _group.getScaledHeight();
                                        console.log(_scaleX);
                                        //triangle.set('scaleX', _scaleX);
                                        //triangle.set('scaleY', _scaleY);
                                        //group.item(1).set('scaleY', group.item(1).height/group.height);
                                        //group.item(1).width = 10;
                                        triangle.setCoords();
                                        console.log(obj)
                                    }
                                })
                            } else {
                                canv.remove(currentLineDraw);
                                canv.remove(currentTriangleDraw);
                            }
                            break;
                        case AnnotationTypes.INK:
                            //canv.isDrawingMode = false;
                            var ink = canv.getObjects()[canv.getObjects().length - 1];
                            ink.angle = 0;
                            confClone(ink, true, true)
                            break;
                        case AnnotationTypes.SIGNATURE:
                            if(currentSignature){
                                currentSignature.clone((clone) =>{
                                    canv.remove(currentSignature);
                                    currentSignature = null;
                                    confClone(clone);
                                    addedCurrentSignature = false;
                                    document.querySelector('#cursorSelectTool').click();
                                })
                                // var clone = Object.create(currentSignature);
                                // Object.assign(clone, currentSignature);
                                // canv.remove(currentSignature);
                                // currentSignature = null;
                                // clone.setCoords();
                                // confClone(clone);
                            }
                            break;
                    }
                }
            },
            'mouse:move': function (e) {
                canv.selection = false;
                //console.log('move: ' + e.pointer.y);
                //console.log('scrollY: ' + window.scrollY);
                //console.log('moveEv: ' + JSON.stringify(e))
                if (canvMouseDown && cursorMode == CursorModes.NORMAL) {
                    if (e.pointer.y <= window.scrollY + 1) {
                        if (!scrollInterval) {
                            scrollInterval = setInterval(() => {
                                window.scroll({
                                    top: window.scrollY - 15 > 0 ? window.scrollY - 15 : 0,
                                    left: window.scrollX,
                                    behavior: 'auto'
                                });
                            }, 100)
                        }
                    } else {
                        clearInterval(scrollInterval);
                        scrollInterval = null;
                    }
                } else if (cursorMode == CursorModes.DRAW && selectedAnnotationType && !checkObjectStructureChange()) {
                    if (canvMouseDown) {
                        switch (selectedAnnotationType) {
                            case AnnotationTypes.RECT:
                                if(e.pointer.x < drawStartPoint.x){
                                    currentRectDraw.set({
                                        left: e.pointer.x
                                    })
                                }
                                if(e.pointer.y < drawStartPoint.y){
                                    currentRectDraw.set({
                                        top: e.pointer.y
                                    })
                                }
                                currentRectDraw.set({
                                    width: Math.abs(drawStartPoint.x - e.pointer.x),
                                    height: Math.abs(drawStartPoint.y - e.pointer.y)
                                })
                                //console.log(currentRectDraw);
                                break;
                            case AnnotationTypes.ELLIPSE:
                                var rx = Math.abs(drawStartPoint.x - e.pointer.x) / 2;
                                var ry = Math.abs(drawStartPoint.y - e.pointer.y) / 2;
                                if (rx > currentCircleDraw.strokeWidth) {
                                    rx -= currentCircleDraw.strokeWidth / 2;
                                }
                                if (ry > currentCircleDraw.strokeWidth) {
                                    ry -= currentCircleDraw.strokeWidth / 2;
                                }
                                if(e.pointer.x < drawStartPoint.x){
                                    currentCircleDraw.set({
                                        left: e.pointer.x
                                    })
                                }
                                if(e.pointer.y < drawStartPoint.y){
                                    currentCircleDraw.set({
                                        top: e.pointer.y
                                    })
                                }
                                currentCircleDraw.set({
                                    rx: rx,
                                    ry: ry
                                });
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
                                currentPlainLineDraw.set({
                                    x2: e.pointer.x,
                                    y2: e.pointer.y
                                });
                                break;
                            case AnnotationTypes.ARROW:
                                var dx = Math.abs(currentLineDraw.left - drawStartPoint.x);
                                var dy = Math.abs(currentLineDraw.top - drawStartPoint.y);
                                if (dx > 0 || dy > 0) {
                                    if (!currentTriangleAdded) {
                                        canv.add(currentTriangleDraw);
                                        currentTriangleAdded = true;
                                    }
                                } else {
                                    canv.remove(currentTriangleDraw);
                                    currentTriangleAdded = false;
                                }
                                currentLineDraw.set({
                                    x2: e.pointer.x,
                                    y2: e.pointer.y
                                });
                                currentTriangleDraw.set({
                                    'left': e.pointer.x + arrowDX,
                                    'top': e.pointer.y + arrowDY,
                                    'angle': fabricCalcArrowAngle(currentLineDraw.x1, currentLineDraw.y1, currentLineDraw.x2, currentLineDraw.y2)
                                });
                                break;
                            case AnnotationTypes.SIGNATURE:
                                if(currentSignature){
                                    currentSignature.set({
                                        left: currentSignature.width/2 + e.pointer.x,
                                        top: currentSignature.height/2 + e.pointer.y
                                    })
                                }
                                break;
                        }
                        canv.requestRenderAll();
                    }else{
                        if(selectedAnnotationType == AnnotationTypes.SIGNATURE && currentSignature){
                            currentSignature.set({
                                left: e.pointer.x - currentSignature.width/2,
                                top: e.pointer.y - currentSignature.height/2
                            })
                            canv.requestRenderAll();
                        }
                    }
                }
            },
            'mouse:over': function(){
                if(selectedAnnotationType == AnnotationTypes.SIGNATURE && currentSignature && !addedCurrentSignature){
                    addedCurrentSignature = true;
                    canv.add(currentSignature);
                    //console.log('mouse:over');
                }
            },
            'mouse:out': function(e){
                if(selectedAnnotationType == AnnotationTypes.SIGNATURE && currentSignature && (e.target == null || (e.target == currentSignature && e.nextTarget ==null))){
                    var mouseEvent = e.e;
                    if(e.target == null || (mouseEvent.offsetX < 0 || mouseEvent.offsetX >= canv.width || mouseEvent.offsetY < 0 || mouseEvent.offsetY >= canv.height)){
                        canv.remove(currentSignature);
                        addedCurrentSignature = false;
                        //console.log('mouse:out');
                    }
                }else{
                    // console.log('mouse:out:else');
                    // console.log('selectedAnnotationType == AnnotationTypes.SIGNATURE: ');
                    // console.log(selectedAnnotationType == AnnotationTypes.SIGNATURE);
                    // console.log(selectedAnnotationType)
                    // console.log('currentSignature: ' + currentSignature ? "true": "false");
                    // console.log('e.target: ');
                    // console.log(e.target == null);
                    // console.log('e.target == currentSignature: ');
                    // console.log(e.target == currentSignature);
                    // console.log(e)
                }
                //console.log(e)

            },
            'selection:created': function (e) {
                deselectOherActiveObjects();
                confClone(e.target, false);
                console.log(e.target);
                canvActiveObject = e.target;
                e.target.hoverCursor = CursorModes.MOVE;
                if(canvActiveObject.hasSecondaryPivot){
                    canvActiveObject.pivot1 && canvActiveObject.pivot1.set('visible', true) && canvActiveObject.pivot1.bringForward();
                    canvActiveObject.pivot2 && canvActiveObject.pivot2.set('visible', true) && canvActiveObject.pivot1.bringForward();
                    //canv.setActiveObject(canvActiveObject.pivot1);
                    canvActiveObject.selectable = false;
                    canvActiveObject.hoverCursor = CursorModes.DEFAULT;
                    canvActiveObject = canvActiveObject.pivot1;
                    canvActiveObject.hoverCursor = CursorModes.MOVE;
                    canv.requestRenderAll();
                }
                setAnnotationPropertiesState();
            },
            'selection:updated': function(e){
                if(canvActiveObject){
                    canvActiveObject.hoverCursor = CursorModes.POINTER;
                }
                canvActiveObject = e.target;
                canvActiveObject.hoverCursor = CursorModes.MOVE;
                setAnnotationPropertiesState();
            },
            'selection:cleared': function (e) {
                //console.log(e);
                if(!canvActiveObject){
                    return;
                }
                canvActiveObject.hoverCursor = CursorModes.POINTER;
                var _active = canv.getActiveObject();
                
                // if(canvActiveObject.hasSecondaryPivot){
                //     canvActiveObject.pivot1 && canvActiveObject.pivot1.set('visible', false);
                //     canvActiveObject.pivot2 && canvActiveObject.pivot2.set('visible', false);
                // }
                if(canvActiveObject.pivotObj){
                    canvActiveObject.pivotObj.pivot1 && canvActiveObject.pivotObj.pivot1.set('visible', false);
                    canvActiveObject.pivotObj.pivot2 && canvActiveObject.pivotObj.pivot2.set('visible', false);
                    canvActiveObject.pivotObj.selectable = true;
                    canvActiveObject.pivotObj.hoverCursor = CursorModes.POINTER;
                }
                canvActiveObject = null;
                setAnnotationPropertiesState(false);
            },
            'object:moving': function (e) {
                canvObjMoving = true;
                //console.log(e);
                e.target.hoverCursor = CursorModes.MOVE;
                restrictObjectBounds(e.target);
            },
            'object:moved': function (e) {
                //console.log(e);
                canvObjMoving = false;
                //e.target.hoverCursor = CursorModes.POINTER;
                raiseEvent(AnnotationEvents.OBJECTMODIFIED, e.target);
            },
            'object:scaling': function (e) {
                //console.log(e);
                canvObjScaling = true;

                restrictObjectBounds(e.target);
            },
            'object:scaled': function (e) {
                //console.log(e);
                canvObjScaling = false;

                restrictObjectBounds(e.target);
                raiseEvent(AnnotationEvents.OBJECTMODIFIED, e.target);
            },
            'object:rotating': function (e) {
                //console.log(e);
                canvObjRotating = true;
            },
            'object:rotated': function (e) {
                //console.log(e);
                canvObjRotating = false;
                raiseEvent(AnnotationEvents.OBJECTMODIFIED, e.target);
            }
        })

        //canv.add(rect);
        //canv.add(fabSelectorGroup);

        var elements = layer.querySelectorAll('span');

        // var done = pageCanvs.every((pc) => {
        //     if(pc.pageNumber == pageNumber){
        //         //pc = {pageNumber: pageNumber, canv: canv, container: realCanv.parentNode, pageID: _pageID};
        //         pc.canv = canv;
        //         pc.container = realCanv.parentNode;
        //         pc.pageID = _pageID;
        //         return false;
        //     }
        // })

        var groupText = new fabric.Group()
        //console.log(elements[0]);
        for (var i = 0; i < elements.length; i++) {
            //console.log(elements[i]);
            var ele = elements[i];
            var top = parseFloat(ele.style.top.replace('px', ''));
            var left = parseFloat(ele.style.left.replace('px', ''));
            var fontSize = parseFloat(ele.style.fontSize.replace('px', ''));
            var fontFamily = ele.style.fontFamily.replace('px', '');
            //console.log(ele.getBoundingClientRect().width)
            var scaleXX = getElementTransform(ele, 'scale');
            var text = new fabric.Text(ele.innerText.trim(), {
                top: top,
                left: left,
                fontSize: fontSize,
                fontFamily: fontFamily,
                opacity: 0,
                excludeFromExport: true
            });
            text.set('selectable', true);
            text.scaleX = scaleXX;
            text.angle = getElementTransform(ele, 'rotate');

            text.canvId = pageCanvs.length - 1;
            //text.set('editable', false);
            initFabricText(text);
            canv.add(text);
            //groupText.add(text);
        }

        if(annotData && annotData.annotations){
            annotData.annotations.forEach((annot) => {
                if(annot.pageNum == pageNumber){
                    var obj = new fabric.Rect(annot)
                    canv.add(obj);
                    obj.setCoords();
                    confAnnotation(annot);
                    canv.requestRenderAll();
                }
            })
        }
        //groupText.set('ty', 'group-text');
        //canv.add(groupText);

        function deselectOherActiveObjects(){
            var pcs = pageCanvs.filter((pc) => {
                return pc.pageNumber != pageNumber;
            })
            pcs.forEach((pc) => {
                pc.canv.discardActiveObject();
                pc.canv.requestRenderAll();
            })
        }

        function setAnnotationPropertiesState(enable = true){
            var buttons = document.querySelectorAll('.annotProps button');
            function _remAnnot(){
                if(canvActiveObject && canvActiveObject.removeButton){
                    canvActiveObject.removeButton.click();
                }
            }
            buttons.forEach((b) => {
                if(enable && canvActiveObject && canvActiveObject.atype && AnnotationsConfig[canvActiveObject.atype.toUpperCase()][b.getAttribute('dtype')] != null){
                    b.removeAttribute('disabled');
                    if(b.getAttribute('dtype') == 'fill'){
                        b.style.color = canvActiveObject.fill;
                    }else if(b.getAttribute('dtype') == 'stroke'){
                        b.style.color = canvActiveObject.stroke;
                    }else if(b.getAttribute('dtype') == 'strokeWidth'){
                        var rg = b.querySelector('#rg-stroke');
                        if(rg){
                            rg.value = canvActiveObject.strokeWidth;
                            var ev = new Event('input');
                            rg.dispatchEvent(ev)
                        }
                    }else if(b.getAttribute('dtype') == 'opacity'){
                        var rg = b.querySelector('#rg-opacity');
                        if(rg){
                            rg.value = canvActiveObject.opacity * 100;
                            var ev = new Event('input');
                            rg.dispatchEvent(ev)
                        }
                    }else if(b.getAttribute('dtype') == 'fontSize'){
                        var rg = b.querySelector('#rg-fontSize');
                        if(rg){
                            rg.value = canvActiveObject.fontSize;
                            var ev = new Event('input');
                            rg.dispatchEvent(ev)
                        }
                    }
                }else if(b.getAttribute('id') == "annotx-delete" && enable){
                    b.removeAttribute('disabled');
                    b.addEventListener('click', _remAnnot);
                }else{
                    //canvActiveObject ? console.log(AnnotationsConfig[canvActiveObject.atype.toUpperCase()][b.getAttribute('dtype')]) : '';
                    b.setAttribute('disabled', 'true');
                    if(b.getAttribute('id') == "annotx-delete"){
                        b.removeEventListener('click', _remAnnot)
                    }
                }
            })
        }

        function restrictObjectBounds(obj) {
            var objWidth = obj.getScaledWidth();
            var objHeight = obj.getScaledHeight()
            var canvWidth = canv.width;
            var canvHeight = canv.height;
            if (obj.left < 0) {
                obj.left = 0;
            } else if (obj.left + objWidth > canvWidth) {
                obj.left = canvWidth - objWidth;
            }
            if (obj.top < 0) {
                obj.top = 0;
            } else if (obj.top + objHeight > canvHeight) {
                obj.top = canvHeight - objHeight;
            }
        }

        function confPivots(obj){
            if(obj.x1 !=null && obj.x2 !=null && obj.y1 !=null && obj.y2 !=null){
                var pivotSettings = {strokeWidth: 2,radius: 5,fill: '#fff',stroke: '#666', hasBorders: false, hasControls: false, visible: false, originX: 'center', originY: 'center'}
                var pivot1 = new fabric.Circle(pivotSettings);
                var pivot2 = new fabric.Circle(pivotSettings);
                pivot1.set({
                    left: obj.x1,
                    top: obj.y1
                })
                pivot2.set({
                    left: obj.x2,
                    top: obj.y2
                })
                pivot1.pivotObj = pivot2.pivotObj = obj;
                canv.add(pivot1, pivot2);
                obj.pivot1 = pivot1;
                obj.pivot2 = pivot2;
                pivot1.bringForward();
                pivot2.bringForward();
                obj.sendBackwards();
                pivot1.on({
                    'moving': function(e){
                        var p = e.target;
                        p.pivotObj && p.pivotObj.set({ 'x1': p.left, 'y1': p.top }) && p.pivotObj.setCoords();
                        canv.requestRenderAll()
                    }
                })
                pivot2.on({
                    'moving': function(e){
                        var p = e.target;
                        p.pivotObj && p.pivotObj.set({ 'x2': p.left, 'y2': p.top }) && p.pivotObj.setCoords();
                        canv.requestRenderAll()
                    }
                })
                obj.on({
                    'moving': function(e){
                        var line = e.target;
                        var p1 = e.target.pivot1;
                        var p2 = e.target.pivot2;
                        console.log('x1: '+ line.x1)
                        line.setCoords();
                        console.log('x1: '+ line.x1)
                        if(p1 && p2){
                            //pivot1.set({left: obj.x1, top: obj.y1 })
                            pivot1.left = line.x1;
                            console.log('left: ' + line.get('x1'))
                            pivot1.top = line.y1;
                            pivot1.setCoords()
                            pivot2.set({ left: obj.x2, top: obj.y2 })
                            pivot2.setCoords()
                        }
                        canv.requestRenderAll()
                        //canv.requestRenderAll()
                    }
                })

                canv.requestRenderAll();
            }
        }

        

        function confClone(clone, add = true, ink = false) {
            clone.hoverCursor = CursorModes.POINTER;
            if(add){
                var stateClone = JSON.parse(JSON.stringify(clone))
                clone.uuid = stateClone.uuid = generateUUID();
                clone.atype = stateClone.atype = selectedAnnotationType;
                clone.docId = stateClone.docId = annotData.docId;
                clone.pageNum = stateClone.pageNum = pageNumber;
                var _author = {id: author.id == '' ? '0' : author.id, name: author.name == '' ? 'Guest' : author.name}
                clone.author = stateClone.author = _author;
                clone.time = stateClone.time = moment().toString();
                if(!ink){
                    canv.add(clone);
                }
                confAnnotation(clone);
                //Object.assign(stateClone, clone)
                console.log(JSON.stringify(stateClone));
                raiseEvent(AnnotationEvents.OBJECTADDED, clone);
            }
            setObjectCorners(clone);
            canv.requestRenderAll();
        }

        // var vApp = new Vue({
        //     el: '#annotationsView',
        //     data: {
        //       pageAnnotations: [],
        //     },
        //      methods: {
        //        removeAnnotation(annotation){
                
        //        }
        //     },
        //     watch: {
        //         pageAnnotations() {
        //             console.log("ffff")
        //         }
        //     }
        // }); 

        

        function addTextAnnotations() {
            var txtAnnots = [];
            var selAnnot = selectedAnnotationType;
            selectedRects.forEach((r) => {
                if (selAnnot == AnnotationTypes.HIGHLIGHT) {
                    var highlight = new fabric.Rect({
                        fill: AnnotationsConfig.HIGHLIGHT.fill,
                        opacity: 0.4,
                        rx: 5,
                        ry: 5,
                        left: r.get('left'),
                        top: r.get('top'),
                        width: r.get('width'),
                        height: r.get('height'),
                        angle: r.get('angle')
                    });
                    txtAnnots.push(highlight);
                } else if (selAnnot == AnnotationTypes.UNDERLINE) {
                    var underline = new fabric.Line([r.get('left'), r.get('top') + r.get('height') - 1, r.get('left') + r.get('width'), r.get('top') + r.get('height') - 1], {
                        stroke: AnnotationsConfig.UNDERLINE,
                        fill: AnnotationsConfig.UNDERLINE,
                        angle: r.get('angle')
                    });
                    txtAnnots.push(underline);
                } else if (selAnnot == AnnotationTypes.STRIKE) {
                    var strike = new fabric.Line([r.get('left'), r.get('top') + (r.get('height') / 2) + 1, r.get('left') + r.get('width'), r.get('top') + (r.get('height') / 2) + 1], {
                        stroke: AnnotationsConfig.STRIKE,
                        fill: AnnotationsConfig.STRIKE,
                        angle: r.get('angle')
                    });
                    txtAnnots.push(strike);
                }
            });
            console.log(txtAnnots);
            if(txtAnnots.length > 0){
                var groupTextAnnotations = new fabric.Group(txtAnnots, {
                    lockScalingY: true,
                    lockScalingX: true,
                    hasControls: false,
                    lockMovementX: true,
                    lockMovementY: true,
                    borderDashArray: [5, 5],
                });
                //canv.add(groupTextAnnotations);
                confClone(groupTextAnnotations);
                groupTextAnnotations.sendBackwards(true);
            }
            selectedRects = [];
            fabClearSelect();
        }
    }

    var fabricCalcArrowAngle = function (x1, y1, x2, y2) {
        var angle = 0,
            x, y;
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
        console.log('angle ' + (angle * 180 / Math.PI + 90));
        return (angle * 180 / Math.PI + 90);
    };
    var fabricCalcLineAngle = function (fabricLine) {
        var width = fabricLine.getScaledWidth();
        var height = fabricLine.getScaledHeight();
        return Math.atan2(fabricLine.height, fabricLine.width) * (180 / Math.PI);
    }

    function confAnnotation(annot){

        var pageNumber = annot.pageNum;
            
        var annotPage = document.querySelector("[annotv-page-id='"+ pageNumber +"']");
        var foundPage = pageAnnotations.find((ant) => {
            return ant.pageNumber == pageNumber;
        })

        var container = '<div class="title"> <div class="annot-info"> <span class="icon">{0}</span> <span class="author">{1}</span> </div> <div class="actions"> <div class="edit-annot mAnnotIcon"> <svg viewBox="0 0 24 24" height="24" width="24"> <path d="m 17.038835,2.26301 4.695331,4.69572 M 1.043407,20.86952 3.1302208,22.9565 M 2.0868139,17.2173 3.1302208,18.26079 H 5.738738 v 2.60873 l 1.0434069,1.04349 M 17.82139,6.17611 5.738738,18.26079 M 15.473724,3.82825 18.693678,0.60803 a 2.0941176,2.0942888 0 0 1 2.950755,0 l 1.744576,1.74472 a 2.0868138,2.0869844 0 0 1 0,2.951 L 20.169055,8.52396 M 6e-8,24 2.0868139,17.2173 15.473724,3.82825 20.169055,8.52396 6.7821449,21.91301 Z" style="stroke-width:1.04344952" /> </svg> </div> <div class="rem-annot mAnnotIcon"> <svg viewBox="0 0 24 24" width="24" height="24"> <path d="M 3.5999997,0 -1e-7,3.60002 8.3999997,12 -1e-7,20.39998 3.5999997,24 12,15.59998 20.4,24 24,20.39998 15.6,12 24,3.60002 20.4,0 12,8.40001 Z"/> </svg> </div> </div> </div> <div class="time">{2}</div> <div class="comment-container"> <div class="comment-view"> <div class="comment"> {3} </div> </div> <div class="comment-cont hidden"> <div class="comment-input"> <div class="toolbarField ac-input" placeholder="Comment" contenteditable></div> </div> <div class="ac-actions hidden"> <button class="overlayButton comment-save">Save</button> <button class="overlayButton comment-cancel">Cancel</button> </div> </div> </div> <div class="replies hidden"> </div> <div class="new-reply hidden"> <div class="comment-input"> <div class="toolbarField ac-input" placeholder="Reply" contenteditable></div> </div> <div class="ac-actions hidden"> <button class="overlayButton new-reply-save">Reply</button> <button class="overlayButton new-reply-cancel">Cancel</button> </div> </div>';
        var cont = document.createElement('div');
        cont.classList = ['annotation-cont'];
        cont.tabIndex = "-1";
        cont.innerHTML = container.format(AnnotationsConfig[annot.atype.toUpperCase()].icon, annot.author.name, moment(annot.time).format('MMM Do, YYYY H:mma'), annot.comment ? annot.comment : '');

        var replies = cont.querySelector('.replies');
        var newReply = cont.querySelector('.new-reply');
        var newReplyActions = newReply.querySelector('.reply-actions');
        var comment = cont.querySelector('.comment-container .comment');
        var btnSaveComment = cont.querySelector('.comment-container .comment-save');
        var btnCancelComment = cont.querySelector('.comment-container .comment-cancel');
        var btnSaveNewReply = cont.querySelector('.new-reply .new-reply-save');
        var btnCancelNewReply = cont.querySelector('.new-reply .new-reply-cancel');
        var commentInput = cont.querySelector('.comment-container .comment-input .ac-input');
        var commentCont = cont.querySelector('.comment-container .comment-cont');
        var newReplyInput = cont.querySelector('.new-reply .comment-input .ac-input');
        var editComment = cont.querySelector('.edit-annot');
        var removeComment = cont.querySelector('.rem-annot');

        var focusEvent = new Event('focus');

        function confReply(r){
            var replyContainer = '<div class="reply-view"> <div class="title"> <div class="annot-info"> <div class="author"> {0} </div> </div> <div class="actions"> <div class="edit-reply mAnnotIcon"> <svg viewBox="0 0 24 24" height="24" width="24"> <path d="m 17.038835,2.26301 4.695331,4.69572 M 1.043407,20.86952 3.1302208,22.9565 M 2.0868139,17.2173 3.1302208,18.26079 H 5.738738 v 2.60873 l 1.0434069,1.04349 M 17.82139,6.17611 5.738738,18.26079 M 15.473724,3.82825 18.693678,0.60803 a 2.0941176,2.0942888 0 0 1 2.950755,0 l 1.744576,1.74472 a 2.0868138,2.0869844 0 0 1 0,2.951 L 20.169055,8.52396 M 6e-8,24 2.0868139,17.2173 15.473724,3.82825 20.169055,8.52396 6.7821449,21.91301 Z" style="stroke-width:1.04344952"></path> </svg> </div> <div class="rem-reply mAnnotIcon"> <svg viewBox="0 0 24 24" width="24" height="24"> <path d="M 3.5999997,0 -1e-7,3.60002 8.3999997,12 -1e-7,20.39998 3.5999997,24 12,15.59998 20.4,24 24,20.39998 15.6,12 24,3.60002 20.4,0 12,8.40001 Z"></path> </svg> </div> </div> </div>  <div class="time">{1}</div> <div class="reply"> {2} </div> </div> <div class="reply-input hidden"> <div class="comment-input"><div class="toolbarField ac-input" placeholder="Reply" contenteditable>{2}</div> </div> <div class="ac-actions hidden"> <button class="overlayButton reply-save">Save</button> <button class="overlayButton reply-cancel">Cancel</button> </div> </div> ';
            var rCont = document.createElement('div');
            rCont.classList.add('reply-cont');
            rCont.innerHTML = replyContainer.format(r.author.name, moment(r.time).format('MMM Do, YYYY H:mma'), r.comment);
            var editReply = rCont.querySelector('.edit-reply');
            var saveReply = rCont.querySelector('.reply-save');
            var removeReply = rCont.querySelector('.rem-reply');
            var replyInputDiv = rCont.querySelector('.reply-input');
            var replyInput = rCont.querySelector('.reply-input .ac-input');
            var reply = rCont.querySelector('.reply');

            replies.prepend(rCont);

            removeReply.addEventListener('click', function(){
                annot.replies = annot.replies.filter((re) =>{
                    return re != r;
                });
                rCont.remove();
                raiseEvent(AnnotationEvents.REPLYREMOVED, {docId: annotData.docId, uuid: annot.uuid, reply: r});
            });
            editReply.addEventListener('click', function(){
                reply.classList.add('hidden')
                replyInputDiv.classList.remove('hidden');
                commentInput.innerHTML = comment.innerHTML;
            })

            saveReply.addEventListener('click', function(e){
                if(replyInput.innerHTML.trim() != ''){
                    cont.dispatchEvent(focusEvent);
                    r.comment = reply.innerHTML = replyInput.innerHTML;
                    reply.classList.remove('hidden');
                    replyInputDiv.classList.add('hidden');
                    raiseEvent(AnnotationEvents.REPLYEDITED, {docId: annotData.docId, uuid: annot.uuid, reply: r});
                    
                }
            })
            confCommentInput(replyInput);
        }

        function confCommentInput(ci){
            var placeHolder = document.createElement('span');
            placeHolder.classList = ['placeholder'];
            placeHolder.innerHTML = ci.getAttribute('placeholder');
            placeHolder.addEventListener('click', function(e){
                e.stopImmediatePropagation();
                ci.focus();
            })
            if(ci.innerHTML.trim() == ''){
                ci.parentNode.prepend(placeHolder);
            }
            ci.addEventListener('input', function(){
                if(ci.innerHTML.length > 0){
                    placeHolder.classList.add('hidden');
                }else{
                    placeHolder.classList.remove('hidden');
                }
            })

            ci.addEventListener('focus', function(e){
                e.stopImmediatePropagation();
                var actions = ci.parentNode.parentNode.querySelector('.ac-actions');
                if(actions){
                    actions.classList.remove('hidden');
                }
            })
            ci.addEventListener('focusout', function(e){
                //e.stopImmediatePropagation();
                var actions = ci.parentNode.parentNode.querySelector('.ac-actions');
                if(actions){
                    if(e.relatedTarget == cont){
                        actions.classList.add('hidden');
                    }
                    //
                }
            })
        }

        if(annot.replies){
            annot.replies.forEach((r) => {
                confReply(r);
            })
        }


        var commentInps = cont.querySelectorAll('.ac-input');
        commentInps.forEach((ci) =>{
            confCommentInput(ci);
        });

        btnSaveComment.addEventListener('click', function(){
            if(commentInput.innerHTML.trim() != ''){
                annot.comment = comment.innerHTML = commentInput.innerHTML;
                comment.classList.remove('hidden')
                commentCont.classList.add('hidden');
            }
        })

        btnSaveNewReply.addEventListener('click', function(){
            if(newReplyInput.innerHTML.trim() != ''){
                annot.replies ? '' : annot.replies = [];
                if(annot.replies){
                    var r = {author: annot.author, comment: newReplyInput.innerHTML, time: moment().toString(), id: generateUUID()};
                    annot.replies.push(r);
                    confReply(r);
                    raiseEvent(AnnotationEvents.REPLYADDED, {docId: annotData.docId, uuid: annot.uuid, reply: r});
                }
                newReplyInput.innerHTML = '';
                newReply.querySelector('.placeholder').classList.remove('hidden');
            }
        })

        btnCancelNewReply.addEventListener('click', function(e){
            newReplyInput.innerHTML = '';
            newReply.querySelector('.placeholder').classList.remove('hidden');
            var actions = newReplyInput.parentNode.parentNode.querySelector('.ac-actions');
            if(actions){
                actions.classList.add('hidden');
            }
        });


        if(annotPage && foundPage){
            foundPage.annots.unshift(annot);

            annotPage.querySelector('.annotation-conts').prepend(cont)

        }else{
            var annots = [];
            annots.push(annot);
            pageAnnotations.push({pageNumber, annots})
            pageAnnotations.sort((x,y) => {
                return x.pageNumber > y.pageNumber ? 1 : -1;
            })

            annotPage = document.createElement('section');
            annotPage.setAttribute('annotv-page-id', pageNumber);
            annotPage.classList = ['annot-page'];

            var pager = document.createElement('div');
            pager.classList = ['page-num'];
            pager.innerHTML = "Page " + pageNumber;
            annotPage.appendChild(pager);

            var containers = document.createElement('div');
            containers.classList = ['annotation-conts'];
            
            containers.appendChild(cont);
            annotPage.appendChild(containers);

            var annotView = document.getElementById('annotationsView');
            annotView.appendChild(annotPage);

            Array.prototype.slice.call(annotView.children)
                .map(function (x) { return annotView.removeChild(x); })
                .sort(function (x, y) { return x.getAttribute('annotv-page-id') > y.getAttribute('annotv-page-id') ? 1 : -1; })
                .forEach(function (x) { annotView.appendChild(x); });
        }

        //Remove button;
        annot.removeButton = cont.querySelector('.rem-annot')
        
        cont.addEventListener('focusout', function(e){
            if(e.relatedTarget != cont && !cont.contains(e.relatedTarget) && e.relatedTarget != null){
                newReply.classList.add('hidden');
                comment.classList.remove('hidden')
                commentCont.classList.add('hidden');
                replies.classList.add('hidden');
            }else if(e.relatedTarget == null){
                cont.focus();
            }
        })

        if(annot.author.id != author.id){
            editComment.remove();
            removeComment.remove();
        }else{
            cont.querySelector('.rem-annot').addEventListener('click', function(e){
                //console.log(annot.uuid);
                //e.stopImmediatePropagation();
                e.stopPropagation();
                removeAnnotation(annot, pageNumber);
                cont.remove();
                var pa = pageAnnotations.find((pa) => {
                    return pa.pageNumber == pageNumber;
                })
                pa.annots = pa.annots.filter((paa) => {
                    return paa.uuid != annot.uuid;
                })
                raiseEvent(AnnotationEvents.OBJECTREMOVED, annot);
                if(!annotPage.querySelector('.annotation-conts .annotation-cont')){
                    annotPage.remove();
                    pageAnnotations = pageAnnotations.filter((pa) => {
                        return pa.pageNumber != pageNumber;
                    })
                }
            })

            cont.querySelector('.edit-annot').addEventListener('click', function(){
                comment.classList.add('hidden')
                commentCont.classList.remove('hidden');
                commentInput.innerHTML = comment.innerHTML;
            })
        }

        cont.addEventListener('click', function(e){
            deSelectActiveObjects();
            annot.canvas.setActiveObject(annot);
            newReply.classList.remove('hidden');
            replies.classList.remove('hidden');
        })
        
    }

    function removeAnnotation(annot, pageNumber){
        var pc = pageCanvs.find((pc) => {
            return pc.pageNumber == pageNumber
        })
        if(pc){
            pc.canv.remove(annot);
        }
    }

    function clearControls(object) {
        object.set({
            hasControls: false,
            hoverCursor: CursorModes.POINTER,
            borderColor: 'red'
        })
    }

    function checkObjectStructureChange() {
        return canvObjMoving || canvObjRotating || canvObjScaling || canvActiveObject;
    }

    function setObjectCorners(obj) {
        if(!obj.get('noControls')){
            obj.set({
                borderColor: '#000',
                cornerStrokeColor: '#000',
                cornerColor: 'white',
                cornerSize: 10,
                transparentCorners: false,
                cornerStyle: 'circle',
                hasRotatingPoint: obj.get('rotateable'),
            });
        }
    }

    function checkTextBeside(text, byRight) {
        var canvHalfway = canv.width / 2;
        var beside = textOrder.filter(t => {
            var sideCheck = false
            if (byRight) {
                sideCheck = t.left >= canvHalfway;
            } else {
                sideCheck = t.left + t.getScaledWidth() < canvHalfway;
            }
            return sideCheck && t.top == text.top
        })
    }

    //function findWhiteLineBefore(text, by)

    function fabClearSelect() {
        for (var j = 0; j < pageCanvs.length; j++) {
            var canv = pageCanvs[j].canv;
            for (var i = 0; i < canv.selectorRects.length; i++) {
                canv.remove(canv.selectorRects[i]);
            }
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
            var selectedTextWidth = getTextWidth(text.text.substring(initialPosition, lastPosition));
            var initialX = getXByPosition(initialPosition);
            var lastX = getXByPosition(lastPosition + 1);
            select.graphics.clear().beginFill("#ace").drawRect(initialX || 0, text.y - 1 || 0, lastX - initialX || 0, textHeight || 0);
            stage.update();

        }

        function selector(x, y, width, height) {
            select.graphics.clear().beginFill("#ace").drawRect(x || 0, y || 0, width || 0, height || 0);
        }

        function clearSelect() {
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
            for (var i = 0; i < text.text.length; i++) {
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
            for (var i = 0; i < position; i++) {
                totalW += getTextWidth(text.text[i]);
            }
            return totalW;
        }

        // window.addEventListener('click', function() {
        //   //console.log("CLICK!!!");
        //   // if(!textInput.hasFocus) {
        //   //   console.log("NO FOCUS");
        //   // }

        // }, false);

        text.addEventListener("mousedown", function (e) {
            var startX = e.rawX;
            var onMove = function (e) {
                clearSelect();
                if (e.rawX >= text.x && e.rawX <= text.x + textWidth) {
                    initialPosition = getPointInText(startX);
                    lastPosition = getPointInText(e.rawX);
                    if (initialPosition > lastPosition) {
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
            var selectedTextWidth = getTextWidth(text.text.substring(initialPosition, lastPosition));
            var initialX = getXByPosition(initialPosition);
            var lastX = getXByPosition(lastPosition + 1);
            select.graphics.clear().beginFill("#ace").drawRect(initialX || 0, text.y - 1 || 0, lastX - initialX || 0, textHeight || 0);
            stage.update();

        }

        function selector(x, y, width, height) {
            select.graphics.clear().beginFill("#ace").drawRect(x || 0, y || 0, width || 0, height || 0);
        }

        function clearSelect() {
            select.graphics.clear();
            stage.update();
        }

        //Gets the width of the text
        function getTextWidth(t) {
            var tempText = new fabric.Text(t, {
                fontSize: text.fontSize,
                fontFamily: text.fontFamily
            });
            //tempText.font = text.font;
            return tempText.width;
        }

        function getPointInText(rawX) {
            var position = 0;
            var totalW = text.left;
            for (var i = 0; i < text.text.length; i++) {
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
            for (var i = 0; i < position; i++) {
                totalW += getTextWidth(text.text[i]);
            }
            return totalW;
        }

        //window.addEventListener('click', function() {
        //console.log("CLICK!!!");
        // if(!textInput.hasFocus) {
        //   console.log("NO FOCUS");
        // }

        //}, false);

        text.addEventListener("mousedown", function (e) {
            var startX = e.rawX;
            var onMove = function (e) {
                clearSelect();
                if (e.rawX >= text.x && e.rawX <= text.x + textWidth) {
                    initialPosition = getPointInText(startX);
                    lastPosition = getPointInText(e.rawX);
                    if (initialPosition > lastPosition) {
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
    const ADJUSTMENT_PAD = 5; //for caret position(y-axis) accuracy, in pointer.
    var selectedRects = []

    function initFabricText(text) {
        var textWidth = text.getScaledWidth() - 0;
        var textHeight = text.getScaledHeight();
        var fabSelectorRect = new fabric.Rect({
            fill: '#ace',
            opacity: 0.5,
            excludeFromExport: true
        });
        var fabHighlighterRect = new fabric.Rect({
            fill: '#fc3',
            opacity: 0.5,
            rx: 5,
            ry: 5
        });
        var fabTextUnderline = new fabric.Line({
            fill: AnnotationsConfig.UNDERLINE
        });
        var fabStrikeOutLine = new fabric.Line({
            fill: AnnotationsConfig.STRIKE
        });
        var fabSquigglyLine = new fabric.Line({
            fill: AnnotationsConfig.UNDERLINE
        });
        var initialPosition;
        var lastPosition;
        var moveEvent;

        var canv = pageCanvs[text.canvId].canv;

        fabSelectorRect.set('selectable', false);
        fabSelectorRect.hoverCursor = 'normal';
        canv.selectorRects.push(fabSelectorRect);

        fabSelectorRect.uuid = generateUUID();

        text.orderIndex = textOrder.length;
        text.annotHighlight = fabHighlighterRect;
        text.annotStrike = fabStrikeOutLine;
        text.annotUnderline = fabTextUnderline;
        textOrder.push({
            text: text,
            rect: fabSelectorRect
        });

        text.hoverCursor = 'text';
        text.set('selectable', false);
        text.on({
            'mousedown': function (e) {
                //console.log(e);
                text.hoverCursor = cursorMode;
                if (cursorMode == CursorModes.NORMAL && !canv.getActiveObject()) {
                    text.hoverCursor = 'text'
                    selectorStartX = e.pointer.x;
                    selectorStartY = text.top;
                    firstDragText = text;
                    //console.log(selectorStartY);
                    fabCanvasTextMouseDown = true;
                }
            }
        })

        var onMove = function (e) {
            text.hoverCursor = cursorMode;
            if (cursorMode == CursorModes.NORMAL && !canv.getActiveObject()) {
                text.hoverCursor = CursorModes.TEXT;
                if (fabCanvasTextMouseDown) {
                    //console.log(e.pointer.x);
                    //console.log('pointY: ' + e.pointer.y);
                    if (e.pointer.y < selectorStartY - 4 && firstDragText == text) {
                        selectionDirection = false;
                        var widt = ((selectorStartX) - text.left);
                        console.log('widt: ' + text.text)
                        selector(text.left, text.top, widt, textHeight)
                    } else if ((text.top + textHeight < selectorStartY || text.top < selectorStartY) && e.pointer.y < selectorStartY) {
                        //console.log('upwards: ' + text.text)
                        //when selecting text upwards from a startpoint
                        if (e.pointer.y < text.top && e.pointer.y < selectorStartY && (e.pointer.x >= text.left && e.pointer.x <= text.left + textWidth)) {
                            //console.log('passed!!! ' + text.text)
                            //select the whole text after line is passed; upwardds
                            selector(text.left, text.top, textWidth, textHeight)
                        } else if ((e.pointer.y >= text.top && e.pointer.y <= text.top + textHeight - ADJUSTMENT_PAD) && e.pointer.y < selectorStartY && e.pointer.x >= text.left && e.pointer.x <= text.left + textWidth) {
                            //select a portion of the text; backwards because it goes upwards
                            lastDragText = text;
                            if (firstDragText.orderIndex < text.orderIndex || lastDragText.orderIndex > text.orderIndex) {
                                canv.remove(fabSelectorRect);
                                removeSelectedRect(fabSelectorRect);
                                return;
                            }
                            var widt = (text.left + textWidth) - e.pointer.x;
                            console.log('hover up')
                            selector(e.pointer.x, text.top, widt, textHeight)
                            selectAllInRange(text, firstDragText);
                        } else {
                            //console.log('clearer');
                            if (!lastDragText) {
                                return;
                            }
                            if (lastDragText == text) {
                                canv.remove(fabSelectorRect);
                                removeSelectedRect(fabSelectorRect);
                                lastDragText = null;
                                return;
                            }
                            //console.log('clearing');
                            if (firstDragText.orderIndex < text.orderIndex || lastDragText.orderIndex > text.orderIndex) {
                                canv.remove(fabSelectorRect);
                                removeSelectedRect(fabSelectorRect);
                                //console.log('remove: ' + text.text);
                            }
                        }
                    } else if (firstDragText == text) {
                        selectionDirection = true;
                        //when cursor is on the line the drag started from and for the line the drag was started from
                        //check to find out when cursor goes below line drag was started from; if it does highlight the whole line(textWidth)
                        //if it doesnt, check if drag is forwards or backwards.. and do neccessary calc
                        var widt = text.top + textHeight < e.pointer.y ? textWidth : e.pointer.x < selectorStartX ? (selectorStartX - e.pointer.x) : (e.pointer.x - selectorStartX);
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
                        //                    var initX = selectorStartY == text.top ? selectorStartX : text.left
                        //                    initialPosition = getPointInText(initX);
                        //                    lastPosition = getPointInText(e.pointer.x);
                        //                    if(initialPosition > lastPosition) {
                        //                      var temp = initialPosition;
                        //                      initialPosition = lastPosition;
                        //                      lastPosition = temp;
                        //                    }
                        //                    console.log('startY: ' + selectorStartY);
                        //                    console.log('start2Y: ' + firstDragText.top);
                        //                    console.log('pointY: ' + e.pointer.y);
                        if (text.orderIndex < firstDragText.orderIndex) {
                            return;
                        }
                        lastDragText = text;

                        var widt = e.pointer.x - text.left;
                        //var widt = e.pointer.x - text.left > textWidth ? textWidth : e.pointer.x - text.left;
                        selector(text.left, text.top, widt, textHeight);
                        //selectorByPosition(initialPosition, lastPosition);
                        selectAllInRange(firstDragText, text);
                    } else {
                        if (!lastDragText) {
                            return;
                        }
                        if (lastDragText == text) {
                            canv.remove(fabSelectorRect);
                            removeSelectedRect(fabSelectorRect);
                            lastDragText = null;
                            return;
                        }
                        var check = selectionDirection ? (firstDragText.orderIndex > text.orderIndex || lastDragText.orderIndex < text.orderIndex) : (firstDragText.orderIndex < text.orderIndex || lastDragText.orderIndex > text.orderIndex)
                        //console.log('check: '+ text.text);
                        if (check) {
                            canv.remove(fabSelectorRect);
                            removeSelectedRect(fabSelectorRect);
                            //console.log('remove: ' + text.text);
                        }
                    }
                } else {
                    if (canvMouseDown && (e.pointer.x >= text.left - LINE_PADDING && e.pointer.x <= text.left + textWidth + LINE_PADDING) && (e.pointer.y >= text.top && e.pointer.y <= text.top + textHeight)) {
                        firstDragText = text;
                        selectorStartX = e.pointer.x;
                        selectorStartY = text.top;
                        fabCanvasTextMouseDown = true;
                    }
                }
            }
        }
        canv.on({
            'mouse:move': onMove
        })

        function selectAllInRange(afterText, beforeText) {
            if (!afterText || !beforeText) {
                return;
            }
            //console.log('afterText index: ' + afterText.orderIndex);
            //console.log('beforeText index: '+ beforeText.orderIndex);

            var indexes = [];
            if (afterText.orderIndex <= beforeText.orderIndex) {
                for (var i = afterText.orderIndex + 1; i < beforeText.orderIndex; i++) {
                    var txt = textOrder[i].text;
                    selector(txt.left, txt.top, txt.getScaledWidth(), txt.getScaledHeight(), txt, textOrder[i].rect);
                    //console.log('selected: ' + txt.text)
                    //indexes.push(i);
                }
            } else {
                for (var i = afterText.orderIndex; i < beforeText.orderIndex - 1; i--) {
                    var txt = textOrder[i].text;
                    selector(txt.left, txt.top, txt.getScaledWidth(), txt.getScaledHeight(), txt, textOrder[i].rect);
                    //console.log('selected: ' + txt.text)
                    //indexes.push(i);
                }
            }

        }

        function getPointInText(rawX) {
            var position = 0;
            var totalW = text.left;
            for (var i = 0; i < text.text.length; i++) {
                totalW += getTextWidth(text.text[i]);
                if (totalW >= rawX) {
                    position = i;
                    break;
                }
            }
            return position;
        }

        function getTextWidth(t) {
            var tempText = new fabric.Text(t, {
                fontSize: text.fontSize,
                fontFamily: text.fontFamily
            });
            //tempText.font = text.font;
            return tempText.getScaledWidth();
        }

        function getXByPosition(position) {
            var totalW = text.left;
            for (var i = 0; i < position; i++) {
                totalW += getTextWidth(text.text[i]);
            }
            return totalW;
        }

        function selectorByPosition(initialPosition, lastPosition) {
            var selectedTextWidth = getTextWidth(text.text.substring(initialPosition, lastPosition));
            var initialX = getXByPosition(initialPosition);
            var lastX = getXByPosition(lastPosition + 1);
            //console.log("draw: " + JSON.stringify({fill: '#ace', opacity: 0.5, left: initialX || 0, top: text.top-1 || 0, width: lastX - initialX || 0, height: textHeight || 0}));
            fabSelectorGroup.remove(fabSelectorRect);
            canv.remove(fabSelectorRect);
            //fabSelectorRect = new fabric.Rect({fill: '#ace', opacity: 0.5, left: initialX || 0, top: text.top-1 || 0, width: lastX - initialX || 0, height: textHeight || 0});
            fabSelectorRect.setOptions({
                fill: '#ace',
                opacity: 0.5,
                left: initialX || 0,
                top: text.top - 1 || 0,
                width: lastX - initialX || 0,
                height: textHeight || 0
            })

            canv.add(fabSelectorRect);
        }

        function getXByPositionPrecise(position) {
            var totalW = text.left;
            var end = position - text.left;
            var i = 0
            while (totalW < position) {
                totalW += getTextWidth(text.text[i]);
                i++;
            }
            return totalW;
        }

        function getPreciseXRange(start, width) {
            return {
                x1: getXByPositionPrecise(start),
                x2: getXByPositionPrecise(text.left + width) - start
            }
        }

        function selector(x, y, width, height, txt, rect) {
            var selRect = rect ? rect : fabSelectorRect;
            var _text = txt ? txt : text;
            //console.log(width)
            x = x < _text.left ? _text.left : x;
            var initX = getXByPosition(getPointInText(x));
            var lastX = getXByPosition(getPointInText(x + width));
            width = x + width > _text.left + _text.getScaledWidth() ? (_text.left + _text.getScaledWidth()) - x : width;

            canv.remove(selRect);
            removeSelectedRect(selRect);
            selRect.setOptions({
                fill: '#ace',
                opacity: 0.5,
                left: x || 0,
                top: y - 1 || 0,
                width: width || 0,
                height: height || 0,
                angle: _text.angle
            })

            canv.add(selRect);
            selectedRects.push(selRect);

            //console.log(_text.text + ' - top: '+ (y - 1) + JSON.stringify(fabHighlighterRect))
        }

    }

    function removeTextAnnotation(value) {
        textAnnotations = textAnnotations.filter((val) => {
            return val.uuid != value.uuid;
        })
    }

    function removeSelectedRect(value) {
        selectedRects = selectedRects.filter((val) => {
            return val.uuid != value.uuid;
        })
    }



    function generateUUID() {
        var d = new Date().getTime();
        if (window.performance && typeof window.performance.now === "function") {
            d += performance.now(); //use high-precision timer if available
        }
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }

    function initSignatureCanvas(){
        var canvas = document.getElementById('sig-canv');
        var canvStyles = window.getComputedStyle(canvas);
        var wid = canvStyles.getPropertyValue('width').replace('px', '');
        var hei = canvStyles.getPropertyValue('height').replace('px', '');
        signatureCanvas = new fabric.Canvas('sig-canv', {
            width: wid,
            height: hei
        });
        signatureCanvas.isDrawingMode = true;
        signatureCanvas.freeDrawingBrush.color = AnnotationsConfig.SIGNATURE.stroke;
        signatureCanvas.freeDrawingBrush.width = AnnotationsConfig.SIGNATURE.strokeWidth;
        signatureCanvas.renderAll();

        
        var annotOverlay = document.querySelector('#annotOverlayContainer');
        var signatureOverlay = document.getElementById('signatureOverlay');
        signatureOverlay.querySelector('#clear-sign').addEventListener('click', function(){
            signatureCanvas.getObjects().forEach((obj) => {
                var c = obj.canvas
                c.remove(obj);
                signatureCanvas.requestRenderAll();
            });
            signatureCanvas.clear();
            signatureCanvas.renderAll();
        })
        signatureOverlay.querySelector('#sign-submit').addEventListener('click', function(){
            var objs = signatureCanvas.getObjects();
            if(objs.length > 0){
                var inks = [];
                objs.forEach((obj) => {
                    obj.setCoords();
                    inks.push(obj);
                });
                currentSignature = new fabric.Group(inks, {
                    stroke: AnnotationsConfig.SIGNATURE.stroke,
                    strokeWidth : AnnotationsConfig.SIGNATURE.strokeWidth,
                    opacity: AnnotationsConfig.SIGNATURE.opacity
                });
                annotOverlay.classList.add('hidden');
                signatureOverlay.classList.add('hidden');
                signatureCanvas.getObjects().forEach((obj) => {
                    signatureCanvas.remove(obj);
                });
            }
        })
    }

    function initAnnotationsProps(){
        //Configure annotations properties controls
        var annotFillColor = new ColorPicker.Default('#annotx-fill', {
            color: 'white',
            format: 'rgba',
        });
        var annotBorderColor = new ColorPicker.Default('#annotx-border', {
            color: 'white',
            format: 'hex',
            hexOnly: true
        });
        //annotFillColor.options.palette.push()
        var strokeProp = document.querySelector('#rg-stroke');
        var opacityProp = document.querySelector('#rg-opacity');
        var fontSizeProp = document.querySelector('#rg-fontSize');

        annotFillColor.on('change', function(color){
            if(canvActiveObject && AnnotationsConfig[canvActiveObject.atype.toUpperCase()]['fill'] != null){
                canvActiveObject.set('fill', color.rgba);
                AnnotationsConfig[canvActiveObject.atype.toUpperCase()].fill = color.rgba;
                if(canvActiveObject.atype == AnnotationTypes.HIGHLIGHT || canvActiveObject.atype == AnnotationTypes.STRIKE || canvActiveObject.atype == AnnotationTypes.UNDERLINE){
                    canvActiveObject.getObjects().forEach((obj) =>{
                        obj.set('fill', color.rgba);
                    })
                }
                canvActiveObject.canvas.requestRenderAll();
                raiseEvent(AnnotationEvents.OBJECTMODIFIED, canvActiveObject);
            }
        });
        annotBorderColor.on('change', function(color){
            if(canvActiveObject && AnnotationsConfig[canvActiveObject.atype.toUpperCase()]['stroke'] != null){
                canvActiveObject.set('stroke', color.rgb);
                AnnotationsConfig[canvActiveObject.atype.toUpperCase()].stroke = color.rgb;
                if(canvActiveObject.atype == AnnotationTypes.HIGHLIGHT || canvActiveObject.atype == AnnotationTypes.STRIKE || canvActiveObject.atype == AnnotationTypes.UNDERLINEE || canvActiveObject.atype == AnnotationTypes.SIGNATURE || canvActiveObject.atype == AnnotationTypes.ARROW){
                    canvActiveObject.getObjects().forEach((obj) =>{
                        obj.set('stroke', color.rgb);
                        if(obj.id == 'arrow_triangle'){
                            obj.set('fill', color.rgb);
                        }
                    })
                }
                canvActiveObject.canvas.requestRenderAll();
                raiseEvent(AnnotationEvents.OBJECTMODIFIED, canvActiveObject);
            }
        });
        
        strokeProp.addEventListener('change', function(){
            if(canvActiveObject){
                raiseEvent(AnnotationEvents.OBJECTMODIFIED, canvActiveObject);
            }
        })

        strokeProp.addEventListener('input', function(){
            if(canvActiveObject && AnnotationsConfig[canvActiveObject.atype.toUpperCase()]['strokeWidth'] != null){
                canvActiveObject.set('strokeWidth', parseInt(strokeProp.value));
                if(canvActiveObject.atype == AnnotationTypes.ARROW){
                    canvActiveObject.getObjects().forEach((obj) =>{
                        obj.set('strokeWidth', parseInt(strokeProp.value));
                    })
                }
                if( canvActiveObject.atype == AnnotationTypes.SIGNATURE){
                    canvActiveObject.getObjects().forEach((obj) =>{
                        obj.set('strokeWidth', parseInt(strokeProp.value));
                    })
                }
                AnnotationsConfig[canvActiveObject.atype.toUpperCase()].strokeWidth = parseInt(strokeProp.value);
                canvActiveObject.canvas.requestRenderAll();
                canvActiveObject.setCoords();
            }
        })
        opacityProp.addEventListener('change', function(){
            if(canvActiveObject){
                raiseEvent(AnnotationEvents.OBJECTMODIFIED, canvActiveObject);
            }
        })
        opacityProp.addEventListener('input', function(){
            if(canvActiveObject && AnnotationsConfig[canvActiveObject.atype.toUpperCase()]['opacity'] != null){
                canvActiveObject.opacity = opacityProp.value/100;
                AnnotationsConfig[canvActiveObject.atype.toUpperCase()].opacity = opacityProp.value/100;
                if(canvActiveObject.atype == AnnotationTypes.HIGHLIGHT || canvActiveObject.atype == AnnotationTypes.STRIKE || canvActiveObject.atype == AnnotationTypes.UNDERLINE || canvActiveObject.atype == AnnotationTypes.SIGNATURE){
                    canvActiveObject.getObjects().forEach((obj) =>{
                        obj.set('opacity', opacityProp.value/100);
                    })
                }
                canvActiveObject.canvas.requestRenderAll();
            }
        })
        fontSizeProp.addEventListener('change', function(){
            if(canvActiveObject){
                raiseEvent(AnnotationEvents.OBJECTMODIFIED, canvActiveObject);
            }
        })
        fontSizeProp.addEventListener('input', function(){
            if(canvActiveObject && AnnotationsConfig[canvActiveObject.atype.toUpperCase()]['fontSize'] != null){
                canvActiveObject.set('fontSize', parseInt(fontSizeProp.value));
                AnnotationsConfig[canvActiveObject.atype.toUpperCase()].fontSize = parseInt(fontSizeProp.value);
                canvActiveObject.canvas.requestRenderAll();
            }
        })
    }


    function initAnnotActions() {

        var cursorTool = document.querySelector('#cursorSelectTool');
        var handTool = document.querySelector('#cursorHandTool');

        var cursorClick = function (e) {
            document.querySelectorAll('#toolbarViewerAnnots .toolbarButton.toggled').forEach((k) => {
                var popup = k.querySelector('#' + k.getAttribute('data-ref'))
                k.classList.remove('toggled');
                if (popup) {
                    popup.classList.remove('show');
                }
            });
            e.target.classList.add('toggled');
            // selectedAnnotationType = AnnotationTypes.NONE;
            // cursorMode = CursorModes.NORMAL;
            setAnnotationMode({type: AnnotationTypes.NONE, cursor: CursorModes.NORMAL});
        }
        cursorTool.addEventListener('click', cursorClick);
        handTool.addEventListener('click', cursorClick);


        var textToolsBtn = document.querySelector('#annotx-textTools');
        var textToolsPopOver = textToolsBtn.querySelector('#annot-text-tools');
        var shapesBtn = document.querySelector('#annotx-shapes');
        var shapesPop = shapesBtn.querySelector('#annot-shapes');
        // var pencilBtn = document.querySelector('#annotx-freeHand');
        // var signatureBtn = document.querySelector('#annotx-signature');
        // var notesBtn = document.querySelector('#annotx-notes');
        // var textBtn = document.querySelector('#annotx-text');
        // var textBtn = document.querySelector('#annotx-text');
        // var textBtn = document.querySelector('#annotx-text');
        // var textBtn = document.querySelector('#annotx-text');
        // var textBtn = document.querySelector('#annotx-text');
        // var textBtn = document.querySelector('#annotx-text');

        var annotBtnModes = {
            "annotx-textTools": {},
            "annotx-shapes": {},
            "annotx-freeHand": {
                type: AnnotationTypes.INK,
                cursor: CursorModes.DRAW
            },
            "annotx-signature": {
                type: AnnotationTypes.SIGNATURE,
                cursor: CursorModes.DRAW
            },
            "annotx-notes": {
                type: AnnotationTypes.NOTE,
                cursor: CursorModes.DRAW
            },
            "annotx-text": {
                type: AnnotationTypes.TEXT,
                cursor: CursorModes.DRAW
            },
            "annotx-stamp": {
                type: AnnotationTypes.STAMP,
                cursor: CursorModes.DRAW
            },
            "highlightToolButton": {
                type: AnnotationTypes.HIGHLIGHT,
                cursor: CursorModes.NORMAL
            },
            "underlineToolButton": {
                type: AnnotationTypes.UNDERLINE,
                cursor: CursorModes.NORMAL
            },
            "strikeoutToolButton": {
                type: AnnotationTypes.STRIKE,
                cursor: CursorModes.NORMAL
            },
            "rectangleToolButton": {
                type: AnnotationTypes.RECT,
                cursor: CursorModes.DRAW
            },
            "ellipseToolButton": {
                type: AnnotationTypes.ELLIPSE,
                cursor: CursorModes.DRAW
            },
            "lineToolButton": {
                type: AnnotationTypes.LINE,
                cursor: CursorModes.DRAW
            },
            "arrowToolButton": {
                type: AnnotationTypes.ARROW,
                cursor: CursorModes.DRAW
            }

        }

        //Annotation buttons with popups

        // var popButtons = [{
        //         button: textToolsBtn,
        //         popup: textToolsPopOver
        //     },
        //     {
        //         button: shapesBtn,
        //         popup: shapesPop
        //     }
        // ]
        // for (var index in popButtons) {
        //     let button = popButtons[index].button;
        //     let popup = popButtons[index].popup;
        //     button.addEventListener('click', function (e) {
        //         console.log(e);
        //         //var popup = button.querySelector('#' + button.getAttribute('data-ref'))
        //         if (popup) {
        //             popup.classList.contains('show') ? popup.classList.remove('show') : popup.classList.add('show');
        //         }
        //         var selectedPopupAnnot = button.querySelector('.annotButton.active');
        //         if (selectedPopupAnnot) {
        //             var mode = annotBtnModes[selectedPopupAnnot.getAttribute('data-element')];
        //             if (mode) {
        //                 selectedAnnotationType = mode.type;
        //                 cursorMode = mode.cursor;
        //             }
        //         }
        //     });
        //     button.querySelectorAll('.annotButton').forEach((e) => {
        //         e.addEventListener('click', function (e2) {
        //             e2.stopImmediatePropagation();
        //             var activeEle = button.querySelector('.annotButton.active');
        //             activeEle ? activeEle.classList.remove('active') : null;
        //             e.classList.add('active');
        //             var icon = e.querySelector('.annotIcon');
        //             button.querySelector('.mAnnotIcon').innerHTML = icon.innerHTML;
        //             var mode = annotBtnModes[e.getAttribute('data-element')];
        //             if (mode) {
        //                 selectedAnnotationType = mode.type;
        //                 cursorMode = mode.cursor;
        //             }
        //         });
        //     })
        // }

        //Whwn clicking on any annotation tool
        document.querySelectorAll('#toolbarViewerAnnots .toolbarButton').forEach((button) => {
            button.addEventListener('click', function (e2) {
                var popShown = false
                document.querySelectorAll('#toolbarViewerAnnots .toolbarButton.toggled').forEach((k) => {
                    var popup = k.querySelector('#' + k.getAttribute('data-ref'))
                    if(k == button){
                        if(popup){
                            popShown = popup.classList.contains('show');
                        }
                        return;
                    }
                    k.classList.remove('toggled');
                    if (popup) {
                        popup.classList.remove('show');
                    }
                });

                //Take pdfviewer back to cursor mode; just incase it was in any other mode
                //_dispatchEvent('switchcursortool', {tool: 0});
                cursorTool.click();
                cursorTool.classList.remove('toggled');

                //wait for cursor change
                var mode = annotBtnModes[button.getAttribute('id')];
                setTimeout(() => {
                    var popup = button.querySelector('#' + button.getAttribute('data-ref'))
                    if (popup) {
                        //popup.classList.contains('show') || popShown ? popup.classList.remove('show') : popup.classList.add('show');
                        var selectedPopupAnnot = button.querySelector('.annotButton.active');
                        if (selectedPopupAnnot) {
                            mode = annotBtnModes[selectedPopupAnnot.getAttribute('data-element')];
                        }
                    }
                    setAnnotationMode(mode);
                    if(!button.classList.contains('no-tog')){
                        button.classList.add('toggled');
                    }
                }, 200);
                if(mode.type == AnnotationTypes.SIGNATURE){
                    //Show signature overlay
                    var annotOverlay = document.getElementById('annotOverlayContainer');
                    var signOverlay = document.getElementById('signatureOverlay');
                    annotOverlay && signOverlay ? annotOverlay.classList.remove('hidden') || signOverlay.classList.remove('hidden') : '';
                    if(signatureCanvas){
                        var back = document.getElementById('sig-background');
                        var canvStyles = window.getComputedStyle(back);
                        var wid = canvStyles.getPropertyValue('width').replace('px', '');
                        var hei = canvStyles.getPropertyValue('height').replace('px', '');
                        signatureCanvas.setDimensions({
                            width: wid,
                            height: hei
                        });
                        signatureCanvas.freeDrawingBrush.color = AnnotationsConfig.SIGNATURE.stroke;
                        signatureCanvas.freeDrawingBrush.width = AnnotationsConfig.SIGNATURE.strokeWidth;
                    }
                }
            })
            button.querySelectorAll('.annotButton').forEach((subAnnot) => {
                subAnnot.addEventListener('click', function (e2) {
                    e2.stopImmediatePropagation();
                    var activeEle = button.querySelector('.annotButton.active');
                    activeEle ? activeEle.classList.remove('active') : null;
                    subAnnot.classList.add('active');
                    var icon = subAnnot.querySelector('.annotIcon');
                    button.querySelector('.mAnnotIcon').innerHTML = icon.innerHTML;
                    var mode = annotBtnModes[subAnnot.getAttribute('data-element')];
                    setAnnotationMode(mode);
                    // if (mode) {
                    //     selectedAnnotationType = mode.type;
                    //     cursorMode = mode.cursor;
                    //     checkInkMode();
                    // }
                });
            })
        });

        //Setting icons for annotation types from dom
        var annotConfigKeys = Object.keys(AnnotationsConfig);
        annotConfigKeys.forEach((k) =>{
            var ele = document.querySelector("[ic-a-type='" + k.toLowerCase() +"']");
            if(ele){
                AnnotationsConfig[k].icon = ele.innerHTML;
            }
        })

        function setAnnotationMode(mode){
            if (mode) {
                this.selectedAnnotationType = mode.type;
                this.cursorMode = mode.cursor;

                pageCanvs.forEach((pc) => {
                    deSelectActiveObjects(pc);
                    pc.canv.isDrawingMode = false;
                    if(cursorMode == CursorModes.DRAW){
                        pc.canv.hoverCursor = CursorModes.DRAW;
                        pc.canv.defaultCursor = CursorModes.DRAW;
                        if (selectedAnnotationType == AnnotationTypes.INK) {
                            pc.canv.isDrawingMode = true;
                            pc.canv.freeDrawingBrush.color = AnnotationsConfig.INK.stroke;
                            pc.canv.freeDrawingBrush.width = AnnotationsConfig.INK.strokeWidth;
                        }
                    }else{
                        pc.canv.hoverCursor = CursorModes.DEFAULT;
                        pc.canv.defaultCursor = CursorModes.DEFAULT;
                    }
                });
            }
        }
    }

    function deSelectActiveObjects(canv){
        var canvs = [];
        canv ? canvs.push(canv) : canvs = pageCanvs;
        canvs.forEach((pc) => {
            pc.canv.discardActiveObject();
            pc.canv.requestRenderAll();
            canvActiveObject = null;
        })
    }

    function initAnnotationsList(){
        PDFViewerApplication.pdfDocument.getPage(3).then((obj) => {
            console.log(obj);
        })
    }

    function gup(name, url) {
        if (!url) url = location.href;
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(url);
        return results == null ? null : results[1];
    }

    function raiseEvent(eventname, eventdata) {
        if(self != top){
            parent.postMessage({event: eventname, data: eventdata},"*");
        }else{
            var event = document.createEvent('CustomEvent');
            event.initCustomEvent(eventname, false, false, eventdata);
            window.dispatchEvent(event);
        }
    }
    
}();

