window.onload = function(){
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
    })
}