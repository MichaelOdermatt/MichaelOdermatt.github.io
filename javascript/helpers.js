/**
 * Takes an element and returns an object containing that element's coordinates relative to the document.
 * (taken from JQuery)
 * @param {*} element the element whose coordinates we want.
 * @returns the given elements coordinates relative to the document
 */
function getElementOffset(element) {
    // Return zeros for disconnected and hidden (display: none) elements (gh-2310)
    // Support: IE <=11 only
    // Running getBoundingClientRect on a
    // disconnected node in IE throws an error
    if (!element.getClientRects().length ) {
        return { top: 0, left: 0 };
    }

    // Get document-relative position by adding viewport scroll to viewport-relative gBCR
    let rect = element.getBoundingClientRect();
    let win = element.ownerDocument.defaultView;
    return {
        top: rect.top + win.pageYOffset,
        left: rect.left + win.pageXOffset
    };
}

// TODO extension method?
// TODO extract out similar code?
// Taken from here https://stackoverflow.com/questions/10787782/full-height-of-a-html-element-div-including-border-padding-and-margin
function getAbsoluteHieght(element) {
    var styles = window.getComputedStyle(element);
    var margin = parseFloat(styles['marginTop']) + parseFloat(styles['marginBottom']);
    return Math.ceil(element.offsetHeight + margin); 
}

function getAbsoluteWidth(element) {
    var styles = window.getComputedStyle(element);
    var margin = parseFloat(styles['marginLeft']) + parseFloat(styles['marginRight']);
    return Math.ceil(element.offsetWidth + margin); 
}