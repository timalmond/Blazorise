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

        if (instance.dotNetObjectRef) {
            instance.dotNetObjectRef.invokeMethodAsync('NotifyPageCount', pdf.numPages);
        }

        renderPage(instance, pageNum);
    });
}

function getOrAddPageElement(instance, pageNum) {
    let pageElement = instance.element.querySelector('div[data-page-number="' + pageNum + '"]');

    if (!pageElement) {
        pageElement = document.createElement('div');

        pageElement.dataset.pageNumber = pageNum;
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

function renderPage(instance, pageNum) {
    instance.pageRendering = true;

    instance.pdf.getPage(pageNum).then(function (page) {
        const pageElement = getOrAddPageElement(instance, pageNum);
        const canvasElement = pageElement.querySelector('canvas.b-pdf-page-canvas');

        if (canvasElement) {
            const canvasContext = canvasElement.getContext("2d");

            const viewport = page.getViewport({ scale: instance.options.scale });
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

            instance.pageNums.push(pageNum);

            if (instance.dotNetObjectRef) {
                instance.dotNetObjectRef.invokeMethodAsync('NotifyPage', pageNum);
            }

            let nextPageNum = pageNum + 1;
            if (nextPageNum <= instance.numPages) {
                queueRenderPage(instance, nextPageNum);
            }
        }
    });
}

function queueRenderPage(instance, pageNum) {
    if (instance.pageRendering) {
        instance.pageNumPending = pageNum;
    } else {
        renderPage(instance, pageNum);
    }
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

        instance.pageNums.forEach(pageNum => queueRenderPage(instance, pageNum));
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
        instance.pageNums.forEach(pageNum => queueRenderPage(instance, pageNum));
    }
}