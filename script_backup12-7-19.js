(function AnnotX() {
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
        RECT: {
            fill: 'purple',
            stroke: '',
            opacity: 1
        },
        ELLIPSE: {
            fill: 'orange',
            stroke: '',
            opacity: 1
        },
        LINE: {
            fill: 'black',
            opacity: 1
        },
        HIGHLIGHT: {
            fill: '#fc3'
        },
        UNDERLINE: {
            fill: 'black',
            opacity: 1
        },
        STRIKE: {
            fill: 'red',
            opacity: 1
        },
        LINK: 'blue',
        TEXT: {
            fill: 'transparent',
            stroke: '',
            fontColor: 'black',
            fontSize: 12,
            opacity: 1
        },
        ARROW: {
            fill: 'green',
            opacity: 1,
            thickness: 1
        },
        INK: {
            fill: '#005E7A',
            opacity: 1,
            thickness: 10
        },
        NOTE: {
            fill: 'yellow'
        },
        STAMP: {
            opacity: 1
        }
    }
    //var canv;
    var pageCanvs = [];
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
    this.selectedAnnotationType = AnnotationTypes.HIGHLIGHT;
    var selectedFillColor = 'red';
    var selectedStrokeColor = 'red';
    var notePath = "M 2.1242662,289.72563 H 17.199746 17.115296 M 2.0609236,287.66067 H 13.715916 13.650626 M 7.4872517,285.97573 H 17.11529 17.061357 M 2.2298365,284.10076 h 9.7547225 -0.05464 m -0.483762,-1.87492 h 5.785268 -0.0324 M 2.1348231,280.35091 H 17.210302 17.125851 M 0.99440816,277.90215 c -0.51469605,0 -0.9275221,0.4131 -0.9275221,0.92758 v 12.45753 c 0,0.51471 0.41282596,0.93015 0.9275221,0.93015 H 1.9950871 l -0.2847884,2.39063 2.0353238,-2.39063 H 18.055591 c 0.514696,0 0.927523,-0.4158 0.927523,-0.93015 v -12.45753 c 0,-0.51471 -0.412821,-0.92758 -0.927523,-0.92758 z";

    var stampFileTypes = ['image/jpg', 'image/jpeg', 'image/png'];

    var textAnnotations = [];

    var canvasScale = 1;
    var orginalPageDimensions = {width: 0, height: 0};
    var originalOrientation = 'potrait';
    var currentPagesRotationAngle = 0;
    var lastPagesRotationAngle = 0;

    var annotations = [];
    //var pageRotationAngle = 0;

    //document.addEventListener('page-rotatecw', rotateListener);
    //document.addEventListener('page-rotateccw', rotateListener);

    var rotateListener = function(e){
        lastPagesRotationAngle = currentPagesRotationAngle;
        currentPagesRotationAngle = PDFViewerApplication.pdfViewer.pagesRotation;
    }

    document.addEventListener('text-rendered', function (event) {
        if (donePages.length == 0) {
            initAnnotActions();
            initAnnotationsList();
            var _layer = document.querySelector(".page[data-page-number='" + event.detail.pageNumber + "'] .textLayer");
            var _lWidth = parseFloat(_layer.style.width.replace('px', ''));
            var _lHeight = parseFloat(_layer.style.height.replace('px', ''));
            orginalPageDimensions.width = _lWidth;
            orginalPageDimensions.height = _lHeight;
            originalOrientation = _lHeight > _lWidth ? 'portrait':'landscape';
            lastPagesRotationAngle = PDFViewerApplication.pdfViewer.pagesRotation;
            currentPagesRotationAngle = lastPagesRotationAngle;
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
                console.log( "ratios:", ratio );
                scaleMultiplier = orientation == 'portrait' ? ratio[0] : ratio[1];

                var rotated = false;
                if(findCanv.canv.width == lHeight && findCanv.canv.height){
                    //page was rotated, no need to scale
                    rotated = true;
                    scaleMultiplier = 1;
                    console.log('Rotate Angle: ' + PDFViewerApplication.pdfViewer.pagesRotation);
                    var _angle = PDFViewerApplication.pdfViewer.pagesRotation;
                    if(_angle != currentPagesRotationAngle){
                        lastPagesRotationAngle = currentPagesRotationAngle;
                    }
                    currentPagesRotationAngle = PDFViewerApplication.pdfViewer.pagesRotation;
                }
                canvasScale = canvasScale * scaleMultiplier;

                findCanv.container.style.width = layer.style.width;
                findCanv.container.style.height = layer.style.height;
                
                findCanv.canv.setDimensions({width:lWidth, height:lHeight});

                var objects = findCanv.canv.getObjects();
                findCanv.canv.freeDrawingBrush.width = DefaultObjectColor.INK.thickness * canvasScale;

                degrees = PDFViewerApplication.pdfViewer.pagesRotation;
                console.log("cwid: " + findCanv.canv.getWidth());
                console.log("lwidth "+ lWidth);
                let canvasCenter = new fabric.Point(findCanv.canv.getWidth() / 2, findCanv.canv.getHeight() / 2) // center of canvas
                let radians = fabric.util.degreesToRadians(degrees)

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
                        let objectOrigin = new fabric.Point(obj.left, obj.top)
                        let new_loc = fabric.util.rotatePoint(objectOrigin, canvasCenter, radians)
                        obj.top = new_loc.y
                        obj.left = new_loc.x
                        obj.angle += degrees //rotate each object by the same angle
                        obj.setCoords()
                    }
                });
                // for (var i in objects) {
                //     var scaleX = objects[i].scaleX;
                //     var scaleY = objects[i].scaleY;
                //     var left = objects[i].left;
                //     var top = objects[i].top;
                    
                //     var tempScaleX =  scaleX * scaleMultiplier;
                //     var tempScaleY =  scaleY * scaleMultiplier;
                //     var tempLeft = left * scaleMultiplier;
                //     var tempTop = top * scaleMultiplier;

                //     if(rotated){
                //         var tempWidth = objects[i].width;
                //         objects[i].rotate(PDFViewerApplication.pdfViewer.pagesRotation);
                //         //findCanv.canv.renderAll();
                //         var _tempTop = tempTop;
                //         if(i == objects.length - 1){
                //             console.log('last');
                //             var _height = objects[i].height
                //             console.log(_height);
                //         }
                //         switch (PDFViewerApplication.pdfViewer.pagesRotation) {
                //             case 0:
                //                 if(lastPagesRotationAngle == 90){
                //                     tempTop = Math.abs(lHeight - tempLeft);
                //                     tempLeft = _tempTop;
                //                 }else if(lastPagesRotationAngle == 270){
                //                     tempTop = tempLeft;
                //                     tempLeft = Math.abs(lHeight - _tempTop);
                //                 }
                //                 break;
                //             case 90:
                //                 if(lastPagesRotationAngle == 0){
                //                     tempTop = tempLeft;
                //                     tempLeft = Math.abs(lWidth - _tempTop);
                //                 }else if(lastPagesRotationAngle == 180){

                //                 }
                //                 break;
                //             case 180:

                //                 break;
                //             case 270:
                //                 if(lastPagesRotationAngle == 0){
                //                     var _width = objects[i].width
                //                     tempTop = Math.abs(lHeight - (tempLeft + _width));
                //                     tempLeft = _tempTop;
                //                 }else if(lastPagesRotationAngle == 180){

                //                 }
                //                 break;
                //             default:
                //                 break;
                //         }
                //     }
                //     // if(rotated && orientation == 'potrait' && originalOrientation == 'landscape' ){

                //     // }
                    
                //     objects[i].scaleX = tempScaleX;
                //     objects[i].scaleY = tempScaleY;
                //     objects[i].left = tempLeft;
                //     objects[i].top = tempTop;

                //     //if(PDFViewerApplication.pdfViewer.pagesRotation != 0){
                //         //page is rotated
                        
                //     //}
                    
                //     objects[i].setCoords();
                // }

                findCanv.canv.renderAll();
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
            canv.freeDrawingBrush.color = DefaultObjectColor.INK.fill;
            canv.freeDrawingBrush.width = DefaultObjectColor.INK.thickness;
        }

        canv.on({
            'mouse:down': function (e) {
                console.log("down");
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
                                fill: DefaultObjectColor.RECT.fill,
                                width: 0,
                                height: 0
                            });
                            canv.add(currentRectDraw);
                            break;
                        case AnnotationTypes.ELLIPSE:
                            currentCircleDraw = new fabric.Ellipse({
                                left: e.pointer.x,
                                top: e.pointer.y,
                                originX: 'left',
                                originY: 'top',
                                rx: 0,
                                ry: 0,
                                fill: DefaultObjectColor.ELLIPSE.fill,
                                type: 'ellipse'
                            });
                            canv.add(currentCircleDraw);
                            break;
                        case AnnotationTypes.LINE:
                            var points = [e.pointer.x, e.pointer.y, e.pointer.x, e.pointer.y];
                            currentPlainLineDraw = new fabric.Line(points, {
                                strokeWidth: 2,
                                fill: DefaultObjectColor.LINE.fill,
                                stroke: DefaultObjectColor.LINE.fill,
                                originX: 'left',
                                originY: 'center',
                                id: 'line',
                                type: 'line',
                                lockScalingX: true,
                                lockScalingY: true
                            });
                            canv.add(currentPlainLineDraw);
                            break;
                        case AnnotationTypes.ARROW:
                            var points = [e.pointer.x, e.pointer.y, e.pointer.x, e.pointer.y];
                            currentLineDraw = new fabric.Line(points, {
                                strokeWidth: 2,
                                fill: DefaultObjectColor.ARROW.fill,
                                stroke: DefaultObjectColor.ARROW.fill,
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
                                lockScalingX: true,
                                selectable: false,
                                pointType: 'arrow_start',
                                angle: -45,
                                width: 10,
                                height: 10,
                                fill: DefaultObjectColor.ARROW.fill,
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
                                fontSize: 12,
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
                                fill: DefaultObjectColor.NOTE.fill,
                                stroke: 'black',
                                opacity: 1,
                                left: centerX,
                                top: centerY
                            });
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
                                                    opacity: DefaultObjectColor.STAMP.opacity
                                                });
                                                restrictObjectBounds(oImg);

                                                canv.add(oImg);
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
                console.log("up");
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
                            if (dx > 0 || dy > 0) {
                                currentPlainLineDraw.clone((clone) => {
                                    canv.remove(currentPlainLineDraw);
                                    clone.set({
                                        lockScalingX: true,
                                        lockScalingY: true
                                    })
                                    confClone(clone);
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
                                    lockScalingY: true
                                });
                                canv.remove(currentLineDraw);
                                canv.remove(currentTriangleDraw);
                                confClone(group);
                            } else {
                                canv.remove(currentLineDraw);
                                canv.remove(currentTriangleDraw);
                            }
                            break;
                        case AnnotationTypes.INK:
                            //canv.isDrawingMode = false;
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
                                currentRectDraw.set({
                                    width: Math.abs(drawStartPoint.x - e.pointer.x),
                                    height: Math.abs(drawStartPoint.y - e.pointer.y)
                                })
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
                        }
                        canv.renderAll();
                    }
                }
            },
            'selection:created': function (e) {
                //console.log(e);
                confClone(e.target);
                canvActiveObject = e.target;
                e.target.hoverCursor = CursorModes.MOVE;
            },
            'selection:cleared': function (e) {
                //console.log(e);
                canvActiveObject.hoverCursor = CursorModes.POINTER;
                canvActiveObject = null;
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
                e.target.hoverCursor = CursorModes.POINTER;
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
            },
            'object:rotating': function (e) {
                //console.log(e);
                canvObjRotating = true;
            },
            'object:rotated': function (e) {
                //console.log(e);
                canvObjRotating = false;
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


        //console.log(elements[0]);
        for (var i = 0; i < elements.length; i++) {
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
            var text = new fabric.Text(ele.innerText.trim(), {
                top: top,
                left: left,
                fontSize: fontSize,
                fontFamily: fontFamily,
                opacity: 0
            });
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
        //console.log(textOrder);

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

        function confClone(clone) {
            clone.hoverCursor = CursorModes.POINTER;
            canv.add(clone);
            setObjectCorners(clone);
        }

        function addTextAnnotations() {
            var txtAnnots = [];
            var selAnnot = selectedAnnotationType;
            selectedRects.forEach((r) => {
                if (selAnnot == AnnotationTypes.HIGHLIGHT) {
                    var highlight = new fabric.Rect({
                        fill: DefaultObjectColor.HIGHLIGHT,
                        opacity: 0.4,
                        rx: 5,
                        ry: 5,
                        left: r.get('left'),
                        top: r.get('top'),
                        width: r.get('width'),
                        height: r.get('height')
                    });
                    txtAnnots.push(highlight);
                } else if (selAnnot == AnnotationTypes.UNDERLINE) {
                    var underline = new fabric.Line([r.get('left'), r.get('top') + r.get('height') - 1, r.get('left') + r.get('width'), r.get('top') + r.get('height') - 1], {
                        stroke: DefaultObjectColor.UNDERLINE,
                        fill: DefaultObjectColor.UNDERLINE
                    });
                    txtAnnots.push(underline);
                } else if (selAnnot == AnnotationTypes.STRIKE) {
                    var strike = new fabric.Line([r.get('left'), r.get('top') + (r.get('height') / 2) + 1, r.get('left') + r.get('width'), r.get('top') + (r.get('height') / 2) + 1], {
                        stroke: DefaultObjectColor.STRIKE,
                        fill: DefaultObjectColor.STRIKE
                    });
                    txtAnnots.push(strike);
                }
            });
            console.log(txtAnnots);
            var groupTextAnnotations = new fabric.Group(txtAnnots, {
                lockScalingY: true,
                lockScalingX: true,
                hasControls: false,
                lockMovementX: true,
                lockMovementY: true
            });
            canv.add(groupTextAnnotations);
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
        obj.set({
            borderColor: 'red',
            cornerColor: 'green',
            cornerSize: 6,
            transparentCorners: false
        });
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
            opacity: 0.5
        });
        var fabHighlighterRect = new fabric.Rect({
            fill: '#fc3',
            opacity: 0.5,
            rx: 5,
            ry: 5
        });
        var fabTextUnderline = new fabric.Line({
            fill: DefaultObjectColor.UNDERLINE
        });
        var fabStrikeOutLine = new fabric.Line({
            fill: DefaultObjectColor.STRIKE
        });
        var fabSquigglyLine = new fabric.Line({
            fill: DefaultObjectColor.UNDERLINE
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
                if (cursorMode == CursorModes.NORMAL) {
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
            if (cursorMode == CursorModes.NORMAL) {
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
                height: height || 0
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
            "annotx-signature": {},
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
                setTimeout(() => {
                    var mode = annotBtnModes[button.getAttribute('id')];
                    var popup = button.querySelector('#' + button.getAttribute('data-ref'))
                    if (popup) {
                        popup.classList.contains('show') || popShown ? popup.classList.remove('show') : popup.classList.add('show');
                        var selectedPopupAnnot = button.querySelector('.annotButton.active');
                        if (selectedPopupAnnot) {
                            mode = annotBtnModes[selectedPopupAnnot.getAttribute('data-element')];
                        }
                    }
                    setAnnotationMode(mode);
                    // if (mode) {
                    //     selectedAnnotationType = mode.type;
                    //     cursorMode = mode.cursor;
                    // }
                    button.classList.add('toggled');
                }, 200)
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


        function setAnnotationMode(mode){
            if (mode) {
                selectedAnnotationType = mode.type;
                cursorMode = mode.cursor;
                if (selectedAnnotationType == AnnotationTypes.INK && cursorMode == CursorModes.DRAW) {
                    pageCanvs.forEach((pc) => {
                        pc.canv.isDrawingMode = true;
                        pc.canv.freeDrawingBrush.color = DefaultObjectColor.INK.fill;
                        pc.canv.freeDrawingBrush.width = DefaultObjectColor.INK.thickness;
                    })
                }else{
                    pageCanvs.forEach((pc) => {
                        pc.canv.isDrawingMode = false;
                    })
                }
            }
        }

    }

    function initAnnotationsList(){
        PDFViewerApplication.pdfDocument.getPage(3).then((obj) => {
            console.log(obj);
        })
    }

    function _dispatchEvent(eventname, eventdata) {
        var event = document.createEvent('CustomEvent');
        event.initCustomEvent(eventname, false, false, eventdata);
        window.dispatchEvent(event);
    }
})()