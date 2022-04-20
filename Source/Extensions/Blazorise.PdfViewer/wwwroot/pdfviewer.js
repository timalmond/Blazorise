import "./vendors/pdf.min.js?v=1.0.3.0";
import "./vendors/pdf.worker.min.js?v=1.0.3.0";
document.getElementsByTagName("head")[0].insertAdjacentHTML("beforeend", "<link rel=\"stylesheet\" href=\"_content/Blazorise.PdfViewer/vendors/pdf_viewer.min.css?v=1.0.3.0\" />");
document.getElementsByTagName("head")[0].insertAdjacentHTML("beforeend", "<link rel=\"stylesheet\" href=\"_content/Blazorise.PdfViewer/pdfviewer.css?v=1.0.3.0\" />");

pdfjsLib.GlobalWorkerOptions.workerSrc = '_content/Blazorise.PdfViewer/vendors/pdf.worker.min.js';

import { getRequiredElement } from "../Blazorise/utilities.js?v=1.0.3.0";

const _instances = [];

export function initialize(dotNetObjectRef, element, elementId, options) {
    element = getRequiredElement(element, elementId);

    if (!element) {
        return;
    }

    const instance = {
        dotNetObjectRef: dotNetObjectRef,
        element: element,
        elementId: elementId,
        pageNum: options.pageNum || 1,
        pageNums: [],
        pageRendering: false,
        pageNumPending: null,
        options: options
    };

    _instances[elementId] = instance;

    loadPdf(instance, options.source, 1);
}

export function destroy(element, elementId) {
    const instance = _instances[elementId];

    if (instance) {
        if (instance.loadingTask) {
            instance.loadingTask.destroy();
        }

        delete _instances[elementId];
    }
}

export function setSource(elementId, source) {
    element = getRequiredElement(element, elementId);

    if (!element) {
        return;
    }

    const instance = _instances[element.id];

    if (instance) {
        loadPdf(instance, source, 1);
    }
}

function loadPdf(instance, source, pageNum) {
    if (instance.loadingTask) {
        instance.loadingTask.destroy();
    }

    instance.loadingTask = pdfjsLib.getDocument({ url: source });

    instance.loadingTask.promise.then(function (pdf) {
        instance.pdf = pdf;
        instance.pageNum = pageNum;
        instance.numPages = pdf.numPages;

        for (let i = 1; i <= pdf.numPages; i++) {
            getOrAddPageElement(instance, i);
        }

        if (instance.dotNetObjectRef) {
            instance.dotNetObjectRef.invokeMethodAsync('NotifyPageCount', pdf.numPages);
        }

        generateEmptyPage(instance, pageNum);
    });
}

function generateEmptyPage(instance, pageNum) {
    instance.pageRendering = true;

    instance.pdf.getPage(pageNum).then(function (page) {
        const viewport = page.getViewport({ scale: instance.options.scale });

        const pageElement = getOrAddPageElement(instance, pageNum);

        if (pageElement) {
            pageElement.height = viewport.height;
            pageElement.width = viewport.width;
            pageElement.style.backgroundColor = "grey";

            const canvasElement = pageElement.querySelector('canvas.b-pdf-page-canvas');

            if (canvasElement) {
                canvasElement.height = viewport.height;
                canvasElement.width = viewport.width;
            }

            respondToVisibility(pageElement, (visible) => {
                if (visible && pageElement.dataset.loaded === "false") {
                    renderPage(instance, pageNum);
                }
            });

            let nextPageNum = pageNum + 1;
            if (nextPageNum <= instance.numPages) {
                generateEmptyPage(instance, nextPageNum);
            }
        }
    });
}

function respondToVisibility(element, callback) {
    var options = {
        root: document.documentElement,
    };

    var observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            callback(entry.intersectionRatio > 0);
        });
    }, options);

    observer.observe(element);
}

function getOrAddPageElement(instance, pageNum) {
    let pageElement = instance.element.querySelector('div[data-page-number="' + pageNum + '"]');

    if (!pageElement) {
        pageElement = document.createElement('div');

        pageElement.dataset.pageNumber = pageNum;
        pageElement.dataset.loaded = false;
        pageElement.classList.add("b-pdf-page");
        pageElement.style.display = "flex";
        pageElement.style.alignSelf = "center";
        instance.element.appendChild(pageElement);

        const canvasElement = document.createElement('canvas');
        canvasElement.classList.add("b-pdf-page-canvas");
        pageElement.appendChild(canvasElement);

        if (instance.options.selectable) {
            const textLayerElement = document.createElement('div');
            textLayerElement.classList.add("b-pdf-page-text-layer");
            textLayerElement.classList.add("textLayer");
            pageElement.appendChild(textLayerElement);
        }
    }

    return pageElement;
}

function resetAllPageElements(instance) {
    let pageElements = instance.element.querySelectorAll('div > .b-pdf-page');

    if (pageElements) {
        pageElements.forEach(pageElement => {
            const canvasElement = pageElement.querySelector('canvas.b-pdf-page-canvas');

            if (canvasElement) {
                const context = canvasElement.getContext('2d');
                context.clearRect(0, 0, canvasElement.width, canvasElement.height);
            }

            if (instance.options.selectable) {
                const textLayerElement = pageElement.querySelector('div.b-pdf-page-text-layer');

                if (textLayerElement) {
                    textLayerElement.innerHtml = "";
                }
            }

            pageElement.dataset.loaded = false;
        });
    }
}

function renderPage(instance, pageNum) {
    instance.pageRendering = true;

    instance.pdf.getPage(pageNum).then(function (page) {
        const viewport = page.getViewport({ scale: instance.options.scale });

        const pageElement = getOrAddPageElement(instance, pageNum);

        if (pageElement) {
            pageElement.height = viewport.height;
            pageElement.width = viewport.width;
            pageElement.style.backgroundColor = "grey";

            const canvasElement = pageElement.querySelector('canvas.b-pdf-page-canvas');

            if (canvasElement) {
                const canvasContext = canvasElement.getContext("2d");

                canvasElement.height = viewport.height;
                canvasElement.width = viewport.width;

                const renderContext = {
                    canvasContext: canvasContext,
                    viewport: viewport
                };

                let renderTask = page.render(renderContext);

                renderTask = renderTask.promise.then(function () {
                    instance.pageRendering = false;
                    if (instance.pageNumPending !== null) {
                        renderPage(instance, instance.pageNumPending);
                        instance.pageNumPending = null;
                    }
                });

                if (instance.options.selectable) {
                    const textLayerElement = pageElement.querySelector('div.b-pdf-page-text-layer');

                    if (textLayerElement) {
                        renderTask.then(function () {
                            return page.getTextContent();
                        }).then(function (textContent) {
                            textLayerElement.style.left = canvasElement.offsetLeft + 'px';
                            textLayerElement.style.top = canvasElement.offsetTop + 'px';
                            textLayerElement.style.height = canvasElement.offsetHeight + 'px';
                            textLayerElement.style.width = canvasElement.offsetWidth + 'px';

                            // Pass the data to the method for rendering of text over the pdf canvas.
                            pdfjsLib.renderTextLayer({
                                textContent: textContent,
                                container: textLayerElement,
                                viewport: viewport,
                                textDivs: []
                            });
                        });
                    }
                }

                pageElement.dataset.loaded = true;

                instance.pageNums.push(pageNum);

                if (instance.dotNetObjectRef) {
                    instance.dotNetObjectRef.invokeMethodAsync('NotifyPage', pageNum);
                }
            }
        }
    });
}

function queueRenderPage(instance, pageNum) {
    //if (instance.pageRendering) {
    //    instance.pageNumPending = pageNum;
    //} else {
    renderPage(instance, pageNum);
    //}
}

export function prevPage(element, elementId) {
    element = getRequiredElement(element, elementId);

    if (!element) {
        return;
    }

    const instance = _instances[element.id];

    if (instance) {
        if (instance.pageNum <= 1) {
            return;
        }
        instance.pageNum--;
        queueRenderPage(instance, instance.pageNum);
    }
}

export function nextPage(element, elementId) {
    element = getRequiredElement(element, elementId);

    if (!element) {
        return;
    }

    const instance = _instances[element.id];

    if (instance) {
        if (instance.pageNum >= instance.pdf.numPages) {
            return;
        }
        instance.pageNum++;
        queueRenderPage(instance, instance.pageNum);
    }
}

export function zoomIn(element, elementId, scale) {
    element = getRequiredElement(element, elementId);

    if (!element) {
        return;
    }

    const instance = _instances[element.id];

    if (instance) {
        instance.options.scale += scale;

        resetAllPageElements(instance);
        generateEmptyPage(instance, 1);

        let pageElements = instance.element.querySelectorAll('div > .b-pdf-page');

        if (pageElements) {
            pageElements.forEach(pageElement => {
                if (pageElement && isVisible(pageElement)) {
                    const pageNum = pageElement.dataset.pageNumber;

                    queueRenderPage(instance, pageNum);
                }
            });
        }
    }
}

export function zoomOut(element, elementId, scale) {
    element = getRequiredElement(element, elementId);

    if (!element) {
        return;
    }

    const instance = _instances[element.id];

    if (instance) {
        instance.options.scale -= scale;

        resetAllPageElements(instance);
        generateEmptyPage(instance, 1);

        let pageElements = instance.element.querySelectorAll('div > .b-pdf-page');

        if (pageElements) {
            pageElements.forEach(pageElement => {
                if (pageElement && isVisible(pageElement)) {
                    const pageNum = pageElement.dataset.pageNumber;

                    queueRenderPage(instance, pageNum);
                }
            });
        }
    }
}

function isVisible(elem) {
    if (!(elem instanceof Element)) throw Error('DomUtil: elem is not an element.');
    const style = getComputedStyle(elem);
    if (style.display === 'none') return false;
    if (style.visibility !== 'visible') return false;
    if (style.opacity < 0.1) return false;
    if (elem.offsetWidth + elem.offsetHeight + elem.getBoundingClientRect().height +
        elem.getBoundingClientRect().width === 0) {
        return false;
    }
    const elemCenter = {
        x: elem.getBoundingClientRect().left + elem.offsetWidth / 2,
        y: elem.getBoundingClientRect().top + elem.offsetHeight / 2
    };
    if (elemCenter.x < 0) return false;
    if (elemCenter.x > (document.documentElement.clientWidth || window.innerWidth)) return false;
    if (elemCenter.y < 0) return false;
    if (elemCenter.y > (document.documentElement.clientHeight || window.innerHeight)) return false;
    let pointContainer = document.elementFromPoint(elemCenter.x, elemCenter.y);
    do {
        if (pointContainer === elem) return true;
    } while (pointContainer = pointContainer.parentNode);
    return false;
}