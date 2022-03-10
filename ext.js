const goNext = () => {
    const next = document.querySelector('#nav-links-top .search-seq-nav .next');

    if (next) {
        next.click();
    }
}

const goPrev = () => {
    const prev = document.querySelector('#nav-links-top .search-seq-nav .prev');

    if (prev) {
        prev.click();
    }
}

document.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'ArrowRight': {
            goNext();
            break;
        }
        case 'ArrowLeft': {
            goPrev();
            break;
        }
    }
})