'use strict';
const switcher = document.querySelector('.btn');
switcher.addEventListener('click', function () {
    document.body.classList.toggle('light-theme');
    document.body.classList.toggle('dark-theme');
    let className = document.body.className;
    if (className === "light-theme") {
        switcher.textContent = "Dark";
    } else {
        switcher.textContent = "Light";
    }
    console.log(`current class name: ${className}`);
});
