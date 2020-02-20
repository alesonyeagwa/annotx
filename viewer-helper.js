window.onload = function(){

    //DropDown helper
    var poppers = document.querySelectorAll('.annotx-popper');
    var dropDowns = document.querySelectorAll('.annotx-popper .dropdown');
    dropDowns.forEach((d) => {
        d.style.display = 'none';
    })
    poppers.forEach((p) => {
        var dropDown = p.querySelector('.dropdown');
        p.addEventListener('click', function(e){
            //e.stopPropagation();
            if(dropDown){
                dropDown.style.display = 'block';
            }
        })
        p.addEventListener('focusout', function(e){
            if(!p.contains(e.relatedTarget)){
                dropDown.style.display = 'none';
            }
        })
    });

    //Range update helper
    var ranges = document.querySelectorAll('.annotx-slider');
    ranges.forEach((r) => {
        var rangeValue = r.parentNode.querySelector('.range-value');
        var unit = rangeValue ? rangeValue.getAttribute('unit') : '';
        r.addEventListener('input', function(){
            if(rangeValue){
                rangeValue.innerHTML = r.value + unit;
            }
        })
    });

    //Overlay Helper
    var overlayClosers = document.querySelectorAll('.overlayClose');
    var annotOverlay = document.querySelector('#annotOverlayContainer');
    overlayClosers.forEach((oc) =>{
        var currentOverlay = document.getElementById(oc.getAttribute('d-ol'));
        oc.addEventListener('click', function(){
            annotOverlay.classList.add('hidden');
            currentOverlay.classList.add('hidden');
        })
    })

}