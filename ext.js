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

const goNextInPool = () => {
    const next = document.querySelector('#nav-links-top .pool-nav .next');

    if (next) {
        next.click();
    }
}
const goPrevInPool = () => {
    const prev = document.querySelector('#nav-links-top .pool-nav .prev');

    if (prev) {
        prev.click();
    }
}
const goFirstInPool = () => {
    const first = document.querySelector('#nav-links-top .pool-nav .first');

    if (first) {
        first.click();
    }
}
const goLastInPool = () => {
    const last = document.querySelector('#nav-links-top .pool-nav .last');

    if (last) {
        last.click();
    }
}

document.addEventListener('keyup', (e) => {
    const hasSearch = !!document.querySelector('#nav-links-top .search-seq-nav');
    const hasPool = !!document.querySelector('#nav-links-top .pool-nav');

    const isShift = e.shiftKey;

    const goSearch = isShift && !hasPool && hasSearch || !isShift && hasSearch
    const goPool = hasPool && (!hasSearch || hasSearch && isShift);

    switch(e.key) {
        case 'ArrowRight': {
            if (goSearch) {
                goNext();
                break;
            }

            if (goPool) {
                goNextInPool();
            }

            break;
        }
        case 'ArrowLeft': {
            if (goSearch) {
                goPrev();
                break;
            }

            if (goPool) {
                goPrevInPool();
            }

            break;
        }

        case 'ArrowUp': {
            if (goPool && isShift) {
                goLastInPool();
            }

            break;
        }
        case 'ArrowDown': {
            if (goPool && isShift) {
                goFirstInPool();
            }

            break;
        }
    }
})