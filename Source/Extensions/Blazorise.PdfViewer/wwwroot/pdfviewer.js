import "./vendors/pdf.min.js?v=1.0.3.0";
import "./vendors/pdf.worker.min.js?v=1.0.3.0";
document.getElementsByTagName("head")[0].insertAdjacentHTML("beforeend", "<link rel=\"stylesheet\" href=\"_content/Blazorise.PdfViewer/vendors/pdf_viewer.min.css?v=1.0.3.0\" />");

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

function renderPage(instance, pageNum) {
    instance.pageRendering = true;

    instance.pdf.getPage(pageNum).then(function (page) {
        const pageElement = document.createElement('div');
        pageElement.classList.add("b-pdf-page");
        pageElement.style.display = "flex";
        pageElement.style.alignSelf = "center";
        instance.element.appendChild(pageElement);

        const canvas = document.createElement('canvas');
        canvas.classList.add("b-pdf-page-canvas");
        pageElement.appendChild(canvas);

        const context = canvas.getContext("2d");

        var viewport = page.getViewport({ scale: instance.options.scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page into canvas context
        var renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        var renderTask = page.render(renderContext);

        // Wait for rendering to finish
        renderTask = renderTask.promise.then(function () {
            instance.pageRendering = false;
            if (instance.pageNumPending !== null) {
                // New page rendering is pending
                renderPage(instance, instance.pageNumPending);
                instance.pageNumPending = null;
            }
        });

        if (instance.options.selectable) {
            const textLayerElement = document.createElement('div');
            textLayerElement.classList.add("b-pdf-page-text-layer");
            textLayerElement.classList.add("textLayer");
            pageElement.appendChild(textLayerElement);

            renderTask.then(function () {
                return page.getTextContent();
            }).then(function (textContent) {
                textLayerElement.style.left = canvas.offsetLeft + 'px';
                textLayerElement.style.top = canvas.offsetTop + 'px';
                textLayerElement.style.height = canvas.offsetHeight + 'px';
                textLayerElement.style.width = canvas.offsetWidth + 'px';

                // Pass the data to the method for rendering of text over the pdf canvas.
                pdfjsLib.renderTextLayer({
                    textContent: textContent,
                    container: textLayerElement,
                    viewport: viewport,
                    textDivs: []
                });
            });
        }

        if (instance.dotNetObjectRef) {
            instance.dotNetObjectRef.invokeMethodAsync('NotifyPage', pageNum);
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
        queueRenderPage(instance, instance.pageNum);
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
        queueRenderPage(instance, instance.pageNum);
    }
}